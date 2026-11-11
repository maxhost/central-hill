import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
export const out =
  process.env.FIXTURE_ARTIFACT_DIR || "/private/tmp/central-hill-translations-retirement-qa";
export const sourceRoot = process.env.SOURCE_ROOT || process.cwd();
export const req = createRequire(path.join(sourceRoot, "package.json"));
export const locales = ["en", "es", "pt", "fr"];
const tables = {
  page: ["page_locale_content", "page_key"],
  post: ["blog_post_locale_content", "post_id"],
  service: ["service_locale_content", "service_id"],
  guide: ["guide_locale_content", "guide_id"],
};
export function guardURL() {
  const url = new URL(process.env.DATABASE_URL || "");
  assert.equal(url.hostname, "translationsretirementqa.local");
  assert.equal(url.pathname, "/translationsretirementqa");
  assert.equal(decodeURIComponent(url.username), "translationsretirementqa");
  const base = new URL(process.env.QA_BASE_URL || "");
  assert.ok(["localhost", "127.0.0.1"].includes(base.hostname));
  assert.equal(base.protocol, "http:");
  assert.equal(base.port, "3081", "Only authorized isolated QA3081 runtime");
  return base.origin;
}
export async function database() {
  guardURL();
  const { neon } = req("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  assert.deepEqual((await sql`select current_database()as db,current_user as role`)[0], {
    db: "translationsretirementqa",
    role: "translationsretirementqa",
  });
  return sql;
}
export async function snapshot(sql, kind, id) {
  const mapping = tables[kind];
  assert.ok(mapping, "Unknown snapshot kind");
  const [table, key] = mapping;
  return await sql.query(
    `select locale,revision,draft,published from ${table} where ${key}=$1 order by locale`,
    [id],
  );
}
export function at(root, dot) {
  return dot.split(".").reduce((v, k) => v?.[k], root);
}
export function own(rows, locale) {
  const row = rows.find((r) => r.locale === locale);
  assert.ok(row, `Missing ${locale} baseline`);
  return row;
}
export async function waitUntil(check, label, timeout = 30000) {
  const until = Date.now() + timeout;
  let last;
  while (Date.now() < until) {
    try {
      const result = await check();
      if (result) return result;
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw Error(`Timeout ${label}${last ? ": " + last.message : ""}`);
}
export async function startBrowser() {
  const base = guardURL(),
    { chromium } = req("playwright"),
    browser = await chromium.launch({ headless: true });
  const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    publicContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await admin.newPage(),
    pub = await publicContext.newPage(),
    errors = [];
  for (const p of [page, pub]) {
    p.setDefaultNavigationTimeout(60000);
    p.setDefaultTimeout(15000);
    p.on("pageerror", (e) => errors.push({ url: p.url(), message: e.message }));
    p.on("dialog", (d) => d.accept());
  }
  const login = JSON.parse(await fs.readFile(process.env.QA_LOGIN_FILE, "utf8"));
  await page.goto(base + "/admin/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email", { exact: true }).fill(login.email);
  await page.getByLabel("Password", { exact: true }).fill(login.password);
  await page.getByRole("button", { name: /Sign in|Log in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"));
  assert.ok(!page.url().includes("/login"));
  return { base, browser, admin, publicContext, page, pub, errors };
}
export async function selectLocale(page, locale) {
  const name = locale.toUpperCase(),
    tab = page.getByRole("tab", { name: new RegExp("^" + name) });
  if (await tab.count()) await tab.first().click();
  else
    await page
      .getByRole("button", { name: locale === "en" ? /^EN/ : name, exact: locale !== "en" })
      .first()
      .click();
}
export async function action(page, sql, kind, id, locale, action) {
  const before = own(await snapshot(sql, kind, id), locale);
  await page.getByRole("button", { name: action, exact: true }).first().click();
  let after;
  try {
    after = await waitUntil(async () => {
      const row = own(await snapshot(sql, kind, id), locale);
      return row.revision > before.revision && (action !== "Publish" || row.draft === null)
        ? row
        : null;
    }, `${kind} ${locale} ${action}`);
  } catch (e) {
    const diagnostic = await page
      .locator('[aria-invalid="true"],[role="alert"]')
      .evaluateAll((nodes) =>
        nodes.map((n) => ({
          id: n.id,
          path: n.getAttribute("data-service-path") || n.getAttribute("data-post-field"),
          text: (n.textContent || n.getAttribute("aria-description") || "").slice(0, 400),
        })),
      );
    throw Error(e.message + "; UI validation " + JSON.stringify(diagnostic));
  }
  await waitUntil(
    () => page.getByRole("button", { name: "Save draft", exact: true }).first().isEnabled(),
    "Save draft re-enabled",
  );
  return after;
}
export async function publicAssert(page, { kind, value }, scope = "body") {
  if (kind === "document-title") {
    assert.equal(await page.title(), value);
    return;
  }
  if (kind === "meta-description") {
    assert.equal(await page.locator('meta[name="description"]').getAttribute("content"), value);
    return;
  }
  if (kind === "aside-aria-label") {
    assert.ok(
      await page
        .locator("aside")
        .evaluateAll((nodes, v) => nodes.some((n) => n.getAttribute("aria-label") === v), value),
      "Missing aside aria-label: " + value,
    );
    return;
  }
  if (kind === "image-alt") {
    assert.ok(
      await page.locator("img").evaluateAll((nodes, v) => nodes.some((n) => n.alt === v), value),
      `Missing img.alt: ${value}`,
    );
    return;
  }
  if (kind === "link-href") {
    assert.ok(
      await page
        .locator(`${scope} a`)
        .evaluateAll(
          (nodes, v) => nodes.some((n) => n.href === v || n.getAttribute("href") === v),
          value,
        ),
      `Missing href: ${value}`,
    );
    return;
  }
  if (kind === "input-placeholder") {
    assert.ok(
      await page
        .locator(`${scope} input`)
        .evaluateAll((nodes, v) => nodes.some((n) => n.placeholder === v), value),
      `Missing placeholder: ${value}`,
    );
    return;
  }
  if (kind === "input-aria-label") {
    assert.ok(
      await page
        .locator(`${scope} input`)
        .evaluateAll((nodes, v) => nodes.some((n) => n.getAttribute("aria-label") === v), value),
      `Missing aria-label: ${value}`,
    );
    return;
  }
  const visible = await page.locator(scope).evaluate(
    (root, v) =>
      [...root.querySelectorAll("*")].some((el) => {
        if (["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"].includes(el.tagName)) return false;
        const style = getComputedStyle(el),
          rect = el.getBoundingClientRect();
        const direct = [...el.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent)
          .join("");
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0 &&
          direct.includes(v)
        );
      }),
    value,
  );
  assert.ok(visible, `Missing visible text: ${value}`);
}
export async function record(name, result) {
  assert.ok(/^[a-z0-9_-]+$/.test(name));
  await fs.mkdir(path.join(out, "results"), { recursive: true });
  await fs.writeFile(
    path.join(out, "results", name + ".json"),
    JSON.stringify({ ...result, recordedAt: new Date().toISOString() }, null, 2),
  );
}

export async function publicSEO(page) {
  return {
    path: new URL(page.url()).pathname,
    language: await page.locator("html").getAttribute("lang"),
    links: await page
      .locator('link[rel="canonical"],link[rel="alternate"][hreflang]')
      .evaluateAll((nodes) =>
        nodes
          .map((n) => ({
            rel: n.rel,
            locale: n.getAttribute("hreflang"),
            href: n.getAttribute("href"),
          }))
          .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      ),
  };
}

export async function assertNoBoundary(page, caseResult) {
  caseResult.boundaries ??= [];
  const text = await page.locator("body").innerText();
  const hits = ["Something went wrong", "This page could not be found"].filter((value) =>
    text.includes(value),
  );
  if (hits.length) caseResult.boundaries.push({ url: page.url(), messages: hits });
  assert.deepEqual(caseResult.boundaries, [], "No error boundary in case");
}
