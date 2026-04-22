import { parseAttemptSessionId } from "../../simulation/_lib/attempt-id";
import type { RecentSessionRow, SimulationKind } from "./student-mock-data";

function rowScenarioId(r: RecentSessionRow): string {
  return r.apiScenarioId ?? parseAttemptSessionId(r.sessionId).scenarioId;
}

export function countAttemptsForScenario(
  rows: RecentSessionRow[],
  scenarioId: string,
  kind: SimulationKind,
): number {
  return rows.filter((r) => {
    if (r.kind !== kind) return false;
    return rowScenarioId(r) === scenarioId;
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
      return rowScenarioId(r) === scenarioId;
    })
    .map((r) => r.score)
    .filter((s): s is number => s != null);
  if (scores.length === 0) return null;
  return Math.max(...scores);
}
