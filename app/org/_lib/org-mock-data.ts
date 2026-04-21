/** Operator / bootcamp preview data — replace with API + RBAC. */

export type OrgSimulationKind = "chat" | "phone" | "video";

export type OrgDifficulty = "Beginner" | "Medium" | "Advanced";

export type OrgRubricItem = {
  id: string;
  label: string;
  description: string;
  /** Relative weight (arbitrary scale; UI shows % of sum). */
  weight: number;
  order: number;
};

export type OrgScenario = {
  id: string;
  title: string;
  summary: string;
  role: string;
  difficulty: OrgDifficulty;
  kind: OrgSimulationKind;
  estMinutes: number;
  configNotes: string;
  rubric: OrgRubricItem[];
  published: boolean;
  updatedAt: string;
};

export type OrgCohort = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  programWeeks: number;
};

export type OrgMember = {
  id: string;
  cohortId: string;
  name: string;
  email: string;
  invitedAt: string;
  status: "active" | "pending";
};

export type OrgSkillDimension = "clarity" | "structure" | "tone" | "policy" | "presence";

export const SKILL_LABELS: Record<OrgSkillDimension, string> = {
  clarity: "Clarity",
  structure: "Structure",
  tone: "Tone",
  policy: "Policy",
  presence: "Presence",
};

export type OrgSkillProfile = Record<OrgSkillDimension, number>;

export type OrgStudentProgress = {
  memberId: string;
  scenarioId: string;
  scenarioTitle: string;
  attempts: number;
  bestScore: number | null;
  completed: boolean;
};

export type OrgAssignment = {
  id: string;
  title: string;
  cohortId: string;
  scenarioId: string;
  dueAt: string;
  createdAt: string;
};

export type OrgSubmission = {
  id: string;
  assignmentId: string;
  memberId: string;
  submittedAt: string;
  reportScore: number | null;
  notes: string;
  gradeManual: number | null;
  status: "pending" | "graded";
};

export const ORG_COHORTS: OrgCohort[] = [
  {
    id: "cohort-spring-26",
    name: "Spring 26 · Leadership lab",
    description: "Mid-level ICs moving into staff+ communication expectations.",
    createdAt: "2026-01-08T10:00:00",
    programWeeks: 8,
  },
  {
    id: "cohort-winter-ops",
    name: "Winter · Ops resilience",
    description: "Support and ops leads practicing escalation and executive updates.",
    createdAt: "2025-11-20T14:30:00",
    programWeeks: 6,
  },
];

export const ORG_MEMBERS: OrgMember[] = [
  {
    id: "mem-ada",
    cohortId: "cohort-spring-26",
    name: "Ada Okonkwo",
    email: "ada.okonkwo@example.com",
    invitedAt: "2026-01-09T12:00:00",
    status: "active",
  },
  {
    id: "mem-ben",
    cohortId: "cohort-spring-26",
    name: "Ben Carter",
    email: "ben.carter@example.com",
    invitedAt: "2026-01-10T09:15:00",
    status: "active",
  },
  {
    id: "mem-chi",
    cohortId: "cohort-spring-26",
    name: "Chi Nguyen",
    email: "chi.nguyen@example.com",
    invitedAt: "2026-01-11T16:40:00",
    status: "pending",
  },
  {
    id: "mem-dana",
    cohortId: "cohort-winter-ops",
    name: "Dana Singh",
    email: "dana.singh@example.com",
    invitedAt: "2025-11-21T11:00:00",
    status: "active",
  },
];

export const ORG_MEMBER_SKILLS: Record<string, OrgSkillProfile> = {
  "mem-ada": { clarity: 82, structure: 76, tone: 88, policy: 71, presence: 79 },
  "mem-ben": { clarity: 74, structure: 81, tone: 72, policy: 68, presence: 85 },
  "mem-chi": { clarity: 0, structure: 0, tone: 0, policy: 0, presence: 0 },
  "mem-dana": { clarity: 79, structure: 84, tone: 80, policy: 90, presence: 77 },
};

