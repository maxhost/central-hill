import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { browser, root, base } from "./common.mjs";
const manifest = JSON.parse(
  await fs.readFile(root + "/matrix/pages-manifest.json", "utf8"),
);
const fixtures = [];
for (const field of manifest.rows)
  for (const instance of field.instances)
    for (const evidence of instance.evidence) {
      const url = new URL(evidence.sourceUrl);
      assert.equal(url.origin, "http://127.0.0.1:9092");
      assert.ok(url.pathname.startsWith("/welcome-qa/"));
      fixtures.push({
        fieldId: field.id,
        path: instance.path,
        ratio: evidence.ratio,
        mediaId: evidence.mediaId,
        sourceUrl: url.href,
        expected: evidence.metadata,
      });
    }
const b = await browser(),
  c = await b.newContext(),
  p = await c.newPage();
const results = [];
try {
  await p.goto(base + "/admin/login", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  for (let offset = 0; offset < fixtures.length; offset += 5) {
    const batch = fixtures.slice(offset, offset + 5);
    const read = await p.evaluate(async (inputs) => {
      const out = [];
      for (const input of inputs) {
        const image = new Image();
        image.src = input.sourceUrl;
        await image.decode();
        out.push({
          ...input,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        });
        image.src = "";
      }
      return out;
    }, batch);
    for (const record of read) {
      assert.equal(
        record.naturalWidth,
        record.expected.width,
        record.fieldId +
          "/" +
          record.path +
          "/" +
          record.ratio +
          " visual width",
      );
      assert.equal(
        record.naturalHeight,
        record.expected.height,
        record.fieldId +
          "/" +
          record.path +
          "/" +
          record.ratio +
          " visual height",
      );
      results.push(record);
    }
  }
  await fs.writeFile(
    root + "/matrix/natural-dimensions-results.json",
    JSON.stringify(
      {
        readonly: true,
        uploadSuccessMocked: false,
        browserDecodedOriginals: results.length,
        results,
      },
      null,
      2,
    ),
  );
  console.log("actual browser natural dimensions", results.length);
} finally {
  await b.close();
}
