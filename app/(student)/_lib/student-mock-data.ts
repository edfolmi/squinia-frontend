/** Preview data — replace with API + auth. */

export type SimulationKind = "chat" | "phone" | "video";

export type Difficulty = "Beginner" | "Medium" | "Advanced";

export type PublishedScenario = {
  id: string;
  title: string;
  summary: string;
  role: string;
  difficulty: Difficulty;
  kind: SimulationKind;
  estMinutes: number;
};

export const PUBLISHED_SCENARIOS: PublishedScenario[] = [
  {
    id: "published-weekly",
    title: "Weekly update for leadership",
    summary: "Live transcript practice: structure, pacing, and clarity under a senior interviewer.",
    role: "AI engineer — learner",
    difficulty: "Medium",
    kind: "chat",
    estMinutes: 12,
  },
  {
    id: "published-phone-1",
    title: "Weekly update check-in",
    summary: "Voice room: practice tone, brevity, and follow-ups on a realistic leadership call.",
    role: "Individual contributor",
    difficulty: "Medium",
    kind: "phone",
    estMinutes: 8,
  },
  {
    id: "published-video-1",
    title: "Stakeholder video review",
    summary: "Camera + optional screen share; executive-style presence and framing.",
    role: "Engineering lead",
    difficulty: "Advanced",
    kind: "video",
    estMinutes: 15,
  },
  {
    id: "published-chat-escalation",
    title: "Customer escalation thread",
    summary: "De-escalation and policy boundaries in written back-and-forth.",
    role: "Support engineer",
    difficulty: "Beginner",
    kind: "chat",
    estMinutes: 10,
  },
];

export type AssignedSimulation = {
  scenarioId: string;
  assignedAt: string;
  dueAt: string | null;
  priority: "normal" | "high";
};

export const ASSIGNED: AssignedSimulation[] = [
  { scenarioId: "published-weekly", assignedAt: "2026-04-18", dueAt: "2026-04-22", priority: "high" },
  { scenarioId: "published-video-1", assignedAt: "2026-04-16", dueAt: null, priority: "normal" },
];

export type RecentSessionRow = {
  sessionId: string;
  kind: SimulationKind;
  scenarioTitle: string;
  /** Null when the API list does not include evaluation scores. */
  score: number | null;
  endedAt: string;
  /** Real scenario UUID from API — used for grouping when ``sessionId`` is not ``slug__token`` shaped. */
  apiScenarioId?: string;
};

export const RECENT_SESSIONS: RecentSessionRow[] = [
  {
    sessionId: "published-weekly__7f2a9c1d4e8b",
    kind: "chat",
    scenarioTitle: "Weekly update for leadership",
    score: 87,
    endedAt: "2026-04-15T14:22:00",
  },
  {
    sessionId: "published-weekly__3a91b0e62f44",
    kind: "chat",
    scenarioTitle: "Weekly update for leadership",
    score: 91,
    endedAt: "2026-04-17T16:40:00",
  },
  {
    sessionId: "published-phone-1__c8d2041a9f33",
    kind: "phone",
    scenarioTitle: "Weekly update check-in",
    score: 82,
    endedAt: "2026-04-14T09:05:00",
  },
];

export function reportHref(sessionId: string, kind: SimulationKind): string {
  return `/simulation/${sessionId}/report?kind=${kind}`;
}

/** Weekly average scores for sparkline / summary */
export const PROGRESS_SERIES: { label: string; value: number }[] = [
  { label: "W1", value: 72 },
  { label: "W2", value: 78 },
  { label: "W3", value: 81 },
  { label: "W4", value: 85 },
  { label: "W5", value: 84 },
  { label: "W6", value: 87 },
];

export type Badge = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
};

export const BADGES: Badge[] = [
  {
    id: "streak-3",
    label: "3-day streak",
    description: "Complete at least one scored session three days in a row.",
    earned: true,
  },
  {
    id: "first-video",
    label: "Video ready",
    description: "Finish your first video simulation.",
    earned: true,
  },
  {
    id: "capstone",
    label: "Capstone path",
    description: "Complete all assigned capstone scenarios.",
    earned: false,
  },
];

export type AssignmentStatus = "pending" | "submitted" | "graded";

/** Instructor-assigned work item — always backed by a published simulation scenario. */
export type AssignmentRow = {
  id: string;
  /** Same title as the linked scenario (instructor may customize via API later). */
  title: string;
  cohort: string;
  /** `PUBLISHED_SCENARIOS` id — run this simulation to complete the assignment. */
  scenarioId: string;
  kind: SimulationKind;
  dueAt: string;
  status: AssignmentStatus;
  points: number;
  /** Maximum scored simulation runs allowed for this assignment (instructor-set). */
  maxAttempts: number;
  /** Minimum report score (0–100) treated as meeting the bar after a simulation. */
  minScorePercent: number;
};

export const ASSIGNMENTS: AssignmentRow[] = [
  {
    id: "asg-weekly-transcript",
    title: "Weekly update for leadership",
    cohort: "Behavioral capstone",
    scenarioId: "published-weekly",
    kind: "chat",
    dueAt: "2026-04-24T23:59:59",
    status: "pending",
    points: 10,
    maxAttempts: 5,
    minScorePercent: 75,
  },
  {
    id: "asg-phone-checkin",
    title: "Weekly update check-in",
    cohort: "Communication lab",
    scenarioId: "published-phone-1",
    kind: "phone",
    dueAt: "2026-04-20T23:59:59",
    status: "submitted",
    points: 15,
    maxAttempts: 3,
    minScorePercent: 70,
  },
  {
    id: "asg-video-stakeholder",
    title: "Stakeholder video review",
    cohort: "Executive presence",
    scenarioId: "published-video-1",
    kind: "video",
    dueAt: "2026-04-28T23:59:59",
    status: "pending",
    points: 20,
    maxAttempts: 4,
    minScorePercent: 80,
  },
];

export function assignmentSimulationKindLabel(kind: SimulationKind): string {
  switch (kind) {
    case "chat":
      return "Transcript";
    case "phone":
      return "Phone";
    case "video":
      return "Video";
    default:
      return kind;
  }
}

export function getScenarioById(id: string): PublishedScenario | undefined {
  return PUBLISHED_SCENARIOS.find((s) => s.id === id);
}

export function getAssignmentById(id: string): AssignmentRow | undefined {
  return ASSIGNMENTS.find((a) => a.id === id);
}
