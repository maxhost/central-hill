import assert from "node:assert/strict";
import { createHarness } from "./harness.mjs";
const {
  req,
  b,
  record,
  box,
  publicPage,
  persist,
  only,
  root,
  fixture,
  until,
  finish,
} = await createHarness(process.argv[2] || "all");
try {
  if (["all", "images", "images-rest", "animated"].includes(only)) {
    if (only === "all" || only === "images")
      await record("initial-stored-image", async () => {
        const out = await publicPage();
        const measurements = [];
        for (const width of [1440, 881, 880, 390]) {
          await out.setViewportSize({ width, height: 1000 });
          measurements.push({
            viewport: width,
            ...(await box(out, "initial-stored-" + width, { ready: true })),
          });
        }
        await out.close();
        return { measurements };
      });
    for (const [name, dims] of [
      ["3-2", [2250, 1500]],
      ["vertical", [1000, 1500]],
      ["square", [1000, 1000]],
      ["wide", [1600, 900]],
    ])
      if (
        only === "all" ||
        only === "images" ||
        (only === "images-rest" && name === "wide")
      )
        await record("image-" + name, async () => {
          const file = await fixture("welcome-" + name, dims),
            v = await persist(file, "image-" + name);
          assert.equal(v.media.width, dims[0]);
          assert.equal(v.media.height, dims[1]);
          await v.out.close();
          return { ...v, out: undefined };
        });
    await record("animated-webp", async () => {
      const v = await persist(
        root + "/fixtures/animated-3-2.webp",
        "animated-webp",
      );
      assert.equal(v.media.width, 600);
      assert.equal(v.media.height, 400);
      const src = await v.out
        .locator("[data-intro-media-frame] img")
        .getAttribute("src");
      assert.match(src, /9092.*animated-3-2\.webp/);
      assert.ok(!src.includes("_next/image"));
      const image = v.out.locator("[data-intro-media-frame]" + " img");
      const a = await image.screenshot();
      let advanced = false;
      for (const delay of [83, 137, 211, 293, 359]) {
        await v.out.waitForTimeout(delay);
        if (!a.equals(await image.screenshot())) {
          advanced = true;
          break;
        }
      }
      assert.ok(
        advanced,
        "animated WebP frames actually advance across non-periodic samples",
      );
      const stored = Buffer.from(await (await fetch(src)).arrayBuffer());
      const metadata = await req("sharp")(stored, {
        animated: true,
      }).metadata();
      assert.equal(metadata.pages, 2);
      const rc = await b.newContext({ reducedMotion: "reduce" }),
        ro = await publicPage("en", { context: rc });
      await box(ro, "animated-webp-reduced-motion", { ready: true });
      const ri = ro.locator("[data-intro-media-frame] img"),
        ra = await ri.screenshot();
      let reducedAdvances = false;
      for (const delay of [83, 137, 211, 293, 359]) {
        await ro.waitForTimeout(delay);
        if (!ra.equals(await ri.screenshot())) {
          reducedAdvances = true;
          break;
        }
      }
      assert.ok(
        reducedAdvances,
        "existing WebP limitation remains: native animation cannot be paused by this component",
      );
      await rc.close();
      await v.out.close();
      return {
        ...v,
        out: undefined,
        pages: metadata.pages,
        advanced,
        reducedMotion:
          "native animated WebP continues; pre-existing limitation verified",
      };
    });
  }
  if (["all", "video", "video-webm"].includes(only)) {
    for (const ext of only === "video-webm" ? ["webm"] : ["mp4", "webm"])
      await record("video-" + ext, async () => {
        const v = await persist(
          root + "/fixtures/loop-3-2." + ext,
          "video-" + ext,
        );
        const video = v.out.locator("[data-intro-media-frame]" + " video");
        const a = await video.evaluate((e) => ({
          time: e.currentTime,
          paused: e.paused,
          muted: e.muted,
          loop: e.loop,
          inline: e.playsInline,
          ready: e.readyState,
          w: e.videoWidth,
          h: e.videoHeight,
          duration: e.duration,
          ended: e.ended,
          error: e.error?.code || null,
        }));
        const z = await until(
          async () => {
            const t = await video.evaluate((e) => e.currentTime);
            return t !== a.time ? t : null;
          },
          "actual video playback advances",
          10000,
        );
        assert.ok(
          z !== a.time,
          "real video advances " + JSON.stringify({ before: a, after: z }),
        );
        assert.equal(a.muted, true);
        assert.equal(a.loop, true);
        assert.equal(a.inline, true);
        assert.equal(a.w, 900);
        assert.equal(a.h, 600);
        await video.evaluate((e) => e.pause());
        const paused = await box(v.out, "video-" + ext + "-paused");
        const before = await video.evaluate((e) => e.currentTime);
        await v.out.waitForTimeout(300);
        assert.equal(await video.evaluate((e) => e.currentTime), before);
        await v.out.close();
        return { ...v, out: undefined, playback: a, advancedTime: z, paused };
      });
  }
  if (only === "all" || only === "lottie") {
    for (const [ext, ratio] of [
      ["json", "3-2"],
      ["json", "2-3"],
      ["json", "1-1"],
      ["json", "16-9"],
      ["lottie", "3-2"],
      ["lottie", "2-3"],
      ["lottie", "1-1"],
      ["lottie", "16-9"],
    ])
      await record("lottie-" + ratio + "-" + ext, async () => {
        const v = await persist(
          root + `/fixtures/lottie-${ratio}.${ext}`,
          "lottie-" + ratio + "-" + ext,
        );
        const canvas = v.out.locator("[data-intro-media-frame]" + " canvas");
        const a = await canvas.screenshot();
        await v.out.waitForTimeout(550);
        const z = await canvas.screenshot();
        assert.notEqual(
          a.toString("base64"),
          z.toString("base64"),
          "real canvas frames advance",
        );
        const decoded = await req("sharp")(a)
          .raw()
          .toBuffer({ resolveWithObject: true });
        const { data, info } = decoded;
        const corner = Array.from(
          data.subarray(
            (info.width * 3 + 3) * info.channels,
            (info.width * 3 + 3) * info.channels + 3,
          ),
        );
        assert.deepEqual(corner, [251, 248, 243]);
        let minX = info.width,
          maxX = 0,
          minY = info.height,
          maxY = 0,
          markerPixels = 0;
        for (let y = 0; y < info.height; y++)
          for (let x = 0; x < info.width; x++) {
            const k = (y * info.width + x) * info.channels;
            if (
              Math.abs(data[k] - 13) < 15 &&
              Math.abs(data[k + 1] - 128) < 20 &&
              Math.abs(data[k + 2] - 77) < 20
            ) {
              markerPixels++;
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        assert.ok(markerPixels > 100, "nonempty actual marker canvas");
        const diameter =
          v.media.width *
          0.3 *
          Math.max(info.width / v.media.width, info.height / v.media.height);
        assert.ok(
          Math.abs(maxX - minX + 1 - diameter) < 4,
          "cover preserves marker width " +
            JSON.stringify({ minX, maxX, diameter }),
        );
        assert.ok(
          Math.abs(maxY - minY + 1 - diameter) < 4,
          "cover preserves marker height",
        );
        assert.ok(
          Math.abs((minY + maxY) / 2 - info.height / 2) < 2,
          "crop is vertically centred",
        );
        assert.equal(
          await v.out.locator("[data-intro-media-frame]" + " img").count(),
          0,
          "no fallback image behind transparent animation",
        );
        await v.out.close();
        return {
          ...v,
          out: undefined,
          canvas: { rendered: true, advanced: true, corner, markerPixels },
        };
      });
  }
} finally {
  await finish();
}
