/** Public HTML form destination from docs/newsletter/HTML.txt; this is not an API key. */
export const BREVO_NEWSLETTER_ACTION = "https://b28bb587.sibforms.com/serve/MUIFACbRKzvCWEt5-OM8bfeLlrhDcUCDRVv_jhsD_h2GptvDPQ-GPFXZfAsEkp6J8rXc2Rg4rOFITtd3AGT7K2nFJMvzSmLbHD70VsnnobdWrF0wOIE_Tf_hEnRpd3ONJP_3roTFlBHzVTkhQqDbH89L0JsdSMO6XJ5dhaEiUI1ylcgU-Mo32_mmfq5fyzNTwFqxotK8-QRqYg3K4w==";
export const BREVO_NEWSLETTER_TIMEOUT_MS = 20000;

/** Same multipart Ajax protocol as the HTML export's main.js, with a strict acceptance check. */
export async function subscribeBrevoNewsletter(
  input: { email: string; consent: boolean; locale: string; honeypot: string },
  signal: AbortSignal,
  transport: typeof fetch = fetch,
): Promise<boolean> {
  if (!input.consent || !input.email.trim() || !["en", "es", "pt", "fr"].includes(input.locale)) return false;
  const body = new FormData();
  body.set("EMAIL", input.email.trim());
  body.set("OPT_IN", "1");
  body.set("email_address_check", input.honeypot);
  body.set("locale", input.locale);
  try {
    const response = await transport(`${BREVO_NEWSLETTER_ACTION}?isAjax=1`, {
      method: "POST",
      body,
      signal,
      credentials: "omit",
    });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    return Boolean(result && typeof result === "object" && "success" in result && result.success === true);
  } catch {
    // Network, CORS, aborted/expired requests and non-JSON replies must never look successful.
    return false;
  }
}
