import { GuidesAdminList } from "@slices/guides/admin/ui/guide-list";
export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : undefined;
  return (
    <GuidesAdminList
      filters={{
        cityId: value("cityId"),
        status: value("status"),
        search: value("search"),
        template: value("template"),
      }}
    />
  );
}
