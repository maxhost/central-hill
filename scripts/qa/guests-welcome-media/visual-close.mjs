import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  browser,
  base,
  root as artifactRoot,
  database,
  pageSnapshot,
  until,
  req,
} from "./common.mjs";
const sharp = req("sharp");
const root = artifactRoot + "/matrix";
const rows = [];
for (const file of (await fs.readdir(root)).filter((x) =>
  /^public-.*-(?:1440|390)-\d+\.png$/.test(x),
)) {
  const { data, info } = await sharp(root + "/" + file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let fixture = 0,
    bright = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = data.subarray(i, i + 3);
    if (
      (r > 150 && g > 90 && b < 140 && r - b > 65) ||
      (g > 65 && g > r * 1.4 && g > b * 1.2) ||
      (r > 140 && r > g * 1.5 && r > b * 1.4)
    )
      fixture++;
    if (r > 220 && g > 215 && b > 205) bright++;
  }
  const pixels = info.width * info.height;
  rows.push({
    file,
    width: info.width,
    height: info.height,
    pixels,
    fixturePixels: fixture,
    paperFraction: bright / pixels,
    blank: fixture < 10 && bright / pixels > 0.95,
  });
}
const out = {
  total: rows.length,
  blank: rows.filter((r) => r.blank),
  all: rows,
};
await fs.writeFile(
  root + "/visual-paper-audit.json",
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify({ total: rows.length, blank: out.blank.length }));
const manifest = JSON.parse(
  await fs.readFile(root + "/pages-manifest.json", "utf8"),
);
const blank = new Set(out.blank.map((r) => r.file));
const affected = [];
for (const field of manifest.rows)
  for (const instance of field.instances) {
    const old = [
      ...new Set(
        instance.evidence
          .flatMap((e) => e.screenshots)
          .filter((s) => blank.has(s)),
      ),
    ];
    if (old.length)
      affected.push({
        fieldId: field.id,
        page: field.field.split(".")[0],
        path: instance.path,
        old,
      });
  }
assert.equal(new Set(affected.map((x) => x.fieldId)).size, 15);
const sql = await database(),
  snapshots = new Map(),
  assets = new Map();
for (const item of affected) {
  if (!snapshots.has(item.page))
    snapshots.set(item.page, await pageSnapshot(sql, item.page));
  item.id = item.path
    .split(".")
    .reduce((o, k) => o[k], snapshots.get(item.page).published.content);
  assert.ok(item.id);
  if (!assets.has(item.id))
    assets.set(
      item.id,
      (await sql`select * from media_asset where id=${item.id}::uuid`)[0],
    );
  item.asset = assets.get(item.id);
  if (item.page === "services") {
    item.selectedMainMediaId = item.id;
    item.id = snapshots.get(
      item.page,
    ).published.content.final_cta.poster_media_id;
    item.asset = (
      await sql`select * from media_asset where id=${item.id}::uuid`
    )[0];
    item.effectiveDestination = "selected poster with reduced motion";
  }
  assert.ok(item.asset);
}
const b = await browser(),
  c = await b.newContext(),
  p = await c.newPage(),
  results = JSON.parse(
    await fs
      .readFile(root + "/visual-close-progress.json", "utf8")
      .catch(() => '{"results":[]}'),
  ).results;
