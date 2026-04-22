"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending";
  joinedAt: string;
};

export function MembersSettingsPanel({ tenantId }: { tenantId: string | null }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    const res = await v1.get<{ memberships: Array<{ tenant_id: string; tenant_name: string; org_role: string; joined_at: string }> }>("auth/me");
    if (res.ok) {
      const ms = res.data.memberships ?? [];
      setMembers(ms.map((m, i) => ({
        id: String(i),
        name: m.tenant_name,
        email: "",
        role: m.org_role,
        status: "active" as const,
        joinedAt: m.joined_at,
      })));
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await v1.post("auth/invites", {
        email,
        tenant_id: tenantId,
        role: "STUDENT",
      });
      if (res.ok) {
        setSent(true);
        setEmail("");
        window.setTimeout(() => setSent(false), 3000);
      } else {
        setError(res.message);
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) return <p className="text-[14px] text-[var(--muted)]">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Invite</h2>
        {error ? (
          <p className="mt-2 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-[13px] text-red-900">{error}</p>
        ) : null}
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
            disabled={sending}
            className="rounded-xl border border-[var(--rule-strong)] px-5 py-2.5 text-[13px] font-medium text-[#111111] hover:bg-[var(--field)] disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send invite"}
          </button>
        </form>
        {sent ? (
          <p className="mt-2 text-[13px] text-[#166534]">Invite sent.</p>
        ) : null}
      </div>

      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Team</h2>
        {members.length === 0 ? (
          <p className="mt-4 text-[14px] text-[var(--muted)]">No members yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--rule)]">
            <table className="w-full min-w-[480px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--rule)] bg-[var(--field)]/60 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  <th className="px-3 py-3 font-medium">Workspace</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-[var(--rule)] last:border-0">
                    <td className="px-3 py-3 font-medium text-[#111111]">{m.name}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-[var(--muted)]">{m.role}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-[#e6f4ea] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-[#166534]">
                        {m.status}
                      </span>
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
