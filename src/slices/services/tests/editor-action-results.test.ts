import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import ts from "typescript";

/** Execute the real result/classification code with an unavailable read/cache dependency. No fake DB success is reported as E2E. */
function load(file: string, mocks: Record<string, unknown>, append = "") {
  const source =
    fs.readFileSync(new URL(file, import.meta.url), "utf8") + append;
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports: Record<
    string,
    (...args: unknown[]) => Promise<Record<string, unknown>>
  > = {};
  vm.runInNewContext(
    code,
    { exports, require: (name: string) => mocks[name] ?? {}, console },
    { filename: file },
  );
  return exports;
}
for (const domain of ["guides", "services"] as const) {
  test(`${domain}: confirmed mutation with failed editor readback remains success and requires reload`, async () => {
    const previous = {
      id: "stable",
      locales: {
        es: { revision: 2, draft: { content: { title: "Keep working" } } },
      },
    };
    const name = domain === "guides" ? "success" : "confirmedServiceResult";
    const store = load(
      `../../${domain}/server/locale-store.ts`,
      {
        "./locale-model": {
          [domain === "guides"
            ? "readGuideEditorialModel"
            : "readServiceEditorialModel"]: async () => {
            throw Error("unavailable read");
          },
        },
      },
      `\nexport { ${name} as committedReadback };`,
    );
    const result = await store.committedReadback!("stable", previous);
    assert.equal(result.ok, true);
    assert.equal(result.refreshWarning, true);
    assert.equal(result.reloadRequired, true);
    assert.equal(result.model, previous);
    assert.equal(previous.locales.es.revision, 2);
  });
  test(`${domain}: cache refresh failure after confirmed mutation never becomes a rejected action`, async () => {
    const result = {
      ok: true,
      model: { id: "stable" },
      refreshWarning: true,
      reloadRequired: true,
    };
    let mutations = 0,
      refreshes = 0;
    const functions =
      domain === "guides"
        ? {
            saveGuideDraft: async () => {
              mutations++;
              return result;
            },
            publishGuideDraft: async () => {
              mutations++;
              return result;
            },
          }
        : {
            saveServiceDraft: async () => {
              mutations++;
              return result;
            },
            publishServiceDraft: async () => {
              mutations++;
              return result;
            },
          };
    const schema = {
      safeParse: (raw: unknown) => ({ success: true, data: raw }),
    };
    const actions = load(`../../${domain}/admin/locale-actions.ts`, {
      "@core/auth": { requireStaff: async () => ({ userId: "actor" }) },
      "next/cache": {
        revalidatePath: () => {
          refreshes++;
          throw Error("cache unavailable");
        },
      },
      "../server/locale-store": functions,
      "../server/publish": {
        revalidateGuides: () => undefined,
        revalidateServices: () => undefined,
      },
      "../server/locale-validation": {
        saveServiceRequestSchema: schema,
        publishServiceRequestSchema: schema,
      },
    });
    for (const name of domain === "guides"
      ? ["saveGuideLocaleDraft", "publishGuideLocaleDraft"]
      : ["saveServiceLocaleDraft", "publishServiceLocaleDraft"]) {
      const actual = await actions[name]!({ serviceId: "stable" });
      assert.equal(actual.ok, true);
      assert.equal(actual.refreshWarning, true);
      assert.equal(actual.reloadRequired, true);
    }
    assert.equal(mutations, 2);
    assert.equal(refreshes, 2);
  });
}
