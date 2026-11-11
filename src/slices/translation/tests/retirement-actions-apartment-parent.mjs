// The query guard suites never resolve an Apartment editor; keep that unrelated graph unloaded.
export async function getApartmentEditorParentId() {
  throw new Error("Unexpected Apartment parent lookup in translation guard tests");
}
