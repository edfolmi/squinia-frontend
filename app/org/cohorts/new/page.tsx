import Link from "next/link";

import { CohortCreateForm } from "./cohort-create-form";

export default function OrgCohortNewPage() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/org/cohorts"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Cohorts
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Create cohort</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Name your cohort and set program length. In preview, saving opens a sample cohort detail — your API would
          persist and provision invites.
        </p>
      </div>
      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <CohortCreateForm />
      </section>
    </div>
  );
}
