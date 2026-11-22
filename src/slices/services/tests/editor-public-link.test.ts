import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { ZodError } from "zod";
import {
  saveServiceRequestSchema,
  serviceFieldErrors,
} from "../server/locale-validation";
import * as jsxRuntime from "react/jsx-runtime";
import { emptyServiceEnvelope, serviceSharedContent } from "../locale-content";
import {
  SERVICE_EDITOR_LOCALES,
  type ServiceEditorialModel,
} from "../editorial-types";
import * as formModel from "../admin/form-model";
import * as workspace from "../admin/locale-form-state";
import * as feedbackModel from "../admin/feedback-model";
import * as presentation from "../presentation";
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
function harness() {
  const category = "eef30000-0000-4000-8000-000000000001",
    id = "eef30000-0000-4000-8000-000000000002";
  const envelope = emptyServiceEnvelope(category);
  envelope.content.name = "Published service";
  const initial: ServiceEditorialModel = {
    id,
    status: "published",
    slugByLocale: { en: "own-preview" },
    previews: {},
    shared: { revision: 1, content: serviceSharedContent(envelope.content) },
    locales: Object.fromEntries(
      SERVICE_EDITOR_LOCALES.map((locale) => [
        locale,
        {
          locale,
          revision: 1,
          templateRevision: null,
          published: envelope,
          draft: null,
          working: envelope,
        },
      ]),
    ) as ServiceEditorialModel["locales"],
  };
  const components = (...names: string[]) =>
    Object.fromEntries(names.map((name) => [name, name]));
  const values: unknown[] = [],
    refs: Array<{ current: unknown }> = [],
    tasks: Promise<unknown>[] = [];
  let valueIndex = 0,
    refIndex = 0;
  const dependencies: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    react: {
      useState: (value: unknown) => {
        const index = valueIndex++;
        if (!(index in values))
          values[index] =
            typeof value === "function" ? (value as () => unknown)() : value;
        return [
          values[index],
          (next: unknown) => {
            values[index] =
              typeof next === "function"
                ? (next as (before: unknown) => unknown)(values[index])
                : next;
          },
        ];
      },
      useRef: (value: unknown) => {
        const index = refIndex++;
        return refs[index] ?? (refs[index] = { current: value });
      },
      useId: () => "public-link-test",
      useEffect: () => {},
      useTransition: () => [
        false,
        (fn: () => unknown) => {
          tasks.push(Promise.resolve(fn()));
        },
      ],
      useCallback: (fn: unknown) => fn,
    },
    "next/link": { __esModule: true, default: "NextLink" },
    "next/navigation": { useRouter: () => ({}) },
    "next-intl": { useTranslations: () => (key: string) => key },
    zod: { ZodError },
    "@core/ui/icons/names": { isIconName: () => true },
    "@core/ui": components("UiIcon"),
    "@slices/backoffice/contract": {
      ...components(
        "AdminButton",
        "AdminCard",
        "IconField",
        "FieldGrid",
        "StateBadge",
        "MediaField",
        "MediaAltProvider",
        "MediaGalleryField",
        "Select",
        "TextArea",
        "TextInput",
      ),
      useMediaQueue: () => ({
        isPreparing: false,
        hasPending: false,
        failures: [],
        flush: async () => true,
      }),
    },
    "@slices/backoffice/contract-client": {
      ...components("FeedbackScope", "EditorFeedbackSummary"),
      feedbackMessage,
      feedbackTabProps,
      focusEditorField: () => false,
      useEditorFeedbackToast: () => ({ error: () => {}, success: () => {} }),
    },
    "../feedback-model": feedbackModel,
    "../locale-form-state": workspace,
    "../form-model": formModel,
    "../../editorial-types": { SERVICE_EDITOR_LOCALES },
    "../../presentation": presentation,
    "../actions": {},
    "../locale-actions": {
      saveServiceLocaleDraft: async (raw: unknown) => {
        const parsed = saveServiceRequestSchema.safeParse(raw);
        assert.equal(
          parsed.success,
          false,
          "the fixture exercises a real request-schema rejection",
        );
        if (parsed.success) throw Error("Expected invalid category");
        return {
          ok: false,
          error: "validation",
          fieldErrors: serviceFieldErrors(parsed.error.issues),
        };
      },
    },
    "./detail-editor": components("DetailEditor"),
    "./service-section-controls": { ServiceField: "ServiceField" },
    "./service-copy-editor": components("ServiceCopyEditor"),
    "./enquiry-form-selector": components("ServiceEnquirySelector"),
  };
  const output = {
    exports: {} as { ServiceForm: (props: unknown) => unknown },
  };
  const source = fs.readFileSync(
    new URL("../admin/ui/service-form.tsx", import.meta.url),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports: output.exports,
    module: output,
    require: (name: string) => {
      assert.ok(name in dependencies, `Unexpected dependency ${name}`);
      return dependencies[name];
    },
    console,
    requestAnimationFrame: (fn: () => void) => fn(),
  });
  return {
    render: () => {
      valueIndex = 0;
      refIndex = 0;
      return output.exports.ServiceForm({
        initial,
        categories: [{ id: category, name: "Category" }],
      });
    },
    settled: () => Promise.all(tasks),
  };
}
test("the Service editor opens its public preview explicitly without background prefetch during Save/Publish", () => {
  const links = nodes(harness().render(), "NextLink");
  const publicLink = links.find(
    (link) => link.props?.href === "/en/services/own-preview",
  );
  assert.ok(publicLink, "published locale keeps its public preview link");
  assert.equal(
    publicLink.props?.prefetch,
    false,
    "editor must not start an automatic public read during a content mutation",
  );
  assert.equal(publicLink.props?.target, "_blank");
  assert.equal(publicLink.props?.rel, "noopener noreferrer");
  const back = links.find((link) => link.props?.href === "/admin/services");
  assert.ok(back);
  assert.equal(
    back.props?.prefetch,
    undefined,
    "ordinary admin navigation retains its existing behavior",
  );
});

