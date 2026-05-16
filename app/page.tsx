import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DemoLeadForm } from "@/app/_components/demo-lead-form";
import nadiaPersona from "@/app/_assets/nadia-chen-persona.png";
import squaBirdCard from "@/app/_assets/squa-bird-card-fly.png";
import logoFull from "@/app/squinia-logo-full.png";

export const metadata: Metadata = {
  title: "Squinia | AI simulation platform for bootcamp cohorts",
  description:
    "Squinia helps bootcamp teams run realistic AI role-play simulations, capture transcripts, and return rubric-backed coaching for every learner.",
};

const defaultWalkthroughEmbedUrl = "https://www.loom.com/embed/1e2c5d0fbc534a2baaf815a131b548b8";
const walkthroughEmbedUrl = videoEmbedSrc(process.env.NEXT_PUBLIC_SQUINIA_WALKTHROUGH_EMBED_URL) ?? defaultWalkthroughEmbedUrl;

const alternatives = [
  {
    title: "Ad-hoc mock interviews",
    body: "Facilitator time disappears fast, and two learners can have completely different practice quality.",
    icon: "branch",
  },
  {
    title: "Generic AI chatbots",
    body: "The chat is available, but it is detached from your personas, rubrics, and cohort outcomes.",
    icon: "spark",
  },
  {
    title: "Zoom role-play",
    body: "Useful for live rehearsal, but hard to repeat, score, and turn into a reviewable learning record.",
    icon: "signal",
  },
  {
    title: "Manual score sheets",
    body: "Good for notes after the fact, but not enough to create realistic reps or transcript-grounded coaching.",
    icon: "leaf",
  },
];

const valuePillars = [
  {
    label: "Perform",
    title: "AI personas across modes",
    body: "Learners practice with named personas in chat, phone, or video, with the interaction shaped by the scenario.",
    visual: "persona",
    tone:
      "border-[#b6dfdd] bg-[linear-gradient(180deg,#dff8f5_0%,#bdecea_60%,#a8ddda_100%)] text-[#0d1818]",
  },
  {
    label: "Create",
    title: "Reusable scenarios",
    body: "Operators build interview, escalation, and workplace communication scenarios once, then assign them across cohorts.",
    visual: "scenario",
    tone:
      "border-[#eadfa6] bg-[linear-gradient(180deg,#fff8d8_0%,#fff1b8_58%,#f7e8a6_100%)] text-[#16130c]",
  },
  {
    label: "Improve",
    title: "Evidence-backed coaching",
    body: "Transcripts are scored against rubrics, then turned into specific feedback tied to what the learner said.",
    visual: "evidence",
    tone:
      "border-[#b9e4bf] bg-[linear-gradient(180deg,#e0f8df_0%,#c6efca_60%,#b5e6bf_100%)] text-[#0f180f]",
  },
];

const workflow = [
  "Build scenarios from real cohort outcomes.",
  "Let learners practice in chat, phone, or video.",
  "Score transcripts against your rubric.",
  "Use the report to coach the next attempt.",
];

function videoEmbedSrc(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host === "loom.com" && url.pathname.startsWith("/embed/")) {
      return url.href;
    }
    if ((host === "youtube.com" || host === "youtube-nocookie.com") && url.pathname.startsWith("/embed/")) {
      return url.href;
    }
    if (host === "youtube.com" && url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\/+/, "");
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function SectionLabel({ children }: { children: string }) {
  return <p className="font-mono text-[10px] uppercase text-[var(--faint)]">{children}</p>;
}

function LeafIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M19.7 4.3C12.5 4.5 7 8.7 5.3 15.6c3.9.5 9.8-1.2 12.7-5.3 1.1-1.6 1.7-3.5 1.7-6Z"
        fill="currentColor"
      />
      <path d="M4.5 19.2c2.6-4.9 6.1-7.8 11.1-9.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function NadiaPersonaAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        "relative mx-auto overflow-hidden rounded-full border border-[#b8e8c4] bg-[#eaf7ee] shadow-[0_12px_28px_-20px_rgba(17,21,17,0.55)]",
        compact ? "h-16 w-16" : "h-20 w-20",
      ].join(" ")}
    >
      <Image
        src={nadiaPersona}
        alt="Nadia Chen, senior PM persona"
        fill
        sizes={compact ? "4rem" : "5rem"}
        className="object-cover object-center"
        placeholder="blur"
      />
    </div>
  );
}

