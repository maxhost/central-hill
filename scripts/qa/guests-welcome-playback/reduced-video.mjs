import assert from "node:assert/strict";
import { createHarness } from "./harness.mjs";
const h = await createHarness("reduced-video-diagnostic");
try {
  await h.record("video-reduced-motion", async () => {
    const c = await h.b.newContext({ reducedMotion: "reduce" }),
      p = await h.publicPage("en", { context: c });
    const m = await h.box(p, "video-reduced-real", { ready: false });
    const observe = () =>
      p
        .locator("[data-intro-media-frame] video")
        .evaluate((v) => ({
          paused: v.paused,
          time: v.currentTime,
          auto: v.autoplay,
          readyState: v.readyState,
          networkState: v.networkState,
          width: v.videoWidth,
          height: v.videoHeight,
          error: v.error?.code ?? null,
          src: v.currentSrc,
          prefersReduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
        }));
    const before = await observe();
    await p.waitForTimeout(700);
    const after = await observe();
    console.log(JSON.stringify({ m, before, after }));
    assert.equal(before.prefersReduce, true);
    assert.equal(before.paused, true);
    assert.equal(before.time, 0);
    assert.equal(before.auto, false);
    assert.equal(before.error, null);
    assert.equal(after.time, 0);
    assert.equal(after.paused, true);
    assert.ok(
      before.width > 0 && before.height > 0,
      "real selected video metadata",
    );
    await c.close();
    return { measurement: m, before, after };
  });
} finally {
  await h.finish();
}
