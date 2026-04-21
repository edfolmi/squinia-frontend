"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { AuthFormMessage } from "../_components/auth-form-message";
import { PreviewContinue } from "../_components/preview-continue";
import { authApiConfigured, authCompleteOnboarding } from "../_lib/auth-api";

const STUDENT_GOALS = [
  { id: "exec-updates", label: "Executive updates", desc: "Clear, concise leadership communication." },
  { id: "difficult-news", label: "Difficult conversations", desc: "Tone, empathy, and boundaries." },
  { id: "customer", label: "Customer-facing", desc: "De-escalation and policy-safe language." },
  { id: "interview", label: "Interview presence", desc: "Structure and confidence under questions." },
  { id: "stakeholder", label: "Stakeholder alignment", desc: "Framing tradeoffs and asks." },
] as const;

type Flow = "choose" | "student" | "admin";

export function OnboardingWizard() {
  const router = useRouter();
  const search = useSearchParams();
  const roleHint = search.get("role") === "admin" || search.get("role") === "student" ? (search.get("role") as "admin" | "student") : null;

  const [flow, setFlow] = useState<Flow>(() => (roleHint === "admin" || roleHint === "student" ? roleHint : "choose"));
  const [goals, setGoals] = useState<Set<string>>(() => new Set());
  const [cohortName, setCohortName] = useState("");
  const [cohortDesc, setCohortDesc] = useState("");
  const [weeks, setWeeks] = useState("8");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goalList = useMemo(() => [...STUDENT_GOALS], []);

  function toggleGoal(id: string) {
    setGoals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submitStudent(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (goals.size === 0) {
      setError("Pick at least one goal so we can tailor your scenarios.");
      return;
    }
    setLoading(true);
    try {
      const res = await authCompleteOnboarding({
        role: "student",
        goalIds: [...goals],
      });
      if (res.ok || !authApiConfigured()) {
        router.push("/dashboard");
        return;
      }
      setError(res.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitAdmin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!cohortName.trim()) {
      setError("Give your first cohort a name.");
      return;
    }
    setLoading(true);
    try {
      const res = await authCompleteOnboarding({
        role: "admin",
        cohortName: cohortName.trim(),
        cohortDescription: cohortDesc.trim() || undefined,
      });
      if (res.ok || !authApiConfigured()) {
        router.push("/org/cohorts");
        return;
      }
      setError(res.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <AuthFormMessage error={error} />

      {flow === "choose" ? (
        <div className="space-y-4">
          <p className="text-center text-[14px] text-[var(--muted)]">How will you primarily use Squinia?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFlow("student")}
              className="rounded-2xl border border-[var(--rule-strong)] bg-[var(--field)]/50 px-4 py-5 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface)]"
            >
              <p className="font-semibold text-[#111111]">Learner</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">Practice simulations, get feedback, and track growth.</p>
            </button>
            <button
              type="button"
              onClick={() => setFlow("admin")}
              className="rounded-2xl border border-[var(--rule-strong)] bg-[var(--field)]/50 px-4 py-5 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface)]"
            >
              <p className="font-semibold text-[#111111]">Org admin</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">Run cohorts, publish scenarios, and review analytics.</p>
            </button>
          </div>
        </div>
      ) : null}

      {flow === "student" ? (
        <form onSubmit={submitStudent} className="space-y-6">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Your goals</h2>
            <p className="mt-2 text-[14px] text-[var(--muted)]">Pick what you want to improve — we weight recommendations accordingly.</p>
            <ul className="mt-4 space-y-2">
              {goalList.map((g) => {
                const on = goals.has(g.id);
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => toggleGoal(g.id)}
                      className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left transition-colors ${
                        on
                          ? "border-[#166534]/40 bg-[#e6f4ea]/50 ring-1 ring-[#166534]/25"
                          : "border-[var(--rule)] bg-[var(--surface)] hover:border-[var(--rule-strong)]"
                      }`}
                    >
                      <span className="font-medium text-[#111111]">{g.label}</span>
                      <span className="mt-0.5 text-[12px] text-[var(--muted)]">{g.desc}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setFlow("choose")} className="rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[13px] font-medium text-[var(--muted)] hover:bg-[var(--field)]">
              Back
            </button>
            <button type="submit" disabled={loading} className="sim-btn-accent px-6 py-2.5 font-mono text-[10px] uppercase disabled:opacity-50">
              {loading ? "Saving…" : "Finish & go to dashboard"}
            </button>
          </div>
        </form>
      ) : null}

      {flow === "admin" ? (
        <form onSubmit={submitAdmin} className="space-y-5">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">First cohort</h2>
            <p className="mt-2 text-[14px] text-[var(--muted)]">Create the shell you will invite learners into. You can edit details later in the org dashboard.</p>
          </div>
          <div>
            <label htmlFor="cname" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Cohort name
            </label>
            <input
              id="cname"
              required
              value={cohortName}
              onChange={(e) => setCohortName(e.target.value)}
              placeholder="e.g. Spring 26 · Leadership lab"
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div>
            <label htmlFor="cdesc" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Description
            </label>
            <textarea
              id="cdesc"
              rows={3}
              value={cohortDesc}
              onChange={(e) => setCohortDesc(e.target.value)}
              className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div>
            <label htmlFor="weeks" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Program length (weeks)
            </label>
            <input
              id="weeks"
              type="number"
              min={1}
              max={52}
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              className="w-full max-w-xs rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 font-mono text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setFlow("choose")} className="rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[13px] font-medium text-[var(--muted)] hover:bg-[var(--field)]">
              Back
            </button>
            <button type="submit" disabled={loading} className="sim-btn-accent px-6 py-2.5 font-mono text-[10px] uppercase disabled:opacity-50">
              {loading ? "Saving…" : "Finish & open cohorts"}
            </button>
          </div>
        </form>
      ) : null}

      <PreviewContinue href="/dashboard" label="Preview: skip to learner dashboard" />
      <p className="text-center text-[12px] text-[var(--faint)]">
        Need a different account?{" "}
        <Link href="/login" className="font-medium text-[var(--muted)] underline underline-offset-2 hover:text-[#111111]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