export const ORG_SKILL_TARGETS: OrgSkillProfile = {
  clarity: 85,
  structure: 85,
  tone: 82,
  policy: 80,
  presence: 83,
};

export const ORG_PROGRESS: OrgStudentProgress[] = [
  {
    memberId: "mem-ada",
    scenarioId: "org-scn-weekly",
    scenarioTitle: "Weekly exec update",
    attempts: 3,
    bestScore: 91,
    completed: true,
  },
  {
    memberId: "mem-ada",
    scenarioId: "org-scn-escalation",
    scenarioTitle: "Customer escalation",
    attempts: 1,
    bestScore: 76,
    completed: true,
  },
  {
    memberId: "mem-ben",
    scenarioId: "org-scn-weekly",
    scenarioTitle: "Weekly exec update",
    attempts: 2,
    bestScore: 84,
    completed: true,
  },
  {
    memberId: "mem-ben",
    scenarioId: "org-scn-escalation",
    scenarioTitle: "Customer escalation",
    attempts: 0,
    bestScore: null,
    completed: false,
  },
  {
    memberId: "mem-chi",
    scenarioId: "org-scn-weekly",
    scenarioTitle: "Weekly exec update",
    attempts: 0,
    bestScore: null,
    completed: false,
  },
  {
    memberId: "mem-dana",
    scenarioId: "org-scn-phone",
    scenarioTitle: "Stakeholder phone check-in",
    attempts: 4,
    bestScore: 88,
    completed: true,
  },
];

function defaultRubric(): OrgRubricItem[] {
  return [
    {
      id: "r1",
      label: "Objective framing",
      description: "States goal and context in the first beats.",
      weight: 25,
      order: 0,
    },
    {
      id: "r2",
      label: "Evidence use",
      description: "Cites concrete signals; avoids hand-waving.",
      weight: 25,
      order: 1,
    },
    {
      id: "r3",
      label: "Executive tone",
      description: "Calm, concise, appropriate register.",
      weight: 25,
      order: 2,
    },
    {
      id: "r4",
      label: "Next steps",
      description: "Clear asks, owners, and timelines.",
      weight: 25,
      order: 3,
    },
  ];
}

export const ORG_SCENARIOS: OrgScenario[] = [
  {
    id: "org-scn-weekly",
    title: "Weekly exec update",
    summary: "Structured written update to a skeptical senior leader.",
    role: "Engineering lead",
    difficulty: "Medium",
    kind: "chat",
    estMinutes: 12,
    configNotes: "Timebox: 12 min. Allow one follow-up question from the AI exec.",
    rubric: defaultRubric(),
    published: true,
    updatedAt: "2026-04-01T08:00:00",
  },
  {
    id: "org-scn-escalation",
    title: "Customer escalation",
    summary: "Written thread: policy boundaries and de-escalation.",
    role: "Support engineer",
    difficulty: "Beginner",
    kind: "chat",
    estMinutes: 10,
    configNotes: "Emphasize policy citations; discourage over-promising.",
    rubric: defaultRubric().map((r, i) => ({
      ...r,
      id: `esc-${r.id}`,
      order: i,
      weight: i === 0 ? 30 : i === 3 ? 20 : 25,
    })),
    published: true,
    updatedAt: "2026-03-18T10:20:00",
  },
  {
    id: "org-scn-phone",
    title: "Stakeholder phone check-in",
    summary: "Voice room: brevity, tone, and follow-through.",
    role: "Ops lead",
    difficulty: "Medium",
    kind: "phone",
    estMinutes: 8,
    configNotes: "Noise gate on; max 2 hold prompts.",
    rubric: defaultRubric(),
    published: false,
    updatedAt: "2026-04-10T15:00:00",
  },
];

