/**
 * Floating WhatsApp chat button (client feedback B1 — LovelyStay-style floating chat).
 * A fixed bottom-right action that opens a WhatsApp conversation with Central Hill's
 * bookings number (910 075 725). Pure markup (no JS / no client island): a `wa.me`
 * deep link works on desktop (WhatsApp Web) and mobile (the app) alike. If the client
 * later prefers Pipedrive or another widget, swap this single component.
 *
 * The number is passed in from the settings singleton (`globals.whatsapp`); we strip
 * everything but digits for the `wa.me` path (it requires the full international form
 * with no `+`, spaces or dashes).
 */
export function WhatsappFab({ phone, label }: { phone: string; label: string }) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
    >
      <svg viewBox="0 0 32 32" aria-hidden className="h-7 w-7 fill-current">
        <path d="M16.004 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.6 4.46 1.73 6.4L3.2 28.8l6.57-1.72a12.74 12.74 0 0 0 6.23 1.6h.01c7.06 0 12.8-5.73 12.8-12.8 0-3.42-1.33-6.63-3.75-9.05a12.71 12.71 0 0 0-9.06-3.63zm0 23.04h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.9 1.02 1.04-3.8-.25-.4a10.58 10.58 0 0 1-1.62-5.65c0-5.86 4.77-10.62 10.64-10.62 2.84 0 5.5 1.1 7.51 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.86-4.77 10.62-10.63 10.62zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.64s1.14 3.06 1.3 3.27c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z" />
      </svg>
    </a>
  );
}
