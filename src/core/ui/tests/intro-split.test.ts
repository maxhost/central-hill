import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IntroSplit } from "../intro-split";

const render = (extra = {}) =>
  renderToStaticMarkup(
    createElement(IntroSplit, {
      headline: "Welcome",
      image: createElement("img", {
        src: "/known-3-2.png",
        alt: "Centre marker",
      }),
      ...extra,
    }),
  );

test("existing IntroSplit callers keep stretch and responsive minimum heights", () => {
  const html = render();
  assert.match(html, /data-intro-media-frame="stretch"/);
  assert.match(html, /min-h-\[280px\] self-stretch/);
  assert.match(html, /min-\[881px\]:min-h-\[380px\]/);
  assert.doesNotMatch(html, /aspect-\[3\/2\]/);
});

test("fixed frame reserves SSR space independently of text and media dimensions", () => {
  const short = render({ imageFrame: "3:2" });
  const long = render({
    imageFrame: "3:2",
    paragraphs: ["Long copy ".repeat(1000)],
    imagePosition: "left",
  });
  const frame = (html: string) =>
    html.match(/<div data-intro-media-frame="3:2"[^>]*>/)?.[0];
  assert.equal(frame(short), frame(long));
  assert.match(frame(short)!, /relative aspect-\[3\/2\]/);
  assert.match(frame(short)!, /\*:absolute \*:inset-0/);
  assert.doesNotMatch(frame(short)!, /min-h|self-stretch/);
  assert.match(long, /min-\[881px\]:grid-cols-\[.95fr_1.05fr\]/);
});
