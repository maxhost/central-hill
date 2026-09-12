/**
 * End-to-end probe for the R2 media pipeline (docs/specs/r2-runbook.md).
 *
 * Exercises the real upload path against the real bucket without writing a DB row:
 * presign → PUT with the two signed headers → public GET → the deployed `/_next/image`
 * optimizer → delete. It leaves nothing behind.
 *
 * Run it after anything that can silently break uploads: rotating the API token,
 * editing the bucket CORS policy, changing `R2_PUBLIC_BASE_URL` (e.g. moving to a
 * custom domain), or a deploy that might have built without the variables (§B4).
 *
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/probe-r2.ts [origin]
 *
 * `origin` defaults to production; pass http://localhost:3000 to probe a local server.
 * A non-zero exit means the upload path is broken — the message says which hop failed.
 */
import { config } from "dotenv";

config({ path: ".env", quiet: true });

const ORIGIN = process.argv[2] ?? "https://central-hill-umber.vercel.app";

function fail(hop: string, detail: string): never {
  console.error(`\n✗ ${hop} FAILED\n${detail}\n`);
  process.exit(1);
}

async function main() {
  const { presignUpload } = await import("../src/core/media/server/ingest");
  const { r2Delete } = await import("../src/core/media/server/r2");
  const sharp = (await import("sharp")).default;

  // A real 1200×800 JPEG, so the optimizer has something to actually resize.
  const jpeg = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: { r: 200, g: 120, b: 60 } },
  })
    .jpeg({ quality: 80 })
    .toBuffer();

  const presigned = await presignUpload({
    filename: "r2-probe.jpg",
    contentType: "image/jpeg",
    size: jpeg.length,
  });
  console.log(`presign      ✓ ${presigned.r2Key}`);

  // Exactly the request the upload island makes. Both headers are signed, so a bucket
  // CORS policy that does not allow them fails here (and in the browser, at preflight).
  const put = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "content-type": presigned.contentType, "cache-control": presigned.cacheControl },
    body: new Uint8Array(jpeg),
  });
  if (!put.ok) fail("PUT to R2", `${put.status} ${put.statusText}\n${await put.text()}`);
  console.log(`PUT          ✓ ${put.status}`);

  const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${presigned.r2Key}`;
  const get = await fetch(publicUrl);
  if (!get.ok) fail("public GET", `${get.status} on ${publicUrl}`);
  const cacheControl = get.headers.get("cache-control");
  if (cacheControl !== presigned.cacheControl) {
    fail(
      "public GET",
      `object stored WITHOUT the immutable cache directive (got ${cacheControl}). ` +
        "A PUT that omits the header must be rejected — check signableHeaders (ADR 0024).",
    );
  }
  console.log(`public GET   ✓ ${get.status} ${get.headers.get("content-type")} · ${cacheControl}`);

  // The decisive check: the deployed optimizer must accept this host, which it only does
  // if R2_PUBLIC_BASE_URL was present when THAT deployment was built (§B4).
  for (const w of [640, 1200]) {
    const url = `${ORIGIN}/_next/image?url=${encodeURIComponent(publicUrl)}&w=${w}&q=75`;
    const res = await fetch(url, { headers: { accept: "image/avif,image/webp,image/*,*/*" } });
    if (!res.ok) {
      await r2Delete(presigned.r2Key);
      fail(
        `/_next/image w=${w}`,
        `${res.status} — ${(await res.text()).slice(0, 300)}\n` +
          "A 400 here means images.remotePatterns was empty at build time: the deployment " +
          "was built without R2_PUBLIC_BASE_URL. Set it and REDEPLOY (runbook §B4).",
      );
    }
    console.log(
      `/_next/image ✓ w=${w} → ${res.headers.get("content-type")} · ${res.headers.get("content-length")} bytes`,
    );
  }

  await r2Delete(presigned.r2Key);
  const after = await fetch(publicUrl);
  console.log(`delete       ✓ public GET now ${after.status}`);
  console.log("\n✓ the R2 upload path is healthy end to end.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
