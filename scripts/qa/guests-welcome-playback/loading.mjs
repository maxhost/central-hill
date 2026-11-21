import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHarness } from "./harness.mjs";
const { req, b, record, box, persist, root, fixture, finish } =
  await createHarness("loading");
try {
  await record("image-slow-neutral-loading", async () => {
    const v = await persist(
      await fixture("welcome-loading-probe", [1500, 1000]),
      "loading-probe",
    );
    await v.out.close();
    const c = await b.newContext({ viewport: { width: 1440, height: 1000 } }),
      out = await c.newPage();
    let release, entered;
    const hold = new Promise((r) => (release = r)),
      hit = new Promise((r) => (entered = r));
    const routeMatch = (url) =>
      url.pathname === "/_next/image" &&
      (url.searchParams.get("url") || "").includes(v.id);
    await out.route(routeMatch, async (route) => {
      entered();
      await hold;
      await route.continue();
    });
    try {
      await out.goto("http://127.0.0.1:3091/en/guests", {
        waitUntil: "domcontentloaded",
      });
      await out.locator("[data-intro-media-frame]").scrollIntoViewIfNeeded();
      await hit;
      const before = await box(out, "image-slow-neutral-loading");
      const styles = await out
        .locator("[data-intro-media-frame] img")
        .evaluate((e) => ({
          complete: e.complete,
          naturalWidth: e.naturalWidth,
          backgroundImage: getComputedStyle(e).backgroundImage,
          backgroundSize: getComputedStyle(e).backgroundSize,
          filter: getComputedStyle(e).filter,
        }));
      const screenshot = await out
        .locator("[data-intro-media-frame]")
        .screenshot();
      const { data, info } = await req("sharp")(screenshot)
        .raw()
        .toBuffer({ resolveWithObject: true });
      let different = 0;
      for (let k = 0; k < data.length; k += info.channels)
        if (
          Math.abs(data[k] - 251) > 3 ||
          Math.abs(data[k + 1] - 248) > 3 ||
          Math.abs(data[k + 2] - 243) > 3
        )
          different++;
      const neutral = different < info.width * info.height * 0.01;
      const observation = {
        id: v.id,
        before,
        styles,
        nonNeutralPixels: different,
        pixels: info.width * info.height,
        neutral,
        method:
          "Actual optimized image request held before bytes; no fake upload or synthetic DOM.",
      };
      await fs.writeFile(
        root + "/welcome-qa/image-loading-observation.json",
        JSON.stringify(observation, null, 2),
      );
      release();
      const loaded = await box(out, "image-slow-after-load", { ready: true });
      assert.equal(
        neutral,
        true,
        "Welcome loading should show neutral paper, not a blurhash preview",
      );
      return { ...observation, loaded };
    } finally {
      release();
      await c.close();
    }
  });
} finally {
  await finish();
}
