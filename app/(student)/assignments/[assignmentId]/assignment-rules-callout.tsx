"use client";

import { useEffectiveAssignmentRules } from "../../_hooks/use-effective-assignment-rules";

type Props = {
  assignmentId: string;
  defaults: { maxAttempts: number; minScorePercent: number };
  bestScore: number | null;
};

export function AssignmentRulesCallout({ assignmentId, defaults, bestScore }: Props) {
  const rules = useEffectiveAssignmentRules(assignmentId, defaults);
  const meets = bestScore !== null && bestScore >= rules.minScorePercent;

  return (
    <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/40 px-4 py-3 text-[13px] leading-relaxed text-[var(--muted)]">
      <p>
        <span className="font-medium text-[#111111]">Minimum report score:</span>{" "}
        <span className="font-mono tabular-nums text-[#111111]">{rules.minScorePercent}%</span> or higher on at least
        one attempt (instructor rule). Your best score:{" "}
        {bestScore === null ? (
          <span className="text-[var(--faint)]">—</span>
        ) : (
          <span className={`font-mono tabular-nums ${meets ? "text-[#166534]" : "text-[#b45309]"}`}>{bestScore}%</span>
        )}
        .
      </p>
      {bestScore !== null ? (
        <p className={`mt-2 text-[12px] ${meets ? "text-[#166534]" : "text-[#b45309]"}`}>
          {meets
            ? "Your best score meets the minimum bar for this assignment."
            : "Your best score is still below the minimum — consider another attempt while you have tries left."}
        </p>
      ) : (
        <p className="mt-2 text-[12px] text-[var(--faint)]">
          Finish a simulation here to see how your report score compares.
        </p>
      )}
    </div>
  );
}
