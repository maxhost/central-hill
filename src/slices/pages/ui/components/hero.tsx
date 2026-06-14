import type { ReactNode } from "react";
import { type MediaImageData, MediaImage } from "@core/media";
import { Container, Eyebrow, cn } from "@core/ui";

/**
 * Page hero (S9). A full-width media band with an overlaid editorial headline. Supports
 * a looping muted background **video** (home/guest) or a still **image** (owners/about/
 * real-estate). Media is resolved upstream into `MediaImageData`; the video reads `.url`.
 */
export function PageHero({
  image,
  videoUrl,
  eyebrow,
  headline,
  subtitle,
  actions,
}: {
  image: MediaImageData | null;
  videoUrl?: string | null;
  eyebrow?: string;
  headline: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative isolate flex min-h-[72vh] items-end overflow-hidden bg-feature">
      {videoUrl ? (
        <video
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={image?.url}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : image ? (
        <MediaImage
          data={image}
          priority
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          sizes="100vw"
        />
      ) : null}

      <div
        className={cn(
          "absolute inset-0 -z-10",
          "bg-gradient-to-t from-black/70 via-black/30 to-black/20",
        )}
        aria-hidden
      />

      <Container className="pb-[clamp(48px,7vw,112px)] pt-40">
        <div className="max-w-3xl text-surface">
          {eyebrow ? <Eyebrow className="text-surface/80">{eyebrow}</Eyebrow> : null}
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] md:text-6xl">{headline}</h1>
          {subtitle ? (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-surface/85">{subtitle}</p>
          ) : null}
          {actions ? <div className="mt-8 flex flex-wrap items-center gap-4">{actions}</div> : null}
        </div>
      </Container>
    </section>
  );
}
