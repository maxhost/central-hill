import assert from "node:assert/strict";
import { createHarness } from "./harness.mjs";
import { imageErrors } from "./image-errors.mjs";
import { playerNetwork } from "./player-network.mjs";
const h = await createHarness(
  process.argv[2] ? "states-from-" + process.argv[2] : "states",
);
const {
  req,
  sql,
  b,
  context,
  p,
  row,
  record: rawRecord,
  frame,
  box,
  publicPage,
  persist,
  root,
  base,
  until,
  section,
  saveDraft,
  publish,
  fixture,
  finish,
} = h;
let active = !process.argv[2];
const record = async (id, fn) => {
  if (!active && id !== process.argv[2]) return;
  active = true;
  const value = await rawRecord(id, fn);
  if (process.env.WELCOME_STOP_AFTER === id) {
    await h.finish();
    process.exit(0);
  }
  return value;
};
h.record = record;
const original = (await row()).published.content.welcome;
try {
  await record("fallback-absent-medium", async () => {
    await section(p, "welcome");
    await p
      .getByRole("button", { name: "Remove", exact: true })
      .first()
      .click();
    const f = await frame();
    await until(
      async () => (await f.locator("[data-welcome-media-state]").count()) === 0,
      "fallback preview",
    );
    const local = await box(f, "fallback-local");
    assert.match(local.media.src, /images\.unsplash\.com/);
    await saveDraft(p);
    await p.reload({ waitUntil: "domcontentloaded" });
    await publish(p);
    const out = await publicPage();
    const measurements = [];
    for (const width of [1440, 390]) {
      await out.setViewportSize({ width, height: 1000 });
      measurements.push({
        viewport: width,
        ...(await box(out, "fallback-public-" + width)),
      });
    }
    await out.close();
    return { local, measurements };
  });
  await record("text-short-long-and-four-locales", async () => {
    const file = await fixture("welcome-text-frame", [1500, 1000]);
    const v = await persist(file, "text-baseline");
    await v.out.close();
    const measurements = [];
    for (const [name, copy] of [
      ["short", "A short welcome."],
      [
        "long",
        "A bright apartment welcomes every guest with clear information and a comfortable space. "
          .repeat(13)
          .slice(0, 1180),
      ],
    ]) {
      await section(p, "welcome");
      await p.locator('[id="page-field-guest-welcome.copy"]').fill(copy);
      const f = await frame();
      await until(
        async () =>
          await f
            .locator('[data-editor-binding="welcome"]')
            .innerText()
            .then((t) => t.includes(copy.slice(0, 50))),
        "text preview " + name,
      );
      measurements.push({
        name,
        place: "preview",
        ...(await box(f, "text-" + name + "-preview", { ready: true })),
      });
      await saveDraft(p);
      await publish(p);
      const out = await publicPage();
      for (const width of name === "long"
        ? [1440, 881, 880, 390]
        : [1440, 390]) {
        await out.setViewportSize({ width, height: 1000 });
        measurements.push({
          name,
          locale: "en",
          viewport: width,
          ...(await box(out, "text-" + name + "-" + width, { ready: true })),
        });
      }
      await out.close();
    }
    for (const [locale, width] of [
      ["es", 1440],
      ["pt", 390],
      ["fr", 881],
    ]) {
      const beforeTarget = (
        await sql`select * from page_locale_content where page_key='guest' and locale=${locale}`
      )[0];
      const targetText = beforeTarget?.published?.content?.welcome;
      await p
        .getByRole("group", { name: "Content language", exact: true })
        .getByRole("button", { name: locale.toUpperCase(), exact: true })
        .click();
      await saveDraft(p);
      await p.reload({ waitUntil: "domcontentloaded" });
      await p
        .getByRole("group", { name: "Content language", exact: true })
        .getByRole("button", { name: locale.toUpperCase(), exact: true })
        .click();
      await publish(p);
      const published = (
        await sql`select * from page_locale_content where page_key='guest' and locale=${locale}`
      )[0];
      assert.equal(
        published.published.content.welcome.image_media_id,
        v.id,
        "own locale published selected fixture",
      );
      if (targetText)
        for (const key of [
          "headline",
          "lede",
          "copy",
          "guarantee_label",
          "image_alt",
        ])
          assert.equal(
            published.published.content.welcome[key],
            targetText[key],
            "own " + locale + " text preserved: " + key,
          );
      const out = await publicPage(locale);
      await out.setViewportSize({ width, height: 1000 });
      const m = await box(out, "locale-" + locale, { ready: true });
      assert.ok(
        m.media.src.includes(encodeURIComponent(v.id)),
        "selected asset rendered in own locale",
      );
      measurements.push({
        locale,
        viewport: width,
        publishedId: published.published.content.welcome.image_media_id,
        ...m,
      });
      assert.equal(await out.locator("html").getAttribute("lang"), locale);
      await out.close();
    }
    await p
      .getByRole("group", { name: "Content language", exact: true })
      .getByRole("button", { name: /^EN/ })
      .click();
    await section(p, "welcome");
    await p.locator('[id="page-field-guest-welcome.copy"]').fill(original.copy);
    await saveDraft(p);
    await publish(p);
    return { measurements };
  });
  await record(
    "image-local-unknown-dimensions-and-no-js-lazy-player",
    async () => {
      const v = await persist(
        await fixture("welcome-dimensionless-blob", [800, 1200]),
        "dimensionless-blob",
      );
      assert.match(v.local.media.src, /^blob:/);
      assert.equal(v.local.media.widthAttribute, null);
      assert.equal(v.local.media.heightAttribute, null);
      const nojs = await b.newContext({
          javaScriptEnabled: false,
          viewport: { width: 390, height: 1000 },
        }),
        out = await publicPage("en", { context: nojs });
      await out.locator("[data-intro-media-frame]").scrollIntoViewIfNeeded();
      await out
        .locator("[data-intro-media-frame] img")
        .evaluate((e) => e.decode());
      const m = await box(out, "image-no-js");
      assert.equal(m.media.tag, "IMG");
      assert.ok(m.media.naturalWidth > 0);
      await nojs.close();
      const c = await b.newContext();
      const network = playerNetwork(c);
      const normal = await publicPage("en", { context: c });
      await normal.locator("[data-intro-media-frame]").scrollIntoViewIfNeeded();
      await normal.waitForTimeout(700);
      const downloaded = await network();
      assert.equal(downloaded.playerPayloads.length, 0);
      assert.equal(downloaded.wasmRequests.length, 0);
      await c.close();
      await v.out.close();
      return { local: v.local, nojs: m, playerDownloads: downloaded };
    },
  );
  await record("image-exif-visual-orientation", async () => {
    const source = await fixture("welcome-exif-raw", [800, 1200]),
      file = root + "/fixtures/welcome-oriented.jpg";
    await req("sharp")(source)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toFile(file);
    const v = await persist(file, "exif-orientation");
    assert.equal(v.media.width, 1200);
    assert.equal(v.media.height, 800);
    assert.equal(v.local.media.naturalWidth, 1200);
    assert.equal(v.local.media.naturalHeight, 800);
    assert.ok(
      Math.abs(
        v.saved.media.naturalHeight - v.saved.media.naturalWidth / 1.5,
      ) <= 1,
    );
    await v.out.close();
    return {
      ...v,
      out: undefined,
      rawDimensions: [800, 1200],
      exifOrientation: 6,
      visualDimensions: [1200, 800],
    };
  });
  await imageErrors(h);
  await record("stored-legacy-image-without-dimensions", async () => {
    const v = await persist(
      await fixture("welcome-legacy-no-dimensions", [1200, 800]),
      "legacy-no-dimensions",
    );
    await v.out.close();
    assert.match(v.media.r2_key, /welcome-legacy-no-dimensions\.png$/);
    await sql`update media_asset set width=null,height=null where id=${v.id}::uuid and r2_key=${v.media.r2_key}`;
    try {
      await p.reload({ waitUntil: "domcontentloaded" });
      const f = await frame();
      const local = await box(f, "legacy-without-dimensions-preview", {
        ready: true,
      });
      assert.equal(local.media.widthAttribute, null);
      await saveDraft(p);
      await publish(p);
      const out = await publicPage();
      const m = await box(out, "legacy-without-dimensions-public", {
        ready: true,
      });
      assert.equal(m.media.tag, "IMG");
      assert.equal(m.media.widthAttribute, null);
      assert.ok(
        !m.media.src.includes("_next/image"),
        "dimensionless legacy media uses native img",
      );
      assert.equal(m.media.naturalWidth, 1200);
      assert.equal(m.media.naturalHeight, 800);
      await out.close();
      return {
        preview: local,
        measurement: m,
        method:
          "Real uploaded own QA asset; dimensions temporarily set null to represent legacy metadata, then restored. Upload/save/publish pipeline already verified before the legacy-state probe.",
      };
    } finally {
      await sql`update media_asset set width=${v.media.width},height=${v.media.height} where id=${v.id}::uuid and r2_key=${v.media.r2_key}`;
    }
  });
  let videoUrl;
  if (!process.argv[2]?.startsWith("lottie")) {
    const video = await persist(
      root + "/fixtures/loop-3-2.webm",
      "states-video",
    );
    videoUrl = await video.out
      .locator("[data-intro-media-frame] video")
      .getAttribute("src");
    await video.out.close();
  }
  await record("video-before-metadata-and-slow-download", async () => {
    const c = await b.newContext(),
      out = await c.newPage();
    let release;
    const gate = new Promise((r) => (release = r));
    await out.route(videoUrl, async (route) => {
      await gate;
      await route.continue();
    });
    await out.goto(base + "/en/guests", { waitUntil: "domcontentloaded" });
    const before = await box(out, "video-before-metadata");
    const loaded = await out
      .locator("[data-intro-media-frame] video")
      .evaluate((e) => ({ ready: e.readyState, error: !!e.error }));
    assert.equal(loaded.ready, 0);
    assert.equal(loaded.error, false);
    await out.waitForTimeout(1000);
    const slow = await box(out, "video-slow-download");
    assert.notEqual(slow.state, "error");
    release();
    await until(
      () =>
        out
          .locator("[data-intro-media-frame] video")
          .evaluate((e) => e.readyState >= 2),
      "video release actual metadata",
    );
    const after = await box(out, "video-after-metadata", { ready: true });
    await c.close();
    return { before, loaded, slow, after };
  });
  await record("video-autoplay-policy-denial", async () => {
    const browser = await req("playwright").chromium.launch({
        headless: true,
        args: [
          "--autoplay-policy=user-gesture-required",
          "--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies",
        ],
      }),
      c = await browser.newContext(),
      out = await c.newPage();
    await out.goto(base + "/en/guests", { waitUntil: "domcontentloaded" });
    const cdp = await c.newCDPSession(out);
    const evaluation = await cdp.send("Runtime.evaluate", {
      expression: `(async()=>{const e=document.querySelector('[data-intro-media-frame] video');e.scrollIntoView();if(e.readyState<2)await new Promise((resolve,reject)=>{e.addEventListener('loadeddata',resolve,{once:true});e.addEventListener('error',reject,{once:true});});const r=e.getBoundingClientRect(),before={width:r.width,height:r.height,muted:e.muted,ready:e.readyState};e.pause();e.muted=false;try{await e.play();return{rejected:false,before};}catch(error){return{rejected:true,name:error.name,message:error.message,before};}})()`,
      awaitPromise: true,
      returnByValue: true,
      userGesture: false,
    });
    const denied = evaluation.result.value;
    assert.equal(
      denied.rejected,
      true,
      "native browser autoplay policy must reject play",
    );
    assert.equal(denied.name, "NotAllowedError");
    const m = await box(out, "video-policy-denied");
    assert.notEqual(m.state, "error");
    await browser.close();
    return {
      denied,
      measurement: m,
      method:
        "Real Chromium policy; unmuting/pause/play provokes native NotAllowedError without a user gesture. Production remains muted in its separate playback contract.",
    };
  });
  await record("video-real-resource-failure-public-and-preview", async () => {
    const c = await b.newContext();
    await c.route(videoUrl, (r) => r.abort("failed"));
    const out = await publicPage("en", { context: c });
    await until(
      async () =>
        (await out
          .locator("[data-welcome-media-state]")
          .getAttribute("data-welcome-media-state")) === "error",
      "public video resource failure",
    );
    await out.setViewportSize({ width: 1440, height: 1000 });
    const m = await box(out, "video-public-error");
    await out.setViewportSize({ width: 390, height: 1000 });
    const mobile = await box(out, "video-public-error-390");
    assert.equal(m.media, null);
    assert.equal(
      await out.locator("[data-intro-media-frame] [role=status]").count(),
      0,
    );
    await c.close();
    const { login } = await import("../guests-welcome-media/common.mjs");
    const ec = await b.newContext();
    await ec.route(videoUrl, (r) => r.abort("failed"));
    const ep = await login(ec);
    await ep.goto(base + "/admin/pages/guest", {
      waitUntil: "domcontentloaded",
    });
    const ef = await until(
      () => ep.frames().find((f) => f.url().includes("/admin/preview/guest?")),
      "failure preview iframe",
    );
    await until(
      async () =>
        (await ef
          .locator("[data-welcome-media-state]")
          .getAttribute("data-welcome-media-state")) === "error",
      "preview video resource failure",
    );
    const preview = await box(ef, "video-preview-error");
    const notice = await ef
      .locator("[data-intro-media-frame] [role=status]")
      .innerText();
    assert.ok(notice.length > 10);
    assert.doesNotMatch(notice, /https?:|9092|\.webm|codec|WASM/);
    await ec.close();
    return { measurement: m, mobile, preview, notice };
  });
  const currentLottie = await row(),
    currentLottieId = currentLottie.published?.content?.welcome?.image_media_id,
    currentLottieMedia = currentLottieId
      ? (
          await sql`select * from media_asset where id=${currentLottieId}::uuid`
        )[0]
      : null;
  let lottie;
  if (
    process.argv[2]?.startsWith("lottie") &&
    !currentLottie.draft &&
    currentLottieMedia?.mime === "application/json" &&
    currentLottieMedia.r2_key.endsWith("/lottie-3-2.json")
  ) {
    console.log("REUSE published real Lottie fixture", currentLottieId);
    lottie = {
      id: currentLottieId,
      media: currentLottieMedia,
      out: await publicPage(),
    };
    await box(lottie.out, "states-lottie-reused", { ready: true });
  } else
    lottie = await persist(root + "/fixtures/lottie-3-2.json", "states-lottie");
  await lottie.out.close();
  const lottieNetwork = await h.networkObservation();
  const playerChunks = lottieNetwork.playerPayloads.map((chunk) => chunk.url);
  const lottieId = lottie.id;
  const lottieUrl =
    base.replace(":3091", ":9092") + "/welcome-qa/" + lottie.media.r2_key;
  await record("lottie-dynamic-import-failure", async () => {
    const c = await b.newContext();
    const blocked = [];
    assert.ok(
      playerChunks.length > 0,
      "actual player payload URLs observed before fault",
    );
    await c.route(
      (url) => playerChunks.includes(url.href),
      (route) => {
        blocked.push(route.request().url());
        return route.abort("failed");
      },
    );
    const out = await publicPage("en", { context: c });
    await until(
      async () =>
        (await out
          .locator("[data-welcome-media-state]")
          .getAttribute("data-welcome-media-state")) === "error",
      "dynamic player chunk import failure",
    );
    assert.ok(blocked.length > 0, "actual player module request was blocked");
    const m = await box(out, "lottie-import-error");
    assert.equal(m.media, null);
    await c.close();
    return {
      measurement: m,
      blocked: blocked.map((url) => new URL(url).pathname),
      method: "Actual dynamic module network failure; no player replacement.",
    };
  });
  await record("lottie-canvas-creation-failure", async () => {
    const c = await b.newContext();
    await c.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (type === "2d" && this.closest("[data-intro-media-frame]"))
          throw new DOMException(
            "QA canvas context unavailable",
            "InvalidStateError",
          );
        return original.call(this, type, ...rest);
      };
    });
    const out = await publicPage("en", { context: c });
    await until(
      async () =>
        (await out
          .locator("[data-welcome-media-state]")
          .getAttribute("data-welcome-media-state")) === "error",
      "actual player canvas initialization failure",
    );
    const m = await box(out, "lottie-canvas-creation-error");
    assert.equal(m.media, null);
    await c.close();
    return {
      measurement: m,
      method:
        "Canvas getContext throws during actual player initialization; failure must degrade inside reserved frame.",
    };
  });
  await record("lottie-no-js-and-transparent-background", async () => {
    const c = await b.newContext({
        javaScriptEnabled: false,
        viewport: { width: 390, height: 1000 },
      }),
      out = await publicPage("en", { context: c });
    const m = await box(out, "lottie-no-js");
    assert.equal(m.media.tag, "CANVAS");
    assert.equal(m.images, 0);
    assert.equal(m.state, "loading");
    const screenshot = await out
      .locator("[data-intro-media-frame]")
      .screenshot();
    const { data, info } = await req("sharp")(screenshot)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const corner = Array.from(
      data.subarray(
        (info.width * 3 + 3) * info.channels,
        (info.width * 3 + 3) * info.channels + 3,
      ),
    );
    assert.deepEqual(corner, [251, 248, 243]);
    await c.close();
    return { measurement: m, corner };
  });
  await record("lottie-reduced-motion", async () => {
    const c = await b.newContext({ reducedMotion: "reduce" }),
      out = await publicPage("en", { context: c });
    const m = await box(out, "lottie-reduced");
    const canvas = out.locator("[data-intro-media-frame] canvas");
    const drawn = await canvas.evaluate((e) => {
      const data = e
        .getContext("2d")
        .getImageData(0, 0, e.width, e.height).data;
      let pixels = 0;
      for (let k = 3; k < data.length; k += 4) if (data[k]) pixels++;
      return pixels;
    });
    assert.ok(
      drawn > 100,
      "reduced motion holds a real first drawing, not an empty canvas",
    );
    const a = await canvas.screenshot();
    await out.waitForTimeout(500);
    const z = await canvas.screenshot();
    assert.equal(
      a.toString("base64"),
      z.toString("base64"),
      "reduced motion holds the actual rendered first frame",
    );
    await c.close();
    return { measurement: m };
  });
  await record("lottie-real-resource-failure", async () => {
    const c = await b.newContext();
    await c.route(lottieUrl, (r) => r.abort("failed"));
    const out = await publicPage("en", { context: c });
    await until(
      async () =>
        (await out
          .locator("[data-welcome-media-state]")
          .getAttribute("data-welcome-media-state")) === "error",
      "lottie native loadError",
    );
    const m = await box(out, "lottie-public-load-error");
    assert.equal(m.media, null);
    await c.close();
    return { measurement: m, lottieId };
  });
  await record("lottie-real-renderer-output-failure", async () => {
    const c = await b.newContext();
    await c.addInitScript(() => {
      const original = CanvasRenderingContext2D.prototype.putImageData;
      CanvasRenderingContext2D.prototype.putImageData = function (...args) {
        if (
          window.__welcomeFailDrawing &&
          this.canvas.closest?.("[data-intro-media-frame]")
        )
          throw new DOMException(
            "QA rendering surface unavailable",
            "InvalidStateError",
          );
        return original.apply(this, args);
      };
    });
    const out = await publicPage("en", { context: c });
    await box(out, "lottie-before-render-fault", { ready: true });
    await out.evaluate(() => (window.__welcomeFailDrawing = true));
    await until(
      async () =>
        (await out
          .locator("[data-welcome-media-state]")
          .getAttribute("data-welcome-media-state")) === "error",
      "real player renderError callback",
    );
    await out.setViewportSize({ width: 1440, height: 1000 });
    const m = await box(out, "lottie-render-error");
    await out.setViewportSize({ width: 390, height: 1000 });
    const mobile = await box(out, "lottie-render-error-390");
    assert.equal(m.media, null);
    await c.close();
    return {
      measurement: m,
      mobile,
      method:
        "Fault injection into actual CanvasRenderingContext2D.putImageData; real DotLottie animation loop catches and emits renderError. No fake upload or player.",
    };
  });
  await record("late-resource-failure-after-replacement", async () => {
    let release, entered;
    const pending = new Promise((r) => (release = r)),
      hit = new Promise((r) => (entered = r));
    const delayed = async (route) => {
      entered();
      await pending;
      await route.abort("failed");
    };
    await context.route(lottieUrl, delayed);
    try {
      await p.reload({ waitUntil: "domcontentloaded" });
      await hit;
      const before = await frame();
      const old = await before
        .locator("[data-welcome-media-state]")
        .elementHandle();
      await section(p, "welcome");
      await p
        .locator("input[type=file]")
        .first()
        .setInputFiles(await fixture("welcome-late-replacement", [1200, 800]));
      await until(
        async () => !(await old.evaluate((e) => e.isConnected)),
        "old boundary removed",
      );
      const after = await frame();
      await box(after, "replacement-before-late-failure", { ready: true });
      release();
      await p.waitForTimeout(800);
      const m = await box(after, "replacement-after-late-failure", {
        ready: true,
      });
      assert.equal(m.media.tag, "IMG");
      assert.match(m.media.src, /^blob:/);
      assert.equal(m.state, "ready");
      return {
        measurement: m,
        method:
          "Actual old Lottie request is held, a new image is selected using the UI, then the old request fails after its boundary was unmounted.",
      };
    } finally {
      release();
      await context.unroute(lottieUrl, delayed);
    }
  });
  await record("video-reduced-motion", async () => {
    const v = await persist(root + "/fixtures/loop-3-2.mp4", "reduced-video");
    await v.out.close();
    const c = await b.newContext({ reducedMotion: "reduce" }),
      out = await publicPage("en", { context: c });
    const m = await box(out, "video-reduced", { ready: true });
    const before = await out
      .locator("[data-intro-media-frame] video")
      .evaluate((e) => ({
        paused: e.paused,
        time: e.currentTime,
        auto: e.autoplay,
      }));
    await out.waitForTimeout(400);
    assert.equal(before.paused, true);
    assert.equal(before.time, 0);
    assert.equal(before.auto, false);
    assert.equal(
      await out
        .locator("[data-intro-media-frame] video")
        .evaluate((e) => e.currentTime),
      0,
    );
    await c.close();
    return { measurement: m, playback: before };
  });
  await record(
    "same-type-and-cross-type-replacement-after-errors",
    async () => {
      const chain = [];
      for (const [name, file] of [
        ["image", await fixture("welcome-chain-1", [1500, 1000])],
        ["video", root + "/fixtures/loop-3-2.webm"],
        ["video-second", root + "/fixtures/loop-3-2.mp4"],
        ["lottie", root + "/fixtures/lottie-3-2.json"],
        ["lottie-second", root + "/fixtures/lottie-2-3.lottie"],
        ["image-final", await fixture("welcome-chain-2", [1000, 1500])],
      ]) {
        const v = await persist(file, "chain-" + name);
        chain.push({
          name,
          id: v.id,
          local: v.local,
          saved: v.saved,
          dimensions: v.dimensions,
        });
        await v.out.close();
      }
      return { chain };
    },
  );
} finally {
  await finish();
}
