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

const walkthroughEmbedUrl = youtubeEmbedSrc(process.env.NEXT_PUBLIC_SQUINIA_WALKTHROUGH_EMBED_URL);

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
    label: "Create",
    title: "Reusable scenarios",
    body: "Operators build interview, escalation, and workplace communication scenarios once, then assign them across cohorts.",
  },
  {
    label: "Perform",
    title: "AI personas across modes",
    body: "Learners practice with named personas in chat, phone, or video, with the interaction shaped by the scenario.",
  },
  {
    label: "Improve",
    title: "Evidence-backed coaching",
    body: "Transcripts are scored against rubrics, then turned into specific feedback tied to what the learner said.",
  },
];

const workflow = [
  "Build scenarios from real cohort outcomes.",
  "Let learners practice in chat, phone, or video.",
  "Score transcripts against your rubric.",
  "Use the report to coach the next attempt.",
];

function youtubeEmbedSrc(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, "");
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

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M8 5.6v12.8L18.6 12 8 5.6Z" fill="currentColor" />
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
            <h2 className="mt-3 text-3xl font-semibold leading-tight">Show the full training loop in one frame.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
              The homepage is ready for a YouTube walkthrough: operators can see how scenarios, simulations, transcripts, and coaching connect before they book a demo.
            </p>
          </div>
          <Link href="#demo" className="sim-btn-accent self-start px-5 py-3 font-mono text-[10px] uppercase sm:self-auto">
            Book a demo
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--rule-strong)] bg-[#101711] shadow-[0_30px_110px_-70px_rgba(17,21,17,0.65)]">
          <div className="aspect-video">
            {walkthroughEmbedUrl ? (
              <iframe
                className="h-full w-full"
                src={walkthroughEmbedUrl}
                title="Squinia product walkthrough"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="relative grid h-full place-items-center overflow-hidden bg-[#101711] text-white">
                <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 1200 675" preserveAspectRatio="none" aria-hidden>
                  <path d="M0 508C195 389 304 449 457 332c176-134 284-178 439-112 123 52 203 36 304-42" stroke="#32a852" strokeWidth="2" fill="none" />
                  <path d="M0 590C209 511 321 549 525 421c148-93 258-108 396-35 102 54 174 62 279 12" stroke="#83b7ff" strokeWidth="2" fill="none" />
                </svg>
                <div className="relative mx-auto max-w-md px-6 text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[var(--accent)] shadow-[0_16px_44px_-24px_rgba(255,255,255,0.85)]">
                    <PlayIcon className="h-8 w-8" />
                  </span>
                  <p className="mt-6 font-mono text-[10px] uppercase text-[#b8e8c4]">Squinia walkthrough</p>
                  <h3 className="mt-2 text-3xl font-semibold leading-tight">From scenario to scorecard.</h3>
                  <p className="mt-3 text-[14px] leading-6 text-white/72">
                    A polished video stage for the YouTube walkthrough, framed to feel like the product rather than a pasted screenshot.
                  </p>
                </div>
              </div>
            )}
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

      <section className="border-b border-[var(--rule)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="max-w-2xl">
            <SectionLabel>Unique value</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">A training grove, not another blank prompt box.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
              The product holds the whole performance record together: scenario design, persona behavior, live practice, transcript persistence, and evidence-backed coaching.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {valuePillars.map((item) => (
              <article key={item.title} className="rounded-lg border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
                <p className="font-mono text-[10px] uppercase text-[var(--accent)]">{item.label}</p>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-[14px] leading-6 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
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
