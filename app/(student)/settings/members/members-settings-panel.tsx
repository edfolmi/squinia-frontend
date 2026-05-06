"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

type Member = {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
  status: "active";
  joined_at: string;
};

type InviteResult = {
  email: string;
  status: string;
  invite_id?: string;
  invite_url?: string;
  message?: string;
};

function extractInviteTokens(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\s,;]+/u)
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function MembersSettingsPanel({ tenantId }: { tenantId: string | null }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteText, setInviteText] = useState("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const inviteTokens = useMemo(() => extractInviteTokens(inviteText), [inviteText]);
  const validEmailCount = inviteTokens.filter((part) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(part)).length;

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await v1.get<{ members: Member[] }>(`tenants/${tenantId}/members`);
    if (res.ok) setMembers(res.data.members ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResults([]);
    if (!inviteTokens.length) {
      setError("Add at least one email address.");
      return;
    }
    setSending(true);
    try {
      const res = await v1.post<{ results: InviteResult[] }>("auth/invites/bulk", {
        emails: inviteTokens,
        role: "STUDENT",
      });
      if (res.ok) {
        setResults(res.data.results ?? []);
        setInviteText("");
        await load();
      } else {
        setError(res.message);
      }
    } finally {
      setSending(false);
    }
  }

  async function onCsv(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setError("CSV must be smaller than 1 MB.");
      return;
    }
    const text = await file.text();
    setInviteText((current) => `${current}\n${text}`.trim());
  }

  if (loading) return <p className="text-[14px] text-[var(--muted)]">Loading...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Invite students</h2>
        {error ? (
          <p className="mt-2 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-[13px] text-red-900">{error}</p>
        ) : null}
        <form onSubmit={onInvite} className="mt-4 space-y-3">
          <textarea
            value={inviteText}
            onChange={(e) => setInviteText(e.target.value)}
            placeholder="student@school.edu, another@school.edu"
            rows={5}
            className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[13px] font-medium text-[#111111] hover:bg-[var(--field)]">
              Upload CSV
              <input type="file" accept=".csv,text/csv" onChange={onCsv} className="sr-only" />
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-[var(--muted)]">
                {validEmailCount} valid / {inviteTokens.length} total
              </span>
              <button
                type="submit"
                disabled={sending}
                className="sim-btn-accent px-5 py-2.5 font-mono text-[10px] uppercase disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send invites"}
              </button>
            </div>
          </div>
        </form>

        {results.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--rule)]">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead className="border-b border-[var(--rule)] bg-[var(--field)]/60 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                <tr>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={`${r.email}-${r.status}`} className="border-b border-[var(--rule)] last:border-0">
                    <td className="px-3 py-3 font-medium text-[#111111]">{r.email}</td>
                    <td className="px-3 py-3 font-mono text-[11px] uppercase text-[var(--muted)]">{r.status}</td>
                    <td className="px-3 py-3 text-[var(--muted)]">{r.message ?? (r.invite_url ? "Invite link created" : "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Members</h2>
        {members.length === 0 ? (
          <p className="mt-4 text-[14px] text-[var(--muted)]">No members yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--rule)]">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--rule)] bg-[var(--field)]/60 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user_id} className="border-b border-[var(--rule)] last:border-0">
                    <td className="px-3 py-3 font-medium text-[#111111]">{m.full_name || "Unnamed user"}</td>
                    <td className="px-3 py-3 text-[var(--muted)]">{m.email}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-[var(--muted)]">{m.role}</td>
                    <td className="px-3 py-3 text-[var(--muted)]">{new Date(m.joined_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
