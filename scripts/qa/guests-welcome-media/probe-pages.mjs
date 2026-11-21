import { database, root } from "./common.mjs";
import fs from "node:fs/promises";
const sql = await database();
const rows =
  await sql`select page_key,locale,draft,published from page_locale_content where locale='en' order by page_key`;
await fs.writeFile(
  root + "/page-state-private.json",
  JSON.stringify(rows, null, 2),
);
console.log(
  rows.map((x) => ({
    key: x.page_key,
    contentKeys: Object.keys((x.draft || x.published || {}).content || {}),
  })),
);
