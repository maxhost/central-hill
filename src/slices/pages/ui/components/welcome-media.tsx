import type { PageMedia } from "../../contract";
import { MediaContent } from "./media-content";
import { WelcomeMediaFrame } from "./media-status";

/** Geometry belongs to IntroSplit; selected media never reveals the stock fallback on failure. */
export function WelcomeMedia({ media, preview, errorLabel }: {
  media: PageMedia;
  preview?: boolean;
  errorLabel?: string;
}) {
  return (
    <WelcomeMediaFrame key={`${media.mime ?? "image/"}:${media.url}`} preview={preview} errorLabel={errorLabel}>
      {MediaContent({
        // Keep Welcome neutral while the actual image loads; retain intrinsic dimensions
        // and normal optimization. Other MediaContent consumers keep their blurhash.
        media: { ...media, blurhash: null },
        className: "absolute inset-0 h-full w-full object-cover object-center",
        sizes: "(max-width: 880px) 100vw, 560px",
      })}
    </WelcomeMediaFrame>
  );
}
