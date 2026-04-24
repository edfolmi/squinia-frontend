"use client";

import { StartSimulationButton } from "../../../simulation/_components/start-simulation-button";
import { useEffectiveAssignmentRules } from "../../_hooks/use-effective-assignment-rules";
import type { SimulationKind } from "../../_lib/student-mock-data";

type Props = {
  assignmentId: string;
  scenarioId: string;
  kind: SimulationKind;
  attemptsUsed: number;
  defaults: { maxAttempts: number; minScorePercent: number };
  buttonClassName: string;
};

export function AssignmentSimulationCta({
  assignmentId,
  scenarioId,
  kind,
  attemptsUsed,
  defaults,
  buttonClassName,
}: Props) {
  const rules = useEffectiveAssignmentRules(assignmentId, defaults);
  const remaining = Math.max(0, rules.maxAttempts - attemptsUsed);
  const atMax = attemptsUsed >= rules.maxAttempts;

  return (
    <div className="mt-4 space-y-2">
      <StartSimulationButton
        scenarioId={scenarioId}
        kind={kind}
        disabled={atMax}
        title={
          atMax
            ? `This assignment allows up to ${rules.maxAttempts} attempt(s). Limit reached.`
            : undefined
        }
        className={buttonClassName}
      >
        Start new attempt
      </StartSimulationButton>
      <p className="text-[12px] leading-relaxed text-[var(--muted)]">
        Attempts:{" "}
        <span className="font-mono tabular-nums text-[#111111]">
          {attemptsUsed}/{rules.maxAttempts}
        </span>
        {atMax
          ? " — you cannot start another attempt. Contact your instructor to raise the limit."
          : remaining === 1
            ? " — one attempt left."
            : ` — ${remaining} attempts left.`}
      </p>
    </div>
  );
}
