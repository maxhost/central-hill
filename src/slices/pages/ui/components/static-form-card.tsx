"use client";

import type { ComponentProps } from "react";
import { FormCard } from "@core/ui";

/**
 * `core/ui`'s `FormCard` with submission blocked — the React equivalent of the original mock
 * markup's `onsubmit="return false"` (React can't take a string handler, and blocks
 * `javascript:` form actions). Native constraint validation still runs first (an invalid
 * `required` field shows the browser bubble); a valid submit is simply cancelled: no navigation,
 * no request. The only client-side code in Real Estate's `#deal-enquiry` section — everything it
 * wraps is server-rendered and passed through as `children`.
 *
 * Placeholder until the form is wired to a real enquiry action (see the slice README's
 * follow-ups); delete this wrapper then and pass `action`/`onSubmit` to `FormCard` directly.
 */
export function StaticFormCard(props: Omit<ComponentProps<"form">, "onSubmit" | "action">) {
  return <FormCard {...props} onSubmit={(e) => e.preventDefault()} />;
}
