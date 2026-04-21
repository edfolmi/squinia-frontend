"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type { SettingsMember } from "../_lib/settings-mock-data";

export function MembersSettingsPanel({ initialMembers }: { initialMembers: SettingsMember[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onInvite(e: FormEvent) {
    e.preventDefault();
    setSent(true);
    window.setTimeout(() => setSent(false), 2500);
    setEmail("");
  }

  function setRole(id: string, role: SettingsMember["role"]) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Invite</h2>
        <form onSubmit={onInvite} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="min-w-0 flex-1 rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-2.5 text-[14px] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
          <button
            type="submit"
            className="rounded-xl border border-[var(--rule-strong)] px-5 py-2.5 text-[13px] font-medium text-[#111111] hover:bg-[var(--field)]"
          >
            Send invite
          </button>
        </form>
        {sent ? (
          <p className="mt-2 text-[13px] text-[#166534]">Preview — invite not emailed. Hook your notifications API.</p>
        ) : null}
      </div>

      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Team</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--rule)]">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--rule)] bg-[var(--field)]/60 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-[var(--rule)] last:border-0">
                  <td className="px-3 py-3 font-medium text-[#111111]">{m.name}</td>
                  <td className="px-3 py-3 text-[var(--muted)]">{m.email}</td>
                  <td className="px-3 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => setRole(m.id, e.target.value as SettingsMember["role"])}
                      className="rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-2 py-1.5 text-[12px] outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] ${
                        m.status === "active" ? "bg-[#e6f4ea] text-[#166534]" : "bg-amber-50 text-[#a16207]"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-[var(--faint)]">Role changes are local preview only.</p>
      </div>
    </div>
  );
}
