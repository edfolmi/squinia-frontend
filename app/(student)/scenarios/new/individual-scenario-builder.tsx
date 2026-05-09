"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { StatusBanner } from "@/app/_components/status-block";
import { agentRoleLabel } from "@/app/_lib/simulation-mappers";
import { v1 } from "@/app/_lib/v1-client";

type MeData = {
  default_tenant_id: string | null;
  memberships: { tenant_id?: string; account_kind?: string }[];
};

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type SimulationKind = "chat" | "phone" | "video";
type AgentRole = "TECHNICAL_INTERVIEWER" | "HR_RECRUITER" | "PRODUCT_MANAGER" | "PEER_DEVELOPER" | "CLIENT_STAKEHOLDER";

type PersonaDraft = {
  name: string;
  title?: string | null;
  personality?: string | null;
  communication_style?: string | null;
  background?: string | null;
};

type IndividualScenarioDraft = {
  title: string;
  description?: string | null;
  difficulty: Difficulty;
  simulation_kind: SimulationKind;
  estimated_minutes: number;
  agent_role: AgentRole;
  persona: PersonaDraft;
  skills_evaluated: string[];
  pressure_level: string;
  evaluation_focus: string[];
  opening_message?: string | null;
};

type DraftResult = { draft: IndividualScenarioDraft };
type CreateResult = { scenario: { id: string } };

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Medium" },
  { value: "ADVANCED", label: "Advanced" },
];

const kindOptions: { value: SimulationKind; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "phone", label: "Phone" },
  { value: "video", label: "Video" },
];

function activeAccountKind(me: MeData): string | undefined {
  const active = me.memberships.find((m) => m.tenant_id === me.default_tenant_id) ?? me.memberships[0];
  return active?.account_kind;
}

function skillLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function IndividualScenarioBuilder() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<IndividualScenarioDraft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const res = await v1.get<MeData>("auth/me");
      if (!alive) return;
      if (!res.ok || activeAccountKind(res.data) !== "individual") {
        setAllowed(false);
        return;
      }
      setAllowed(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const updateDraft = useCallback((patch: Partial<IndividualScenarioDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }, []);

  async function onDraft() {
    setError(null);
    setNotice(null);
    const cleaned = prompt.trim();
    if (cleaned.length < 10) {
      setError("Describe what you want to practice in at least 10 characters.");
      return;
    }
    setDrafting(true);
    try {
      const res = await v1.post<DraftResult>("me/scenarios/draft-with-ai", { prompt: cleaned });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setDraft(res.data.draft);
      setNotice("Draft ready. Review the simple fields, then create your practice.");
    } finally {
      setDrafting(false);
    }
  }

  async function onCreate() {
    if (!draft) return;
    setError(null);
    setNotice(null);
    setCreating(true);
    try {
      const res = await v1.post<CreateResult>("me/scenarios", draft);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push("/scenarios");
    } finally {
      setCreating(false);
    }
  }

  if (allowed === null) {
    return (
      <div className="mx-auto max-w-4xl text-[14px] text-[var(--muted)]">
        Checking learner workspace...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <StatusBanner message="AI practice creation is only available in your individual learner workspace." />
        <Link href="/scenarios" className="sim-btn-accent inline-flex px-5 py-3 font-mono text-[10px] uppercase">
          Back to scenarios
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">Individual practice builder</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Create practice with AI</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
            Describe the interview, role, job description, or conversation you want to rehearse. Squinia will turn it into a focused practice room.
          </p>
        </div>
        <Link href="/scenarios" className="rounded-lg border border-[var(--rule-strong)] px-4 py-2.5 text-[13px] font-semibold text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]">
          Back to scenarios
        </Link>
      </div>

      {error ? <StatusBanner message={error} /> : null}
      {notice ? <p className="rounded-lg border border-[#b8e8c4] bg-[#f1fbf3] px-4 py-3 text-[14px] text-[#1f6f3a]">{notice}</p> : null}

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <label htmlFor="practicePrompt" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          What do you want to practice?
        </label>
        <textarea
          id="practicePrompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder="Paste a job description or write something like: I want to practice a difficult stakeholder escalation call as a backend engineer at a fintech startup."
          className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
        <button
          type="button"
          onClick={onDraft}
          disabled={drafting}
          className="sim-btn-accent mt-4 px-5 py-3 font-mono text-[10px] uppercase disabled:opacity-50"
        >
          {drafting ? "Drafting..." : draft ? "Regenerate preview" : "Generate preview"}
        </button>
      </section>

      {draft ? (
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--faint)]">AI preview</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#111111]">Review your practice room</h2>
            </div>
            <span className="rounded-full border border-[var(--rule)] bg-[var(--field)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
              {draft.pressure_level}
            </span>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="scenarioTitle" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                Title
              </label>
              <input
                id="scenarioTitle"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="scenarioDescription" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                Context
              </label>
              <textarea
                id="scenarioDescription"
                rows={5}
                value={draft.description ?? ""}
                onChange={(e) => updateDraft({ description: e.target.value })}
                className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
              />
            </div>
            <div>
              <label htmlFor="scenarioDifficulty" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                Difficulty
              </label>
              <select
                id="scenarioDifficulty"
                value={draft.difficulty}
                onChange={(e) => updateDraft({ difficulty: e.target.value as Difficulty })}
                className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="scenarioKind" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                Format
              </label>
              <select
                id="scenarioKind"
                value={draft.simulation_kind}
                onChange={(e) => updateDraft({ simulation_kind: e.target.value as SimulationKind })}
                className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
              >
                {kindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="scenarioMinutes" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                Duration
              </label>
              <input
                id="scenarioMinutes"
                type="number"
                min={1}
                max={120}
                value={draft.estimated_minutes}
                onChange={(e) => updateDraft({ estimated_minutes: Number(e.target.value) || 20 })}
                className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
              />
            </div>
            <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/45 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">Coach-selected role</p>
              <p className="mt-2 text-[14px] font-semibold text-[#111111]">{agentRoleLabel(draft.agent_role)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <ReadOnlyPanel title="Persona" lines={[draft.persona.name, draft.persona.title ?? "", draft.persona.communication_style ?? ""]} />
            <ReadOnlyPanel title="Skills evaluated" lines={draft.skills_evaluated.map(skillLabel)} />
            <ReadOnlyPanel title="Evaluation focus" lines={draft.evaluation_focus} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCreate}
              disabled={creating || !draft.title.trim()}
              className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create practice"}
            </button>
            <p className="text-[13px] text-[var(--muted)]">You can start the scenario from your scenario list after it is created.</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ReadOnlyPanel({ title, lines }: { title: string; lines: string[] }) {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  return (
    <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/45 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">{title}</p>
      {clean.length ? (
        <ul className="mt-3 space-y-2">
          {clean.map((line) => (
            <li key={line} className="text-[13px] leading-5 text-[var(--muted)]">
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-[var(--muted)]">Squinia will use platform defaults.</p>
      )}
    </div>
  );
}
