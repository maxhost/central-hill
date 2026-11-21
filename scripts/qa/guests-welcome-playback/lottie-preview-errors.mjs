import assert from "node:assert/strict";
import { createHarness } from "./harness.mjs";
const h = await createHarness("lottie-preview-errors"),
  { context, p, row, sql, record, frame, box, until, finish } = h;
try {
  await record("lottie-preview-load-and-render-errors", async () => {
    const id = (await row()).published.content.welcome.image_media_id,
      asset = (await sql`select * from media_asset where id=${id}::uuid`)[0];
    assert.match(asset.mime, /application\/(json|zip\+dotlottie)/);
    const url = "http://127.0.0.1:9092/welcome-qa/" + asset.r2_key;
    const abort = (r) => r.abort("failed");
    await context.route(url, abort);
    await p.reload({ waitUntil: "domcontentloaded" });
    let f = await frame();
    await f.locator("[data-intro-media-frame]").scrollIntoViewIfNeeded();
    await until(
      async () =>
        (await f
          .locator("[data-welcome-media-state]")
          .getAttribute("data-welcome-media-state")) === "error",
      "real Lottie loadError in preview",
    );
    const load = await box(f, "lottie-preview-load-error"),
      loadNotice = await f
        .locator("[data-intro-media-frame] [role=status]")
        .innerText();
    assert.ok(loadNotice.length > 10);
    assert.doesNotMatch(loadNotice, /https?:|9092|\.json|WASM|codec/);
    await context.unroute(url, abort);
    await p.addInitScript(() => {
      const original = CanvasRenderingContext2D.prototype.putImageData;
      CanvasRenderingContext2D.prototype.putImageData = function (...args) {
        if (
          window.__previewCanvasFailure &&
          this.canvas.closest?.("[data-intro-media-frame]")
        )
          throw new DOMException(
            "QA canvas output unavailable",
            "InvalidStateError",
          );
        return original.apply(this, args);
      };
    });
    await p.reload({ waitUntil: "domcontentloaded" });
    f = await frame();
    await box(f, "lottie-preview-before-render-error", { ready: true });
    await f.evaluate(() => (window.__previewCanvasFailure = true));
    await until(
      async () =>
        (await f
          .locator("[data-welcome-media-state]")
          .getAttribute("data-welcome-media-state")) === "error",
      "actual Lottie renderError in preview",
    );
    const render = await box(f, "lottie-preview-render-error"),
      renderNotice = await f
        .locator("[data-intro-media-frame] [role=status]")
        .innerText();
    assert.equal(renderNotice, loadNotice);
    assert.equal(render.media, null);
    return {
      load,
      render,
      notice: renderNotice,
      method:
        "Actual saved Lottie: network failure and real Canvas2D output failure, both in the authenticated preview; no mock player or upload.",
    };
  });
} finally {
  await finish();
}
