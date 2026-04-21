/** Browser-only overrides for assignment simulation rules (instructor preview). */

export const ASSIGNMENT_RULES_STORAGE_KEY = "squinia.instructor.assignmentRules.v1" as const;

export type AssignmentRules = {
  maxAttempts: number;
  minScorePercent: number;
};

export type StoredAssignmentRules = Record<string, AssignmentRules>;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function normalizeRules(rules: AssignmentRules): AssignmentRules {
  return {
    maxAttempts: clamp(Math.floor(Number(rules.maxAttempts)) || 1, 1, 99),
    minScorePercent: clamp(Math.floor(Number(rules.minScorePercent)) || 0, 0, 100),
  };
}

export function loadAllAssignmentRules(): StoredAssignmentRules {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ASSIGNMENT_RULES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as StoredAssignmentRules;
  } catch {
    return {};
  }
}

export function getEffectiveAssignmentRules(assignmentId: string, defaults: AssignmentRules): AssignmentRules {
  const all = loadAllAssignmentRules();
  const o = all[assignmentId];
  if (!o) return normalizeRules(defaults);
  return normalizeRules({
    maxAttempts: o.maxAttempts ?? defaults.maxAttempts,
    minScorePercent: o.minScorePercent ?? defaults.minScorePercent,
  });
}

export function saveAssignmentRules(assignmentId: string, rules: AssignmentRules): void {
  if (typeof window === "undefined") return;
  const all = loadAllAssignmentRules();
  all[assignmentId] = normalizeRules(rules);
  window.localStorage.setItem(ASSIGNMENT_RULES_STORAGE_KEY, JSON.stringify(all));
}
