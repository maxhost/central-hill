"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import {
  AdminButton,
  Field as BaseField,
  IconField,
  Select,
  TextArea,
  TextInput,
} from "@slices/backoffice/contract";

const ItemContext = createContext("");
export function ServiceItemScope({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const parent = useContext(ItemContext);
  return (
    <ItemContext.Provider value={parent ? `${parent}, ${name}` : name}>
      {children}
    </ItemContext.Provider>
  );
}

/** Bind labels and errors for native controls; composite pickers are named groups. */
export function ServiceField({
  children,
  fieldPath,
  ...props
}: ComponentProps<typeof BaseField> & { fieldPath?: string }) {
  const id = useId();
  const scope = useContext(ItemContext);
  const child = isValidElement(children)
    ? (children as ReactElement<Record<string, unknown>>)
    : null;
  const native =
    child &&
    [TextInput, TextArea, Select, IconField].includes(
      child.type as typeof TextInput,
    );
  return (
    <div
      data-service-field
      data-service-path={fieldPath}
      data-service-error-message={props.error}
      data-service-error={props.error ? "true" : undefined}
    >
      <BaseField {...props} htmlFor={native ? id : undefined}>
        <div id={`${id}-description`} className="sr-only">
          {props.hint} {props.error}
        </div>
        {native ? (
          cloneElement(child, {
            id,
            "aria-label":
              scope && props.label ? `${scope}: ${props.label}` : props.label,
            "aria-invalid": props.error ? true : undefined,
            "aria-describedby": `${id}-description`,
          })
        ) : (
          <div
            role="group"
            aria-label={props.label}
            aria-describedby={`${id}-description`}
          >
            {children}
          </div>
        )}
      </BaseField>
    </div>
  );
}

export function ServiceSectionControls({
  section,
  title,
  choice,
  count,
  onChoice,
  onDiscard,
  error,
  children,
}: {
  section: string;
  title: string;
  choice: boolean | undefined;
  count: number;
  onChoice: (choice: boolean | undefined) => void;
  onDiscard: () => void;
  error?: string;
  children: ReactNode;
}) {
  const t = useTranslations("services.admin.presentation");
  const enabled = choice ?? count > 0;
  const [expanded, setExpanded] = useState(false);
  const [changed, setChanged] = useState(false);
  const open = Boolean(error) || (enabled && (!changed || expanded));
  const panel = useId();
  return (
    <section
      id={`service-section-${section}`}
      data-service-section={section}
      className="space-y-4 border-t border-line pt-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                onChoice(e.target.checked);
                setExpanded(e.target.checked);
                setChanged(true);
              }}
              className="size-4 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            {title}
          </label>
          <p className="text-xs text-ink-soft">
            {enabled ? t("visible") : t("hidden")} · {t("elements", { count })}{" "}
            · {choice === undefined ? t("inherited") : t("explicit")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {choice !== undefined ? (
            <AdminButton
              onClick={() => {
                onChoice(undefined);
                setChanged(false);
              }}
            >
              {t("reset")}
            </AdminButton>
          ) : null}
          {enabled ? (
            <AdminButton
              aria-expanded={open}
              aria-controls={panel}
              onClick={() => {
                setChanged(true);
                setExpanded(!open);
              }}
            >
              {t("edit")}
            </AdminButton>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div id={panel} hidden={!open} className="space-y-4">
        {children}
        <div className="space-y-1">
          <AdminButton onClick={onDiscard}>{t("discard")}</AdminButton>
          <p className="text-xs text-ink-soft">{t("discardHint")}</p>
        </div>
      </div>
    </section>
  );
}
