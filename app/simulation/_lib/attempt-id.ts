/**
 * Multiple attempts per scenario: each run uses a unique session id so reports do not overwrite.
 * Format: `{scenarioSlug}__{attemptToken}` — scenario slugs must not contain `__`.
 */

export const ATTEMPT_DELIM = "__" as const;

export type SimulationKind = "chat" | "phone" | "video";

export function newAttemptToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function appendAttemptToScenarioId(scenarioId: string, attemptToken: string): string {
  return `${scenarioId}${ATTEMPT_DELIM}${attemptToken}`;
}

export function parseAttemptSessionId(sessionId: string): {
  scenarioId: string;
  attemptToken: string | null;
} {
  const i = sessionId.lastIndexOf(ATTEMPT_DELIM);
  if (i === -1) {
    return { scenarioId: sessionId, attemptToken: null };
  }
  return {
    scenarioId: sessionId.slice(0, i),
    attemptToken: sessionId.slice(i + ATTEMPT_DELIM.length) || null,
  };
}

export function buildSimulationPath(sessionId: string, kind: SimulationKind): string {
  switch (kind) {
    case "phone":
      return `/simulation/phone/${sessionId}`;
    case "video":
      return `/simulation/video/${sessionId}`;
    default:
      return `/simulation/${sessionId}`;
  }
}
