import { PageEditorialPreview } from "@slices/pages/contract";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { robots: { index: false, follow: false } };
export default async function HomePreview({ searchParams }: {
 searchParams: Promise<{ locale?: string; instance?: string }>;
}) {
 return PageEditorialPreview({ pageKey: "home", query: await searchParams });
}
