/** Map API enums to UI labels / routes used by the Next app. */

export type UiSimulationKind = "chat" | "phone" | "video";

export function sessionModeToUiKind(mode: string | undefined | null): UiSimulationKind {
  const m = (mode ?? "TEXT").toUpperCase();
  if (m === "VOICE") return "phone";
  if (m === "VIDEO") return "video";
  return "chat";
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
