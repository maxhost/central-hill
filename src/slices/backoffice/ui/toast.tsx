"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@core/ui";

/**
 * Agnostic admin toast system (S12, backoffice slice). A single global
 * `ToastProvider` (mounted once in the `(admin)` root layout) exposes an
 * imperative, message-neutral API through `useToast()`:
 *
 *   const toast = useToast();
 *   toast.success("Apartment saved");
 *   toast.error(message, { description, duration });
 *   toast.show(message, { variant: "info" });
 *
 * It is deliberately decoupled from CRUD: any admin client component can fire any
 * message with any variant. Built in-repo (no new dependency — the stack is locked,
 * ADR-gated) on the Warm-Editorial design tokens. Toasts auto-dismiss, are
 * dismissible, stack bottom-right, and announce via `aria-live`.
 */

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  /** Optional second line under the title. */
  description?: string;
  /** Visual + a11y tone. Defaults to "info". */
  variant?: ToastVariant;
  /** Auto-dismiss after N ms; `0` keeps it until dismissed. Defaults to 4500. */
  duration?: number;
}

interface ToastRecord {
  id: string;
  message: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

export interface ToastApi {
  /** Show a toast with explicit options; returns its id. */
  show: (message: string, opts?: ToastOptions) => string;
  success: (message: string, opts?: Omit<ToastOptions, "variant">) => string;
  error: (message: string, opts?: Omit<ToastOptions, "variant">) => string;
  info: (message: string, opts?: Omit<ToastOptions, "variant">) => string;
  warning: (message: string, opts?: Omit<ToastOptions, "variant">) => string;
  /** Dismiss a toast early by id. */
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 4500;

// Module-level monotonic counter — stable ids without Math.random/Date (no SSR drift).
let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  // Track auto-dismiss timers so we can clear them on manual dismiss/unmount.
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, opts?: ToastOptions): string => {
      const id = `t${++seq}`;
      const duration = opts?.duration ?? DEFAULT_DURATION;
      const record: ToastRecord = {
        id,
        message,
        description: opts?.description,
        variant: opts?.variant ?? "info",
        duration,
      };
      setToasts((prev) => [...prev, record]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  // Clear any pending timers when the provider unmounts.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) clearTimeout(timer);
      map.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m, o) => show(m, { ...o, variant: "success" }),
      error: (m, o) => show(m, { ...o, variant: "error" }),
      info: (m, o) => show(m, { ...o, variant: "info" }),
      warning: (m, o) => show(m, { ...o, variant: "warning" }),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/**
 * Access the toast API. Outside a `ToastProvider` it returns a no-op API so a
 * stray call never throws (it just does nothing) — keeps consumers defensive.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? NOOP_API;
}

const NOOP_API: ToastApi = {
  show: () => "",
  success: () => "",
  error: () => "",
  info: () => "",
  warning: () => "",
  dismiss: () => {},
};

// ── Presentation ──────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-line bg-surface text-ink",
};

const VARIANT_ICON_COLOR: Record<ToastVariant, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  warning: "text-amber-600",
  info: "text-accent",
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  // Enter transition: mount hidden, then reveal on the next frame.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      role={toast.variant === "error" || toast.variant === "warning" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg shadow-black/5 transition-all duration-200 ease-out",
        VARIANT_STYLES[toast.variant],
        shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      <span className={cn("mt-0.5 flex-none", VARIANT_ICON_COLOR[toast.variant])}>
        <ToastIcon variant={toast.variant} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{toast.message}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs leading-snug opacity-80">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="flex-none rounded p-0.5 text-current opacity-50 transition-opacity hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const common = { viewBox: "0 0 24 24", width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  if (variant === "success") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.4l2.4 2.4 4.6-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (variant === "error") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.2v.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === "warning") {
    return (
      <svg {...common}>
        <path d="M12 4l8.5 15H3.5L12 4z" strokeLinejoin="round" />
        <path d="M12 10v3.5M12 16.5v.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.2" strokeLinecap="round" />
    </svg>
  );
}
