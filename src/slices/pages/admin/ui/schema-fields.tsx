"use client";

import { useTranslations } from "next-intl";
import { UiIcon } from "@core/ui";
import {
  type AdminMediaPreview,
  Checkbox,
  Field,
  IconField,
  MediaField,
  Select,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import {
  type FieldNode,
  type SelectOptions,
  emptyValue,
  humanizeKey,
  listLabelKeys,
  ABOUT_EDITOR_LIST_PATHS,
  type AboutListOperation,
} from "../form-model";

import { AboutListEditor } from "./about-list-editor";

/**
 * Recursive, schema-driven field renderer (S12, ADR 0012). Walks a `FieldNode`
 * against the current value and renders the matching control, calling `onChange`
 * with the dot/index **path** so the editor can update its nested `data` immutably.
 * Errors are keyed by the same dotted path the page schema produces on validation.
 */

export type PathOnChange = (path: (string | number)[], value: unknown) => void;

/**
 * Readable editor labels (owner request, spec S3). A field key resolves to
 * `pages.admin.labels.<key>` (4 locales) and falls back to `humanizeKey` when no label is
 * authored — so a page or key without one renders exactly as before. Keys are labelled
 * globally (the same `headline` / `cta` / `icon_key` reads the same on every page). Array
 * items use the singular `pages.admin.itemLabels.<arrayKey>` ("Benefit 1"), else the array's
 * own label ("Benefits 1", the previous behaviour). A variable list's add button reads
 * `pages.admin.addLabels.<arrayKey>` ("+ New figure", spec S5), else "+ <item label>".
 * A generic array key can be labelled per section with `…ByParent.<parentKey>.<arrayKey>`
 * (`listLabelKeys`, spec about-admin-editor S1), tried first.
 */
export function useFieldLabels() {
  const t = useTranslations("pages");
  return {
    field(key: string): string {
      const k = `admin.labels.${key}`;
      return t.has(k) ? t(k) : humanizeKey(key);
    },
    item(path: readonly (string | number)[], fallback: string): string {
      const k = listLabelKeys("itemLabels", path).find((key) => t.has(key));
      return k ? t(k) : fallback;
    },
    add(path: readonly (string | number)[], fallback: string): string {
      const k = listLabelKeys("addLabels", path).find((key) => t.has(key));
      return k ? t(k) : fallback;
    },
  };
}

interface RenderProps {
  pageKey?: string;
  listIds?: Record<string, string[]>;
  onListChange?: (path: string, operation: AboutListOperation) => void;
  node: FieldNode;
  value: unknown;
  path: (string | number)[];
  label: string;
  depth: number;
  onChange: PathOnChange;
  errors: Record<string, string>;
  previews: Record<string, AdminMediaPreview>;
  options: SelectOptions;
}

export function NodeField(props: RenderProps) {
  const {
    pageKey,
    listIds,
    onListChange,
    node,
    value,
    path,
    label: defaultLabel,
    depth,
    onChange,
    errors,
    previews,
    options,
  } = props;
  const errorKey = path.join(".");
  const controlId = `page-field-${encodeURIComponent(pageKey ?? "page")}-${path.map((part) => encodeURIComponent(String(part))).join(".")}`;
  const labels = useFieldLabels();
  const t = useTranslations("pages");
  const labelKey = `admin.guidesLabels.${path.join(".")}`;
  const guideLabelKey = pageKey === "guides"
    ? [`${labelKey}._label`, labelKey].find((key) => t.has(key) && typeof t.raw(key) === "string")
    : undefined;
  const label = guideLabelKey ? t(guideLabelKey) : defaultLabel;
  const hintKey = `admin.${pageKey === "guides" ? "guidesHints" : "servicesHints"}.${path.join(".")}`;
  const hint = (pageKey === "services" || pageKey === "guides") && node.kind !== "object" && node.kind !== "hidden" && t.has(hintKey)
    ? t(hintKey)
    : "hint" in node ? node.hint : undefined;

  // `admin_hidden` field: nothing to render. Its value stays in the editor's `data` (scaffolded
  // by `applyDefaults`) and is saved back unchanged, since `onChange` never touches its path.
  if (node.kind === "hidden") return null;

  if (node.kind === "object") {
    // Only collapse the Guides city-filter settings; their values remain in the
    // parent form state and are restored when the checkbox is enabled again.
    const cityFilterDisabled = pageKey === "guides" && path.length === 1 &&
      path[0] === "city_filter" && (value as { enabled?: boolean } | undefined)?.enabled === false;
    const fields = cityFilterDisabled
      ? node.fields.filter((field) => field.key === "enabled")
      : node.fields;
    const body = fields.map((f) => (
      <NodeField
        key={f.key}
        pageKey={pageKey}
        listIds={listIds}
        onListChange={onListChange}
        node={f.node}
        value={(value as Record<string, unknown> | undefined)?.[f.key]}
        path={[...path, f.key]}
        label={labels.field(f.key)}
        depth={depth + 1}
        onChange={onChange}
        errors={errors}
        previews={previews}
        options={options}
      />
    ));
    if (depth === 0) return <div className="space-y-4">{body}</div>;
    return (
      <fieldset className="space-y-4 rounded-md border border-line p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {label}
        </legend>
        {body}
      </fieldset>
    );
  }

  if (node.kind === "array") {
    const items = Array.isArray(value) ? value : [];
    if (pageKey === "about" && onListChange && (ABOUT_EDITOR_LIST_PATHS as readonly string[]).includes(errorKey)) {
      const itemLabel = labels.item(path, label);
      return <AboutListEditor label={label} itemLabel={itemLabel} addLabel={labels.add(path, itemLabel)}
        items={items} ids={listIds?.[errorKey] ?? []} min={node.min} max={node.max} error={errors[errorKey]}
        onChange={(operation) => onListChange(errorKey, operation)}
        createItem={() => {
          const item = emptyValue(node.element);
          // New contact cards deliberately start with a valid, visible choice.
          return errorKey === "contact.cards" ? { ...(item as Record<string, unknown>), destination: "buildings" } : item;
        }}
        renderItem={(item, index) => <NodeField {...props} node={node.element} value={item} path={[...path, index]}
          label={`${itemLabel} ${index + 1}`} depth={depth + 1} />} />;
    }
    const canAdd = !node.fixedOrder && items.length < node.max;
    const canRemove = items.length > node.min;
    const itemLabel = labels.item(path, label);
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {label}
        </p>
        {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
        {items.map((item, i) => (
          <div key={i} className="space-y-3 rounded-md border border-line p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-soft">
                {itemLabel} {i + 1}
              </span>
              {!node.fixedOrder ? (
                <div className="flex items-center gap-1">
                <ArrayBtn
                  action="up"
                  disabled={i === 0}
                  onClick={() => onChange(path, swap(items, i, i - 1))}
                />
                <ArrayBtn
                  action="down"
                  disabled={i === items.length - 1}
                  onClick={() => onChange(path, swap(items, i, i + 1))}
                />
                <ArrayBtn
                  action="remove"
                  disabled={!canRemove}
                  onClick={() =>
                    onChange(
                      path,
                      items.filter((_, j) => j !== i),
                    )
                  }
                />
                </div>
              ) : null}
            </div>
            <NodeField
              pageKey={pageKey}
              listIds={listIds}
              onListChange={onListChange}
              node={node.element}
              value={item}
              path={[...path, i]}
              label={`${itemLabel} ${i + 1}`}
              depth={depth + 1}
              onChange={onChange}
              errors={errors}
              previews={previews}
              options={options}
            />
          </div>
        ))}
        {canAdd ? (
          <button
            type="button"
            onClick={() => onChange(path, [...items, emptyValue(node.element)])}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            + {labels.add(path, itemLabel)}
          </button>
        ) : null}
      </div>
    );
  }

  if (node.kind === "boolean") {
    const box = (
      <Checkbox
        id={controlId}
        aria-invalid={Boolean(errors[errorKey])}
        aria-description={errors[errorKey] || hint}
        label={label}
        checked={Boolean(value)}
        onChange={(e) => onChange(path, e.target.checked)}
      />
    );
    return hint ? <Field hint={hint}>{box}</Field> : box;
  }

  if (node.kind === "media") {
    const id = typeof value === "string" && value ? value : null;
    return (
      <Field label={label} hint={hint} error={errors[errorKey]}>
        <div role="group" aria-label={label} aria-describedby={errors[errorKey] || hint ? `${controlId}-description` : undefined}>
          {errors[errorKey] || hint ? <span id={`${controlId}-description`} className="sr-only">{errors[errorKey] || hint}</span> : null}
          <MediaField
            value={id}
            accept={node.accept}
            preview={id ? (previews[id] ?? null) : null}
            onChange={(next) => onChange(path, next ?? "")}
          />
        </div>
      </Field>
    );
  }

  if (node.kind === "icon") {
    return (
      <Field label={label} htmlFor={controlId} required={!node.optional} error={errors[errorKey]}>
        <IconField
          id={controlId}
          value={typeof value === "string" ? value : ""}
          allowEmpty={node.optional}
          onChange={(next) => onChange(path, next)}
        />
      </Field>
    );
  }

  if (node.kind === "select") {
    const opts = options[node.source] ?? [];
    const val = typeof value === "string" ? value : "";
    return (
      <Field label={label} htmlFor={controlId} hint={hint} error={errors[errorKey]}>
        <Select
          id={controlId}
          aria-invalid={Boolean(errors[errorKey])}
          aria-description={errors[errorKey] || hint}
          value={val}
          onChange={(e) => onChange(path, e.target.value)}
        >
          <option value="">{node.emptyLabel}</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {opts.length === 0 ? (
          <p className="mt-1 text-xs text-ink-soft">{node.emptyHint}</p>
        ) : null}
      </Field>
    );
  }

  if (pageKey === "about" && path[0] === "contact" && path.at(-1) === "destination") {
    return <Field label={label} htmlFor={controlId} error={errors[errorKey]} required>
      <Select id={controlId} value={typeof value === "string" ? value : ""}
        aria-invalid={Boolean(errors[errorKey])} aria-description={errors[errorKey]}
        onChange={(event) => onChange(path, event.target.value)}>
        {["buildings", "owners", "real_estate"].map((destination) => <option key={destination} value={destination}>{t(`admin.pages.${destination}`)}</option>)}
      </Select>
    </Field>;
  }

  // string
  const str = typeof value === "string" ? value : "";
  return (
    <Field label={label} htmlFor={controlId} hint={hint} required={!node.optional} error={errors[errorKey]}>
      {node.multiline ? (
        <TextArea
          id={controlId}
          aria-invalid={Boolean(errors[errorKey])}
          aria-description={errors[errorKey] || hint}
          value={str}
          onChange={(e) => onChange(path, e.target.value)}
        />
      ) : (
        <TextInput
          id={controlId}
          aria-invalid={Boolean(errors[errorKey])}
          aria-description={errors[errorKey] || hint}
          value={str}
          onChange={(e) => onChange(path, e.target.value)}
        />
      )}
    </Field>
  );
}

function swap<T>(arr: T[], a: number, b: number): T[] {
  if (b < 0 || b >= arr.length) return arr;
  const next = [...arr];
  [next[a], next[b]] = [next[b]!, next[a]!];
  return next;
}

const ARRAY_BTN = {
  up: { icon: "arrow-up", label: "media.moveUp" },
  down: { icon: "arrow-down", label: "media.moveDown" },
  remove: { icon: "xmark", label: "media.remove" },
} as const;

function ArrayBtn({
  action,
  onClick,
  disabled,
}: {
  action: keyof typeof ARRAY_BTN;
  onClick: () => void;
  disabled?: boolean;
}) {
  const tb = useTranslations("backoffice");
  const { icon, label } = ARRAY_BTN[action];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={tb(label)}
      title={tb(label)}
      className={`rounded px-1.5 py-0.5 text-xs disabled:opacity-30 ${
        action === "remove"
          ? "text-red-600 hover:text-red-700"
          : "text-ink-soft hover:text-ink"
      }`}
    >
      <UiIcon name={icon} size={14} />
    </button>
  );
}
