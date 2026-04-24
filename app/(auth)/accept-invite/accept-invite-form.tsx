"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AuthFormMessage } from "../_components/auth-form-message";
import { authAcceptInvite, authFetchMe, postAuthDestination, setSessionFromLoginData } from "../_lib/auth-api";

type Props = {
  initialToken: string;
  orgName: string;
};

export function AcceptInviteForm({ initialToken, orgName }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const tokenFromUrl = search.get("token") ?? initialToken;
  const [token, setToken] = useState(tokenFromUrl);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token.trim()) {
      setError("Invite token missing.");
      return;
    }
    if (password && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await authAcceptInvite({
        token: token.trim(),
        password: password || undefined,
        fullName: fullName.trim() || undefined,
      });
      if (res.ok) {
        setSessionFromLoginData(res.data);
        const me = await authFetchMe();
        const dest = postAuthDestination(me.ok ? me.data : null);
        router.push(dest);
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
      <p className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/60 px-3 py-2 text-[13px] text-[var(--muted)]">
        You are joining <span className="font-medium text-[#111111]">{orgName}</span> on Squinia. Set a password if
        this is a new account; otherwise your existing password still applies after accept.
      </p>
      <AuthFormMessage error={error} />
      <div>
        <label htmlFor="token" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Invite token
        </label>
        <textarea
          id="token"
          rows={2}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 font-mono text-[13px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <div>
        <label htmlFor="name" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Your name
        </label>
        <input
          id="name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Password (new users)
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="sim-btn-accent w-full px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-50"
      >
        {loading ? "Accepting…" : "Accept invite"}
      </button>
      <p className="text-center text-[13px] text-[var(--muted)]">
        <Link href="/login" className="font-medium text-[#111111] underline underline-offset-2">
          Sign in instead
        </Link>
      </p>
    </form>
  );
}
