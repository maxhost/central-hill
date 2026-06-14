"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@core/auth/client";

/** Signs the staff member out, then hard-navigates to the login screen. */
export function SignOutButton() {
  const t = useTranslations("backoffice");
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        window.location.assign("/admin/login");
      }}
      className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink disabled:opacity-60"
    >
      {t("shell.signOut")}
    </button>
  );
}
