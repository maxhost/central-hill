"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { UiIcon } from "@core/ui";

/** Only the admin document and explicitly marked field panels participate.
 * Preview iframes keep their own independent scroll position. */
export function AdminScrollToTop() {
  const t = useTranslations("backoffice.shell");
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(
      window.scrollY > 64 || Array.from(
        document.querySelectorAll<HTMLElement>("[data-admin-editor-scroll]"),
      ).some(panel => panel.scrollTop > 64),
    );
    update();
    document.addEventListener("scroll", update, { capture: true, passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      document.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  if (!visible) return null;

  const scrollToTop = () => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant" : "smooth";
    window.scrollTo({ top: 0, behavior });
    document.querySelectorAll<HTMLElement>("[data-admin-editor-scroll]")
      .forEach(panel => panel.scrollTo({ top: 0, behavior }));
  };

  return (
    <button
      type="button"
      data-admin-scroll-top
      aria-label={t("backToTop")}
      title={t("backToTop")}
      onClick={scrollToTop}
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-ink text-bg shadow-md transition-colors hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:right-6"
    >
      <UiIcon name="arrow-up" size={22} />
    </button>
  );
}