export const ORG_ASSIGNMENTS: OrgAssignment[] = [
  {
    id: "org-asg-1",
    title: "Weekly exec update · cohort submission",
    cohortId: "cohort-spring-26",
    scenarioId: "org-scn-weekly",
    dueAt: "2026-04-25T23:59:59",
    createdAt: "2026-04-12T09:00:00",
  },
];

export const ORG_SUBMISSIONS: OrgSubmission[] = [
  {
    id: "org-sub-1",
    assignmentId: "org-asg-1",
    memberId: "mem-ada",
    submittedAt: "2026-04-14T18:22:00",
    reportScore: 91,
    notes: "Strong structure; tighten ask in closing.",
    gradeManual: null,
    status: "pending",
  },
  {
    id: "org-sub-2",
    assignmentId: "org-asg-1",
    memberId: "mem-ben",
    submittedAt: "2026-04-15T11:05:00",
    reportScore: 84,
    notes: "",
    gradeManual: 86,
    status: "graded",
  },
];

export function getCohortById(id: string): OrgCohort | undefined {
  return ORG_COHORTS.find((c) => c.id === id);
}

export function getMembersForCohort(cohortId: string): OrgMember[] {
  return ORG_MEMBERS.filter((m) => m.cohortId === cohortId);
}

export function getProgressForCohort(cohortId: string): OrgStudentProgress[] {
  const memberIds = new Set(getMembersForCohort(cohortId).map((m) => m.id));
  return ORG_PROGRESS.filter((p) => memberIds.has(p.memberId));
}

export function getScenarioById(id: string): OrgScenario | undefined {
  return ORG_SCENARIOS.find((s) => s.id === id);
}

export function getAssignmentById(id: string): OrgAssignment | undefined {
  return ORG_ASSIGNMENTS.find((a) => a.id === id);
}

export function getSubmissionsForAssignment(assignmentId: string): OrgSubmission[] {
  return ORG_SUBMISSIONS.filter((s) => s.assignmentId === assignmentId);
}

export function getMemberById(id: string): OrgMember | undefined {
  return ORG_MEMBERS.find((m) => m.id === id);
}

export function cohortAverageScore(cohortId: string): number | null {
  const memberIds = getMembersForCohort(cohortId).map((m) => m.id);
  const scores = ORG_PROGRESS.filter((p) => memberIds.includes(p.memberId) && p.bestScore != null).map(
    (p) => p.bestScore as number,
  );
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function cohortCompletionRate(cohortId: string): number {
  const progress = getProgressForCohort(cohortId);
  if (progress.length === 0) return 0;
  const done = progress.filter((p) => p.completed).length;
  return Math.round((done / progress.length) * 100);
}

export function averageSkillProfileForCohort(cohortId: string): OrgSkillProfile | null {
  const members = getMembersForCohort(cohortId).filter((m) => m.status === "active");
  const dims = Object.keys(SKILL_LABELS) as OrgSkillDimension[];
  if (members.length === 0) return null;
  const out: Partial<OrgSkillProfile> = {};
  for (const d of dims) {
    let sum = 0;
    let n = 0;
    for (const m of members) {
      const s = ORG_MEMBER_SKILLS[m.id]?.[d] ?? 0;
      if (s > 0) {
        sum += s;
        n += 1;
      }
    }
    out[d] = n ? Math.round(sum / n) : 0;
  }
  return out as OrgSkillProfile;
}

export function skillGapForCohort(cohortId: string): OrgSkillProfile | null {
  const avg = averageSkillProfileForCohort(cohortId);
  if (!avg) return null;
  const dims = Object.keys(SKILL_LABELS) as OrgSkillDimension[];
  const out: Partial<OrgSkillProfile> = {};
  for (const d of dims) {
    out[d] = Math.max(0, ORG_SKILL_TARGETS[d] - (avg[d] ?? 0));
  }
  return out as OrgSkillProfile;
}
