import "server-only";
import type { SQL } from "drizzle-orm";
import type { ContactCaptureInput, ContactCaptureResult } from "../form-capture-types";
/** Contract scaffold replaced by implementer B; guard is trusted SQL, never client input. */
export async function captureFormContact(_input: ContactCaptureInput, _guard: SQL): Promise<ContactCaptureResult> {
  throw new Error("Capture implementation pending");
}
