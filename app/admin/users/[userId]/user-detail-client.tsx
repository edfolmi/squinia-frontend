"use client";

import { useEffect, useState } from "react";

import { StatusBanner } from "@/app/_components/status-block";
import { v1 } from "@/app/_lib/v1-client";

import { PageHeader, Panel, Pill, formatDate } from "../../_components/admin-ui";

type UserDetail = {
  user: {
    id: string;
    email: string;
    full_name: string;
    platform_role: string;
    is_active: boolean;
    is_verified: boolean;
    last_login_at?: string | null;
    created_at?: string | null;
  };
  memberships: { tenant_id: string; tenant_name: string; account_kind: string; role: string; joined_at?: string | null }[];
  cohorts: { cohort_id: string; cohort_name: string; tenant_name: string; role: string; joined_at?: string | null }[];
  recent_sessions: { id: string; tenant_name: string; status: string; mode: string; created_at?: string | null; ended_at?: string | null }[];
};

export function AdminUserDetailClient({ userId }: { userId: string }) {
  const [data, setData] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await v1.get<UserDetail>(`platform/users/${userId}`);
      if (res.ok) setData(res.data);
      else setError(res.message);
    })();
  }, [userId]);

  return (
    <div className="space-y-7">
      <PageHeader
        label="User detail"
        title={data?.user.full_name ?? "Loading user"}
        description={data?.user.email ?? "Inspect account status, memberships, cohort enrollment, and recent sessions."}
      />
      {error ? <StatusBanner message={error} /> : null}
      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Panel title="Account">
              <div className="space-y-3 text-[13px] text-[var(--muted)]">
                <p><span className="font-medium text-[#111111]">Role:</span> {data.user.platform_role}</p>
                <p><span className="font-medium text-[#111111]">Status:</span> {data.user.is_active ? "Active" : "Inactive"}</p>
                <p><span className="font-medium text-[#111111]">Verified:</span> {data.user.is_verified ? "Yes" : "No"}</p>
                <p><span className="font-medium text-[#111111]">Last login:</span> {formatDate(data.user.last_login_at)}</p>
              </div>
            </Panel>
            <Panel title="Memberships">
              <p className="text-2xl font-semibold">{data.memberships.length}</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">Active tenant memberships</p>
            </Panel>
            <Panel title="Cohorts">
              <p className="text-2xl font-semibold">{data.cohorts.length}</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">Cohort enrollments</p>
            </Panel>
          </div>
          <Panel title="Memberships">
            <ul className="divide-y divide-[var(--rule)]">
              {data.memberships.map((m) => (
                <li key={`${m.tenant_id}-${m.role}`} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div>
                    <p className="font-medium text-[#111111]">{m.tenant_name}</p>
                    <p className="text-[12px] text-[var(--muted)]">{m.account_kind} - joined {formatDate(m.joined_at)}</p>
                  </div>
                  <Pill>{m.role}</Pill>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Recent sessions">
            {data.recent_sessions.length ? (
              <ul className="divide-y divide-[var(--rule)]">
                {data.recent_sessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div>
                      <p className="font-medium text-[#111111]">{s.tenant_name}</p>
                      <p className="text-[12px] text-[var(--muted)]">{s.mode} - {s.status}</p>
                    </div>
                    <span className="text-[12px] text-[var(--muted)]">{formatDate(s.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-[var(--muted)]">No sessions yet.</p>
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}
