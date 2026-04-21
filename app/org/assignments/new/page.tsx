import Link from "next/link";

import { ORG_ASSIGNMENTS, ORG_COHORTS, ORG_SCENARIOS } from "../../_lib/org-mock-data";

import { OrgAssignmentCreateForm } from "./org-assignment-create-form";

export default function OrgAssignmentNewPage() {
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
          Create & assign task
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Post-session assignments tie a cohort to a scenario and due date. Grading can combine auto report scores with
          manual marks.
        </p>
      </div>
      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <OrgAssignmentCreateForm cohorts={ORG_COHORTS} scenarios={ORG_SCENARIOS} sampleAssignmentId={ORG_ASSIGNMENTS[0]?.id ?? "org-asg-1"} />
      </section>
    </div>
  );
}
