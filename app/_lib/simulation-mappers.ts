/** Map API enums to UI labels / routes used by the Next app. */

export type UiSimulationKind = "chat" | "phone" | "video";

export type ApiSessionMode = "TEXT" | "VOICE" | "VIDEO";

export function sessionModeToUiKind(mode: string | undefined | null): UiSimulationKind {
  const m = (mode ?? "TEXT").toUpperCase();
  if (m === "VOICE" || m === "PHONE") return "phone";
  if (m === "VIDEO") return "video";
  return "chat";
}

/** Read simulation modality from scenario `config` (persisted by org scenario editor). */
export function scenarioConfigToUiKind(config: unknown): UiSimulationKind {
  if (!config || typeof config !== "object") return "chat";
  const c = config as Record<string, unknown>;
  const raw = c.session_mode ?? c.default_session_mode ?? c.modality;
  if (typeof raw !== "string") return "chat";
  return sessionModeToUiKind(raw);
}

export function uiKindToSessionMode(kind: UiSimulationKind): ApiSessionMode {
  if (kind === "phone") return "VOICE";
  if (kind === "video") return "VIDEO";
  return "TEXT";
}

export function scenarioDifficultyLabel(difficulty: string | undefined | null): string {
  const d = (difficulty ?? "INTERMEDIATE").toUpperCase();
  if (d === "BEGINNER") return "Beginner";
  if (d === "ADVANCED") return "Advanced";
  return "Medium";
}

export function agentRoleLabel(role: string | undefined | null): string {
  if (!role) return "Simulation";
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function simulationReportHref(sessionId: string, kind: UiSimulationKind): string {
  return `/simulation/${sessionId}/report?kind=${kind}`;
}
