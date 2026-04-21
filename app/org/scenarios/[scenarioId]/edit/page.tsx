import Link from "next/link";
import { notFound } from "next/navigation";

import { ScenarioEditorForm } from "../../../_components/scenario-editor-form";
import { getScenarioById } from "../../../_lib/org-mock-data";

export default async function OrgScenarioEditPage({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { scenarioId } = await params;
  const scenario = getScenarioById(scenarioId);
  if (!scenario) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/org/scenarios"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Scenarios
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Edit scenario</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{scenario.title}</p>
      </div>
      <ScenarioEditorForm mode="edit" initial={scenario} />
    </div>
  );
}
