import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import * as presentation from "../presentation";
import * as editorModel from "../admin/ui/editor-model";
import * as localeContent from "../locale-content";
import * as formState from "../admin/ui/locale-form-state";
import * as feedbackModel from "../admin/ui/feedback-model";
import { guideTreeErrors } from "../admin/validation";
import {
  GUIDE_EDITOR_LOCALES,
  type GuideEditorialModel,
} from "../editorial-types";
import {
  feedbackMessage,
  feedbackTabProps,
} from "@slices/backoffice/contract-client";
type ElementNode = { type?: unknown; props?: Record<string, unknown> };
function nodes(tree: unknown, type: string): ElementNode[] {
  if (Array.isArray(tree)) return tree.flatMap((node) => nodes(node, type));
  if (!tree || typeof tree !== "object") return [];
  const node = tree as ElementNode;
  return [
    ...(node.type === type ? [node] : []),
    ...nodes(node.props?.children, type),
  ];
}

test("a real visible-section rejection links the required group and Add destination to its error", async () => {
  const id = "eef40000-0000-4000-8000-000000000001",
    city = "eef40000-0000-4000-8000-000000000002",
    sectionId = "eef40000-0000-4000-8000-000000000003";
  const draft = editorModel.newGuide(id, city);
  draft.slug = "own-guide";
  draft.slugs.en = "own-guide";
  draft.title = "Guide";
  draft.sections = [
    {
      ...editorModel.newSection(sectionId, id, 0),
      title: "Section",
      body: "Content",
      presentation: { version: 1, enabled: false },
    },
  ];
  const envelope = localeContent.emptyGuideEnvelope(city);
  Object.assign(envelope.content, {
    title: draft.title,
    sections: draft.sections,
  });
  const cities = [
    { id: city, name: "City", slug: "city", status: "published" },
  ] as never;
  const initial: GuideEditorialModel = {
    id,
    status: "published",
    slugByLocale: { en: "own-guide" },
    citySlugs: { en: "city" },
    previews: {},
    cities,
    shared: {
      revision: 1,
      content: localeContent.guideSharedContent(envelope.content),
    },
    locales: Object.fromEntries(
      GUIDE_EDITOR_LOCALES.map((locale) => [
        locale,
        {
          locale,
          revision: 1,
          templateRevision: null,
          draft: envelope,
          published: envelope,
          working: envelope,
        },
      ]),
    ) as GuideEditorialModel["locales"],
  };
  const values: unknown[] = [],
    refs: Array<{ current: unknown }> = [];
  let vi = 0,
    ri = 0;
  const components = (...names: string[]) =>
    Object.fromEntries(names.map((name) => [name, name]));
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    react: {
      useState: (value: unknown) => {
        const index = vi++;
        if (!(index in values))
          values[index] =
            typeof value === "function" ? (value as () => unknown)() : value;
        return [
          values[index],
          (next: unknown) => {
            values[index] =
              typeof next === "function"
                ? (next as (old: unknown) => unknown)(values[index])
                : next;
          },
        ];
      },
      useRef: (value: unknown) => {
        const index = ri++;
        return refs[index] ?? (refs[index] = { current: value });
      },
      useId: () => "group-test",
      useEffect: () => {},
    },
    "next/link": { __esModule: true, default: "NextLink" },
    "next/navigation": { useRouter: () => ({}) },
    "next-intl": { useTranslations: () => (key: string) => key },
    "@core/ui": components("UiIcon"),
    "@slices/backoffice/contract": {
      ...components(
        "AdminCard",
        "StateBadge",
        "Field",
        "Select",
        "FieldGrid",
        "AdminButton",
        "MediaField",
        "MediaAltProvider",
        "MediaQueueProvider",
      ),
      useMediaQueue: () => ({
        isPreparing: false,
        hasPending: false,
        failures: [],
      }),
    },
    "@slices/backoffice/contract-client": {
      ...components("FeedbackScope", "EditorFeedbackSummary"),
      feedbackMessage,
      feedbackTabProps,
      useEditorFeedbackToast: () => ({ error: () => {}, success: () => {} }),
    },
    "../../editorial-types": { GUIDE_EDITOR_LOCALES },
    "../../locale-content": localeContent,
    "../locale-actions": {
      publishGuideLocaleDraft: async () => ({
        ok: false,
        error: "validation",
        fieldErrors: guideTreeErrors({ ...draft, status: "published" }, cities),
      }),
    },
    "./editor-model": editorModel,
    "./guide-place-editor": components("GuideTextField"),
    "./guide-section-editor": components("GuideSectionEditor"),
    "./locale-form-state": formState,
    "./feedback-model": feedbackModel,
  };
  const source =
    fs.readFileSync(
      new URL("../admin/ui/guide-editor.tsx", import.meta.url),
      "utf8",
    ) + "\nexport {Editor as TestGuideEditor};";
  const compiled = {
    exports: {} as { TestGuideEditor: (props: unknown) => unknown },
  };
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, {
    module: compiled,
    exports: compiled.exports,
    require: (name: string) => {
      assert.ok(name in dependencies, `Unexpected dependency ${name}`);
      return dependencies[name];
    },
    console,
  });
  const render = () => {
    vi = 0;
    ri = 0;
    return compiled.exports.TestGuideEditor({ initial, cities, draft });
  };
  const publish = nodes(render(), "AdminButton").find(
    (node) => node.props?.children === "Publish (EN)",
  )!;
  assert.equal(publish.props?.disabled, false);
  await (publish.props!.onClick as () => Promise<void>)();
  const tree = render();
  const error = nodes(tree, "p").find(
    (node) => node.props?.id === `${id}-sections-error`,
  );
  assert.ok(error);
  assert.equal(
    error.props?.children,
    "Keep at least one complete visible section.",
  );
  const group = nodes(tree, "section").find(
    (node) => node.props?.["aria-labelledby"] === "group-test-sections",
  );
  assert.ok(group);
  assert.match(String(group.props?.className), /border-red-600/);
  assert.match(
    String(group.props?.["aria-describedby"]),
    new RegExp(`${id}-sections-error`),
  );
  const add = nodes(tree, "AdminButton").find(
    (node) => node.props?.id === `${id}-sections`,
  )!;
  assert.match(
    String(add.props?.["aria-describedby"]),
    new RegExp(`${id}-sections-error`),
  );
  assert.match(
    String(add.props?.["aria-describedby"]),
    /group-test-sections-required/,
  );
  assert.match(String(add.props?.className), /border-red-600/);
  assert.equal(add.props?.["aria-invalid"], undefined);
  const hint = nodes(tree, "p").find(
    (node) => node.props?.id === "group-test-sections-required",
  );
  assert.ok(hint);
  assert.match(
    String(hint.props?.children),
    /at least one.*visible section.*publish/i,
  );
});

