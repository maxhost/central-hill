import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createHarness } from "./harness.mjs";
export async function imageErrors(h) {
  const { record, b, row, publicPage, until, box, base, artifact } = h;
  await record("image-real-resource-failure-public-and-preview", async () => {
    const id = (await row()).published.content.welcome.image_media_id;
    const match = (url) =>
      url.pathname === "/_next/image" &&
      (url.searchParams.get("url") || "").includes(id);
    const aborted = [];
    const c = await b.newContext({ viewport: { width: 1440, height: 1000 } });
    await c.route(match, (r) => {
      aborted.push(r.request().url());
      return r.abort("failed");
    });
    const out = await publicPage("en", { context: c });
    await out.locator("[data-intro-media-frame]").scrollIntoViewIfNeeded();
    await until(
      async () =>
        (await out
          .locator("[data-welcome-media-state]")
          .getAttribute("data-welcome-media-state")) === "error",
      "native image failure",
    );
    const measurement = await box(out, "image-public-error");
    assert.equal(measurement.media, null);
    assert.equal(
      await out.locator("[data-intro-media-frame] [role=status]").count(),
      0,
    );
    await c.close();
    const { login } = await import("../guests-welcome-media/common.mjs");
    const ec = await b.newContext();
    await ec.route(match, (r) => {
      aborted.push(r.request().url());
      return r.abort("failed");
    });
    const ep = await login(ec);
    await ep.goto(base + "/admin/pages/guest", {
      waitUntil: "domcontentloaded",
    });
    const ef = await until(
      () => ep.frames().find((f) => f.url().includes("/admin/preview/guest?")),
      "image failure iframe",
    );
    await ef.locator("[data-intro-media-frame]").scrollIntoViewIfNeeded();
    let observation;
    try {
      await until(
        async () => {
          observation = await ef
            .locator("[data-intro-media-frame]")
            .evaluate((e) => ({
              html: e.outerHTML,
              state: e
                .querySelector("[data-welcome-media-state]")
                ?.getAttribute("data-welcome-media-state"),
              images: Array.from(e.querySelectorAll("img")).map((i) => ({
                src: i.currentSrc || i.src,
                complete: i.complete,
                width: i.naturalWidth,
              })),
            }));
          return observation.state === "error";
        },
        "preview image failure",
        30000,
      );
    } catch (error) {
      await fs.writeFile(
        artifact + "/image-preview-error-observation.json",
        JSON.stringify(
          { id, aborted, frameUrl: ef.url(), observation },
          null,
          2,
        ),
      );
      await ef
        .locator("[data-intro-media-frame]")
        .screenshot({ path: artifact + "/image-preview-error-diagnostic.png" });
      throw error;
    }
    const preview = await box(ef, "image-preview-error"),
      notice = await ef
        .locator("[data-intro-media-frame] [role=status]")
        .innerText();
    assert.ok(notice.length > 10);
    assert.doesNotMatch(notice, /https?:|9092|\.jpg|decode|codec/);
    await ec.close();
    return { measurement, preview, notice, aborted };
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const h = await createHarness("image-errors");
  try {
    await imageErrors(h);
  } finally {
    await h.finish();
  }
}
