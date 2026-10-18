import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminPageHeader,
  StateBadge,
  Field,
  Select,
  TextInput,
  AdminButton,
  EmptyState,
} from "@slices/backoffice/contract";
import { listGuidesAdmin } from "../queries";
import { listGuideCityOptions } from "@slices/geography/contract";
export async function GuidesAdminList({
  filters = {},
}: {
  filters?: {
    cityId?: string;
    status?: string;
    search?: string;
    template?: string;
  };
}) {
  const t = await getTranslations("guides.admin");
  const [items, cities] = await Promise.all([
    listGuidesAdmin(filters),
    listGuideCityOptions(),
  ]);
  const rows = items.filter(
    (item) => !filters.template || item.template === filters.template,
  );
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("guides")}
        actions={
          <Link
            href="/admin/guides/new"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-deep"
          >
            {t("newGuide")}
          </Link>
        }
      />
      <form
        action="/admin/guides"
        className="grid gap-4 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Field label={t("search")} htmlFor="guide-search">
          <TextInput
            id="guide-search"
            name="search"
            defaultValue={filters.search}
            type="search"
          />
        </Field>
        <Field label={t("labels.city_id")} htmlFor="guide-city">
          <Select id="guide-city" name="cityId" defaultValue={filters.cityId}>
            <option value="">{t("allCities")}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("labels.template")} htmlFor="guide-template">
          <Select
            id="guide-template"
            name="template"
            defaultValue={filters.template}
          >
            <option value="">{t("allTemplates")}</option>
            {[
              "landing",
              "eat",
              "beaches",
              "events",
              "secrets",
              "families",
              "groups",
              "travellers",
              "custom",
            ].map((value) => (
              <option key={value} value={value}>
                {t(`templates.${value}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("labels.status")} htmlFor="guide-status">
          <Select id="guide-status" name="status" defaultValue={filters.status}>
            <option value="">{t("allStatuses")}</option>
            {["draft", "published", "archived"].map((status) => (
              <option key={status} value={status}>
                {t(status === "published" ? "publishedStatus" : status)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="self-end">
          <AdminButton type="submit">{t("filter")}</AdminButton>
        </div>
      </form>
      {!rows.length ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-ink-soft">
              <tr>
                {["title", "city_id", "template", "status", "position"].map(
                  (key) => (
                    <th key={key} className="px-4 py-3">
                      {t(`labels.${key}`)}
                    </th>
                  ),
                )}
                <th className="px-4 py-3">
                  {t("sections")} / {t("places")}
                </th>
                <th className="px-4 py-3">
                  <span className="sr-only">{t("edit")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="min-w-40 px-4 py-4 font-medium">
                    <Link
                      href={`/admin/guides/${row.id}`}
                      className="text-ink hover:text-accent-deep"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4">{row.city}</td>
                  <td className="px-4 py-4">
                    {t(`templates.${row.template}`)}
                  </td>
                  <td className="px-4 py-4">
                    <StateBadge
                      label={t(
                        row.status === "published"
                          ? "publishedStatus"
                          : row.status,
                      )}
                      tone={row.status === "published" ? "approved" : "draft"}
                    />
                  </td>
                  <td className="px-4 py-4 tabular-nums">{row.position}</td>
                  <td className="px-4 py-4 tabular-nums">
                    {row.sections} / {row.places}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/guides/${row.id}`}
                        className="text-accent-deep underline underline-offset-4"
                      >
                        {t("edit")}
                      </Link>
                      {row.publishedUrl ? (
                        <a
                          href={row.publishedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-deep underline underline-offset-4"
                        >
                          {t("published")}
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
