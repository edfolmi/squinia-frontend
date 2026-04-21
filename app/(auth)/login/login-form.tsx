"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthFormMessage } from "../_components/auth-form-message";
import { PreviewContinue } from "../_components/preview-continue";
import { authApiConfigured, authLogin } from "../_lib/auth-api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authLogin({ email: email.trim(), password });
      if (res.ok) {
        router.push("/onboarding");
        router.refresh();
        return;
      }
      setError(res.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AuthFormMessage error={error} />
      <div>
        <label htmlFor="email" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none transition-shadow placeholder:text-[var(--faint)] focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="sim-btn-accent w-full px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      {!authApiConfigured() ? (
        <p className="text-center text-[12px] leading-relaxed text-[var(--faint)]">
          Auth API URL not set. Sign in will show an error unless you configure{" "}
          <span className="font-mono text-[11px]">NEXT_PUBLIC_AUTH_API_BASE</span>.
        </p>
      ) : null}
      <PreviewContinue href="/onboarding" label="Skip to onboarding (preview)" />
    </form>
  );
}
