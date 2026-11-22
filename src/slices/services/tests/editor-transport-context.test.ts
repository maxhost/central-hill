import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import { ZodError } from "zod";
import {
  feedbackMessage,
  feedbackTabProps,
  type FeedbackGroup,
} from "@slices/backoffice/contract-client";
import * as guideHelpers from "../../guides/admin/ui/editor-model";
import * as guideContent from "../../guides/locale-content";
import * as guideState from "../../guides/admin/ui/locale-form-state";
import * as guideFeedback from "../../guides/admin/ui/feedback-model";
import { GUIDE_EDITOR_LOCALES } from "../../guides/editorial-types";
import { emptyServiceEnvelope, serviceSharedContent } from "../locale-content";
import * as serviceForm from "../admin/form-model";
import * as serviceState from "../admin/locale-form-state";
import * as serviceFeedback from "../admin/feedback-model";
import * as servicePresentation from "../presentation";
import { SERVICE_EDITOR_LOCALES } from "../editorial-types";
import * as postState from "../../blog/admin/ui/post-editor-state";
import * as postFeedback from "../../blog/admin/ui/feedback-model";
import { BLOG_EDITOR_LOCALES } from "../../blog/editorial-types";

type Domain = "guide" | "service" | "blog";
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
const locales = ["en", "es", "pt", "fr"] as const;
const id = "eef50000-0000-4000-8000-000000000001",
  reference = "eef50000-0000-4000-8000-000000000002",
  media = "eef50000-0000-4000-8000-000000000003";
