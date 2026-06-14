"use client";

/**
 * Root error boundary. Because the localized `<html>` lives in `[locale]/layout`,
 * this top-level (non-localized) boundary must render its own document.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <button
          type="button"
          onClick={reset}
          className="rounded border px-4 py-2 text-sm"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
