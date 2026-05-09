import Link from "next/link";

import { RubricBoardForm } from "../../_components/rubric-board-form";

export default function NewRubricPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/org/rubrics"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Rubrics
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Create rubric board</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Define reusable scoring criteria for scenarios, interviews, and workplace simulations.
        </p>
      </div>
      <RubricBoardForm mode="new" />
    </div>
  );
}
