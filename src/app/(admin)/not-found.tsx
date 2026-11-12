import Link from "next/link";

/** The admin root layout already owns the document's html and body elements. */
export default function AdminNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link href="/admin/pages" className="text-sm underline">Back to Pages</Link>
    </main>
  );
}
