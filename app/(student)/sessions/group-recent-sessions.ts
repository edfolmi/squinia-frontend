import { parseAttemptSessionId } from "../../simulation/_lib/attempt-id";
import type { RecentSessionRow, SimulationKind } from "../_lib/student-mock-data";

export type SessionScenarioGroup = {
  groupKey: string;
  scenarioId: string;
  scenarioTitle: string;
  kind: SimulationKind;
  attempts: RecentSessionRow[];
};

export function groupRecentSessionsByScenario(rows: RecentSessionRow[]): SessionScenarioGroup[] {
  const map = new Map<string, RecentSessionRow[]>();
  for (const row of rows) {
    const parsed = parseAttemptSessionId(row.sessionId);
    const scenarioIdForKey = row.apiScenarioId ?? parsed.scenarioId;
    const key = `${scenarioIdForKey}::${row.kind}`;
    const list = map.get(key);
    if (list) list.push(row);
    else map.set(key, [row]);
  }

  const groups: SessionScenarioGroup[] = [];
  for (const [groupKey, attempts] of map) {
    const [scenarioId, kindStr] = groupKey.split("::");
    const kind = kindStr as SimulationKind;
    attempts.sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
    const first = attempts[0];
    if (!first) continue;
    groups.push({
      groupKey,
      scenarioId: first.apiScenarioId ?? scenarioId ?? first.sessionId,
      scenarioTitle: first.scenarioTitle,
      kind,
      attempts,
    });
  }

  groups.sort(
    (a, b) =>
      new Date(b.attempts[0]?.endedAt ?? 0).getTime() - new Date(a.attempts[0]?.endedAt ?? 0).getTime(),
  );
  return groups;
}