function FeatureIcon({ type }: { type: string }) {
  if (type === "signal") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M4 16.5h3.2v3H4v-3ZM10.4 11h3.2v8.5h-3.2V11ZM16.8 5h3.2v14.5h-3.2V5Z" fill="currentColor" />
      </svg>
    );
  }
  if (type === "spark") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M12 3.5 14.2 9l5.6 2.1-5.6 2.1L12 18.7l-2.2-5.5-5.6-2.1L9.8 9 12 3.5Z" fill="currentColor" />
      </svg>
    );
  }
  if (type === "branch") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M6 19c5.9-3.5 9.6-8 11.2-14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9.6 15.4C8 12.6 7 10.2 6.8 8.1c2.6.5 4.4 2 5.4 4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13.7 10.2c.2-2.6 1.4-4.6 3.5-6 1.2 2.3 1.2 4.5.1 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return <LeafIcon className="h-5 w-5" />;
}

function NatureField() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <svg className="absolute left-0 top-0 h-full w-full opacity-[0.28]" viewBox="0 0 1400 900" preserveAspectRatio="none">
        <path d="M-50 790C210 670 330 710 520 585c165-108 241-267 467-300 161-23 287 33 463-49" stroke="#32a852" strokeWidth="1" fill="none" />
        <path d="M-60 700C165 620 330 640 483 515c173-141 279-251 498-245 151 4 276 72 487-28" stroke="#175cd3" strokeWidth="1" fill="none" />
        <path d="M-70 610C165 565 292 560 476 430c176-124 306-214 505-188 150 20 281 86 489 11" stroke="#d7a529" strokeWidth="1" fill="none" />
      </svg>
      <LeafIcon className="home-leaf absolute left-[9%] top-[18%] h-7 w-7 text-[var(--accent)] opacity-55" />
      <LeafIcon className="home-leaf home-leaf-delay absolute right-[14%] top-[34%] h-6 w-6 text-[#175cd3] opacity-35" />
      <LeafIcon className="home-leaf home-leaf-slow absolute bottom-[18%] left-[39%] h-5 w-5 text-[#d7a529] opacity-40" />
    </div>
  );
}

function ModeSignal({ label, tone, className = "" }: { label: string; tone: string; className?: string }) {
  return (
    <div
      className={[
        "home-value-mode absolute flex items-center gap-2 rounded-full border border-white/70 bg-white/74 px-3 py-2 text-[11px] font-semibold shadow-[0_16px_36px_-28px_rgba(17,21,17,0.55)] backdrop-blur",
        className,
      ].join(" ")}
    >
      <span className={["h-2.5 w-2.5 rounded-full", tone].join(" ")} />
      {label}
    </div>
  );
}

