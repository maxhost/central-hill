"use client";

import { type ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import { UiIcon } from "@core/ui";
import {
  AdminButton,
  type AdminMediaPreview,
  Field,
  FieldGrid,
  MediaField,
  Select,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";
import { FACT_ICONS, type FactIcon } from "../../detail";
import {
  DETAIL_LIMITS as L,
  type DetailDraft,
  type DraftBookingRow,
  type DraftExtra,
  type DraftFact,
  type DraftGoodToKnow,
  type DraftItinerary,
  type DraftOptionGroup,
  type DraftPartner,
  type DraftPricing,
  addPricingColumn,
  addPricingRow,
  emptyPricing,
  moveAt,
  moveNotesToPractical,
  movePricingColumn,
  removeAt,
  removePricingColumn,
  replaceAt,
} from "../detail-draft";

/**
 * "Detail sections" editor for a service (the rich `/services/<slug>` sections stored as
 * the [T] `detail` JSON field — see `../../detail`). Pure controlled component: the
 * service form owns the {@link DetailDraft} state and serialises it with `draftToDetail`
 * on save. Panels follow the page's reading order (`mock/service-detail.html`): title &
 * booking card → key facts → about heading → what's included → the variable module
 * (itinerary, options, pricing, extras, partners) → good to know, plus a legacy "Notes"
 * panel only while old notes remain. List items add / remove / reorder inline, with
 * the same ↑ ↓ ✕ idiom as the blog body editor. Errors are looked up by the dotted
 * path the save schema produces (`detail.pricing.rows.0.cells`, …).
 */

type Errors = Record<string, string>;

/** The three "Good to know" columns, in page order, with their schema caps. */
const GTK_COLUMNS = [
  ["included", L.gtk_included],
  ["cancellation", L.gtk_cancellation],
  ["practical", L.gtk_practical],
] as const satisfies readonly (readonly [keyof DraftGoodToKnow, number])[];

export function DetailEditor({
  value,
  onChange,
  errors,
  previews,
}: {
  value: DetailDraft;
  onChange: (next: DetailDraft) => void;
  errors: Errors;
  /** Server-resolved previews for persisted media ids (itinerary step thumbnails). */
  previews: Record<string, AdminMediaPreview>;
}) {
  const t = useTranslations("services");
  const d = (key: string, values?: Record<string, string | number>) =>
    t(`admin.detail.${key}`, values);
  const err = (...path: (string | number)[]) => errors[["detail", ...path].join(".")];
  const set = <K extends keyof DetailDraft>(key: K, next: DetailDraft[K]) =>
    onChange({ ...value, [key]: next });
  const setGtk = (key: keyof DraftGoodToKnow, next: string[]) =>
    set("good_to_know", { ...value.good_to_know, [key]: next });

  // Previews of step images picked in this session (not in the server's map yet). Steps
  // are keyed by index, so each picker is re-keyed by its media id and fed from here.
  const [picked, setPicked] = useState<Record<string, AdminMediaPreview>>({});
  const previewFor = (id: string) => (id ? (picked[id] ?? previews[id] ?? null) : null);

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">{d("hint")}</p>

      {/* Title & booking card */}
      <Section title={d("sections.titleBooking")}>
        <SubHeading error={err("badges")}>{d("fields.badges")}</SubHeading>
        <p className="text-xs text-ink-soft">{d("fields.badgesHint")}</p>
        <StringList
          items={value.badges}
          onChange={(next) => set("badges", next)}
          max={L.badges}
          addLabel={d("add.badge")}
          errorAt={(i) => err("badges", i)}
          emptyLabel={d("empty")}
          controlsLabels={controlsLabels(d)}
        />
        <Field
          label={d("fields.priceNote")}
          hint={d("fields.priceNoteHint")}
          error={err("price_note")}
        >
          <TextInput
            value={value.price_note}
            onChange={(e) => set("price_note", e.target.value)}
          />
        </Field>
        <SubHeading error={err("booking_rows")}>{d("fields.bookingRows")}</SubHeading>
        <ItemList
          items={value.booking_rows}
          onChange={(next) => set("booking_rows", next)}
          max={L.booking_rows}
          heading={(i) => d("items.bookingRow", { n: i + 1 })}
          addLabel={d("add.bookingRow")}
          emptyLabel={d("empty")}
          blank={(): DraftBookingRow => ({ label: "", value: "" })}
          controlsLabels={controlsLabels(d)}
          render={(row, i, update) => (
            <FieldGrid>
              <Field label={d("fields.label")} required error={err("booking_rows", i, "label")}>
                <TextInput
                  value={row.label}
                  onChange={(e) => update({ ...row, label: e.target.value })}
                />
              </Field>
              <Field label={d("fields.value")} required error={err("booking_rows", i, "value")}>
                <TextInput
                  value={row.value}
                  onChange={(e) => update({ ...row, value: e.target.value })}
                />
              </Field>
            </FieldGrid>
          )}
        />
      </Section>

      {/* Key facts */}
      <Section title={d("sections.facts")} error={err("facts")}>
        <ItemList
          items={value.facts}
          onChange={(next) => set("facts", next)}
          max={L.facts}
          heading={(i) => d("items.fact", { n: i + 1 })}
          addLabel={d("add.fact")}
          emptyLabel={d("empty")}
          blank={(): DraftFact => ({ icon: FACT_ICONS[0], title: "", note: "" })}
          controlsLabels={controlsLabels(d)}
          render={(fact, i, update) => (
            <div className="space-y-3">
              <FieldGrid>
                <Field label={d("fields.icon")} required error={err("facts", i, "icon")}>
                  <Select
                    value={fact.icon}
                    onChange={(e) => update({ ...fact, icon: e.target.value as FactIcon })}
                  >
                    {FACT_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {d(`factIcons.${ic}`)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={d("fields.title")} required error={err("facts", i, "title")}>
                  <TextInput
                    value={fact.title}
                    onChange={(e) => update({ ...fact, title: e.target.value })}
                  />
                </Field>
              </FieldGrid>
              <Field
                label={d("fields.factNote")}
                hint={d("fields.optional")}
                error={err("facts", i, "note")}
              >
                <TextInput
                  value={fact.note}
                  onChange={(e) => update({ ...fact, note: e.target.value })}
                />
              </Field>
            </div>
          )}
        />
      </Section>

      {/* About heading */}
      <Section title={d("sections.about")}>
        <Field
          label={d("fields.aboutTitle")}
          hint={d("fields.aboutTitleHint")}
          error={err("about_title")}
        >
          <TextInput
            value={value.about_title}
            onChange={(e) => set("about_title", e.target.value)}
          />
        </Field>
      </Section>

      {/* What's included (heading + the highlights list) */}
      <Section title={d("sections.included")}>
        <Field
          label={d("fields.includedTitle")}
          hint={d("fields.includedTitleHint")}
          error={err("included_title")}
        >
          <TextInput
            value={value.included_title}
            onChange={(e) => set("included_title", e.target.value)}
          />
        </Field>
        <SubHeading error={err("highlights")}>{d("fields.highlights")}</SubHeading>
        <StringList
          items={value.highlights}
          onChange={(next) => set("highlights", next)}
          max={L.highlights}
          addLabel={d("add.highlight")}
          errorAt={(i) => err("highlights", i)}
          emptyLabel={d("empty")}
          controlsLabels={controlsLabels(d)}
        />
      </Section>

      {/* Variable module */}
      <div className="space-y-1 border-t border-line pt-4">
        <p className="text-sm font-semibold text-ink">{d("module.title")}</p>
        <p className="text-sm text-ink-soft">{d("module.hint")}</p>
      </div>

      {/* Itinerary */}
      <Section title={d("sections.itinerary")} error={err("itinerary")}>
        <ItemList
          items={value.itinerary}
          onChange={(next) => set("itinerary", next)}
          max={L.itinerary}
          heading={(i) => d("items.step", { n: i + 1 })}
          addLabel={d("add.step")}
          emptyLabel={d("empty")}
          blank={(): DraftItinerary => ({ time: "", title: "", text: "", media_id: "" })}
          controlsLabels={controlsLabels(d)}
          render={(step, i, update) => (
            <div className="space-y-3">
              <FieldGrid>
                <Field label={d("fields.time")} required error={err("itinerary", i, "time")}>
                  <TextInput
                    value={step.time}
                    onChange={(e) => update({ ...step, time: e.target.value })}
                  />
                </Field>
                <Field label={d("fields.title")} required error={err("itinerary", i, "title")}>
                  <TextInput
                    value={step.title}
                    onChange={(e) => update({ ...step, title: e.target.value })}
                  />
                </Field>
              </FieldGrid>
              <Field label={d("fields.text")} required error={err("itinerary", i, "text")}>
                <TextArea
                  value={step.text}
                  onChange={(e) => update({ ...step, text: e.target.value })}
                />
              </Field>
              <Field
                label={d("fields.stepImage")}
                hint={d("fields.stepImageHint")}
                error={err("itinerary", i, "media_id")}
              >
                <MediaField
                  key={step.media_id || "none"}
                  value={step.media_id || null}
                  preview={previewFor(step.media_id)}
                  onChange={(id, preview) => {
                    if (id && preview) setPicked((prev) => ({ ...prev, [id]: preview }));
                    update({ ...step, media_id: id ?? "" });
                  }}
                />
              </Field>
            </div>
          )}
        />
      </Section>

      {/* Options (groups → items) */}
      <Section title={d("sections.options")} error={err("option_groups")}>
        <ItemList
          items={value.option_groups}
          onChange={(next) => set("option_groups", next)}
          max={L.option_groups}
          heading={(i) => d("items.group", { n: i + 1 })}
          addLabel={d("add.group")}
          emptyLabel={d("empty")}
          blank={(): DraftOptionGroup => ({ title: "", items: [{ name: "", desc: "" }] })}
          controlsLabels={controlsLabels(d)}
          render={(group, gi, update) => (
            <div className="space-y-3">
              <Field
                label={d("fields.groupTitle")}
                required
                error={err("option_groups", gi, "title")}
              >
                <TextInput
                  value={group.title}
                  onChange={(e) => update({ ...group, title: e.target.value })}
                />
              </Field>
              <SubHeading error={err("option_groups", gi, "items")}>
                {d("fields.groupItems")}
              </SubHeading>
              <ItemList
                items={group.items}
                onChange={(items) => update({ ...group, items })}
                max={L.option_items}
                min={1}
                heading={(i) => d("items.option", { n: i + 1 })}
                addLabel={d("add.option")}
                emptyLabel={d("empty")}
                blank={() => ({ name: "", desc: "" })}
                controlsLabels={controlsLabels(d)}
                render={(item, ii, updateItem) => (
                  <FieldGrid>
                    <Field
                      label={d("fields.name")}
                      required
                      error={err("option_groups", gi, "items", ii, "name")}
                    >
                      <TextInput
                        value={item.name}
                        onChange={(e) => updateItem({ ...item, name: e.target.value })}
                      />
                    </Field>
                    <Field
                      label={d("fields.optionDesc")}
                      hint={d("fields.optionDescHint")}
                      error={err("option_groups", gi, "items", ii, "desc")}
                    >
                      <TextArea
                        rows={2}
                        value={item.desc}
                        onChange={(e) => updateItem({ ...item, desc: e.target.value })}
                      />
                    </Field>
                  </FieldGrid>
                )}
              />
            </div>
          )}
        />
      </Section>

      {/* Pricing table */}
      <Section title={d("sections.pricing")} error={err("pricing")}>
        {value.pricing ? (
          <PricingEditor
            value={value.pricing}
            onChange={(next) => set("pricing", next)}
            onRemove={() => set("pricing", null)}
            err={(...p) => err("pricing", ...p)}
            d={d}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">{d("pricing.none")}</p>
            <AdminButton variant="ghost" onClick={() => set("pricing", emptyPricing())}>
              + {d("add.pricing")}
            </AdminButton>
          </div>
        )}
      </Section>

      {/* Extras */}
      <Section title={d("sections.extras")} error={err("extras")}>
        <ItemList
          items={value.extras}
          onChange={(next) => set("extras", next)}
          max={L.extras}
          heading={(i) => d("items.extra", { n: i + 1 })}
          addLabel={d("add.extra")}
          emptyLabel={d("empty")}
          blank={(): DraftExtra => ({ label: "", price: "", desc: "" })}
          controlsLabels={controlsLabels(d)}
          render={(extra, i, update) => (
            <div className="space-y-3">
              <FieldGrid>
                <Field label={d("fields.label")} required error={err("extras", i, "label")}>
                  <TextInput
                    value={extra.label}
                    onChange={(e) => update({ ...extra, label: e.target.value })}
                  />
                </Field>
                <Field
                  label={d("fields.price")}
                  hint={d("fields.priceHint")}
                  required
                  error={err("extras", i, "price")}
                >
                  <TextInput
                    value={extra.price}
                    onChange={(e) => update({ ...extra, price: e.target.value })}
                  />
                </Field>
              </FieldGrid>
              <Field label={d("fields.desc")} required error={err("extras", i, "desc")}>
                <TextArea
                  rows={2}
                  value={extra.desc}
                  onChange={(e) => update({ ...extra, desc: e.target.value })}
                />
              </Field>
            </div>
          )}
        />
      </Section>

      {/* Partners */}
      <Section title={d("sections.partners")} error={err("partners")}>
        <ItemList
          items={value.partners}
          onChange={(next) => set("partners", next)}
          max={L.partners}
          heading={(i) => d("items.partner", { n: i + 1 })}
          addLabel={d("add.partner")}
          emptyLabel={d("empty")}
          blank={(): DraftPartner => ({ name: "", desc: "", cta_label: "", url: "" })}
          controlsLabels={controlsLabels(d)}
          render={(p, i, update) => (
            <div className="space-y-3">
              <Field label={d("fields.name")} required error={err("partners", i, "name")}>
                <TextInput
                  value={p.name}
                  onChange={(e) => update({ ...p, name: e.target.value })}
                />
              </Field>
              <Field label={d("fields.desc")} required error={err("partners", i, "desc")}>
                <TextArea
                  rows={2}
                  value={p.desc}
                  onChange={(e) => update({ ...p, desc: e.target.value })}
                />
              </Field>
              <FieldGrid>
                <Field
                  label={d("fields.ctaLabel")}
                  required
                  error={err("partners", i, "cta_label")}
                >
                  <TextInput
                    value={p.cta_label}
                    onChange={(e) => update({ ...p, cta_label: e.target.value })}
                  />
                </Field>
                <Field label={d("fields.url")} required error={err("partners", i, "url")}>
                  <TextInput
                    type="url"
                    value={p.url}
                    onChange={(e) => update({ ...p, url: e.target.value })}
                  />
                </Field>
              </FieldGrid>
            </div>
          )}
        />
      </Section>

      {/* Good to know (three fixed columns) */}
      <Section title={d("sections.goodToKnow")} error={err("good_to_know")}>
        {GTK_COLUMNS.map(([key, max]) => (
          <div key={key} className="space-y-3">
            <SubHeading error={err("good_to_know", key)}>{d(`gtk.${key}`)}</SubHeading>
            <StringList
              items={value.good_to_know[key]}
              onChange={(next) => setGtk(key, next)}
              max={max}
              addLabel={d("add.gtkItem")}
              errorAt={(i) => err("good_to_know", key, i)}
              emptyLabel={d("empty")}
              controlsLabels={controlsLabels(d)}
              multiline
            />
          </div>
        ))}
      </Section>

      {/* Legacy notes: shown only while old notes remain, with a one-click migration. */}
      {value.notes.length > 0 ? (
        <Section title={d("sections.notes")} error={err("notes")}>
          <p className="text-sm text-ink-soft">{d("legacyNotes.hint")}</p>
          <div>
            <AdminButton variant="ghost" onClick={() => onChange(moveNotesToPractical(value))}>
              {d("legacyNotes.move")}
            </AdminButton>
          </div>
          <StringList
            items={value.notes}
            onChange={(next) => set("notes", next)}
            max={L.notes}
            addLabel={d("add.note")}
            errorAt={(i) => err("notes", i)}
            emptyLabel={d("empty")}
            controlsLabels={controlsLabels(d)}
            multiline
          />
        </Section>
      ) : null}
    </div>
  );
}

// ── Pricing table ────────────────────────────────────────────────────────────
function PricingEditor({
  value,
  onChange,
  onRemove,
  err,
  d,
}: {
  value: DraftPricing;
  onChange: (next: DraftPricing) => void;
  onRemove: () => void;
  err: (...path: (string | number)[]) => string | undefined;
  d: (key: string, values?: Record<string, string | number>) => string;
}) {
  const labels = controlsLabels(d);
  const columnName = (i: number) =>
    value.columns[i]?.trim() || d("items.column", { n: i + 1 });

  return (
    <div className="space-y-5">
      {/* Columns — adding/removing/moving a column does the same to every row's cells. */}
      <div className="space-y-3">
        <SubHeading error={err("columns")}>{d("pricing.columns")}</SubHeading>
        {value.columns.map((col, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <TextInput
                aria-label={d("items.column", { n: i + 1 })}
                placeholder={d("items.column", { n: i + 1 })}
                value={col}
                onChange={(e) =>
                  onChange({ ...value, columns: replaceAt(value.columns, i, e.target.value) })
                }
              />
              <ItemControls
                index={i}
                count={value.columns.length}
                canRemove={value.columns.length > 1}
                onMove={(dir) => onChange(movePricingColumn(value, i, dir))}
                onRemove={() => onChange(removePricingColumn(value, i))}
                labels={labels}
              />
            </div>
            <ErrorLine error={err("columns", i)} />
          </div>
        ))}
        <AdminButton
          variant="ghost"
          onClick={() => onChange(addPricingColumn(value))}
          disabled={value.columns.length >= L.pricing_columns}
        >
          + {d("add.column")}
        </AdminButton>
      </div>

      {/* Rows — a label plus one cell per column. */}
      <div className="space-y-3">
        <SubHeading error={err("rows")}>{d("pricing.rows")}</SubHeading>
        <ItemList
          items={value.rows}
          onChange={(rows) => onChange({ ...value, rows })}
          max={L.pricing_rows}
          min={1}
          heading={(i) => d("items.row", { n: i + 1 })}
          addLabel={d("add.row")}
          emptyLabel={d("empty")}
          blank={() => ({ label: "", cells: value.columns.map(() => "") })}
          onAdd={() => onChange(addPricingRow(value))}
          controlsLabels={labels}
          render={(row, ri, update) => (
            <div className="space-y-3">
              <Field label={d("fields.rowLabel")} required error={err("rows", ri, "label")}>
                <TextInput
                  value={row.label}
                  onChange={(e) => update({ ...row, label: e.target.value })}
                />
              </Field>
              <FieldGrid>
                {value.columns.map((_, ci) => (
                  <Field
                    key={ci}
                    label={columnName(ci)}
                    required
                    error={err("rows", ri, "cells", ci)}
                  >
                    <TextInput
                      value={row.cells[ci] ?? ""}
                      onChange={(e) => {
                        // Pad defensively so the row always has one cell per column.
                        const cells = value.columns.map((__, j) => row.cells[j] ?? "");
                        update({ ...row, cells: replaceAt(cells, ci, e.target.value) });
                      }}
                    />
                  </Field>
                ))}
              </FieldGrid>
              <ErrorLine error={err("rows", ri, "cells")} />
            </div>
          )}
        />
      </div>

      <Field label={d("fields.footnote")} error={err("footnote")}>
        <TextArea
          rows={2}
          value={value.footnote}
          onChange={(e) => onChange({ ...value, footnote: e.target.value })}
        />
      </Field>

      <AdminButton variant="danger" onClick={onRemove}>
        {d("pricing.remove")}
      </AdminButton>
    </div>
  );
}

// ── Building blocks (copied idiom: schema-fields / body-editor) ──────────────
interface ControlsLabels {
  up: string;
  down: string;
  remove: string;
}

function controlsLabels(d: (key: string) => string): ControlsLabels {
  return { up: d("controls.moveUp"), down: d("controls.moveDown"), remove: d("controls.remove") };
}

/** A section panel — the fieldset + legend idiom of the pages schema editor. */
function Section({
  title,
  error,
  children,
}: {
  title: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-4 rounded-md border border-line p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {title}
      </legend>
      <ErrorLine error={error} />
      {children}
    </fieldset>
  );
}

function SubHeading({ children, error }: { children: ReactNode; error?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{children}</p>
      <ErrorLine error={error} />
    </div>
  );
}

/** Same error line as `Field`, for list-level / row-level errors with no single control. */
function ErrorLine({ error }: { error?: string }) {
  return error ? <p className="text-xs font-medium text-red-600">{error}</p> : null;
}

function ItemControls({
  index,
  count,
  canRemove = true,
  onMove,
  onRemove,
  labels,
}: {
  index: number;
  count: number;
  canRemove?: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  labels: ControlsLabels;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <AdminButton
        variant="ghost"
        aria-label={labels.up}
        title={labels.up}
        onClick={() => onMove(-1)}
        disabled={index === 0}
      >
        <UiIcon name="arrow-up" size={16} />
      </AdminButton>
      <AdminButton
        variant="ghost"
        aria-label={labels.down}
        title={labels.down}
        onClick={() => onMove(1)}
        disabled={index === count - 1}
      >
        <UiIcon name="arrow-down" size={16} />
      </AdminButton>
      <AdminButton
        variant="danger"
        aria-label={labels.remove}
        title={labels.remove}
        onClick={onRemove}
        disabled={!canRemove}
      >
        <UiIcon name="xmark" size={16} />
      </AdminButton>
    </div>
  );
}

/** Ordered list of object items, each in a bordered card with ↑ ↓ ✕ controls. */
function ItemList<T>({
  items,
  onChange,
  max,
  min = 0,
  heading,
  addLabel,
  emptyLabel,
  blank,
  onAdd,
  controlsLabels: labels,
  render,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  max: number;
  min?: number;
  heading: (i: number) => string;
  addLabel: string;
  emptyLabel: string;
  blank: () => T;
  /** Override "add" when appending must touch more than the list (pricing rows). */
  onAdd?: () => void;
  controlsLabels: ControlsLabels;
  render: (item: T, i: number, update: (next: T) => void) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? <p className="text-sm text-ink-soft">{emptyLabel}</p> : null}
      {items.map((item, i) => (
        <div key={i} className="space-y-3 rounded-md border border-line p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink-soft">{heading(i)}</span>
            <ItemControls
              index={i}
              count={items.length}
              canRemove={items.length > min}
              onMove={(dir) => onChange(moveAt(items, i, dir))}
              onRemove={() => onChange(removeAt(items, i))}
              labels={labels}
            />
          </div>
          {render(item, i, (next) => onChange(replaceAt(items, i, next)))}
        </div>
      ))}
      <AdminButton
        variant="ghost"
        onClick={() => (onAdd ? onAdd() : onChange([...items, blank()]))}
        disabled={items.length >= max}
      >
        + {addLabel}
      </AdminButton>
    </div>
  );
}

/** Ordered list of plain strings (badges, highlights, good to know, notes): one control per row + ↑ ↓ ✕. */
function StringList({
  items,
  onChange,
  max,
  addLabel,
  emptyLabel,
  errorAt,
  controlsLabels: labels,
  multiline = false,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  max: number;
  addLabel: string;
  emptyLabel: string;
  errorAt: (i: number) => string | undefined;
  controlsLabels: ControlsLabels;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? <p className="text-sm text-ink-soft">{emptyLabel}</p> : null}
      {items.map((item, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-start gap-2">
            {multiline ? (
              <TextArea
                rows={2}
                value={item}
                onChange={(e) => onChange(replaceAt(items, i, e.target.value))}
              />
            ) : (
              <TextInput
                value={item}
                onChange={(e) => onChange(replaceAt(items, i, e.target.value))}
              />
            )}
            <ItemControls
              index={i}
              count={items.length}
              onMove={(dir) => onChange(moveAt(items, i, dir))}
              onRemove={() => onChange(removeAt(items, i))}
              labels={labels}
            />
          </div>
          <ErrorLine error={errorAt(i)} />
        </div>
      ))}
      <AdminButton
        variant="ghost"
        onClick={() => onChange([...items, ""])}
        disabled={items.length >= max}
      >
        + {addLabel}
      </AdminButton>
    </div>
  );
}
