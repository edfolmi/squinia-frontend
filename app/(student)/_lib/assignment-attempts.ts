import { parseAttemptSessionId } from "../../simulation/_lib/attempt-id";
import type { RecentSessionRow, SimulationKind } from "./student-mock-data";

export function countAttemptsForScenario(
  rows: RecentSessionRow[],
  scenarioId: string,
  kind: SimulationKind,
): number {
  return rows.filter((r) => {
    if (r.kind !== kind) return false;
    const { scenarioId: base } = parseAttemptSessionId(r.sessionId);
    return base === scenarioId;
  }).length;
}

export function bestScoreForScenario(
  rows: RecentSessionRow[],
  scenarioId: string,
  kind: SimulationKind,
): number | null {
  const scores = rows
    .filter((r) => {
      if (r.kind !== kind) return false;
      const { scenarioId: base } = parseAttemptSessionId(r.sessionId);
      return base === scenarioId;
    })
    .map((r) => r.score);
  if (scores.length === 0) return null;
  return Math.max(...scores);
}
