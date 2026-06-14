"use client";

import {
  type AdminMediaPreview,
  Checkbox,
  Field,
  MediaField,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import { type FieldNode, emptyValue, humanizeKey } from "../form-model";

/**
 * Recursive, schema-driven field renderer (S12, ADR 0012). Walks a `FieldNode`
 * against the current value and renders the matching control, calling `onChange`
 * with the dot/index **path** so the editor can update its nested `data` immutably.
 * Errors are keyed by the same dotted path the page schema produces on validation.
 */

export type PathOnChange = (path: (string | number)[], value: unknown) => void;

interface RenderProps {
  node: FieldNode;
  value: unknown;
  path: (string | number)[];
  label: string;
  depth: number;
  onChange: PathOnChange;
  errors: Record<string, string>;
  previews: Record<string, AdminMediaPreview>;
}

export function NodeField(props: RenderProps) {
  const { node, value, path, label, depth, onChange, errors, previews } = props;
  const errorKey = path.join(".");

  if (node.kind === "object") {
    const body = node.fields.map((f) => (
      <NodeField
        key={f.key}
        node={f.node}
        value={(value as Record<string, unknown> | undefined)?.[f.key]}
        path={[...path, f.key]}
        label={humanizeKey(f.key)}
        depth={depth + 1}
        onChange={onChange}
        errors={errors}
        previews={previews}
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
    const canAdd = items.length < node.max;
    const canRemove = items.length > node.min;
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
        {items.map((item, i) => (
          <div key={i} className="space-y-3 rounded-md border border-line p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-soft">
                {label} {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <ArrayBtn
                  disabled={i === 0}
                  onClick={() => onChange(path, swap(items, i, i - 1))}
                  label="↑"
                />
                <ArrayBtn
                  disabled={i === items.length - 1}
                  onClick={() => onChange(path, swap(items, i, i + 1))}
                  label="↓"
                />
                <ArrayBtn
                  disabled={!canRemove}
                  tone="danger"
                  onClick={() => onChange(path, items.filter((_, j) => j !== i))}
                  label="✕"
                />
              </div>
            </div>
            <NodeField
              node={node.element}
              value={item}
              path={[...path, i]}
              label={`${label} ${i + 1}`}
              depth={depth + 1}
              onChange={onChange}
              errors={errors}
              previews={previews}
            />
          </div>
        ))}
        {canAdd ? (
          <button
            type="button"
            onClick={() => onChange(path, [...items, emptyValue(node.element)])}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            + {label}
          </button>
        ) : null}
      </div>
    );
  }

  if (node.kind === "boolean") {
    return (
      <Checkbox
        label={label}
        checked={Boolean(value)}
        onChange={(e) => onChange(path, e.target.checked)}
      />
    );
  }

  if (node.kind === "media") {
    const id = typeof value === "string" && value ? value : null;
    return (
      <Field label={label} error={errors[errorKey]}>
        <MediaField
          value={id}
          preview={id ? (previews[id] ?? null) : null}
          onChange={(next) => onChange(path, next ?? "")}
        />
      </Field>
    );
  }

  // string
  const str = typeof value === "string" ? value : "";
  return (
    <Field label={label} required={!node.optional} error={errors[errorKey]}>
      {node.multiline ? (
        <TextArea value={str} onChange={(e) => onChange(path, e.target.value)} />
      ) : (
        <TextInput value={str} onChange={(e) => onChange(path, e.target.value)} />
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

function ArrayBtn({
  label,
  onClick,
  disabled,
  tone,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded px-1.5 py-0.5 text-xs disabled:opacity-30 ${
        tone === "danger" ? "text-red-600 hover:text-red-700" : "text-ink-soft hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
