import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const root =
    process.env.WELCOME_QA_ROOT || "/private/tmp/central-hill-guests-welcome",
  artifact = root + "/welcome-qa";
const groups = [
  [
    "results-images-infra-interrupted.json",
    ["initial-stored-image", "image-3-2", "image-vertical", "image-square"],
  ],
  ["results-images-rest.json", ["image-wide"]],
  ["results-animated.json", ["animated-webp"]],
  ["results-video.json", ["video-mp4"]],
  ["results-video-webm.json", ["video-webm"]],
  [
    "results-lottie.json",
    [
      "lottie-3-2-json",
      "lottie-2-3-json",
      "lottie-1-1-json",
      "lottie-16-9-json",
      "lottie-3-2-lottie",
      "lottie-2-3-lottie",
      "lottie-1-1-lottie",
      "lottie-16-9-lottie",
    ],
  ],
  ["results-loading.json", ["image-slow-neutral-loading"]],
  [
    "results-states.json",
    ["fallback-absent-medium", "text-short-long-and-four-locales"],
  ],
  [
    "results-states-from-image-local-unknown-dimensions-and-no-js-lazy-player.json",
    [
      "image-local-unknown-dimensions-and-no-js-lazy-player",
      "image-exif-visual-orientation",
    ],
  ],
  [
    "results-image-errors.json",
    ["image-real-resource-failure-public-and-preview"],
  ],
  [
    "results-lottie-preview-errors.json",
    ["lottie-preview-load-and-render-errors"],
  ],
  [
    "results-states-from-stored-legacy-image-without-dimensions.json",
    [
      "stored-legacy-image-without-dimensions",
      "video-before-metadata-and-slow-download",
      "video-autoplay-policy-denial",
      "video-real-resource-failure-public-and-preview",
    ],
  ],
  [
    "results-lottie-import-completed-before-transport-restart.json",
    ["lottie-dynamic-import-failure"],
  ],
  [
    "results-states-from-lottie-canvas-creation-failure.json",
    [
      "lottie-canvas-creation-failure",
      "lottie-no-js-and-transparent-background",
    ],
  ],
  [
    "results-reduced-lottie-diagnostic.json",
    ["lottie-reduced-motion-real-canvas"],
  ],
  [
    "results-states-from-lottie-real-resource-failure.json",
    [
      "lottie-real-resource-failure",
      "lottie-real-renderer-output-failure",
      "late-resource-failure-after-replacement",
    ],
  ],
  [
    "results-lottie-identity.json",
    ["json", "lottie"].flatMap((ext) =>
      ["3-2", "2-3", "1-1", "16-9"].map(
        (ratio) => "lottie-identity-" + ratio + "-" + ext,
      ),
    ),
  ],
  ["results-reduced-video-diagnostic.json", ["video-reduced-motion"]],
  [
    "results-states-from-same-type-and-cross-type-replacement-after-errors.json",
    ["same-type-and-cross-type-replacement-after-errors"],
  ],
];
const historicalIds = {
  "results-images-infra-interrupted.json": {
    "image-3-2": ["bff79c4c-9ac2-4b24-8d25-576c25aa0068", "welcome-3-2.png"],
    "image-vertical": [
      "020a0a20-f04c-4ed4-a4e9-de70a2d010f7",
      "welcome-vertical.png",
    ],
    "image-square": [
      "e29af754-24b9-4ba5-9535-014068b91704",
      "welcome-square.png",
    ],
  },
  "results-images-rest.json": {
    "image-wide": ["b10bc7cb-2de2-49f2-b5f6-d992a2d904aa", "welcome-wide.png"],
  },
  "results-animated.json": {
    "animated-webp": [
      "b640ad24-0d23-4a80-80b6-ff9fe201b7d9",
      "animated-3-2.webp",
    ],
  },
};
const cases = [],
  attemptDiagnostics = [];