/** Focal integration: real editor handlers and grouped state, controlled failing action transport, no browser/DB/upload-success claim. */
function harness(domain: Domain, failedFile = false) {
  const components = (...names: string[]) =>
    Object.fromEntries(names.map((name) => [name, name]));
  const values: unknown[] = [],
    refs: Array<{ current: unknown }> = [],
    tasks: Promise<unknown>[] = [],
    toasts: string[] = [],
    flushGroups: FeedbackGroup[][] = [];
  let vi = 0,
    ri = 0,
    actions = 0;
  const field =
    domain === "guide" ? "title" : domain === "service" ? "name" : "excerpt";
  const known = { [field]: "Complete this required field." };
  const inject = (value: unknown): unknown => {
    if (!value || typeof value !== "object") return value;
    const object = value as Record<string, unknown>;
    const states = (object.locales ??
      (domain === "blog" && object.en ? object : null)) as Record<
      string,
      { errors: Record<string, string> }
    > | null;
    if (states && locales.every((locale) => states[locale]))
      for (const locale of locales) states[locale]!.errors = { ...known };
    return value;
  };
  const fail = async () => {
    actions++;
    throw Error("Controlled lost action response");
  };
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    react: {
      useState: (value: unknown) => {
        const index = vi++;
        if (!(index in values))
          values[index] = inject(
            typeof value === "function" ? (value as () => unknown)() : value,
          );
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
      useId: () => "transport-context",
      useEffect: () => {},
      useMemo: (fn: () => unknown) => fn(),
      useCallback: (fn: unknown) => fn,
      useTransition: () => [
        false,
        (fn: () => unknown) => tasks.push(Promise.resolve(fn())),
      ],
    },
    "next/link": { __esModule: true, default: "NextLink" },
    "next/navigation": { useRouter: () => ({}) },
    "next-intl": { useTranslations: () => (key: string) => key },
    "@core/ui": components("UiIcon"),
    "@core/ui/icons/names": { isIconName: () => true },
    zod: { ZodError },
    "@slices/backoffice/contract": {
      ...components(
        "AdminButton",
        "AdminCard",
        "StateBadge",
        "Field",
        "FieldGrid",
        "Checkbox",
        "Select",
        "TextInput",
        "TextArea",
        "IconField",
        "MediaField",
        "MediaGalleryField",
        "MediaAltProvider",
        "MediaQueueProvider",
      ),
      useMediaQueue: () => ({
        isPreparing: false,
        hasPending: false,
        failures: failedFile
          ? [{ id: media, name: "pt-cover.png", locale: "pt", entity: id }]
          : [],
        isQueued: () => false,
        flush: async (
          _ids: unknown,
          options: { knownGroups?: FeedbackGroup[] },
        ) => {
          flushGroups.push(structuredClone(options.knownGroups ?? []));
          return true;
        },
      }),
    },
    "@slices/backoffice/contract-client": {
      ...components("FeedbackScope", "EditorFeedbackSummary"),
      feedbackMessage,
      feedbackTabProps,
      focusEditorField: () => false,
      useEditorFeedbackToast: () => ({
        error: (message: string) => toasts.push(message),
        success: () => assert.fail("uncertain action must not emit success"),
      }),
    },
  };
  let file: string,
    exportName: string,
    append = "",
    props: unknown;
  if (domain === "guide") {
    const draft = guideHelpers.newGuide(id, reference);
    draft.slug = "guide";
    draft.slugs.en = "guide";
    draft.hero_media_id = media;
    const envelope = guideContent.emptyGuideEnvelope(reference);
    envelope.content.hero_media_id = media;
    const initial = {
      id,
      status: "published",
      slugByLocale: { en: "guide" },
      citySlugs: { en: "city" },
      previews: {},
      cities: [],
      shared: {
        revision: 1,
        content: guideContent.guideSharedContent(envelope.content),
      },
      locales: Object.fromEntries(
        locales.map((locale) => [
          locale,
          {
            locale,
            revision: 1,
            templateRevision: null,
            published: envelope,
            draft: envelope,
            working: envelope,
          },
        ]),
      ),
    };
    Object.assign(dependencies, {
      "../../editorial-types": { GUIDE_EDITOR_LOCALES },
      "../../locale-content": guideContent,
      "../locale-actions": {
        saveGuideLocaleDraft: fail,
        publishGuideLocaleDraft: fail,
      },
      "./editor-model": guideHelpers,
      "./guide-place-editor": components("GuideTextField"),
      "./guide-section-editor": components("GuideSectionEditor"),
      "./locale-form-state": guideState,
      "./feedback-model": guideFeedback,
    });
    file = "../../guides/admin/ui/guide-editor.tsx";
    exportName = "TestGuideEditor";
    append = "\nexport {Editor as TestGuideEditor};";
    props = { initial, cities: [], draft };
  } else if (domain === "service") {
    const envelope = emptyServiceEnvelope(reference);
    envelope.content.cover_media_id = media;
    const initial = {
      id,
      status: "published",
      slugByLocale: { en: "service" },
      previews: {},
      shared: { revision: 1, content: serviceSharedContent(envelope.content) },
      locales: Object.fromEntries(
        locales.map((locale) => [
          locale,
          {
            locale,
            revision: 1,
            templateRevision: null,
            published: envelope,
            draft: envelope,
            working: envelope,
          },
        ]),
      ),
    };
    Object.assign(dependencies, {
      "../feedback-model": serviceFeedback,
      "../locale-form-state": serviceState,
      "../form-model": serviceForm,
      "../../editorial-types": { SERVICE_EDITOR_LOCALES },
      "../../presentation": servicePresentation,
      "../actions": {},
      "../locale-actions": {
        saveServiceLocaleDraft: fail,
        publishServiceLocaleDraft: fail,
      },
      "./detail-editor": components("DetailEditor"),
      "./service-section-controls": { ServiceField: "ServiceField" },
      "./service-copy-editor": components("ServiceCopyEditor"),
      "./enquiry-form-selector": components("ServiceEnquirySelector"),
    });
    file = "../admin/ui/service-form.tsx";
    exportName = "ServiceForm";
    props = { initial, categories: [{ id: reference, name: "Category" }] };
  } else {
    const envelope = postState.emptyPostEnvelope(reference, reference);
    envelope.content.cover_media_id = media;
    const initial = {
      id,
      archived: false,
      slugByLocale: { en: "article" },
      previews: {},
      locales: Object.fromEntries(
        locales.map((locale) => [
          locale,
          {
            locale,
            revision: 1,
            templateRevision: null,
            published: envelope,
            draft: envelope,
            working: envelope,
          },
        ]),
      ),
    };
    Object.assign(dependencies, {
      "../editorial-contract": { BLOG_EDITOR_LOCALES },
      "../post-locale-actions": {
        savePostLocaleDraft: fail,
        publishPostLocaleDraft: fail,
      },
      "../actions": {},
      "./post-rich-text-editor": components("PostRichTextEditor"),
      "./post-editor-state": postState,
      "./feedback-model": postFeedback,
    });
    file = "../../blog/admin/ui/post-locale-editor.tsx";
    exportName = "PostLocaleEditor";
    props = { initial, categories: [], authors: [], posts: [] };
  }
  const output = { exports: {} as Record<string, (props: unknown) => unknown> };
  const code = ts.transpileModule(
    fs.readFileSync(new URL(file, import.meta.url), "utf8") + append,
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    module: output,
    exports: output.exports,
    require: (name: string) => {
      assert.ok(name in dependencies, `Unexpected dependency ${name}`);
      return dependencies[name];
    },
    console,
  });
  const render = () => {
    vi = 0;
    ri = 0;
    return output.exports[exportName]!(props);
  };
  return {
    render,
    toasts,
    flushGroups,
    actions: () => actions,
    settled: async () => {
      await Promise.all(tasks);
      await new Promise((resolve) => setImmediate(resolve));
    },
  };
}
for (const domain of ["guide", "service", "blog"] as const) {
  for (const action of ["save", "publish"] as const)
    test(`${domain}: uncertain EN ${action} preserves and names all captured known translation errors`, async () => {
      const h = harness(domain);
      let tree = h.render();
      const before = structuredClone(
        nodes(tree, "FeedbackScope")[0]!.props!.knownGroups as FeedbackGroup[],
      );
      assert.deepEqual(
        before.map((group) => [group.locale, group.issues.length]),
        [
          ["en", 1],
          ["es", 1],
          ["pt", 1],
          ["fr", 1],
        ],
      );
      const save = nodes(tree, "AdminButton").find(
        (node) =>
          node.props?.children ===
          (action === "save" ? "Save draft (EN)" : "Publish (EN)"),
      )!;
      await (save.props!.onClick as () => unknown)();
      await h.settled();
      assert.equal(h.actions(), 1);
      assert.equal(h.toasts.length, 1);
      assert.match(h.toasts[0]!, /could not confirm.*EN/i);
      for (const locale of ["ES", "PT", "FR"])
        assert.match(h.toasts[0]!, new RegExp(`${locale} \\(1\\)`));
      if (action === "save")
        assert.deepEqual(
          h.flushGroups[0]?.map((group) => [group.locale, group.issues.length]),
          before.map((group) => [group.locale, group.issues.length]),
        );
      else
        assert.equal(
          h.flushGroups.length,
          0,
          "Publish never flushes or retries an upload",
        );
      tree = h.render();
      const after = nodes(tree, "FeedbackScope")[0]!.props!
        .knownGroups as FeedbackGroup[];
      for (const locale of ["es", "pt", "fr"])
        assert.deepEqual(
          after.find((group) => group.locale === locale),
          before.find((group) => group.locale === locale),
          "no validation or mutation of other-language error state",
        );
    });
  test(`${domain}: selection scope carries raw validation groups without counting queue failures`, () => {
    const tree = harness(domain, true).render(),
      scope = nodes(tree, "FeedbackScope")[0]!.props!;
    const raw = scope.knownGroups as FeedbackGroup[],
      visible = nodes(tree, "EditorFeedbackSummary")[0]!.props!
        .groups as FeedbackGroup[];
    assert.equal(raw.find((group) => group.locale === "pt")?.issues.length, 1);
    assert.equal(
      visible.find((group) => group.locale === "pt")?.issues.length,
      2,
    );
  });
}
