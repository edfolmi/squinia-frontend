"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { AuthFormMessage } from "../_components/auth-form-message";
import { PreviewContinue } from "../_components/preview-continue";
import { authApiConfigured, authVerifyEmail } from "../_lib/auth-api";

type Props = {
  initialToken: string;
  sent: boolean;
};

export function VerifyEmailClient({ initialToken, sent }: Props) {
  const search = useSearchParams();
  const tokenFromUrl = search.get("token") ?? initialToken;
  const [token, setToken] = useState(tokenFromUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!token.trim()) {
      setError("Paste the verification token from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await authVerifyEmail({ token: token.trim() });
      if (res.ok) {
        setSuccess("Email verified. You can sign in.");
        return;
      }
      setError(res.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {sent ? (
        <p className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/60 px-3 py-2 text-[13px] text-[var(--muted)]">
          We sent a link to your inbox (when your API is wired). Open it on this device, or paste the token below.
        </p>
      ) : null}
      <AuthFormMessage error={error} success={success} />
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="token" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Verification token
          </label>
          <textarea
            id="token"
            rows={3}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token from email link…"
            className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 font-mono text-[13px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="sim-btn-accent w-full px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify email"}
        </button>
      </form>
      {success ? (
        <p className="text-center">
          <Link href="/login" className="sim-btn-accent inline-block px-6 py-3 font-mono text-[10px] uppercase">
            Continue to sign in
          </Link>
        </p>
      ) : null}
      <p className="text-center text-[13px] text-[var(--muted)]">
        Wrong address?{" "}
        <Link href="/register" className="font-medium text-[#111111] underline underline-offset-2">
          Sign up again
        </Link>
      </p>
      <PreviewContinue href="/login" label="Preview: continue to sign in" />
      {!authApiConfigured() ? (
        <p className="text-center text-[12px] text-[var(--faint)]">
          Set <span className="font-mono text-[11px]">NEXT_PUBLIC_API_BASE</span> when the verify-email route exists on the API.
        </p>
      ) : null}
    </div>
  );
}