test("a real blank-category Save rejection reaches the Category field and its focus destination", async () => {
  const h = harness();
  let tree = h.render();
  const category = nodes(tree, "Select").find(
    (node) => node.props?.["data-service-path"] === "category_id",
  )!;
  (category.props!.onChange as (event: unknown) => void)({
    target: { value: "" },
  });
  tree = h.render();
  const save = nodes(tree, "AdminButton").find(
    (node) => node.props?.children === "Save draft (EN)",
  )!;
  (save.props!.onClick as () => void)();
  await h.settled();
  tree = h.render();
  const field = nodes(tree, "ServiceField").find(
    (node) => node.props?.label === "admin.fields.category",
  )!;
  assert.equal(
    typeof field.props?.error,
    "string",
    "actual Field receives the rejection for red/ARIA treatment",
  );
  assert.equal(
    nodes(field, "Select")[0]?.props?.["data-service-path"],
    "category_id",
  );
  const summary = nodes(tree, "EditorFeedbackSummary")[0]!.props!;
  const groups = summary.groups as Array<{
    locale: string;
    issues: Array<{ path: string; label: string }>;
  }>;
  assert.deepEqual(
    groups
      .find((group) => group.locale === "en")
      ?.issues.map((issue) => ({ path: issue.path, label: issue.label })),
    [{ path: "category_id", label: "Category" }],
  );
  let focused = false,
    scrolled = false;
  const control = {
    matches: () => true,
    parentElement: null,
    focus: () => {
      focused = true;
    },
    scrollIntoView: () => {
      scrolled = true;
    },
  };
  const root = {
    querySelectorAll: () => [],
    querySelector: (selector: string) =>
      selector === '[data-service-path="category_id"]' ? control : null,
  };
  const rootElement = nodes(tree, "div").find((node) => node.props?.ref)!;
  (rootElement.props!.ref as { current: unknown }).current = root;
  (summary.onNavigate as (locale: string, path: string) => void)(
    "en",
    "category_id",
  );
  assert.equal(
    focused,
    true,
    "summary resolves the actual Category select instead of the root/body",
  );
  assert.equal(scrolled, true);
});
