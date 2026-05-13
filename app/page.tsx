import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DemoLeadForm } from "@/app/_components/demo-lead-form";
import demoThumbnail from "@/docs/squinia-demo-thumbnail.png";
import logoFull from "@/app/squinia-logo-full.png";

export const metadata: Metadata = {
  title: "Squinia | AI simulation platform for bootcamp cohorts",
  description:
    "Squinia helps bootcamp teams run realistic AI role-play simulations, capture transcripts, and return rubric-backed coaching for every learner.",
};

const alternatives = [
  {
    title: "Ad-hoc mock interviews",
    body: "Hard to schedule, inconsistent across learners, and difficult to review after the moment passes.",
  },
  {
    title: "Generic AI chatbots",
    body: "Easy to open, but detached from your scenarios, personas, rubrics, and cohort outcomes.",
  },
  {
    title: "Zoom role-play",
    body: "Useful for live practice, but limited by facilitator time and often missing transcript-grounded feedback.",
  },
  {
    title: "Spreadsheets and manual rubrics",
    body: "Good for tracking, but not enough to create repeatable practice or evidence-backed coaching at scale.",
  },
];

const valuePillars = [
  {
    label: "Reusable scenarios",
    body: "Operators can create interview, escalation, and workplace communication scenarios once, then assign them across cohorts.",
  },
  {
    label: "Believable AI personas",
    body: "Learners practice with named personas across chat, phone, and video instead of a generic prompt box.",
  },
  {
    label: "Evidence-backed evaluation",
    body: "Squinia stores transcripts, scores rubric criteria, and returns coaching tied to what the learner actually said.",
  },
];

const workflow = [
  "Build scenarios from real cohort outcomes.",
  "Let learners practice in chat, phone, or video.",
  "Score transcripts against your rubric.",
  "Use the report to coach the next attempt.",
];

function SectionLabel({ children }: { children: string }) {
  return <p className="font-mono text-[10px] uppercase text-[var(--faint)]">{children}</p>;
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative isolate overflow-hidden border-b border-[var(--rule)]">
        <Image
          src={demoThumbnail}
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-center opacity-25"
        />
        <div className="absolute inset-0 -z-10 bg-[rgba(246,247,243,0.86)]" />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-8">
          <Link href="/" className="shrink-0 rounded-lg outline-none sim-transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
            <Image src={logoFull} alt="Squinia" priority className="h-8 w-auto max-w-[116px] sm:h-9 sm:max-w-[152px]" />
          </Link>
          <nav className="flex shrink-0 items-center gap-1 text-[13px] font-medium sm:gap-2">
            <Link href="/login" className="hidden rounded-lg px-2 py-2 text-[var(--muted)] sim-transition hover:bg-[var(--surface)] hover:text-[var(--foreground)] sm:inline-flex sm:px-3">
              Sign in
            </Link>
            <Link href="#demo" className="rounded-lg bg-[var(--foreground)] px-3 py-2 text-white sim-transition hover:bg-[#243126] sm:px-4">
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Book demo</span>
            </Link>
          </nav>
        </header>

        <div className="relative mx-auto flex min-h-[82vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-20 sm:px-8 sm:pb-16">
          <div className="max-w-3xl">
            <SectionLabel>AI simulation platform</SectionLabel>
            <h1 className="mt-4 max-w-[21rem] break-words text-3xl font-semibold leading-tight text-[var(--foreground)] sm:max-w-3xl sm:text-6xl sm:leading-[1.02]">
              AI simulation platform for bootcamp cohorts.
            </h1>
            <p className="mt-6 max-w-[21rem] text-[15px] leading-7 text-[var(--muted)] sm:max-w-2xl sm:text-lg sm:leading-8">
              Squinia helps operators turn high-stakes conversations into repeatable practice: realistic AI personas, chat, phone, and video sessions, transcript capture, rubric scoring, and coaching that points back to learner evidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#demo" className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase">
                Book a demo
              </Link>
              <a
                href="https://www.loom.com/share/70acd7b5b64044af948d4f1b6cf4be90"
                className="rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-6 py-3 font-mono text-[10px] uppercase text-[var(--foreground)] sim-transition hover:bg-[var(--field)]"
              >
                View walkthrough
              </a>
            </div>
          </div>

          <div className="mt-12 grid gap-3 text-[13px] text-[var(--muted)] sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--rule)] bg-[rgba(255,255,255,0.72)] px-4 py-3">Scenario design for operators</div>
            <div className="rounded-lg border border-[var(--rule)] bg-[rgba(255,255,255,0.72)] px-4 py-3">Practice across chat, phone, and video</div>
            <div className="rounded-lg border border-[var(--rule)] bg-[rgba(255,255,255,0.72)] px-4 py-3">Transcript-grounded feedback reports</div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--rule)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionLabel>Competitive alternatives</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">The old workflow was built around scarcity.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
              Bootcamp teams already create practice, feedback, and accountability. Squinia makes the strongest parts repeatable without asking every learner to wait for the same limited facilitator slot.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {alternatives.map((item) => (
              <article key={item.title} className="rounded-lg border border-[var(--rule)] bg-[var(--surface-soft)] p-5">
                <h3 className="font-semibold text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="max-w-2xl">
            <SectionLabel>Unique value</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">Everything centers on the learner performance record.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
              Squinia is not a blank chatbot. It connects scenario design, persona behavior, live practice, transcript persistence, and evidence-backed coaching inside one cohort workflow.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {valuePillars.map((item) => (
              <article key={item.label} className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
                <h3 className="text-lg font-semibold">{item.label}</h3>
                <p className="mt-3 text-[14px] leading-6 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--rule)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--field)] shadow-[var(--shadow-soft)]">
            <Image
              src={demoThumbnail}
              alt="Squinia product walkthrough preview showing the platform interface."
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="h-auto w-full"
              placeholder="blur"
            />
          </div>
          <div>
            <SectionLabel>Cohort workflow</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">From scenario design to a coaching conversation.</h2>
            <ol className="mt-7 space-y-4">
              {workflow.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--rule-strong)] bg-[var(--field)] font-mono text-[11px] text-[var(--muted)]">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-[15px] leading-7 text-[var(--muted)]">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="demo" className="bg-[var(--background)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="lg:pt-8">
            <SectionLabel>Target market</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">Built for operators who need practice to feel real, measurable, and ready for review.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
              The best fit is a bootcamp or training team that already knows which conversations matter, but needs a repeatable way for every learner to rehearse, get scored, and improve before the real interaction.
            </p>
            <div className="mt-7 space-y-3 text-[14px] leading-6 text-[var(--muted)]">
              <p className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-4">Use your own scenarios, rubrics, and personas.</p>
              <p className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-4">Give learners realistic reps without waiting for live reviewer availability.</p>
              <p className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-4">Review transcripts and coaching evidence after each completed session.</p>
            </div>
          </div>
          <DemoLeadForm />
        </div>
      </section>
    </main>
  );
}
