"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type Initial = { fullName: string; email: string };

export function ProfileSettingsForm({ initial }: { initial: Initial }) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [email] = useState(initial.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    window.setTimeout(() => {
      setMessage("Preview — profile not saved to a server.");
      setLoading(false);
    }, 400);
  }

  function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword || confirmPassword || currentPassword) {
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
      if (!currentPassword) {
        setError("Enter your current password to set a new one.");
        return;
      }
    }
    setLoading(true);
    window.setTimeout(() => {
      setMessage("Preview — use your auth API’s password change endpoint.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLoading(false);
    }, 400);
  }

  return (
    <div className="space-y-10">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-[13px] text-red-900">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-[#166534]/30 bg-[#e6f4ea]/70 px-3 py-2 text-[13px] text-[#166534]">{message}</p>
      ) : null}

      <form onSubmit={onSaveProfile} className="space-y-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Basic info</h2>
        <div>
          <label htmlFor="fullName" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Full name
          </label>
          <input
            id="fullName"
            value={fullName}
            onChange={(ev) => setFullName(ev.target.value)}
            className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            className="w-full cursor-not-allowed rounded-xl border border-[var(--rule)] bg-[var(--field)]/80 px-4 py-3 text-[15px] text-[var(--muted)] outline-none"
          />
          <p className="mt-1 text-[12px] text-[var(--faint)]">Email changes usually require verification — wire your auth provider.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="sim-btn-accent px-6 py-2.5 font-mono text-[10px] uppercase disabled:opacity-50"
        >
          Save profile
        </button>
      </form>

      <form id="password" onSubmit={onChangePassword} className="space-y-5 scroll-mt-24 border-t border-[var(--rule)] pt-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Password</h2>
        <div>
          <label htmlFor="cur" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Current password
          </label>
          <input
            id="cur"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(ev) => setCurrentPassword(ev.target.value)}
            className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </div>
        <div>
          <label htmlFor="npw" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            New password
          </label>
          <input
            id="npw"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(ev) => setNewPassword(ev.target.value)}
            className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </div>
        <div>
          <label htmlFor="npw2" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Confirm new password
          </label>
          <input
            id="npw2"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(ev) => setConfirmPassword(ev.target.value)}
            className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl border border-[var(--rule-strong)] px-6 py-2.5 text-[13px] font-medium text-[#111111] transition-colors hover:bg-[var(--field)] disabled:opacity-50"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
