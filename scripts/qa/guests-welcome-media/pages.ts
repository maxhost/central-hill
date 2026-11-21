/* eslint-disable @typescript-eslint/no-explicit-any -- QA traverses heterogeneous schema snapshots and browser element kinds; persisted values are checked against real database metadata. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pageSchemas } from "../../../src/slices/pages/schemas";
import {
  describe,
  applyDefaults,
  type FieldNode,
} from "../../../src/slices/pages/admin/form-model";
import {
  browser,
  login,
  section,
  saveDraft,
  publish,
  fixture,
  until,
  root,
  base,
  database,
  pageSnapshot,
} from "./common.mjs";
const requested = process.argv[2] || "home";
const ratios: [string, number, number][] = [
  ["3-2", 2250, 1500],
  ["2-3", 1000, 1500],
  ["1-1", 1200, 1200],
  ["16-9", 1600, 900],
  ["4-5", 1200, 1500],
  ["4-3", 1200, 900],
  ["3-4", 900, 1200],
  ["16-10", 1200, 750],
];
const requestedRatios = (
  process.env.QA_RATIOS || "3-2,2-3,1-1,recommended"
).split(",");
const output = root + "/matrix";
const reportKey =
  requested +
  (process.env.QA_REPORT_SUFFIX ? "-" + process.env.QA_REPORT_SUFFIX : "");
await fs.mkdir(output, { recursive: true });
const sql = await database();
const b = await browser();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await login(ctx);
p.setDefaultTimeout(20000);
p.setDefaultNavigationTimeout(90000);
p.on("dialog", (d) => d.accept());
const publicCtx = await b.newContext({
  viewport: { width: 1440, height: 1000 },
});
const pub = await publicCtx.newPage();
if (["home", "guest"].includes(requested)) {
  for (const context of [ctx, publicCtx])
    await context.route("**/*", (route) =>
      route.request().resourceType() === "media"
        ? route.abort("failed")
        : route.continue(),
    );
}
if (requested === "guides") {
  await p.emulateMedia({ reducedMotion: "reduce" });
  await pub.emulateMedia({ reducedMotion: "reduce" });
}
const report: any = {
  page: requested,
  browser: await b.version(),
  engine: "Chromium only",
  checks: [],
  failures: [],
  started: new Date().toISOString(),
};
const bodyErrors: string[] = [];
p.on("pageerror", (e) => bodyErrors.push(e.message));
function at(c: any, ps: string[]) {
  return ps.reduce((a, k) => a?.[k], c);
}
function fields(node: FieldNode, data: any, ps: string[] = []): any[] {
  if (node.kind === "hidden") return [];
  if (node.kind === "object")
    return node.fields.flatMap((x) =>
      fields(x.node, data?.[x.key], [...ps, x.key]),
    );
  if (node.kind === "array")
    return (Array.isArray(data) ? data : []).flatMap((x, i) =>
      fields(node.element, x, [...ps, "" + i]),
    );
  return node.kind === "media"
    ? [{ path: ps.join("."), accept: node.accept, hint: node.hint || "" }]
    : [];
}
function recommended(f: any) {
  if (f.hint.includes("900×1350")) return "2-3";
  if (requested === "services" && f.path.startsWith("hero.")) return "16-9";
  if (requested === "services" && f.path.startsWith("final_cta.")) return "4-5";
  if (f.hint.includes("16:10")) return "16-10";
  if (f.hint.includes("4:5")) return "4-5";
  if (f.hint.includes("3:4")) return "3-4";
  if (f.hint.includes("4:3") || f.hint.includes("1600×1200")) return "4-3";
  if (f.hint.includes("16:9") || f.hint.includes("1920×1080")) return "16-9";
  return "3-2";
}
function expectedRatio(key: string, ps: string) {
  if (ps.startsWith("og_image")) return null;
  if (
    [
      "home.guests_pitch",
      "owners.services",
      "owners.dashboard",
      "owners.final_cta",
      "real_estate.capabilities",
      "about.organisation",
      "services.final_cta",
    ].some((x) => (key + "." + ps).startsWith(x))
  )
    return 4 / 5;
  if (key === "guest" && ps.startsWith("welcome")) return 3 / 2;
  if (key === "guides" && ps.startsWith("guide_aside")) return 16 / 10;
  return null;
}
async function findTargets(frame: any, url: string) {
  return frame
    .locator('img,video,[style*="background-image"]', {})
    .filter({})
    .evaluateAll(
      (els: any[], url: string) =>
        els
          .map((e: any, i: number) => ({ e, i }))
          .filter(({ e }) =>
            [e.src, e.currentSrc, e.srcset, e.poster, e.style.backgroundImage]
              .filter(Boolean)
              .some(
                (s) => s.includes(url) || s.includes(encodeURIComponent(url)),
              ),
          )
          .map(({ i }) => i),
      url,
    );
}
async function previewFrame(pick: any) {
  if (requested === "guides") await section(p, pick.path);
  const surface =
    requested === "guides" && pick.path.startsWith("guide_aside.")
      ? "shared_aside"
      : "page";
  return until(
    () =>
      p
        .frames()
        .find(
          (f) =>
            f.url().includes("/admin/preview/" + requested + "?") &&
            new URL(f.url()).searchParams.get("surface") === surface,
        ),
    "preview surface " + surface,
  );
}
async function measure(
  frame: any,
  url: string,
  label: string,
  ratio: number | null,
  screenshot: boolean,
) {
  console.log("measure", label);
  const all = frame.locator('img,video,[style*="background-image"]');
  const indexes = await until(
    async () => {
      const a = await findTargets(frame, url);
      return a.length ? a : null;
    },
    "selected media destination " + label,
    30000,
  );
  const measurements = [];
  for (let n = 0; n < indexes.length; n++) {
    const el = all.nth(indexes[n]);
    await el.scrollIntoViewIfNeeded();
    const m = await el.evaluate(async (e: any) => {
      const source =
        e.tagName === "IMG"
          ? e.currentSrc || e.src
          : e.tagName === "VIDEO"
            ? e.poster
            : e.style.backgroundImage.slice(5, -2);
      if (e.tagName === "IMG") await e.decode();
      else if (source) {
        const im = new Image();
        im.src = source;
        await im.decode();
      }
      const r = e.getBoundingClientRect(),
        s = getComputedStyle(e),
        par = e.parentElement,
        pr = par.getBoundingClientRect();
      return {
        tag: e.tagName,
        src: source,
        w: r.width,
        h: r.height,
        nw: e.naturalWidth || null,
        nh: e.naturalHeight || null,
        fit:
          e.tagName === "IMG" || e.tagName === "VIDEO"
            ? s.objectFit
            : s.backgroundSize,
        position:
          e.tagName === "IMG" || e.tagName === "VIDEO"
            ? s.objectPosition
            : s.backgroundPosition,
        parent: { w: pr.width, h: pr.height },
        layout: {
          minimum: parseFloat(getComputedStyle(par).minHeight) || 0,
          columns: getComputedStyle(
            par.parentElement,
          ).gridTemplateColumns.split(" ").length,
          copyHeight:
            par.parentElement.children[0]?.getBoundingClientRect().height || 0,
        },
        videoState:
          e.tagName === "VIDEO"
            ? {
                hasSrc: e.hasAttribute("src"),
                paused: e.paused,
                readyState: e.readyState,
                videoWidth: e.videoWidth,
              }
            : null,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.ok(m.w > 0 && m.h > 0, label + " nonzero");
    assert.equal(m.overflow, false, label + " overflow");
    if (process.env.QA_POSTER_VIDEO && m.videoState)
      assert.equal(
        m.videoState.hasSrc,
        false,
        label + " selected poster with reduced motion",
      );
    if (m.fit === "fill" && m.tag === "IMG")
      assert.ok(
        Math.abs(m.h - m.w / (m.nw / m.nh)) <= 1,
        label + " intrinsic image not deformed",
      );
    else
      assert.ok(
        ["cover", "contain"].includes(m.fit),
        label + " fit contract " + m.fit,
      );
    if (m.fit === "cover")
      assert.equal(m.position, "50% 50%", label + " centered crop");
    if (/about-(story|community)-image/.test(label)) {
      const expectedHeight = Math.max(
        m.layout.minimum,
        m.w / (m.nw / m.nh),
        m.layout.columns > 1 ? m.layout.copyHeight : 0,
      );
      assert.ok(
        Math.abs(m.h - expectedHeight) <= 1,
        `${label} intrinsic/stretch contract ${m.w}x${m.h}, expected height ${expectedHeight}`,
      );
    }
    if (label.includes("about-certifications-items")) {
      assert.equal(m.fit, "contain", label + " logo containment");
      assert.ok(
        Math.abs(m.h - 48) <= 1 && m.w <= 161,
        label + " logo slot 48px/max160px",
      );
    }
    if (label.includes("buildings-calculator-media")) {
      const expectedHeight =
        m.layout.columns > 1 ? m.layout.copyHeight : m.w / (4 / 5);
      assert.ok(
        Math.abs(m.h - expectedHeight) <= 1,
        `${label} responsive calculator height ${m.h}, expected ${expectedHeight}`,
      );
    }
    if (ratio)
      assert.ok(
        Math.abs(m.h - m.w / ratio) <= 1,
        `${label} ratio ${m.w}x${m.h}, expected ${ratio}`,
      );
    if (screenshot)
      await el.screenshot({
        path: path.join(
          output,
          label.replaceAll(/[^a-z0-9_-]/gi, "-") + "-" + n + ".png",
        ),
        timeout: 15000,
      });
    measurements.push(m);
  }
  return measurements;
}
try {
  await p.goto(base + "/admin/pages/" + requested, {
    waitUntil: "domcontentloaded",
  });
  await p.waitForTimeout(1800);
  if (process.env.QA_POSTER_VIDEO) {
    assert.equal(requested, "services");
    await p.emulateMedia({ reducedMotion: "reduce" });
    await pub.emulateMedia({ reducedMotion: "reduce" });
    for (const group of ["hero", "final_cta"]) {
      await section(p, group);
      const input = p.locator("input[type=file]").first();
      const reservation = p.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          new URL(r.url()).pathname === "/admin/pages/services" &&
          r.request().headers()["next-action"],
      );
      await input.setInputFiles(root + "/fixtures/loop-3-2.mp4");
      assert.equal((await reservation).status(), 200);
      await until(
        () =>
          input
            .locator("xpath=..")
            .getByText("Uploads when you save", { exact: true })
            .count(),
        "video queued",
      );
    }
  }
  // Read the existing working snapshot; do not Save before replacing old orphan media references.
  const node = describe(pageSchemas[requested as keyof typeof pageSchemas]);
  let snap = await pageSnapshot(sql, requested);
  if (!snap?.draft && !snap?.published) {
    const legacy = (
      await sql`select data,og_image_media_id from page_content where key=${requested}`
    )[0];
    assert.ok(legacy, "existing QA content baseline");
    snap = {
      revision: 0,
      draft: {
        content: applyDefaults(node, legacy.data),
        ogImageMediaId: legacy.og_image_media_id,
      },
    };
  }
  const original = structuredClone(snap);
  await fs.writeFile(
    output + "/" + requested + "-initial.json",
    JSON.stringify(original, null, 2),
  );
  let all = fields(node, (snap.draft ?? snap.published).content).filter(
    (x) => x.accept !== "video" && x.accept !== "document",
  );
  if (process.env.QA_FIELDS)
    all = all.filter((x) => process.env.QA_FIELDS!.split(",").includes(x.path));
  if (requested === "guest")
    all = all.filter((x) => !x.path.startsWith("welcome."));
  const passes = requestedRatios;
  for (const pass of passes) {
    const picks: any[] = [];
    const groups = [...new Set(all.map((x) => x.path.split(".")[0]))];
    for (const group of groups) {
      await section(p, group);
      await p.waitForTimeout(100);
      const sectionFields = fields(
        node,
        (
          (await pageSnapshot(sql, requested))?.draft ??
          (await pageSnapshot(sql, requested))?.published ??
          snap.draft ??
          snap.published
        ).content,
      ).filter((x) => x.path.startsWith(group + "."));
      const inputs = p.locator("input[type=file]");
      assert.equal(
        await inputs.count(),
        sectionFields.length,
        requested + "/" + group + " uploader inventory vsUI",
      );
      for (const f of all.filter((x) => x.path.startsWith(group + "."))) {
        const ratioName = pass === "recommended" ? recommended(f) : pass;
        const dim = ratios.find((x) => x[0] === ratioName)!;
        assert.ok(dim);
        if (pass === "recommended" && requestedRatios.includes(ratioName))
          continue;
        const filename =
          requested.replaceAll("_", "-") +
          "-" +
          f.path.replaceAll(/[._]/g, "-") +
          "-" +
          ratioName;
        const file = await fixture(filename, [dim[1], dim[2]]);
        const index = sectionFields.findIndex((x) => x.path === f.path);
        const input = inputs.nth(index);
        await input.setInputFiles(file);
        await until(
          async () =>
            await input
              .locator("xpath=..")
              .locator('img[src^="blob:"]')
              .count(),
          "local selected " + f.path,
        );
        await until(
          () =>
            p
              .getByRole("button", { name: "Save draft", exact: true })
              .first()
              .isEnabled(),
          "reservation " + f.path,
        );
        const localURL = await input
          .locator("xpath=..")
          .locator("img")
          .first()
          .getAttribute("src");
        picks.push({
          ...f,
          ratio: ratioName,
          w: dim[1],
          h: dim[2],
          localURL,
          filename,
        });
        console.log("pick", requested, f.path, ratioName);
      }
    }
    if (!picks.length) continue;
    // Check each exact blob after debounced live rendering; publication runs real upload+finalize.
    for (const pick of picks) {
      try {
        pick.localPreview = await measure(
          await previewFrame(pick),
          pick.localURL,
          "preview-local-" + pick.filename,
          expectedRatio(requested, pick.path),
          false,
        );
      } catch (e) {
        pick.localPreviewError = (e as Error).message;
        report.failures.push({
          field: pick.path,
          ratio: pick.ratio,
          stage: "local-preview",
          error: pick.localPreviewError,
        });
      }
    }
    await p
      .getByRole("button", { name: "Mobile, 390 px", exact: true })
      .click();
    await p.waitForTimeout(250);
    for (const pick of picks) {
      try {
        pick.localPreviewMobile = await measure(
          await previewFrame(pick),
          pick.localURL,
          "preview-local-mobile-" + pick.filename,
          expectedRatio(requested, pick.path),
          true,
        );
      } catch (e) {
        report.failures.push({
          field: pick.path,
          ratio: pick.ratio,
          stage: "local-preview-mobile",
          error: (e as Error).message,
        });
      }
    }
    await p
      .getByRole("button", { name: "Desktop, 1440 px", exact: true })
      .click();
    const rev = snap.revision;
    await saveDraft(p);
    snap = await pageSnapshot(sql, requested);
    assert.ok(snap.revision > rev);
    assert.ok(snap.draft);
    for (const pick of picks) {
      pick.id = at(snap.draft.content, pick.path.split("."));
      const media = (
        await sql`select * from media_asset where id=${pick.id}::uuid`
      )[0];
      assert.ok(media, "finalized selected media");
      assert.equal(media.width, pick.w);
      assert.equal(media.height, pick.h);
      assert.ok(media.r2_key.endsWith("/" + pick.filename + ".png"));
      pick.url = "http://127.0.0.1:9092/welcome-qa/" + media.r2_key;
      pick.persisted = {
        id: media.id,
        width: media.width,
        height: media.height,
        key: media.r2_key,
      };
    }
    await p.reload({ waitUntil: "domcontentloaded" });
    snap = await pageSnapshot(sql, requested);
    for (const pick of picks)
      assert.equal(
        at(snap.draft.content, pick.path.split(".")),
        pick.id,
        "reload retains id",
      );
    await publish(p);
    snap = await pageSnapshot(sql, requested);
    assert.equal(snap.draft, null);
    for (const pick of picks)
      assert.equal(
        at(snap.published.content, pick.path.split(".")),
        pick.id,
        "published retains id",
      );
    const route =
      requested === "home"
        ? ""
        : requested === "guest"
          ? "/guests"
          : requested === "real_estate"
            ? "/real-estate"
            : "/" + requested;
    const destinations =
      requested === "guides"
        ? JSON.parse(process.env.QA_GUIDE_DESTINATIONS || "[]")
        : [];
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      await pub.setViewportSize(viewport);
      await pub.goto(base + "/en" + route, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      for (const pick of picks) {
        try {
          if (requested === "guides" && pick.path.startsWith("guide_aside.")) {
            assert.ok(
              destinations.length,
              "guide aside detail destination required",
            );
            pick.public = pick.public || [];
            for (const dest of destinations) {
              await pub.goto(base + dest, { waitUntil: "domcontentloaded" });
              pick.public.push({
                viewport,
                dest,
                measurements: await measure(
                  pub,
                  pick.url,
                  "public-" + pick.filename + "-" + viewport.width,
                  expectedRatio(requested, pick.path),
                  true,
                ),
              });
            }
            await pub.goto(base + "/en" + route, {
              waitUntil: "domcontentloaded",
            });
          } else {
            pick.public = pick.public || [];
            pick.public.push({
              viewport,
              dest: "/en" + route,
              measurements: await measure(
                pub,
                pick.url,
                "public-" + pick.filename + "-" + viewport.width,
                expectedRatio(requested, pick.path),
                true,
              ),
            });
          }
        } catch (e) {
          report.failures.push({
            field: pick.path,
            ratio: pick.ratio,
            viewport,
            stage: "public",
            error: (e as Error).message,
          });
        }
      }
    }
    for (const pick of picks) {
      try {
        pick.savedPreview = await measure(
          await previewFrame(pick),
          pick.url,
          "preview-saved-" + pick.filename,
          expectedRatio(requested, pick.path),
          false,
        );
      } catch (e) {
        report.failures.push({
          field: pick.path,
          ratio: pick.ratio,
          stage: "saved-preview",
          error: (e as Error).message,
        });
      }
      report.checks.push(pick);
    }
    await p
      .getByRole("button", { name: "Mobile, 390 px", exact: true })
      .click();
    await p.waitForTimeout(250);
    for (const pick of picks) {
      try {
        pick.savedPreviewMobile = await measure(
          await previewFrame(pick),
          pick.url,
          "preview-saved-mobile-" + pick.filename,
          expectedRatio(requested, pick.path),
          true,
        );
      } catch (e) {
        report.failures.push({
          field: pick.path,
          ratio: pick.ratio,
          stage: "saved-preview-mobile",
          error: (e as Error).message,
        });
      }
    }
    await p
      .getByRole("button", { name: "Desktop, 1440 px", exact: true })
      .click();
    await fs.writeFile(
      output + "/" + reportKey + "-results.json",
      JSON.stringify({ ...report, bodyErrors }, null, 2),
    );
    await fs.writeFile(
      output + "/" + reportKey + "-" + pass + "-results.json",
      JSON.stringify({ ...report, bodyErrors }, null, 2),
    );
    console.log(
      "pass-completed",
      requested,
      pass,
      "failures",
      report.failures.length,
    );
  }
} catch (e) {
  report.failures.push({ stage: "harness", error: (e as Error).stack });
  console.error(e);
  console.log("UI failure", await p.locator("body").innerText());
  await p
    .screenshot({
      path: output + "/" + requested + "-failure.png",
      fullPage: true,
    })
    .catch(() => {});
} finally {
  await fs.writeFile(
    output + "/" + reportKey + "-results.json",
    JSON.stringify(
      { ...report, bodyErrors, ended: new Date().toISOString() },
      null,
      2,
    ),
  );
  await b.close();
}
console.log(
  JSON.stringify({
    page: requested,
    checks: report.checks.length,
    failures: report.failures.length,
  }),
);
if (report.failures.length) process.exitCode = 1;
