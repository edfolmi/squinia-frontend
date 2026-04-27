import Link from "next/link";

import { AgentPersonaForm } from "../../_components/agent-persona-form";

export default function NewPersonaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/org/personas"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Personas
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Create persona</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Define the person learners will meet in calls, video rooms, and chat.
        </p>
      </div>
      <AgentPersonaForm mode="new" />
    </div>
  );
}
