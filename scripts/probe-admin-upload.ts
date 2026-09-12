/**
 * End-to-end probe of the **gated backoffice upload path** against a deployed origin
 * (ADR 0029). Complements `scripts/probe-r2.ts`, which tests R2 and the optimizer but
 * never touches a Server Action.
 *
 * This exists because the upload path has a failure mode that is invisible locally *by
 * construction*: `next start` resolves modules from `node_modules` and never consults
 * the build's file trace, so a missing native library (libvips) passes every local test
 * and dies only in the deployed function. The only way to catch it is to drive the real
 * gated actions against a real deployment — which is what this does:
 *
 *   sign in → presign → browser-shaped PUT to R2 → finalize → clean up
 *
 * It removes the object and row it creates, leaving nothing behind.
 *
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/probe-admin-upload.ts <email> <password> [origin]
 *
 * ⚠️ Server Action ids are per-build, so they are discovered by scanning the deployed
 * admin page's client chunks rather than hardcoded. That scan is the brittle part: if
 * it stops finding them, check whether the chunk shape changed before assuming the
 * upload is broken.
 */
import { config } from "dotenv";

config({ path: ".env", quiet: true });

const [email, password, origin = "https://central-hill-umber.vercel.app"] = process.argv.slice(2);
if (!email || !password) {
  console.error("usage: probe-admin-upload.ts <email> <password> [origin]");
  process.exit(2);
}
const ADMIN_URL = `${origin}/admin/pages/home`;

function fail(hop: string, detail: string): never {
  console.error(`\n✗ ${hop} FAILED\n${detail}\n`);
  process.exit(1);
}

/** Pull the line of a Server Action flight response that carries `key`. */
function pick(text: string, key: string): Record<string, string> | null {
  for (const line of text.split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    try {
      const o = JSON.parse(line.slice(i + 1));
      if (o && typeof o === "object" && key in o) return o;
    } catch {
      /* not every flight line is JSON */
    }
  }
  return null;
}

async function main() {
  const sharp = (await import("sharp")).default;

  // 1. Sign in and keep the session cookie.
  const login = await fetch(`${origin}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!login.ok) fail("sign in", `${login.status} — check the credentials`);
  const cookie = (login.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .join("; ");
  if (!cookie) fail("sign in", "no session cookie returned");
  console.log("sign in     ✓");

  // 2. Discover this build's action ids from the admin page's client chunks.
  const html = await (await fetch(ADMIN_URL, { headers: { cookie } })).text();
  const chunks = [...new Set(html.match(/\/_next\/static\/chunks\/[^"]+\.js/g) ?? [])];
  const ids = new Set<string>();
  for (const c of chunks) {
    const js = await (await fetch(`${origin}${c}`)).text();
    for (const m of js.match(/"[0-9a-f]{40,42}"/g) ?? []) ids.add(m.slice(1, -1));
  }
  if (ids.size === 0) fail("discover actions", "no Server Action ids found in the admin chunks");
  console.log(`discover    ✓ ${ids.size} candidate action id(s)`);

  const call = (id: string, args: unknown[]) =>
    fetch(ADMIN_URL, {
      method: "POST",
      headers: { "Next-Action": id, "content-type": "text/plain;charset=UTF-8", cookie },
      body: JSON.stringify(args),
    });

  // 3. Presign — also identifies which id is which.
  const image = await sharp({
    create: { width: 4200, height: 2800, channels: 3, background: { r: 120, g: 150, b: 170 } },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  let presigned: Record<string, string> | null = null;
  let presignId = "";
  for (const id of ids) {
    const res = await call(id, [
      { filename: "admin-probe.jpg", contentType: "image/jpeg", size: image.length },
    ]);
    const got = pick(await res.text(), "uploadUrl");
    if (got) {
      presigned = got;
      presignId = id;
      break;
    }
  }
  if (!presigned) fail("presign", "no action returned an upload URL — is the deployment current?");
  console.log(`presign     ✓ ${presigned.r2Key}`);

  // 4. The PUT the browser would make.
  const put = await fetch(presigned.uploadUrl, {
    method: "PUT",
    body: new Uint8Array(image),
    headers: {
      "content-type": presigned.contentType,
      "cache-control": presigned.cacheControl,
    },
  });
  if (!put.ok) {
    fail(
      "PUT to R2",
      `${put.status} — from a browser this would also need the bucket CORS policy to allow ` +
        `PUT with content-type + cache-control from ${origin}.`,
    );
  }
  console.log(`PUT         ✓ ${put.status}`);

  // 5. Finalize — the hop that needs sharp, i.e. the one ADR 0029 is about.
  let finalized: Record<string, string> | null = null;
  for (const id of ids) {
    if (id === presignId) continue;
    const res = await call(id, [{ id: presigned.id, r2Key: presigned.r2Key }]);
    const text = await res.text();
    const got = pick(text, "url");
    if (got) {
      finalized = got;
      break;
    }
    if (res.status === 500 && /"digest"/.test(text)) {
      const digest = (text.match(/"digest":"(\d+)"/) || [])[1];
      fail(
        "finalize",
        `500 (digest ${digest}).\n` +
          `The message is redacted in production — read it with:\n` +
          `  vercel logs ${origin}\n` +
          "A libvips/ERR_DLOPEN_FAILED there means the native library is missing from the " +
          "traced function bundle (ADR 0029), NOT that sharp failed to install.",
      );
    }
  }
  if (!finalized) fail("finalize", "no action accepted the finalize arguments");
  console.log(
    `finalize    ✓ ${finalized.width}x${finalized.height} ${finalized.mime} (normalised)`,
  );

  // 6. Clean up: the probe must not leave an orphan asset behind.
  const { deleteMedia } = await import("../src/core/media/server/ingest");
  await deleteMedia(presigned.id);
  const gone = await fetch(`${process.env.R2_PUBLIC_BASE_URL}/${presigned.r2Key}`);
  console.log(`cleanup     ✓ object now ${gone.status}`);
  console.log("\n✓ the backoffice upload path works on this deployment.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