test("Places required marker and description follow explicit ON in a visible section only", () => {
  const sectionId = "eef40000-0000-4000-8000-000000000003",
    guideId = "eef40000-0000-4000-8000-000000000001";
  const source = fs.readFileSync(
    new URL("../admin/ui/guide-section-editor.tsx", import.meta.url),
    "utf8",
  );
  const components = (...names: string[]) =>
    Object.fromEntries(names.map((name) => [name, name]));
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "next-intl": { useTranslations: () => (key: string) => key },
    "@slices/backoffice/contract": components(
      "Field",
      "Checkbox",
      "AdminButton",
      "MediaField",
    ),
    "../../presentation": presentation,
    "./guide-place-editor": components("GuidePlaceEditor", "GuideTextField"),
    "./editor-model": editorModel,
  };
  const compiled = {
    exports: {} as { GuideSectionEditor: (props: unknown) => unknown },
  };
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, {
    module: compiled,
    exports: compiled.exports,
    require: (name: string) => {
      assert.ok(name in dependencies, `Unexpected dependency ${name}`);
      return dependencies[name];
    },
  });
  const render = (
    enabled: boolean,
    places: boolean | undefined,
    errors: Record<string, string> = {},
  ) =>
    compiled.exports.GuideSectionEditor({
      section: {
        ...editorModel.newSection(sectionId, guideId, 0),
        presentation: { version: 1, enabled, modules: { places } },
      },
      previews: {},
      errors,
      dirty: false,
      hasPendingChildren: false,
      persisted: true,
      disabled: false,
      canOrder: true,
      first: true,
      last: true,
      placeState: () => ({ dirty: false, persisted: true, errors: {} }),
      onChange: () => {},
      onPreview: () => {},
      onDelete: () => {},
      onMove: () => {},
      onAddPlace: () => {},
      onDeletePlace: () => {},
      onMovePlace: () => {},
    });
  const error = "Complete this module or switch it off.",
    tree = render(true, true, { places: error });
  const group = nodes(tree, "div").find(
    (node) => node.props?.["aria-labelledby"] === `${sectionId}-places-heading`,
  )!;
  assert.ok(group);
  assert.match(
    String(group.props?.["aria-describedby"]),
    new RegExp(`${sectionId}-places-error`),
  );
  assert.match(String(group.props?.className), /border-red-600/);
  const heading = nodes(group, "h4")[0]!;
  assert.equal(nodes(heading, "span")[0]?.props?.children, "*");
  const add = nodes(group, "AdminButton").find(
    (node) => node.props?.id === `${sectionId}-places`,
  )!;
  assert.match(
    String(add.props?.["aria-describedby"]),
    new RegExp(`${sectionId}-places-required`),
  );
  assert.match(
    String(add.props?.["aria-describedby"]),
    new RegExp(`${sectionId}-places-error`),
  );
  assert.equal(add.props?.["aria-invalid"], undefined);
  const message = nodes(tree, "p").find(
    (node) => node.props?.id === `${sectionId}-places-error`,
  );
  assert.equal(message?.props?.children, error);
  for (const [enabled, places] of [
    [true, undefined],
    [false, true],
  ] as const) {
    const optional = render(enabled, places);
    const h = nodes(optional, "h4").find(
      (node) => node.props?.id === `${sectionId}-places-heading`,
    )!;
    assert.ok(h);
    assert.equal(nodes(h, "span").length, 0);
    assert.equal(
      nodes(optional, "p").some(
        (node) => node.props?.id === `${sectionId}-places-required`,
      ),
      false,
    );
  }
  assert.equal(
    nodes(render(true, false), "div").some(
      (node) =>
        node.props?.["aria-labelledby"] === `${sectionId}-places-heading`,
    ),
    false,
  );
});
