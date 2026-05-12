export type AchievementProgress = {
  label: string;
  complete: boolean;
  current?: number;
  target?: number;
  current_score?: number;
  target_score?: number;
  current_attempts?: number;
  target_attempts?: number;
};

export type AchievementItem = {
  id: string;
  key: string;
  kind: "level" | "skill" | string;
  title: string;
  description: string;
  certificate_title: string;
  criteria: Record<string, unknown>;
  sort_order: number;
  earned: boolean;
  earned_id: string | null;
  earned_at: string | null;
  certificate_serial: string | null;
  evidence_snapshot: Record<string, unknown> | null;
  score_snapshot: Record<string, unknown> | null;
  progress: AchievementProgress;
};

export type AchievementLibrary = {
  summary: {
    earned: number;
    total: number;
    locked: number;
  };
  items: AchievementItem[];
};

export type AchievementDetail = {
  achievement: AchievementItem & {
    earned: true;
    earned_id: string;
    earned_at: string;
    certificate_serial: string;
    evidence_snapshot: Record<string, unknown>;
    score_snapshot: Record<string, unknown>;
  };
  recipient: {
    name: string;
    email: string;
  };
};

export function formatAchievementDate(value?: string | null): string {
  if (!value) return "Not earned yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function evidenceText(item: Pick<AchievementItem, "kind" | "evidence_snapshot" | "progress">): string {
  const evidence = item.evidence_snapshot ?? {};
  if (item.kind === "level") {
    const sessions = evidence.completed_eligible_sessions;
    const scenarios = evidence.unique_scenarios;
    return `${typeof sessions === "number" ? sessions : "--"} eligible sessions across ${
      typeof scenarios === "number" ? scenarios : "--"
    } scenarios`;
  }
  if (item.kind === "skill") {
    const score = evidence.score;
    const attempts = evidence.attempts;
    return `${typeof score === "number" ? Math.round(score) : "--"}% across ${
      typeof attempts === "number" ? attempts : "--"
    } rubric evidence points`;
  }
  return item.progress.label;
}
