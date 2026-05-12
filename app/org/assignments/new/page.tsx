"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";

import { OrgAssignmentCreateForm } from "./org-assignment-create-form";

type Row = { id: string; name: string };
type ScnRow = { id: string; title: string };

export default function OrgAssignmentNewPage() {
  const [cohorts, setCohorts] = useState<Row[]>([]);
  const [scenarios, setScenarios] = useState<ScnRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([
      v1.get<ItemsData<Row>>("cohorts", { limit: 100, page: 1 }),
      v1.get<ItemsData<ScnRow>>("scenarios", { limit: 100, page: 1 }),
    ]);
    if (cRes.ok) setCohorts(cRes.data.items ?? []);
    if (sRes.ok) setScenarios(sRes.data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/org/assignments"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          All assignments
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">
          Create &amp; assign task
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Post-session assignments tie a cohort to a scenario and due date. Grading can combine auto report scores with
          manual marks.
        </p>
      </div>
      {loading ? (
        <p className="text-[14px] text-[var(--muted)]">Loading…</p>
      ) : (
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
          <OrgAssignmentCreateForm cohorts={cohorts} scenarios={scenarios} />
        </section>
      )}
    </div>
  );
}
