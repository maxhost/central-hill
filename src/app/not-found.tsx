import Link from "next/link";

/**
 * Root not-found boundary (non-localized — e.g. unknown locale). Renders its own
 * document since the localized `<html>` lives in `[locale]/layout`.
 */
export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <Link href="/en" className="text-sm underline">
          Go home
        </Link>
      </body>
    </html>
  );
}
