import { getTranslations } from "next-intl/server";
import type { StaffContext } from "@core/auth";
import { AdminCard, AdminPageHeader, EmptyState } from "./primitives";

/**
 * Backoffice landing screen. For the shell milestone it greets the staff member
 * and shows an empty "modules" area — slice admin screens populate the sidebar
 * (and, later, dashboard widgets) as they register through the contract.
 */
export async function Dashboard({ staff }: { staff: StaffContext }) {
  const t = await getTranslations("backoffice");

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t("dashboard.title")}
        description={t("dashboard.welcome", { name: staff.name })}
      />
      <AdminCard title={t("dashboard.modules")}>
        <EmptyState title={t("dashboard.empty")} hint={t("dashboard.emptyHint")} />
      </AdminCard>
    </div>
  );
}
