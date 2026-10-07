import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { iconKey } from "@core/validation/icon-key";
import { FALLBACK_ICON, ICON_NAMES, Icon, isIconName, resolveIconName } from "../icon";
import { ICON_SVG } from "../icons/svg";

/**
 * `core/ui` `<Icon>` + the generated Iconoir map (ADR 0034). Pure, no DB. The local
 * tsconfig adds the `server-only` shim and the automatic JSX runtime. Run:
 *   npx tsx --tsconfig src/core/ui/tests/tsconfig.json --test src/core/ui/tests/icon.test.ts
 */

test("generated map matches the pinned iconoir package", () => {
  const dir = path.resolve(process.cwd(), "node_modules/iconoir/icons/regular");
  const files = readdirSync(dir).filter((f) => f.endsWith(".svg")).map((f) => f.slice(0, -4)).sort();
  assert.deepEqual([...ICON_NAMES], files, "re-run `pnpm icons:generate`");
  for (const name of ICON_NAMES) assert.ok(ICON_SVG[name].length > 0, name);
});

test("isIconName / resolveIconName", () => {
  assert.equal(isIconName("graph-up"), true);
  assert.equal(isIconName("chart"), false);
  assert.equal(resolveIconName("map-pin"), "map-pin");
  assert.equal(resolveIconName("chart"), FALLBACK_ICON);
  assert.equal(resolveIconName(undefined), FALLBACK_ICON);
  assert.equal(resolveIconName(""), FALLBACK_ICON);
});

test("renders the named icon inline, decorative by default", () => {
  const html = renderToStaticMarkup(createElement(Icon, { name: "map-pin", size: 20, className: "text-accent" }));
  assert.match(html, /^<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="1.5"/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /class="text-accent"/);
  assert.ok(html.includes(ICON_SVG["map-pin"]));
});

test("unknown name renders the fallback", () => {
  const html = renderToStaticMarkup(createElement(Icon, { name: "does-not-exist" }));
  assert.ok(html.includes(ICON_SVG[FALLBACK_ICON]));
});

test("strokeWidth on the root is not overridden by the icon's own paths", () => {
  const html = renderToStaticMarkup(createElement(Icon, { name: "map-pin", strokeWidth: 2 }));
  assert.match(html, /stroke-width="2"/);
  assert.doesNotMatch(ICON_SVG["map-pin"], /stroke-width="1\.5"/);
});

test("title makes the icon an escaped, labelled image", () => {
  const html = renderToStaticMarkup(createElement(Icon, { name: "bell", title: 'Alerts <&> "x"' }));
  assert.match(html, /role="img"/);
  assert.doesNotMatch(html, /aria-hidden/);
  assert.ok(html.includes("<title>Alerts &lt;&amp;&gt; \"x\"</title>"));
});

test("iconKey accepts only existing iconoir names", () => {
  assert.equal(iconKey.safeParse("graph-up").success, true);
  assert.equal(iconKey.safeParse("chart").success, false);
  assert.equal(iconKey.safeParse("Map-Pin").success, false);
});
