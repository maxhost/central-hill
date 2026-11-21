import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  browser,
  root,
  base,
  database,
  pageSnapshot,
  until,
} from "./common.mjs";
const key = process.argv[2];
assert.ok(["home", "guest", "guides"].includes(key));
const sql = await database();
const row = await pageSnapshot(sql, key);
const id = row.published.content.hero.poster_media_id;
assert.ok(id);
const b = await browser(),
  ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.route("**/*", (r) =>
  r.request().resourceType() === "media" ? r.abort("failed") : r.continue(),
);
const p = await ctx.newPage();
await p.emulateMedia({ reducedMotion: "reduce" });
const results = [];
try {
  for (const width of [1440, 390]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.goto(
      base +
        "/en" +
        (key === "home" ? "" : key === "guest" ? "/guests" : "/guides"),
      { waitUntil: "domcontentloaded", timeout: 90000 },
    );
    const media = p.locator(`video[poster*="${id}"],img[src*="${id}"]`).first();
    await media.scrollIntoViewIfNeeded();
    const state = await until(
      () =>
        media.evaluate(async (e) => {
          const video = e instanceof HTMLVideoElement;
          const source = video ? e.poster : e.currentSrc || e.src;
          const image = video ? new Image() : e;
          if (video) image.src = source;
          await image.decode();
          if (video && (e.readyState !== 0 || e.videoWidth !== 0)) return false;
          const r = e.getBoundingClientRect(),
            s = getComputedStyle(e);
          return {
            tag: e.tagName,
            source,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            width: r.width,
            height: r.height,
            fit: s.objectFit,
            position: s.objectPosition,
            videoState: video
              ? {
                  readyState: e.readyState,
                  videoWidth: e.videoWidth,
                  currentTime: e.currentTime,
                  error: e.error?.code || null,
                }
              : null,
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        }),
      "poster actually displayed",
    );
    assert.ok(state.width > 0 && state.height > 0);
    assert.equal(state.fit, "cover");
    assert.equal(state.position, "50% 50%");
    assert.equal(state.overflow, false);
    await media.screenshot({
      path: root + `/matrix/${key}-poster-visible-${width}.png`,
    });
    results.push({ viewport: width, ...state });
  }
  await fs.writeFile(
    root + `/matrix/${key}-poster-visible-results.json`,
    JSON.stringify(
      {
        key,
        id,
        realSelectedImageDecoded: true,
        videoNetworkFailureInduced: true,
        uploadSuccessMocked: false,
        results,
      },
      null,
      2,
    ),
  );
  console.log("visible poster", key, results.length);
} finally {
  await b.close();
}
