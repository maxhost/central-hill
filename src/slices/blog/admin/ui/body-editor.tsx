"use client";

import { useTranslations } from "next-intl";
import {
  AdminButton,
  Field,
  FieldGrid,
  Select,
  type AdminMediaPreview,
  Checkbox,
  MediaField,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import type { BodyBlock, PostBody } from "../../body";

/**
 * Portable-JSON body editor (S12, ADR 0013). Edits the closed block set
 * (`heading | paragraph | list | image | quote | callout | divider | cta`) as an
 * ordered array, add/remove/reorder inline. Image blocks reference `media_asset.id`
 * via the shared media picker; the post form keeps the previews map. Pure controlled
 * component — the post form owns the `body` state and serialises it to JSON on save.
 */

type BlockType = BodyBlock["type"];

const BLOCK_TYPES: BlockType[] = [
  "heading",
  "paragraph",
  "list",
  "image",
  "quote",
  "callout",
  "divider",
  "cta",
];

const CALLOUT_VARIANTS = ["info", "tip", "warning", "note"] as const;
const HEADING_LEVELS = [2, 3, 4] as const;

function emptyBlock(type: BlockType): BodyBlock {
  switch (type) {
    case "heading":
      return { type: "heading", level: 2, text: "" };
    case "paragraph":
      return { type: "paragraph", text: "" };
    case "list":
      return { type: "list", ordered: false, items: [""] };
    case "image":
      return { type: "image", media_id: "" };
    case "quote":
      return { type: "quote", text: "" };
    case "callout":
      return { type: "callout", variant: "info", body: "" };
    case "divider":
      return { type: "divider" };
    case "cta":
      return { type: "cta", label: "", url: "" };
  }
}

export function BodyEditor({
  value,
  onChange,
  previews,
  onPreview,
}: {
  value: PostBody;
  onChange: (next: PostBody) => void;
  previews: Record<string, AdminMediaPreview>;
  onPreview: (preview: AdminMediaPreview | null) => void;
}) {
  const t = useTranslations("blog");

  const update = (i: number, patch: Record<string, unknown>) =>
    onChange(value.map((b, idx) => (idx === i ? ({ ...b, ...patch } as BodyBlock) : b)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = (type: BlockType) => onChange([...value, emptyBlock(type)]);
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    const target = i + dir;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {value.length === 0 ? <p className="text-sm text-ink-soft">{t("admin.post.body.empty")}</p> : null}

      {value.map((block, i) => (
        <div key={i} className="space-y-3 rounded-md border border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {t(`admin.post.body.types.${block.type}`)}
            </span>
            <div className="flex items-center gap-1">
              <AdminButton variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </AdminButton>
              <AdminButton variant="ghost" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                ↓
              </AdminButton>
              <AdminButton variant="danger" onClick={() => remove(i)}>
                ✕
              </AdminButton>
            </div>
          </div>

          {block.type === "heading" ? (
            <div className="space-y-3">
              <FieldGrid>
                <Field label={t("admin.post.body.fields.level")}>
                  <Select
                    value={String(block.level)}
                    onChange={(e) => update(i, { level: Number(e.target.value) })}
                  >
                    {HEADING_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        H{l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("admin.post.body.fields.number")}>
                  <TextInput
                    value={block.number ?? ""}
                    onChange={(e) => update(i, { number: e.target.value || undefined })}
                  />
                </Field>
              </FieldGrid>
              <Field label={t("admin.post.body.fields.text")}>
                <TextInput value={block.text} onChange={(e) => update(i, { text: e.target.value })} />
              </Field>
            </div>
          ) : null}

          {block.type === "paragraph" ? (
            <Field label={t("admin.post.body.fields.text")}>
              <TextArea rows={4} value={block.text} onChange={(e) => update(i, { text: e.target.value })} />
            </Field>
          ) : null}

          {block.type === "list" ? (
            <ListBlockFields
              ordered={block.ordered}
              items={block.items}
              onOrdered={(ordered) => update(i, { ordered })}
              onItems={(items) => update(i, { items })}
              label={t("admin.post.body.fields.ordered")}
              addLabel={t("admin.post.body.addItem")}
            />
          ) : null}

          {block.type === "image" ? (
            <div className="space-y-3">
              <Field label={t("admin.post.body.fields.image")}>
                <MediaField
                  value={block.media_id || null}
                  preview={previews[block.media_id] ?? null}
                  onChange={(id, preview) => {
                    update(i, { media_id: id ?? "" });
                    onPreview(preview);
                  }}
                />
              </Field>
              <FieldGrid>
                <Field label={t("admin.post.body.fields.caption")}>
                  <TextInput
                    value={block.caption ?? ""}
                    onChange={(e) => update(i, { caption: e.target.value || undefined })}
                  />
                </Field>
                <Field label={t("admin.post.body.fields.alt")}>
                  <TextInput
                    value={block.alt ?? ""}
                    onChange={(e) => update(i, { alt: e.target.value || undefined })}
                  />
                </Field>
              </FieldGrid>
            </div>
          ) : null}

          {block.type === "quote" ? (
            <div className="space-y-3">
              <Field label={t("admin.post.body.fields.text")}>
                <TextArea rows={3} value={block.text} onChange={(e) => update(i, { text: e.target.value })} />
              </Field>
              <Field label={t("admin.post.body.fields.attribution")}>
                <TextInput
                  value={block.attribution ?? ""}
                  onChange={(e) => update(i, { attribution: e.target.value || undefined })}
                />
              </Field>
            </div>
          ) : null}

          {block.type === "callout" ? (
            <div className="space-y-3">
              <Field label={t("admin.post.body.fields.variant")}>
                <Select value={block.variant} onChange={(e) => update(i, { variant: e.target.value })}>
                  {CALLOUT_VARIANTS.map((v) => (
                    <option key={v} value={v}>
                      {t(`admin.post.body.variants.${v}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("admin.post.body.fields.text")}>
                <TextArea rows={3} value={block.body} onChange={(e) => update(i, { body: e.target.value })} />
              </Field>
            </div>
          ) : null}

          {block.type === "cta" ? (
            <FieldGrid>
              <Field label={t("admin.post.body.fields.ctaLabel")}>
                <TextInput value={block.label} onChange={(e) => update(i, { label: e.target.value })} />
              </Field>
              <Field label={t("admin.post.body.fields.ctaUrl")}>
                <TextInput value={block.url} onChange={(e) => update(i, { url: e.target.value })} />
              </Field>
            </FieldGrid>
          ) : null}

          {block.type === "divider" ? (
            <p className="text-sm text-ink-soft">{t("admin.post.body.dividerNote")}</p>
          ) : null}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {t("admin.post.body.addBlock")}
        </span>
        {BLOCK_TYPES.map((type) => (
          <AdminButton key={type} variant="ghost" onClick={() => add(type)}>
            {t(`admin.post.body.types.${type}`)}
          </AdminButton>
        ))}
      </div>
    </div>
  );
}

/** Editor for a list block's string items (add/remove/edit). */
function ListBlockFields({
  ordered,
  items,
  onOrdered,
  onItems,
  label,
  addLabel,
}: {
  ordered: boolean;
  items: string[];
  onOrdered: (v: boolean) => void;
  onItems: (items: string[]) => void;
  label: string;
  addLabel: string;
}) {
  return (
    <div className="space-y-3">
      <Checkbox label={label} checked={ordered} onChange={(e) => onOrdered(e.target.checked)} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              value={item}
              onChange={(e) => onItems(items.map((it, idx) => (idx === i ? e.target.value : it)))}
            />
            <AdminButton
              variant="danger"
              onClick={() => onItems(items.filter((_, idx) => idx !== i))}
              disabled={items.length <= 1}
            >
              ✕
            </AdminButton>
          </div>
        ))}
      </div>
      <AdminButton variant="ghost" onClick={() => onItems([...items, ""])}>
        {addLabel}
      </AdminButton>
    </div>
  );
}
