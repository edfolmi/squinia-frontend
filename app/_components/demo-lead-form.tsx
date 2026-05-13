"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { getApiBase } from "@/app/(auth)/_lib/auth-config";
import { parseApiJson } from "@/app/_lib/api-envelope";

type LearnerCountRange = "1-25" | "26-100" | "101-500" | "500+";
type PrimaryUseCase = "interview_practice" | "workplace_communication" | "escalation_training" | "custom";

type DemoLeadFormData = {
  fullName: string;
  workEmail: string;
  organizationName: string;
  roleTitle: string;
  learnerCountRange: LearnerCountRange;
  primaryUseCase: PrimaryUseCase;
  message: string;
};

type DemoLeadResponse = {
  id: string;
  status: string;
  created_at: string;
};

const learnerRanges: Array<{ value: LearnerCountRange; label: string }> = [
  { value: "1-25", label: "1-25 learners" },
  { value: "26-100", label: "26-100 learners" },
  { value: "101-500", label: "101-500 learners" },
  { value: "500+", label: "500+ learners" },
];

const useCases: Array<{ value: PrimaryUseCase; label: string }> = [
  { value: "interview_practice", label: "Interview practice" },
  { value: "workplace_communication", label: "Workplace communication" },
  { value: "escalation_training", label: "Escalation training" },
  { value: "custom", label: "Custom cohort scenarios" },
];

const initialForm: DemoLeadFormData = {
  fullName: "",
  workEmail: "",
  organizationName: "",
  roleTitle: "",
  learnerCountRange: "26-100",
  primaryUseCase: "interview_practice",
  message: "",
};

function inputClassName(extra = ""): string {
  return [
    "w-full rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[var(--foreground)] outline-none",
    "sim-transition placeholder:text-[var(--faint)] focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-ring)]",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function collectMetadata(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  return {
    referrer: document.referrer,
    landing_path: `${window.location.pathname}${window.location.search}`,
    utm,
  };
}

export function DemoLeadForm() {
  const [form, setForm] = useState<DemoLeadFormData>(initialForm);
  const [state, setState] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof DemoLeadFormData>(field: K, value: DemoLeadFormData[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting" || state === "success") return;
    setError(null);
    setState("submitting");

    const base = getApiBase();
    if (!base) {
      setError("Squinia services are not configured for this environment.");
      setState("idle");
      return;
    }

    let url: string;
    try {
      url = new URL("api/v1/demo-leads", `${base.replace(/\/+$/, "")}/`).href;
    } catch {
      setError("Squinia services are not configured for this environment.");
      setState("idle");
      return;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: form.fullName,
          work_email: form.workEmail,
          organization_name: form.organizationName,
          role_title: form.roleTitle,
          learner_count_range: form.learnerCountRange,
          primary_use_case: form.primaryUseCase,
          message: form.message,
          metadata: collectMetadata(),
        }),
      });
      const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const result = parseApiJson<DemoLeadResponse>(response, raw);
      if (!result.ok) {
        setError(result.message || "We could not send the request. Please try again.");
        setState("idle");
        return;
      }
      setState("success");
    } catch {
      setError("We could not reach Squinia services. Please check your connection and try again.");
      setState("idle");
    }
  }

  const locked = state === "submitting" || state === "success";

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase text-[var(--faint)]">Book a demo</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">See Squinia with your cohort workflow.</h2>
        <p className="mt-2 text-[14px] leading-6 text-[var(--muted)]">
          Share the shape of your program and we will tailor the walkthrough around your learners, scenarios, and review process.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="demo-full-name" className="mb-2 block font-mono text-[10px] uppercase text-[var(--faint)]">
            Full name
          </label>
          <input
            id="demo-full-name"
            autoComplete="name"
            required
            minLength={2}
            disabled={locked}
            value={form.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            className={inputClassName()}
          />
        </div>
        <div>
          <label htmlFor="demo-email" className="mb-2 block font-mono text-[10px] uppercase text-[var(--faint)]">
            Work email
          </label>
          <input
            id="demo-email"
            type="email"
            autoComplete="email"
            required
            disabled={locked}
            value={form.workEmail}
            onChange={(event) => setField("workEmail", event.target.value)}
            className={inputClassName()}
          />
        </div>
        <div>
          <label htmlFor="demo-organization" className="mb-2 block font-mono text-[10px] uppercase text-[var(--faint)]">
            Organization
          </label>
          <input
            id="demo-organization"
            autoComplete="organization"
            required
            minLength={2}
            disabled={locked}
            value={form.organizationName}
            onChange={(event) => setField("organizationName", event.target.value)}
            className={inputClassName()}
          />
        </div>
        <div>
          <label htmlFor="demo-role" className="mb-2 block font-mono text-[10px] uppercase text-[var(--faint)]">
            Role
          </label>
          <input
            id="demo-role"
            autoComplete="organization-title"
            required
            minLength={2}
            disabled={locked}
            value={form.roleTitle}
            onChange={(event) => setField("roleTitle", event.target.value)}
            className={inputClassName()}
          />
        </div>
        <div>
          <label htmlFor="demo-learner-count" className="mb-2 block font-mono text-[10px] uppercase text-[var(--faint)]">
            Learners per cohort
          </label>
          <select
            id="demo-learner-count"
            required
            disabled={locked}
            value={form.learnerCountRange}
            onChange={(event) => setField("learnerCountRange", event.target.value as LearnerCountRange)}
            className={inputClassName()}
          >
            {learnerRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="demo-use-case" className="mb-2 block font-mono text-[10px] uppercase text-[var(--faint)]">
            Primary use case
          </label>
          <select
            id="demo-use-case"
            required
            disabled={locked}
            value={form.primaryUseCase}
            onChange={(event) => setField("primaryUseCase", event.target.value as PrimaryUseCase)}
            className={inputClassName()}
          >
            {useCases.map((useCase) => (
              <option key={useCase.value} value={useCase.value}>
                {useCase.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="demo-message" className="mb-2 block font-mono text-[10px] uppercase text-[var(--faint)]">
          What should the demo cover?
        </label>
        <textarea
          id="demo-message"
          required
          maxLength={2000}
          disabled={locked}
          value={form.message}
          onChange={(event) => setField("message", event.target.value)}
          className={inputClassName("min-h-32 resize-y leading-6")}
          placeholder="Example: We run 80-person software engineering cohorts and need structured interview practice with rubric-backed feedback."
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-[var(--danger-soft)] px-4 py-3 text-[13px] leading-5 text-[var(--danger-strong)]" role="alert">
          {error}
        </p>
      ) : null}

      {state === "success" ? (
        <p className="mt-4 rounded-lg border border-[#b8e8c4] bg-[var(--accent-soft)] px-4 py-3 text-[13px] leading-5 text-[#166534]" role="status">
          Request received. We have saved your demo interest and will use these details to shape the walkthrough.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={locked}
        className="sim-btn-accent mt-5 w-full px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-55"
      >
        {state === "submitting" ? "Sending..." : state === "success" ? "Request sent" : "Book a demo"}
      </button>
    </form>
  );
}
