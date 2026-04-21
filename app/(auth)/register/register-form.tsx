"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthFormMessage } from "../_components/auth-form-message";
import { PreviewContinue } from "../_components/preview-continue";
import { authApiConfigured, authRegister } from "../_lib/auth-api";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await authRegister({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });
      if (res.ok) {
        router.push("/verify-email?sent=1");
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
        <label htmlFor="name" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Full name
        </label>
        <input
          id="name"
          autoComplete="name"
          required
          value={fullName}
          onChange={(ev) => setFullName(ev.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Work email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
        <p className="mt-1 text-[11px] text-[var(--faint)]">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(ev) => setConfirm(ev.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="sim-btn-accent w-full px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create account"}
      </button>
      {!authApiConfigured() ? (
        <p className="text-center text-[12px] text-[var(--faint)]">
          Without <span className="font-mono text-[11px]">NEXT_PUBLIC_AUTH_API_BASE</span>, registration returns an error.
        </p>
      ) : null}
      <PreviewContinue href="/verify-email?sent=1" label="Preview: go to verify-email screen" />
    </form>
  );
}