p.setDefaultTimeout(30000);
p.setDefaultNavigationTimeout(90000);
try {
  for (const page of [...snapshots.keys()])
    for (const width of [1440, 390]) {
      if (
        affected
          .filter((x) => x.page === page)
          .every((item) =>
            results.some(
              (r) =>
                r.page === page &&
                r.path === item.path &&
                r.width === width &&
                r.id === item.id,
            ),
          )
      )
        continue;
      await p.emulateMedia({
        reducedMotion: page === "services" ? "reduce" : "no-preference",
      });
      await p.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      const route =
        page === "home"
          ? ""
          : page === "real_estate"
            ? "/real-estate"
            : "/" + page;
      assert.equal(
        (
          await p.goto(base + "/en" + route, { waitUntil: "domcontentloaded" })
        ).status(),
        200,
      );
      for (const item of affected.filter((x) => x.page === page)) {
        if (
          results.some(
            (r) =>
              r.page === page &&
              r.path === item.path &&
              r.width === width &&
              r.id === item.id,
          )
        )
          continue;
        if (page === "services")
          await p.locator("#plan").scrollIntoViewIfNeeded();
        const targets = p.locator(
          `img[src*="${item.id}"],video[poster*="${item.id}"],video[src*="${item.id}"],[style*="${item.id}"]`,
        );
        await until(
          async () => await targets.count(),
          item.path + " selected destination",
        );
        for (let index = 0; index < (await targets.count()); index++) {
          const target = targets.nth(index);
          await target.scrollIntoViewIfNeeded();
          await target.evaluate((e) =>
            e.scrollIntoView({
              block: "center",
              inline: "nearest",
              behavior: "instant",
            }),
          );
          const inspect = () =>
            target.evaluate(async (e) => {
              let nw, nh, source;
              const style = getComputedStyle(e);
              if (e instanceof HTMLImageElement) {
                await e.decode();
                nw = e.naturalWidth;
                nh = e.naturalHeight;
                source = e.currentSrc;
              } else if (
                e instanceof HTMLVideoElement &&
                e.getAttribute("src")
              ) {
                if (e.readyState < 2)
                  await new Promise((resolve, reject) => {
                    e.addEventListener("loadeddata", resolve, { once: true });
                    e.addEventListener("error", reject, { once: true });
                    setTimeout(() => reject(Error("video readiness")), 20000);
                  });
                await e.play();
                nw = e.videoWidth;
                nh = e.videoHeight;
                source = e.currentSrc;
              } else {
                const image = new Image();
                source =
                  e instanceof HTMLVideoElement
                    ? e.poster
                    : style.backgroundImage.slice(5, -2);
                image.src = source;
                await image.decode();
                nw = image.naturalWidth;
                nh = image.naturalHeight;
              }
              const ancestry = [];
              for (let a = e; a; a = a.parentElement) {
                const s = getComputedStyle(a);
                if (
                  s.opacity !== "1" ||
                  s.visibility !== "visible" ||
                  s.display === "none" ||
                  a.hasAttribute("data-reveal")
                )
                  ancestry.push({
                    tag: a.tagName,
                    label: a.getAttribute("data-reveal-label"),
                    opacity: s.opacity,
                    visibility: s.visibility,
                    display: s.display,
                    transform: s.transform,
                  });
              }
              const r = e.getBoundingClientRect();
              return {
                tag: e.tagName,
                source,
                naturalWidth: nw,
                naturalHeight: nh,
                width: r.width,
                height: r.height,
                top: r.top,
                bottom: r.bottom,
                scroll: scrollY,
                fit:
                  e instanceof HTMLImageElement || e instanceof HTMLVideoElement
                    ? style.objectFit
                    : style.backgroundSize,
                position: style.objectPosition || style.backgroundPosition,
                ancestors: ancestry,
                video:
                  e instanceof HTMLVideoElement
                    ? {
                        hasSrc: e.hasAttribute("src"),
                        videoWidth: e.videoWidth,
                        readyState: e.readyState,
                      }
                    : null,
              };
            });
          const immediate = await inspect();
          await p.evaluate(
            () =>
              new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
              ),
          );
          await until(async () => {
            const x = await inspect();
            return x.ancestors.every(
              (a) =>
                a.opacity === "1" &&
                a.visibility === "visible" &&
                a.display !== "none",
            )
              ? x
              : null;
          }, "painted ancestors " + item.path);
          let previous;
          await until(async () => {
            const x = await inspect();
            const signature = [x.scroll, x.top, x.height].join();
            const stable = previous === signature;
            previous = signature;
            return stable;
          }, "stable scroll " + item.path);
          await p.evaluate(
            () =>
              new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
              ),
          );
          const painted = await inspect();
          if (page === "services") {
            assert.equal(painted.video.hasSrc, false);
            assert.equal(painted.video.videoWidth, 0);
            assert.equal(painted.video.readyState, 0);
          }
          assert.ok(
            painted.source.includes(item.id) ||
              painted.source.includes(encodeURIComponent(item.id)),
            item.path + " selected actual bytes",
          );
          assert.ok(painted.naturalWidth > 0 && painted.naturalHeight > 0);
          assert.ok(painted.width > 0 && painted.height > 0);
          assert.ok(
            Math.abs(
              painted.naturalHeight -
                (painted.naturalWidth * item.asset.height) / item.asset.width,
            ) <= 1,
            item.path + " visual natural aspect",
          );
          const prefix = `visual-close-${item.page}-${item.path.replaceAll(".", "-")}-${width}-${index}`;
          const media = prefix + "-media.png",
            section = prefix + "-section.png";
          await target.screenshot({ path: root + "/" + media });
          const container = target.locator("xpath=ancestor::section[1]");
          if (await container.count())
            await container.screenshot({ path: root + "/" + section });
          else await p.screenshot({ path: root + "/" + section });
          const { data, info } = await sharp(root + "/" + media)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          let ink = 0;
          for (let n = 0; n < data.length; n += info.channels) {
            const [r, g, b] = data.subarray(n, n + 3);
            if (Math.max(r, g, b) - Math.min(r, g, b) > 50) ink++;
          }
          assert.ok(ink > 10, item.path + " actual nonpaper pixels");
          results.push({
            ...item,
            width,
            index,
            immediate,
            painted,
            media,
            section,
            nonPaperPixels: ink,
          });
          await fs.writeFile(
            root + "/visual-close-progress.json",
            JSON.stringify({ results }, null, 2),
          );
          console.log("PAINTED", item.fieldId, item.path, width, index);
        }
      }
    }
  for (const [page, snapshot] of snapshots)
    assert.deepEqual(
      await pageSnapshot(sql, page),
      snapshot,
      page + " readonly snapshot exact",
    );
  const result = {
    readonly: true,
    oldPublicClips: rows.length,
    oldBlankClips: out.blank.length,
    oldBlankDesktop: out.blank.filter((x) => x.file.includes("-1440-")).length,
    oldBlankMobile: out.blank.filter((x) => x.file.includes("-390-")).length,
    affectedFieldTypes: new Set(affected.map((x) => x.fieldId)).size,
    affectedInstances: affected.length,
    oldArtifactsPreserved: true,
    results,
    snapshotsExact: true,
  };
  await fs.writeFile(
    root + "/visual-close-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    JSON.stringify({
      cases: results.length,
      affected: affected.length,
      oldBlank: out.blank.length,
    }),
  );
} catch (error) {
  await fs.writeFile(
    root + "/visual-close-failure.json",
    JSON.stringify(
      {
        error: String(error),
        completed: results.length,
        oldArtifactsPreserved: true,
      },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await b.close();
}
