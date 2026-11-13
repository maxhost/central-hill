import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import type { ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import type { FooterContact } from "../footer";

const compiled = { exports: {} };
const dependencies: Record<string, unknown> = {
  "react/jsx-runtime": jsxRuntime,
  "@/i18n/navigation": { Link: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => <a href={href} className={className}>{children}</a> },
  "./container": { Container: ({ children, className }: { children: ReactNode; className?: string }) => <div className={className}>{children}</div> },
};
const code = ts.transpileModule(readFileSync(new URL("../footer.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
runInNewContext(code, { module: compiled, exports: compiled.exports, require: (name: string) => {
  assert.ok(Object.hasOwn(dependencies, name), name);
  return dependencies[name];
} });
const Footer = (compiled.exports as { Footer: typeof import("../footer").Footer }).Footer;
const contact: FooterContact = {
  callLabel: "Call", bookingsLabel: "Bookings", phone: "+351 910 075 725",
  email: "info@centralhill.pt", checkinPhone: "+351 912 310 632", checkinLabel: "Check-in",
  whatsapp: "+351 910 075 725", whatsappLabel: "WhatsApp", ownersPhone: "+351 910 438 062",
  ownersEmail: "partners@centralhill.pt", ownersLabel: "Owners",
  guestsTitle: "For Guests", ownersTitle: "For Owners", officeAddress: "Own office", officeLabel: "Office",
  phoneIcon: <span>phone-icon</span>, emailIcon: <span>email-icon</span>, whatsappIcon: <span>whatsapp-icon</span>,
};
function render(change: Partial<FooterContact> = {}) {
  return renderToStaticMarkup(<Footer brand={<span>Own brand</span>} toggleLabel="Choose" ownerLabel="Owner" guestLabel="Guest"
    contact={{ ...contact, ...change }} newsletter={<button>Own newsletter</button>}
    social={[{ key: "linkedin", label: "in", url: "https://example.test/social" }]}
    groups={[{ title: "Own navigation", links: [{ href: "/own-link", label: "Own link" }] }]}
    copyrightLabel="Own copyright" localeSwitcher={<button>Own locales</button>} />);
}
function group(html: string, audience: "guests" | "owners") {
  return html.match(new RegExp(`<section data-footer-${audience}[^>]*>([\\s\\S]*?)</section>`))?.[1];
}
test("Footer contact columns keep guest and owner email/phone destinations separate", () => {
  const html = render(), guests = group(html, "guests"), owners = group(html, "owners");
  assert.ok(guests); assert.ok(owners);
  for (const href of ["tel:+351910075725", "tel:+351912310632", "mailto:info@centralhill.pt"]) assert.ok(guests.includes(href));
  for (const href of ["tel:+351910438062", "mailto:partners@centralhill.pt"]) assert.ok(owners.includes(href));
  assert.equal(guests.includes("partners@"), false); assert.equal(owners.includes("info@"), false);
  assert.ok(guests.includes("whatsapp-icon"));
  for (const text of ["Own brand", "Own office", "Own newsletter", "Own navigation", "Own link", "Own copyright", "Own locales", "https://example.test/social"]) assert.ok(html.includes(text));
});
test("Empty Owners email hides just that link and never substitutes guest email", () => {
  const html = render({ ownersEmail: "  " }), owners = group(html, "owners");
  assert.ok(owners);
  assert.ok(owners?.includes("tel:+351910438062"));
  assert.equal(owners.includes("mailto:"), false);
  assert.ok(group(html, "guests")?.includes("mailto:info@centralhill.pt"));
});
test("An email-only Owners group remains independently visible and trimmed", () => {
  const owners = group(render({ ownersPhone: " ", ownersEmail: "  owner@example.test  " }), "owners");
  assert.ok(owners);
  assert.ok(owners?.includes('href="mailto:owner@example.test"'));
  assert.equal(owners.includes("tel:"), false);
});
test("Both absent Owners contacts omit the empty group without losing guest contacts", () => {
  const html = render({ ownersPhone: undefined, ownersEmail: undefined });
  assert.equal(group(html, "owners"), undefined);
  assert.ok(group(html, "guests")?.includes("info@centralhill.pt"));
});
test("Optional guest rows may be absent without substituting Owners destinations", () => {
  const guests = group(render({ checkinPhone: undefined, whatsapp: undefined }), "guests");
  assert.ok(guests);
  assert.ok(guests?.includes("tel:+351910075725"));
  assert.equal(guests.includes("+351912310632"), false);
  assert.equal(guests.includes("whatsapp-icon"), false);
});
for (const locale of ["en", "es", "pt", "fr"]) test(`Footer contact group headings resolve in ${locale}`, () => {
  const messages = JSON.parse(readFileSync(new URL(`../../../../messages/${locale}.json`, import.meta.url), "utf8")).settings.footer;
  const html = render({ guestsTitle: messages.guestsContactTitle, ownersTitle: messages.ownersContactTitle });
  assert.ok(group(html, "guests")?.includes(messages.guestsContactTitle));
  assert.ok(group(html, "owners")?.includes(messages.ownersContactTitle));
});
