"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminButton } from "@slices/backoffice/contract";
import type { PageKey } from "../../schemas";
import { PAGE_ADMIN_ORDER } from "../page-order";
import { BLOG_ARTICLE_EDITOR_URL, type PageEditorView } from "../editorial-views";

/** Changes editor routes only after local work has been saved or explicitly discarded. */
export function PageNavigation({
  currentKey,
  view = "page",
  hasUnsavedChanges,
  busy,
  onLeave,
}: {
  currentKey: PageKey;
  view?: PageEditorView;
  hasUnsavedChanges: boolean;
  busy: boolean;
  onLeave: () => void;
}) {
  const t = useTranslations("pages.admin");
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [target, setTarget] = useState<string | null>(null);
  const currentHref = view === "blog_article" ? BLOG_ARTICLE_EDITOR_URL : `/admin/pages/${currentKey}`;
  const [navigating, startNavigation] = useTransition();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (target && !element.open) {
      element.showModal();
      cancelButton.current?.focus();
    } else if (!target && element.open) {
      element.close();
    }
  }, [target]);

  function navigate(href: string) {
    if (busy || navigating || href === currentHref) return;
    onLeave();
    setTarget(null);
    startNavigation(() => router.push(href));
  }

  function choose(href: string) {
    if (busy || navigating || href === currentHref) return;
    if (hasUnsavedChanges) setTarget(href);
    else navigate(href);
  }

  return (
    <>
      <nav aria-label={t("pageNavigation.label")} className="flex min-w-0 items-stretch overflow-x-auto rounded-md border border-line bg-bg">
        <span className="flex shrink-0 items-center border-r border-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {t("pageNavigation.page")}
        </span>
        {PAGE_ADMIN_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            aria-current={key === currentKey ? "page" : undefined}
            disabled={busy || navigating}
            onClick={() => choose(`/admin/pages/${key}`)}
            className={`min-h-11 shrink-0 cursor-pointer border-r border-line px-4 py-3 text-sm transition-colors last:border-r-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${key === currentKey ? "bg-accent/10 font-medium text-accent-deep" : "text-ink hover:bg-surface"}`}
          >
            {t(`pages.${key}`)}
          </button>
        ))}
      </nav>

      {currentKey === "blog" ? <div className="mt-3 space-y-2">
        <nav aria-label={t("blogEditors.navigation")} className="flex flex-wrap gap-2">
          {(["page", "blog_article"] as const).map(editor => <button key={editor} type="button"
            aria-current={view === editor ? "page" : undefined} disabled={busy || navigating}
            onClick={() => choose(editor === "page" ? "/admin/pages/blog" : BLOG_ARTICLE_EDITOR_URL)}
            className={`min-h-11 cursor-pointer rounded-md border border-line px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 ${view === editor ? "bg-accent/10 font-medium text-accent-deep" : "bg-bg text-ink hover:bg-surface"}`}>
            {t(editor === "page" ? "blogEditors.listing" : "blogEditors.articleSidebar")}
          </button>)}
        </nav>
        <p className="text-xs text-ink-soft">{t("blogEditors.sharedDraft")}</p>
      </div> : null}

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={() => setTarget(null)}
        onClose={() => setTarget(null)}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-ink/40"
      >
        <h2 id={titleId} className="font-serif text-2xl">{t("pageNavigation.unsavedTitle")}</h2>
        <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-ink-soft">{t("pageNavigation.unsavedMessage")}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={cancelButton}
            type="button"
            onClick={() => setTarget(null)}
            className="min-h-11 cursor-pointer rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t("pageNavigation.cancel")}
          </button>
          <AdminButton variant="primary" className="min-h-11 px-4 py-2" disabled={busy || navigating} onClick={() => { if (target) navigate(target); }}>
            {t("pageNavigation.continue")}
          </AdminButton>
        </div>
      </dialog>
    </>
  );
}