for (const [file, expected] of groups) {
  const r = JSON.parse(await fs.readFile(artifact + "/" + file, "utf8"));
  assert.ok(r.cases.length >= expected.length, file + " incomplete");
  if (r.errors?.length) {
    assert.equal(
      file,
      "results-images-infra-interrupted.json",
      "unreviewed page errors",
    );
    assert.equal(r.errors.length, 2);
    assert.ok(
      r.errors.every(
        (e) =>
          e.message.startsWith("Failed query:") &&
          e.message.includes("building") &&
          e.message.includes("eeaf3509-37ec-4a3a-a12b-2317836795a1"),
      ),
      "only reviewed old Building query failures",
    );
  }
  attemptDiagnostics.push({
    file,
    pageErrors: r.errors || [],
    excludedFailures: r.failures || [],
    interpretation:
      file === "results-images-infra-interrupted.json"
        ? "Two old Building query failures were recorded globally in a run later interrupted at image-wide; historical logs do not assign errors to individual case timestamps. Completed image cycles retain actual selected-source measurements; wide and subsequent final replacement cycles were retested separately. No claim of zero errors over all attempts."
        : "Only explicit completed pass cases count; later failed attempts are excluded and affected cases use their passing retests.",
  });
  for (let i = 0; i < expected.length; i++) {
    const name = expected[i],
      historical = historicalIds[file]?.[name],
      matches = r.cases.filter(
        (c) =>
          c.caseId === name ||
          c.id === name ||
          (historical &&
            c.id === historical[0] &&
            c.media?.id === historical[0] &&
            c.media?.r2_key === historical[0] + "/" + historical[1]),
      );
    assert.equal(matches.length, 1, file + " exact case identity " + name);
    const c = matches[0];
    assert.equal(c.status, "pass", name + " is not pass");
    if (c.caseId) assert.equal(c.caseId, name);
    if (c.media?.id && /^(image|video)\//.test(c.media.mime || "")) {
      for (const measurement of c.dimensions || [])
        assert.ok(
          decodeURIComponent(measurement.media?.src || "").includes(c.media.id),
          name + " selected UUID appears in recorded public source",
        );
      if (c.saved?.media?.src)
        assert.ok(
          decodeURIComponent(c.saved.media.src).includes(c.media.id),
          name + " selected UUID appears in recorded saved preview",
        );
    }
    if (name.startsWith("lottie-identity-")) {
      assert.equal(c.identityVerified, true, name + " public identity");
      assert.ok(c.publicDownloads.length > 0, name + " actual source download");
      for (const download of c.publicDownloads) {
        assert.equal(download.sha256, c.uploadedSha256, name + " exact bytes");
        assert.ok(
          decodeURIComponent(download.url).includes(c.media.id),
          name + " source UUID",
        );
      }
    }
    cases.push({ ...c, caseId: name, evidence: file });
  }
}
assert.equal(new Set(cases.map((c) => c.caseId)).size, 44);
const files = execFileSync("git", ["diff", "ec7f610", "--name-only"])
  .toString()
  .trim()
  .split("\n")
  .filter(
    (name) =>
      (name.startsWith("src/") && !name.includes("/tests/")) ||
      name.startsWith("messages/"),
  );
const source = {
  head: execFileSync("git", ["rev-parse", "HEAD"]).toString().trim(),
  files: Object.fromEntries(
    await Promise.all(
      files.map(async (name) => [
        name,
        createHash("sha256")
          .update(await fs.readFile(name))
          .digest("hex"),
      ]),
    ),
  ),
};
const webpPreservation = JSON.parse(
  await fs.readFile(artifact + "/webp-byte-preservation.json", "utf8"),
);
assert.equal(webpPreservation.exact, true);
const videoPng = await fs.readFile(artifact + "/video-reduced-real.png");
const { data: videoPixels, info: videoInfo } = await createRequire(
  import.meta.url,
)("sharp")(videoPng)
  .raw()
  .toBuffer({ resolveWithObject: true });
let greenPixels = 0;
for (let k = 0; k < videoPixels.length; k += videoInfo.channels)
  if (
    videoPixels[k] < 60 &&
    videoPixels[k + 1] > 80 &&
    videoPixels[k + 1] < 160 &&
    videoPixels[k + 2] < 130
  )
    greenPixels++;
assert.ok(
  greenPixels > 100,
  "reduced video first frame visibly contains actual fixture marker",
);
const reducedVideoVisual = {
  image: "video-reduced-real.png",
  sha256: createHash("sha256").update(videoPng).digest("hex"),
  greenPixels,
  width: videoInfo.width,
  height: videoInfo.height,
};
const baselineImages = JSON.parse(
    await fs.readFile(root + "/baseline/results.json", "utf8"),
  ),
  baselinePlayback = JSON.parse(
    await fs.readFile(root + "/baseline-playback/results.json", "utf8"),
  );
assert.equal(baselinePlayback.cases.length, 2);
assert.equal(baselinePlayback.errors.length, 0);
const receipt = {
  status: "pass",
  scope:
    "P24 Welcome media only; overall merge still requires complete other uploads matrix, build/checks/conservation and final independent review",
  browser: "Playwright Chromium; no Safari claim",
  generated: new Date().toISOString(),
  source,
  requiredImageRatios: ["3:2", "2:3", "1:1", "16:9"],
  baseline: {
    image: "../baseline/results.json",
    videoAndLottie: "../baseline-playback/results.json",
    originalFrame: baselineImages.measurements.map((m) => ({
      width: m.width,
      height: m.height,
    })),
    actualVideoPlayback: baselinePlayback.cases[0].playback,
    actualLottiePlayback: baselinePlayback.cases[1].playback,
  },
  caseCount: cases.length,
  cases,
  attemptDiagnostics,
  historicalIds,
  webpPreservation,
  reducedVideoVisual,
  notes: [
    "Only completed passing cases are combined; failed/incomplete earlier attempts remain in their original files.",
    "Blurhash loading discrepancy was fixed narrowly in Welcome and retested to neutral0/191888non-paperpixels before bytes.",
    "Animated WebP continues under reduced motion as an existing native limitation.",
    "Fault tests abort actual requests or interrupt real canvas output; uploads are never mocked.",
    "QA switched from the slow original NeonHTTP proxy to a verified-parity HTTP→real local PostgreSQL bridge; no business API or persistence is mocked.",
    "Tiny Turbopack async loader is distinguished from actual DotLottie JS payload and WASM.",
  ],
};
await fs.writeFile(
  artifact + "/final-receipt.json",
  JSON.stringify(receipt, null, 2),
);
console.log(
  JSON.stringify({
    status: receipt.status,
    caseCount: cases.length,
    source: source.head,
    path: artifact + "/final-receipt.json",
  }),
);
