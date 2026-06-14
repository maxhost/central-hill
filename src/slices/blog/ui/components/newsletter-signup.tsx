"use client";
import { useState, type FormEvent } from "react";
import { Eyebrow } from "@core/ui";

/**
 * Newsletter signup island. Visual + UX only for now; on submit it will call the
 * leads slice `submitLead({ kind: "newsletter", ... })` once S10 lands (the
 * pipeline + email notify are owned there — content-briefs.md §6, ADR 0011/0014).
 */
export function NewsletterSignup({
  eyebrow,
  title,
  description,
  placeholder,
  button,
  success,
}: {
  eyebrow: string;
  title: string;
  description: string;
  placeholder: string;
  button: string;
  success: string;
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO(S10 leads): await submitLead({ kind: "newsletter", email, ...consent }).
    setDone(true);
  }

  return (
    <div className="rounded-2xl bg-feature px-8 py-12 text-bg md:px-14">
      <div className="mx-auto max-w-xl text-center">
        <Eyebrow className="text-bg/70">{eyebrow}</Eyebrow>
        <h2 className="mt-3 font-serif text-3xl leading-tight">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-bg/80">{description}</p>

        {done ? (
          <p className="mt-8 text-sm font-medium text-bg">{success}</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="w-full rounded-md border border-bg/20 bg-bg/5 px-4 py-3 text-sm text-bg placeholder:text-bg/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            <button
              type="submit"
              className="shrink-0 rounded-md bg-accent px-7 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-deep"
            >
              {button}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
