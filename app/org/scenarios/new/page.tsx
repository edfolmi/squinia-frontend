import Link from "next/link";

import { ScenarioEditorForm } from "../../_components/scenario-editor-form";

export default function OrgScenarioNewPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/org/scenarios"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Scenarios
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Scenario builder</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Set role, difficulty, simulation type, and room configuration. Build the rubric your evaluators and models
          align to.
        </p>
      </div>
      <ScenarioEditorForm mode="new" initial={null} />
    </div>
  );
}
