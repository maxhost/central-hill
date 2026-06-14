import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminCard, AdminPageHeader, EmptyState, StateBadge } from "@slices/backoffice/contract";
import { deriveLeadTitle, formatAdminDate, statusTone } from "../derive";
import { getLead } from "../queries";
import { AssignControl } from "./assign-control";
import { StatusControl } from "./status-control";

/**
 * Backoffice lead detail / audit screen (S12) at `/admin/leads/[id]`. Server
 * component: loads the lead + its captured fields, renders the status + assignment
 * controls (client islands) and the GDPR consent audit trail verbatim (ADR 0014).
 * `currentUserId` (from the gated route) decides whether the lead is "mine".
 */

/** Humanise an unmapped field key, e.g. `target_model` → `Target model`. */
function humanize(key: string): string {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

export async function LeadDetail({ id, currentUserId }: { id: string; currentUserId: string }) {
  const t = await getTranslations("leads");
  const detail = await getLead(id);
  if (!detail) notFound();

  const title = deriveLeadTitle(Object.fromEntries(detail.fields.map((f) => [f.key, f.value])));
  const fieldLabel = (key: string) => (t.has(`fields.${key}`) ? t(`fields.${key}`) : humanize(key));
  const mine = detail.assigned_to != null && detail.assigned_to === currentUserId;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/leads" className="text-sm text-ink-soft hover:text-ink">
          ← {t("admin.detail.back")}
        </Link>
      </div>

      <AdminPageHeader
        title={title}
        description={t(`admin.kind.${detail.kind}`)}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusControl id={detail.id} current={detail.status} />
            <AssignControl id={detail.id} mine={mine} />
          </div>
        }
      />

      <AdminCard title={t("admin.detail.submission")}>
        <dl>
          <Row label={t("admin.detail.statusLabel")}>
            <StateBadge label={t(`admin.status.${detail.status}`)} tone={statusTone(detail.status)} />
          </Row>
          <Row label={t("admin.detail.assignment")}>
            {detail.assigned_to
              ? mine
                ? t("admin.detail.assignedToYou")
                : t("admin.detail.assignedTo", { id: detail.assigned_to })
              : t("admin.detail.unassigned")}
          </Row>
          <Row label={t("admin.detail.sourcePage")}>{detail.source_page}</Row>
          <Row label={t("admin.detail.locale")}>
            <span className="uppercase">{detail.locale}</span>
          </Row>
          <Row label={t("admin.detail.createdAt")}>{formatAdminDate(detail.created_at)}</Row>
          <Row label={t("admin.detail.updatedAt")}>{formatAdminDate(detail.updated_at)}</Row>
        </dl>
      </AdminCard>

      <AdminCard title={t("admin.detail.fields")}>
        {detail.fields.length === 0 ? (
          <EmptyState title={t("admin.detail.noFields")} />
        ) : (
          <dl>
            {detail.fields.map((f) => (
              <Row key={f.key} label={fieldLabel(f.key)}>
                <span className="whitespace-pre-wrap">{f.value}</span>
              </Row>
            ))}
          </dl>
        )}
      </AdminCard>

      <AdminCard title={t("admin.detail.audit")}>
        <dl>
          <Row label={t("admin.detail.marketingConsent")}>
            {detail.marketing_consent ? t("admin.consentYes") : t("admin.consentNo")}
          </Row>
          <Row label={t("admin.detail.consentText")}>
            {detail.consent_text ? (
              <span className="whitespace-pre-wrap italic text-ink-soft">{detail.consent_text}</span>
            ) : (
              "—"
            )}
          </Row>
          <Row label={t("admin.detail.consentAt")}>{formatAdminDate(detail.consent_at)}</Row>
          <Row label={t("admin.detail.ipAddress")}>{detail.ip_address ?? "—"}</Row>
          <Row label={t("admin.detail.userAgent")}>
            <span className="break-all text-ink-soft">{detail.user_agent ?? "—"}</span>
          </Row>
        </dl>
      </AdminCard>
    </div>
  );
}
