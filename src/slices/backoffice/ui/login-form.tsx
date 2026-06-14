"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@core/auth/client";

/**
 * Backoffice sign-in (email + password via Better Auth). On success it
 * hard-navigates to `/admin` so the server-side gate re-runs with the fresh
 * session cookie. Generic error copy only — never reveals whether the email
 * exists.
 */
export function LoginForm() {
  const t = useTranslations("backoffice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const inputClass =
    "w-full rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(false);
        const { error: signInError } = await authClient.signIn.email({ email, password });
        if (signInError) {
          setError(true);
          setPending(false);
          return;
        }
        window.location.assign("/admin");
      }}
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          {t("login.email")}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-1.5 ${inputClass}`}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          {t("login.password")}
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-1.5 ${inputClass}`}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-md border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent-deep">
          {t("login.error")}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-accent px-7 py-3 text-sm font-medium text-surface transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t("login.submitting") : t("login.submit")}
      </button>
    </form>
  );
}
