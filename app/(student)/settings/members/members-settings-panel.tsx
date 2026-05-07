"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

type StaffMember = {
  user_id: string;
  full_name: string | null;
  email: string;
  role: "ORG_OWNER" | "ORG_ADMIN" | "INSTRUCTOR";
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
  return Array.from(new Set(input.split(/[\s,;]+/u).map((part) => part.trim().toLowerCase()).filter(Boolean)));
}

export function MembersSettingsPanel({ tenantId }: { tenantId: string | null }) {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [inviteText, setInviteText] = useState("");
  const [role, setRole] = useState<"INSTRUCTOR" | "ORG_ADMIN">("INSTRUCTOR");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const inviteTokens = useMemo(() => extractInviteTokens(inviteText), [inviteText]);
  const validEmailCount = inviteTokens.filter((part) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(part)).length;

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await v1.get<{ members: StaffMember[] }>(`tenants/${tenantId}/members`);
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
      setError("Add at least one staff email address.");
      return;
    }
    setSending(true);
    try {
      const res = await v1.post<{ results: InviteResult[] }>("auth/invites/bulk", {
        emails: inviteTokens,
        role,
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

  async function changeRole(member: StaffMember, nextRole: "ORG_ADMIN" | "INSTRUCTOR") {
    if (!tenantId || member.role === "ORG_OWNER" || member.role === nextRole) return;
    setSavingUserId(member.user_id);
    const res = await v1.patch(`tenants/${tenantId}/members/${member.user_id}`, { role: nextRole });
    if (res.ok) await load();
    else setError(res.message);
    setSavingUserId(null);
  }

  async function removeMember(member: StaffMember) {
    if (!tenantId || member.role === "ORG_OWNER") return;
    const confirmed = window.confirm(`Remove ${member.email} from your organization staff?`);
    if (!confirmed) return;
    setSavingUserId(member.user_id);
    const res = await v1.delete(`tenants/${tenantId}/members/${member.user_id}`);
    if (res.ok) await load();
    else setError(res.message);
    setSavingUserId(null);
  }

  if (loading) return <p className="text-[14px] text-[var(--muted)]">Loading...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Invite staff</h2>
        {error ? (
          <p className="mt-2 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-[13px] text-red-900">{error}</p>
        ) : null}
        <form onSubmit={onInvite} className="mt-4 space-y-3">
          <textarea
            value={inviteText}
            onChange={(e) => setInviteText(e.target.value)}
            placeholder="coach@company.com, admin@company.com"
            rows={5}
            className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[13px] font-medium text-[#111111] hover:bg-[var(--field)]">
                Upload CSV
                <input type="file" accept=".csv,text/csv" onChange={onCsv} className="sr-only" />
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "INSTRUCTOR" | "ORG_ADMIN")}
                className="rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[#111111] outline-none"
              >
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ORG_ADMIN">Staff admin</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-[var(--muted)]">{validEmailCount} valid / {inviteTokens.length} total</span>
              <button type="submit" disabled={sending} className="sim-btn-accent px-5 py-2.5 font-mono text-[10px] uppercase disabled:opacity-50">
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
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Staff team</h2>
        {members.length === 0 ? (
          <p className="mt-4 text-[14px] text-[var(--muted)]">No staff members yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--rule)]">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--rule)] bg-[var(--field)]/60 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user_id} className="border-b border-[var(--rule)] last:border-0">
                    <td className="px-3 py-3 font-medium text-[#111111]">{m.full_name || "Unnamed user"}</td>
                    <td className="px-3 py-3 text-[var(--muted)]">{m.email}</td>
                    <td className="px-3 py-3">
                      {m.role === "ORG_OWNER" ? (
                        <span className="font-mono text-[11px] text-[var(--muted)]">ORG_OWNER</span>
                      ) : (
                        <select
                          value={m.role}
                          disabled={savingUserId === m.user_id}
                          onChange={(e) => void changeRole(m, e.target.value as "ORG_ADMIN" | "INSTRUCTOR")}
                          className="rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-2 py-1.5 font-mono text-[11px]"
                        >
                          <option value="ORG_ADMIN">ORG_ADMIN</option>
                          <option value="INSTRUCTOR">INSTRUCTOR</option>
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">{new Date(m.joined_at).toLocaleDateString()}</td>
                    <td className="px-3 py-3">
                      {m.role === "ORG_OWNER" ? null : (
                        <button
                          type="button"
                          disabled={savingUserId === m.user_id}
                          onClick={() => void removeMember(m)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </td>
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