function ValuePillarVisual({ type }: { type: string }) {
  if (type === "scenario") {
    return (
      <div className="relative h-[15.5rem] overflow-hidden rounded-lg border border-white/72 bg-[rgba(255,255,255,0.48)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <svg className="absolute inset-0 h-full w-full text-[#cf9b25]/45" viewBox="0 0 380 250" preserveAspectRatio="none" aria-hidden>
          <path className="home-value-trail" d="M47 204C99 143 135 178 180 113c34-48 82-60 146-52" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path className="home-value-trail home-value-trail-delay" d="M20 118c64 14 96-18 137-48 50-36 90-34 154-17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="relative flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase text-[#7a661b]">Scenario library</p>
          <span className="rounded-full bg-white/78 px-3 py-1 font-mono text-[8px] uppercase text-[#7a661b]">Ready</span>
        </div>
        <div className="relative mt-8 grid gap-3">
          {["Interview loop", "Escalation call", "Workplace update"].map((item, index) => (
            <div
              key={item}
              className="home-value-scenario-row flex items-center gap-3 rounded-lg border border-white/72 bg-white/76 p-3 shadow-[0_14px_32px_-28px_rgba(74,57,10,0.72)]"
              style={{ animationDelay: `${index * 0.22}s` }}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f7d75e]/40 text-[#8a6b09]">
                <LeafIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{item}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#efe4aa]">
                  <span className="home-value-progress block h-full rounded-full bg-[#32a852]" style={{ width: `${68 + index * 8}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "persona") {
    return (
      <div className="relative h-[15.5rem] overflow-hidden rounded-lg border border-white/72 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.9),rgba(255,255,255,0.26)_50%,rgba(255,255,255,0.08)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        <div className="absolute left-1/2 top-10 h-36 w-36 -translate-x-1/2 rounded-full border border-white/80 bg-white/24" />
        <div className="absolute left-1/2 top-[4.3rem] h-24 w-24 -translate-x-1/2 rounded-full border border-white/80 bg-white/34" />
        <div className="relative mx-auto mt-8 max-w-[12rem]">
          <NadiaPersonaAvatar />
          <p className="mt-3 text-center text-[13px] font-semibold">Nadia Chen</p>
          <p className="text-center text-[11px] text-[#3d5f60]">Senior PM persona</p>
        </div>
        <ModeSignal label="Chat" tone="bg-[#32a852]" className="left-5 top-7" />
        <ModeSignal label="Phone" tone="bg-[#d7a529]" className="right-5 top-12" />
        <ModeSignal label="Video" tone="bg-[#175cd3]" className="bottom-6 left-1/2 -translate-x-1/2" />
      </div>
    );
  }

  return (
    <div className="relative h-[15.5rem] overflow-hidden rounded-lg border border-white/72 bg-[rgba(255,255,255,0.48)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase text-[#21692f]">Evidence report</p>
          <p className="mt-2 text-[26px] font-semibold leading-none text-[#111511]">84</p>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white/78 text-[12px] font-semibold text-[#21692f] shadow-[0_14px_32px_-26px_rgba(17,21,17,0.5)]">
          Score
        </div>
      </div>
      <div className="mt-6 grid grid-cols-4 items-end gap-3">
        {[54, 78, 64, 88].map((height, index) => (
          <div key={height} className="flex h-24 items-end rounded-full bg-white/42 px-1.5 pb-1.5">
            <span
              className="home-value-score-bar block w-full rounded-full bg-[linear-gradient(180deg,#32a852_0%,#1e9a9a_100%)]"
              style={{ height: `${height}%`, animationDelay: `${index * 0.18}s` }}
            />
          </div>
        ))}
      </div>
      <div className="home-evidence-scan absolute inset-x-5 bottom-5 space-y-2 rounded-lg bg-white/62 p-3">
        <span className="block h-1.5 w-10 rounded-full bg-[#32a852]/45" />
        <span className="block h-1.5 w-full rounded-full bg-[#d8e8d7]" />
        <span className="block h-1.5 w-3/4 rounded-full bg-[#d8e8d7]" />
      </div>
    </div>
  );
}

function SquaBirdCanopy() {
  return (
    <div className="relative h-full overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
      <div className="relative aspect-[5/7] min-h-full overflow-hidden bg-[var(--surface)] lg:aspect-auto lg:h-full">
        <Image
          src={squaBirdCard}
          alt="A painted Squa bird flying above a mountain landscape."
          fill
          sizes="(min-width: 1024px) 36vw, 100vw"
          className="home-nature-photo object-cover object-center"
          placeholder="blur"
        />
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(16,23,17,0)_0%,rgba(16,23,17,0.58)_56%,rgba(16,23,17,0.84)_100%)] px-5 pb-5 pt-24 text-white">
          <p className="font-mono text-[9px] uppercase text-[#b8e8c4] drop-shadow">For your demo</p>
          <h3 className="mt-2 max-w-[17rem] text-2xl font-semibold leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            Bring your real cohort scenarios.
          </h3>
          <p className="mt-2 max-w-[18rem] text-[13px] leading-5 text-white/82 drop-shadow">
            We will shape the walkthrough around your learners, rubrics, and review process.
          </p>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--rule)] bg-[#101711] text-white">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Image src={logoFull} alt="Squinia" className="h-9 w-auto brightness-0 invert" />
            <p className="mt-5 max-w-sm text-[14px] leading-7 text-white/68">
              AI simulation infrastructure for bootcamp teams that need realistic learner practice, transcript evidence, and rubric-backed coaching.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase text-[#b8e8c4]">Product</p>
            <div className="mt-4 grid gap-3 text-[14px] text-white/68">
              <Link href="#walkthrough" className="sim-transition hover:text-white">
                Walkthrough
              </Link>
              <Link href="#demo" className="sim-transition hover:text-white">
                Book a demo
              </Link>
              <Link href="/login" className="sim-transition hover:text-white">
                Sign in
              </Link>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase text-[#b8e8c4]">Use cases</p>
            <div className="mt-4 grid gap-3 text-[14px] text-white/68">
              <span>Interview practice</span>
              <span>Workplace communication</span>
              <span>Escalation training</span>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase text-[#b8e8c4]">Platform</p>
            <div className="mt-4 grid gap-3 text-[14px] text-white/68">
              <span>Reusable scenarios</span>
              <span>AI personas</span>
              <span>Evidence reports</span>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] leading-6 text-white/52 sm:flex-row sm:items-center sm:justify-between">
          <p>Built for repeatable cohort practice and measurable learner progress.</p>
          <p>Squinia by EDEF ICT SERVICES</p>
        </div>
      </div>
    </footer>
  );
}

function HeroSimulationStage() {
  return (
    <div className="home-panel-float relative mx-auto mt-12 w-full max-w-5xl rounded-lg border border-[rgba(204,212,201,0.7)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_24px_90px_-64px_rgba(17,21,17,0.45)] backdrop-blur md:mt-14">
      <div className="grid min-w-0 overflow-hidden rounded-md border border-[var(--rule)] bg-[var(--surface)] md:grid-cols-[0.76fr_1.24fr]">
        <div className="min-w-0 border-b border-[var(--rule)] bg-[var(--surface-soft)] p-4 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase text-[var(--faint)]">Scenario grove</p>
            <span className="rounded-full border border-[#b8e8c4] bg-[var(--accent-soft)] px-2 py-1 font-mono text-[8px] uppercase text-[#166534]">
              Live
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {["Technical interview loop", "Stakeholder escalation", "Client discovery call"].map((item, index) => (
              <div key={item} className="rounded-md border border-[var(--rule)] bg-[var(--surface)] p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--field)] text-[var(--accent)]">
                    <LeafIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">{item}</p>
                    <p className="mt-1 text-[11px] text-[var(--faint)]">{index === 0 ? "Assigned to cohort" : "Ready to assign"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative min-w-0 overflow-hidden bg-[#f9faf7] p-4 sm:min-h-[330px] sm:p-6">
          <div className="space-y-3 sm:hidden">
            <div className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
              <p className="font-mono text-[9px] uppercase text-[var(--faint)]">Learner session</p>
              <h3 className="mt-1 text-base font-semibold">Product manager interview</h3>
              <div className="mt-4 rounded-md border border-[var(--rule)] bg-[var(--field)] p-3">
                <NadiaPersonaAvatar compact />
                <p className="mt-3 text-center text-[13px] font-semibold">Nadia Chen</p>
                <p className="text-center text-[11px] text-[var(--muted)]">Senior PM persona</p>
              </div>
              <p className="mt-3 rounded-md bg-[var(--field)] p-3 text-[12px] leading-5 text-[var(--muted)]">
                Walk me through a tradeoff you made under pressure.
              </p>
            </div>
            {[
              ["Transcript", "14 captured turns"],
              ["Rubric", "Evidence and clarity"],
              ["Coaching", "2 next actions"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-[var(--rule)] bg-[rgba(255,255,255,0.86)] p-3">
                <p className="font-mono text-[9px] uppercase text-[var(--faint)]">{label}</p>
                <p className="mt-1 text-[13px] font-semibold text-[var(--foreground)]">{value}</p>
              </div>
            ))}
          </div>

          <div className="hidden sm:block">
            <svg className="absolute inset-x-0 top-8 h-24 w-full text-[#ccd4c9]" viewBox="0 0 640 120" preserveAspectRatio="none" aria-hidden>
              <path className="home-flight-path" d="M10 80C105 18 197 110 286 52c75-48 146-49 207 2 49 42 91 43 137 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="relative ml-auto max-w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase text-[var(--faint)]">Learner session</p>
                  <h3 className="mt-1 text-base font-semibold sm:text-lg">Product manager interview</h3>
                </div>
                <span className="hidden shrink-0 rounded-full bg-[#eef6ff] px-2.5 py-1 font-mono text-[8px] uppercase text-[#175cd3] sm:inline-flex sm:px-3 sm:text-[9px]">
                  Video
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-md border border-[var(--rule)] bg-[var(--field)] p-3">
                  <NadiaPersonaAvatar />
                  <p className="mt-3 text-center text-[13px] font-semibold">Nadia Chen</p>
                  <p className="text-center text-[11px] text-[var(--muted)]">Senior PM persona</p>
                </div>
                <div className="space-y-2">
                  <p className="rounded-md bg-[var(--field)] p-3 text-[12px] leading-5 text-[var(--muted)]">
                    Walk me through a tradeoff you made under pressure.
                  </p>
                  <p className="ml-6 rounded-md border border-[var(--rule)] bg-[var(--surface)] p-3 text-[12px] leading-5 text-[var(--muted)]">
                    I started by naming the customer impact, then aligned the team on constraints...
                  </p>
                </div>
              </div>
            </div>
            <div className="relative mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["Transcript", "14 captured turns"],
                ["Rubric", "Evidence and clarity"],
                ["Coaching", "2 next actions"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[var(--rule)] bg-[rgba(255,255,255,0.86)] p-3">
                  <p className="font-mono text-[9px] uppercase text-[var(--faint)]">{label}</p>
                  <p className="mt-1 text-[13px] font-semibold text-[var(--foreground)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WalkthroughVideo() {
  return (
    <section id="walkthrough" className="border-b border-[var(--rule)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <SectionLabel>Walkthrough</SectionLabel>
            {/* <h2 className="mt-3 text-3xl font-semibold leading-tight"></h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
            </p> */}
          </div>
          <Link href="#demo" className="sim-btn-accent self-start px-5 py-3 font-mono text-[10px] uppercase sm:self-auto">
            Book a demo
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--rule-strong)] bg-[#101711] shadow-[0_30px_110px_-70px_rgba(17,21,17,0.65)]">
          <div className="aspect-video">
            <iframe
              className="h-full w-full"
              src={walkthroughEmbedUrl}
              title="Squinia product walkthrough"
              allow="fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative isolate overflow-hidden border-b border-[var(--rule)]">
        <NatureField />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-8">
          <Link href="/" className="shrink-0 rounded-lg outline-none sim-transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
            <Image src={logoFull} alt="Squinia" priority className="h-8 w-auto max-w-[116px] sm:h-9 sm:max-w-[152px]" />
          </Link>
          <nav className="flex shrink-0 items-center gap-1 text-[13px] font-medium sm:gap-2">
            <Link href="/login" className="hidden rounded-lg px-2 py-2 text-[var(--muted)] sim-transition hover:bg-[var(--surface)] hover:text-[var(--foreground)] sm:inline-flex sm:px-3">
              Sign in
            </Link>
            <Link href="#walkthrough" className="hidden rounded-lg px-2 py-2 text-[var(--muted)] sim-transition hover:bg-[var(--surface)] hover:text-[var(--foreground)] sm:inline-flex sm:px-3">
              Walkthrough
            </Link>
            <Link href="#demo" className="rounded-lg bg-[var(--foreground)] px-3 py-2 text-white sim-transition hover:bg-[#243126] sm:px-4">
              Demo
            </Link>
          </nav>
        </header>

        <div className="relative mx-auto min-h-[calc(100vh-5rem)] max-w-6xl px-5 pb-12 pt-20 sm:px-8 sm:pb-16 sm:pt-24">
          <div className="max-w-3xl">
            <SectionLabel>AI simulation platform</SectionLabel>
            <h1 className="mt-4 max-w-[21rem] break-words text-4xl font-semibold leading-[1.08] text-[var(--foreground)] sm:max-w-4xl sm:text-7xl sm:leading-[0.98]">
              Practice that grows with every bootcamp cohort.
            </h1>
            <p className="mt-6 max-w-[22rem] text-[15px] leading-7 text-[var(--muted)] sm:max-w-2xl sm:text-lg sm:leading-8">
              Squinia turns high-stakes conversations into repeatable AI simulations with real personas, chat, phone, and video practice, transcript capture, rubric scoring, and coaching tied to learner evidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#demo" className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase">
                Book a demo
              </Link>
              <Link
                href="#walkthrough"
                className="rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-6 py-3 font-mono text-[10px] uppercase text-[var(--foreground)] sim-transition hover:bg-[var(--field)]"
              >
                Watch walkthrough
              </Link>
            </div>
          </div>
          <HeroSimulationStage />
        </div>
      </section>

      <WalkthroughVideo />

      <section className="border-b border-[var(--rule)] bg-[var(--surface-soft)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionLabel>Competitive alternatives</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">The old workflow was built around scarcity.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
              Bootcamp teams already create practice, feedback, and accountability. Squinia makes the strongest parts repeatable without asking every learner to wait for the same limited facilitator slot.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {alternatives.map((item) => (
              <article key={item.title} className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--field)] text-[var(--accent)]">
                  <FeatureIcon type={item.icon} />
                </span>
                <h3 className="mt-5 font-semibold text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-[var(--rule)] bg-[#f7f8f2]">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
          <svg className="absolute -right-20 top-8 h-72 w-[36rem] text-[#d7a529]/20" viewBox="0 0 580 280" fill="none">
            <path d="M7 226C122 94 206 154 300 70c93-83 178-68 274-32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M39 265C152 169 239 196 344 101c69-62 126-74 215-53" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <LeafIcon className="home-leaf absolute left-[6%] top-20 h-7 w-7 text-[var(--accent)] opacity-25" />
          <LeafIcon className="home-leaf home-leaf-delay absolute bottom-16 right-[10%] h-6 w-6 text-[#d7a529] opacity-30" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <div>
              <SectionLabel>Unique value</SectionLabel>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                A training grove, not another blank prompt box.
              </h2>
            </div>
            <p className="max-w-2xl text-[15px] leading-7 text-[var(--muted)] lg:ml-auto">
              Squinia keeps the whole performance record together: scenario design, persona behavior, live practice, transcript persistence, and evidence-backed coaching.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {valuePillars.map((item) => (
              <article
                key={item.title}
                className={[
                  "home-value-card group flex min-h-[29rem] flex-col overflow-hidden rounded-lg border p-4 shadow-[0_34px_90px_-58px_rgba(17,21,17,0.48)]",
                  item.tone,
                ].join(" ")}
              >
                <ValuePillarVisual type={item.visual} />
                <div className="flex flex-1 flex-col justify-end px-1 pb-1 pt-6">
                  <p className="font-mono text-[10px] uppercase text-[#1d7d3a]">{item.label}</p>
                  <h3 className="mt-3 text-2xl font-semibold leading-[1.08]">{item.title}</h3>
                  <p className="mt-4 text-[15px] leading-7 text-[rgba(17,21,17,0.72)]">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
          {/* <div className="relative z-10 mt-6 flex justify-center">
            <Link href="#demo" className="sim-btn-accent px-5 py-3 font-mono text-[10px] uppercase">
              See it in a demo
            </Link>
          </div> */}
        </div>
      </section>

      <section className="border-b border-[var(--rule)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--surface-soft)] p-5 shadow-[var(--shadow-soft)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#32a852,#175cd3,#d7a529)]" />
            <div className="grid gap-3">
              {workflow.map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-md border border-[var(--rule)] bg-[var(--surface)] p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--field)] font-mono text-[11px] text-[var(--muted)]">
                    {index + 1}
                  </span>
                  <p className="text-[14px] leading-6 text-[var(--muted)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>Cohort workflow</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">From scenario design to a coaching conversation.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
              Squinia is strongest when a team knows which conversations matter and needs every learner to rehearse, get scored, and improve before the real interaction.
            </p>
          </div>
        </div>
      </section>

      <section id="demo" className="bg-[var(--background)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">

          <SquaBirdCanopy />

          <DemoLeadForm />
        </div>
      </section>

      <Footer />
    </main>
  );
}
