import { notFound } from "next/navigation";
import { z } from "zod";
import { getGuideForEdit } from "@slices/guides/contract";
import { GuideEditor } from "@slices/guides/contract";
export default async function GuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const initial = await getGuideForEdit(id);
  if (!initial) notFound();
  return (
    <GuideEditor
      initial={initial}
      cities={initial.cities}
      draft={initial.data}
    />
  );
}
