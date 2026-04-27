"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getAccessToken } from "@/app/(auth)/_lib/auth-tokens";

import {
  endBackendSimulationSession,
  getBackendSessionDetail,
  isApiBaseConfigured,
  isBackendSessionId,
  postTextSimulationChat,
  postTextSimulationOpening,
} from "../_lib/backend-simulation";
import { PersonaAvatar, personaFromScenarioLike, type RuntimePersona } from "../_lib/persona-runtime";
import { buildStoredChatReport, saveSessionReport } from "../_lib/session-report";
import { SimulationTeamFeedbackDialog } from "../_components/team-feedback-dialog";

export type SimulationSessionMeta = {
  language: string;
  channel: string;
  difficulty: string;
  scorecard: string;
  learnerRole: string;
  learnerContext: string;
  personaBlurb: string;
};

type Mood = "thinking" | "probing" | "satisfied";

type TranscriptEntry = {
  id: string;
  role: "ai" | "user";
  text: string;
  offsetSec: number;
};

type AiStream = {
  lineId: string;
  full: string;
  shown: string;
  offsetSec: number;
};

type Phase = "prepare" | "live";
type ComposeMode = "reply" | "note";

function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const INITIAL: TranscriptEntry[] = [
  {
    id: "1",
    role: "ai",
    text: `Hey, you've got about five minutes—can you give me a quick update on your project this week? I'm juggling a few things, so just hit the highlights: what did you get done, any blockers I should know about, and what's next?`,
    offsetSec: 0,
  },
];

const AI_REPLIES = [
  "Thanks. If you had to pick one thing that could slip without anyone noticing until it's expensive—what is it?",
  "Good. Translate that into what leadership needs to hear in the first sixty seconds on Monday.",
  "Understood. What decision are you implicitly asking them to make by the end of this update?",
];

function moodLabel(m: Mood) {
  switch (m) {
    case "thinking":
      return "Considering";
    case "probing":
      return "Probing";
    case "satisfied":
      return "Settled";
  }
}

function TranscriptRule() {
  return (
    <div
      className="my-10 h-px w-full max-w-full rounded-full bg-gradient-to-r from-transparent via-[var(--rule-strong)] to-transparent opacity-[0.92]"
      aria-hidden
    />
  );
}

function SoftWideRule() {
  return (
    <div
      className="my-6 h-px w-full bg-gradient-to-r from-transparent via-[var(--rule-strong)] to-transparent"
      aria-hidden
    />
  );
}

/** Sculpted seam: deeper center valley (“n”) between transcript and composer. */
function ComposerTopCurve() {
  return (
    <svg
      className="sim-composer-curve pointer-events-none"
      viewBox="0 0 1200 18"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M0,0 L1200,0 L1200,5 Q600,18 0,5 Z"
      />
    </svg>
  );
}

function IconBack({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconFlag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 22V4a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H6" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/** Lens-like arc (video will use camera; voice will use phone) + live chat bubble for transcript mode. */
function IconLiveTranscriptMark({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  const c = active ? "#111111" : "var(--muted)";
  return (
    <svg
      className={className ?? ""}
      width="32"
      height="28"
      viewBox="0 0 40 34"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 12 Q20 5 34 12"
        stroke={c}
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M11 18h18a3 3 0 013 3v4.5a3 3 0 01-3 3h-9.5L14 31v-2.5H11a3 3 0 01-3-3V21a3 3 0 013-3z"
        stroke={c}
        strokeWidth="1.15"
        strokeLinejoin="round"
        fill="#ffffff"
      />
      <circle cx="16" cy="24.5" r="1.1" fill={c} opacity="0.35" />
      <circle cx="20" cy="24.5" r="1.1" fill={c} opacity="0.45" />
      <circle cx="24" cy="24.5" r="1.1" fill={c} opacity="0.35" />
    </svg>
  );
}

function SimArcUnderline({ active }: { active: boolean }) {
  const stroke = active ? "var(--rule-strong)" : "var(--rule-strong)";
  return (
    <svg
      className="mt-0.5"
      width="76"
      height="9"
      viewBox="0 0 76 9"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 6 Q38 1.5 73 6"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MetaRow({
  label,
  value,
  showDivider = true,
}: {
  label: string;
  value: string;
  showDivider?: boolean;
}) {
  return (
    <div className="py-3.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
        {label}
      </p>
      <p className="mt-2 text-[15px] font-normal leading-snug tracking-[-0.015em] text-[#111111]">
        {value}
      </p>
      {showDivider ? (
        <div
          className="mt-4 h-px bg-gradient-to-r from-transparent via-[var(--rule)] to-transparent"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export function SimulationScreen({
  sessionId,
  personaName: initialPersonaName,
  personaTitle: initialPersonaTitle,
  scenarioTitle: initialScenarioTitle,
  learnerName,
  meta,
}: {
  sessionId: string;
  personaName: string;
  personaTitle: string;
  scenarioTitle: string;
  learnerName: string;
  meta: SimulationSessionMeta;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("prepare");
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("reply");
  const [runtimeScenarioTitle, setRuntimeScenarioTitle] = useState(initialScenarioTitle);
  const [runtimePersona, setRuntimePersona] = useState<RuntimePersona>({
    name: initialPersonaName,
    title: initialPersonaTitle,
    avatarUrl: "",
    blurb: meta.personaBlurb,
  });

  const [lines, setLines] = useState<TranscriptEntry[]>(INITIAL);
  const [draft, setDraft] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [aiStream, setAiStream] = useState<AiStream | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mood, setMood] = useState<Mood>("probing");
  const [signals, setSignals] = useState({
    confidence: "→" as "↑" | "→" | "↓",
    clarity: "→" as "↑" | "→" | "↓",
    depth: "→" as "↑" | "→" | "↓",
  });

  const centerRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const elapsedRef = useRef(0);
  const streamStateRef = useRef<AiStream | null>(null);

  const live = phase === "live";
  const useBackendChat = useMemo(
    () => process.env.NEXT_PUBLIC_USE_BACKEND_SESSIONS === "1" && isBackendSessionId(sessionId),
    [sessionId],
  );
  const [chatHttpError, setChatHttpError] = useState<string | null>(null);
  const replyBlocked =
    useBackendChat &&
    live &&
    composeMode === "reply" &&
    (!getAccessToken() || !isApiBaseConfigured());
  const sessionBusy = aiTyping || aiStream !== null;
  useEffect(() => {
    if (!useBackendChat) return;
    let cancelled = false;
    void (async () => {
      const detail = await getBackendSessionDetail(sessionId);
      if (cancelled || !detail?.scenario_snapshot) return;
      const snap = detail.scenario_snapshot as Record<string, unknown>;
      setRuntimePersona(personaFromScenarioLike(snap));
      if (typeof snap.title === "string" && snap.title.trim()) {
        setRuntimeScenarioTitle(snap.title.trim());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, useBackendChat]);

  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [live]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    if (!live) {
      streamStateRef.current = null;
    }
  }, [live]);

  useEffect(() => {
    if (!live || !useBackendChat) return;
    let cancelled = false;
    setAiTyping(true);
    void (async () => {
      try {
        const res = await postTextSimulationOpening(sessionId);
        if (cancelled) return;
        if (!res.ok) {
          setChatHttpError(res.message);
          setLines([
            {
              id: crypto.randomUUID(),
              role: "ai",
              text: `We could not load the facilitator's opening (${res.message}). Try ending the session and starting again.`,
              offsetSec: 0,
            },
          ]);
          return;
        }
        const text = (res.data.assistant_content || "").trim() || "…";
        setLines([{ id: crypto.randomUUID(), role: "ai", text, offsetSec: 0 }]);
      } finally {
        if (!cancelled) setAiTyping(false);
      }
    })();
    return () => {
      cancelled = true;
      setAiTyping(false);
    };
  }, [live, useBackendChat, sessionId]);

  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines, aiTyping, aiStream]);

  useEffect(() => {
    if (!live) return;
    const id = window.requestAnimationFrame(() => {
      composerInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [live]);

  useEffect(() => {
    if (!live || sessionBusy) return;
    const t = window.setTimeout(() => {
      composerInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [live, sessionBusy]);

  useEffect(() => {
    if (!live) return;
    if (lines.length <= 1) {
      setMood("probing");
      return;
    }
    const last = lines[lines.length - 1];
    if (last.role === "user" || aiTyping || aiStream) {
      setMood("thinking");
      return;
    }
    setMood(lines.length > 4 ? "satisfied" : "probing");
  }, [lines, aiTyping, aiStream, live]);

  const pushUser = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const body = composeMode === "note" ? `Note — ${trimmed}` : trimmed;
      const userEntry: TranscriptEntry = {
        id: crypto.randomUUID(),
        role: "user",
        text: body,
        offsetSec: elapsed,
      };

      if (live && useBackendChat && composeMode === "reply" && !body.startsWith("Note —")) {
        setChatHttpError(null);
        setLines((prev) => [...prev, userEntry]);
        setDraft("");
        setAiTyping(true);
        void (async () => {
          try {
            const res = await postTextSimulationChat(sessionId, userEntry.text);
            if (!res.ok) {
              setChatHttpError(res.message);
              setLines((prev) => prev.filter((l) => l.id !== userEntry.id));
              return;
            }
            const reply = (res.data.assistant_content || "").trim() || "…";
            setLines((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "ai",
                text: reply,
                offsetSec: elapsedRef.current,
              },
            ]);
          } finally {
            setAiTyping(false);
          }
        })();
        return;
      }

      setLines((prev) => [...prev, userEntry]);
      setDraft("");
    },
    [elapsed, composeMode, live, useBackendChat, sessionId],
  );

  useEffect(() => {
    if (!live || useBackendChat) return;
    const last = lines[lines.length - 1];
    if (!last || last.role !== "user") return;
    if (last.text.startsWith("Note —")) return;

    setAiTyping(true);
    const delay = 900 + Math.min(1400, last.text.length * 22);
    const t = window.setTimeout(() => {
      const prevSnapshot = lines;
      const tail = prevSnapshot[prevSnapshot.length - 1];
      if (!tail || tail.role !== "user") return;
      const userTurns = prevSnapshot.filter((l) => l.role === "user").length;
      const reply = AI_REPLIES[(userTurns - 1) % AI_REPLIES.length];
      setAiTyping(false);
      setAiStream({
        lineId: crypto.randomUUID(),
        full: reply,
        shown: "",
        offsetSec: elapsedRef.current,
      });
    }, delay);

    return () => {
      window.clearTimeout(t);
      setAiTyping(false);
    };
  }, [lines, live, useBackendChat]);

  useEffect(() => {
    if (!aiStream || useBackendChat) return;
    if (aiStream.shown.length >= aiStream.full.length) {
      setLines((prev) => [
        ...prev,
        {
          id: aiStream.lineId,
          role: "ai",
          text: aiStream.full,
          offsetSec: aiStream.offsetSec,
        },
      ]);
      setAiStream(null);
      setSignals({
        confidence: (["↑", "→", "↓"] as const)[Math.floor(Math.random() * 3)],
        clarity: (["↑", "→", "↓"] as const)[Math.floor(Math.random() * 3)],
        depth: (["↑", "→", "↓"] as const)[Math.floor(Math.random() * 3)],
      });
      return;
    }

    const tick = window.setTimeout(() => {
      setAiStream((s) => {
        if (!s) return null;
        const step = 2 + Math.min(4, Math.floor(s.full.length / 120));
        const nextLen = Math.min(s.full.length, s.shown.length + step);
        return { ...s, shown: s.full.slice(0, nextLen) };
      });
    }, 24);

    return () => window.clearTimeout(tick);
  }, [aiStream, useBackendChat]);

  const sessionShort = useMemo(
    () => (sessionId.length > 10 ? `${sessionId.slice(0, 6)}…` : sessionId),
    [sessionId],
  );

  function enterLive() {
    setPhase("live");
    setElapsed(0);
    setLines(useBackendChat ? [] : INITIAL);
    setDraft("");
    setAiTyping(false);
    setAiStream(null);
    setChatHttpError(null);
  }

  async function requestEndSession() {
    if (!live) return;
    const ok = window.confirm(
      "End this simulation? You will open your session report with transcript and evaluation.",
    );
    if (!ok) return;
    if (useBackendChat) {
      await endBackendSimulationSession(sessionId);
    }
    const payload = buildStoredChatReport({
      sessionId,
      scenarioTitle: runtimeScenarioTitle,
      learnerName,
      interviewerName: runtimePersona.name,
      interviewerTitle: runtimePersona.title,
      scorecardLabel: meta.scorecard,
      lines,
      elapsedSec: elapsed,
    });
    void saveSessionReport(payload).then(() => {
      router.push(`/simulation/${sessionId}/report?kind=chat`);
    });
  }

  const rail = (
    <div className="flex flex-col gap-8 px-5 py-8 lg:px-7 lg:py-10">
      <section className="rounded-2xl bg-[var(--field)]/65 px-4 py-4 ring-1 ring-[var(--rule)]/90">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
          Scenario
        </p>
        <p className="mt-2.5 text-[1.125rem] font-medium leading-snug tracking-[-0.024em] text-[#111111] lg:text-[1.2rem]">
          {runtimeScenarioTitle}
        </p>
      </section>

      <section className="rounded-2xl">
        <MetaRow label="AI persona" value={`${runtimePersona.name} · ${runtimePersona.title}`} />
        <MetaRow label="Language" value={meta.language} />
        <MetaRow label="Channel" value={meta.channel} />
        <MetaRow label="Difficulty" value={meta.difficulty} />
        <MetaRow label="Scorecard" value={meta.scorecard} showDivider={false} />
      </section>

      <section>
        <SoftWideRule />
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
          Persona
        </p>
        <div className="mt-3 max-h-[9.5rem] overflow-y-auto overscroll-y-contain rounded-xl bg-[var(--surface)] px-3 py-3 ring-1 ring-[var(--rule)]/80">
          <p className="text-[14px] leading-[1.65] text-[var(--muted)]">{runtimePersona.blurb || meta.personaBlurb}</p>
        </div>
      </section>

      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
          Your role
        </p>
        <p className="mt-3 text-[15px] leading-[1.65] tracking-[-0.01em] text-[#111111]">
          {meta.learnerRole}
        </p>
        <p className="mt-2 text-[14px] leading-[1.6] text-[var(--muted)]">
          {meta.learnerContext}
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)]/90 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
          Signals
        </p>
        <ul className="mt-3 space-y-0 font-mono text-[13px] tracking-[0.02em] text-[var(--muted)]">
          <li className="flex justify-between gap-6 py-3">
            <span>Confidence</span>
            <span className="tabular-nums text-[#111111]">{signals.confidence}</span>
          </li>
          <li
            className="h-px bg-gradient-to-r from-transparent via-[var(--rule)] to-transparent"
            aria-hidden
          />
          <li className="flex justify-between gap-6 py-3">
            <span>Clarity</span>
            <span className="tabular-nums text-[#111111]">{signals.clarity}</span>
          </li>
          <li
            className="h-px bg-gradient-to-r from-transparent via-[var(--rule)] to-transparent"
            aria-hidden
          />
          <li className="flex justify-between gap-6 py-3">
            <span>Depth</span>
            <span className="tabular-nums text-[#111111]">{signals.depth}</span>
          </li>
        </ul>
      </section>

      <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--faint)]">
        Session {sessionShort}
      </p>
    </div>
  );

  const personaRail = (
    <div className="flex h-full flex-col gap-10 px-5 py-8 lg:px-8 lg:py-10">
      <div className="flex items-start gap-4">
        <PersonaAvatar
          persona={runtimePersona}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#111111] font-mono text-[11px] font-medium tracking-wide text-[var(--accent-fg)]"
        />
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
            Interviewer
          </p>
          <p className="mt-2 font-sans text-[1.35rem] font-normal leading-[1.15] tracking-[-0.035em] text-[#111111]">
            {runtimePersona.name}
          </p>
          <p className="mt-2 text-[15px] leading-[1.6] text-[var(--muted)]">{runtimePersona.title}</p>
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
          Disposition
        </p>
        <p className="mt-4 flex items-center gap-2 text-[15px] tracking-[-0.01em] text-[#111111]">
          <span
            className={`inline-block h-[6px] w-[6px] rounded-sm bg-[#111111] ${mood === "thinking" ? "sim-mood-dot" : ""}`}
            aria-hidden
          />
          <span key={mood} className="sim-disposition-label">
            {moodLabel(mood)}
          </span>
        </p>
        <p className="mt-4 max-w-[20rem] text-sm leading-relaxed text-[var(--muted)]">
          Live read on pacing and structure. Not a scorecard.
        </p>
      </div>
    </div>
  );

  return (
    <div className="sim-root relative flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-[var(--background)] text-[#111111]">
      {/* Top system bar — operational, not marketing chrome */}
      <header className="relative z-10 mx-2 mt-2 flex h-[52px] shrink-0 items-center gap-2 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] px-2 shadow-[0_6px_28px_-20px_rgba(17,17,17,0.14)] sm:mx-3 sm:px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="sim-transition flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--rule)] bg-transparent text-[#111111] transition-colors duration-200 ease-out hover:bg-[var(--field)]"
            aria-label="Back"
          >
            <IconBack />
          </button>
          <button
            type="button"
            onClick={() => setInfoPanelOpen(true)}
            className="cursor-pointer rounded-lg px-2 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:bg-[var(--field)] hover:text-[#111111] hover:underline sm:hidden"
          >
            View info
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex items-center justify-center">
          <div className="pointer-events-auto flex flex-col items-center justify-center gap-0.5">
            <span className="sr-only">Live transcript simulation</span>
            <span className="-mb-px inline-flex leading-none" aria-hidden>
              <IconLiveTranscriptMark active={live} />
            </span>
            <span className="font-mono text-[10px] uppercase leading-none tracking-[0.26em] text-[var(--faint)]">
              {live ? "Live" : "Room"}
            </span>
            <SimArcUnderline active={live} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {live ? (
            <span className="hidden font-mono text-[11px] tabular-nums text-[var(--muted)] sm:inline">
              T+{formatClock(elapsed)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="sim-transition flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-transparent text-[var(--muted)] transition-colors hover:border-[var(--rule)] hover:text-[#111111]"
            title="Flag for team — send feedback"
            aria-label="Flag for team — send feedback"
          >
            <IconFlag />
          </button>
          <button
            type="button"
            onClick={() => setInfoPanelOpen(true)}
            className="sim-transition hidden cursor-pointer rounded-xl border border-[var(--rule)] px-3 py-2 text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] sm:inline"
          >
            View info
          </button>
          <button
            type="button"
            disabled={!live}
            onClick={() => void requestEndSession()}
            className="sim-btn-accent rounded-xl px-4 py-2.5 font-mono text-[10px] uppercase sm:px-5"
          >
            End simulation
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2 pt-0 sm:px-3 sm:pb-3">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[42rem] flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--surface)] shadow-[0_6px_36px_-18px_rgba(17,17,17,0.12)]">
          <main
            ref={centerRef}
            className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth ${live ? "sim-live-panel" : ""}`}
          >
            <div className="px-5 py-8 sm:px-8 sm:py-10">
              {!live ? (
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
                  Room
                </p>
              ) : (
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--faint)]">
                  Conversation
                </p>
              )}

              {live ? (
                <ol className="mt-8 list-none p-0 sm:mt-10">
                  {useBackendChat && lines.length === 0 && !aiStream && aiTyping ? (
                    <li className="mt-2">
                      <p className="text-sm leading-relaxed text-[var(--muted)]">
                        Your interviewer is opening the conversation from this scenario…
                      </p>
                    </li>
                  ) : null}
                  {lines.map((entry, i) => (
                    <li key={entry.id}>
                      {i > 0 ? <TranscriptRule /> : null}
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          {entry.role === "ai" ? (
                            <PersonaAvatar
                              persona={runtimePersona}
                              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#111111] font-mono text-[10px] font-medium text-[var(--accent-fg)]"
                            />
                          ) : (
                            <div
                              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--rule-strong)] font-mono text-[10px] font-medium text-[var(--muted)]"
                              aria-hidden
                            >
                              You
                            </div>
                          )}
                          <div className="min-w-0 flex-1 space-y-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--faint)]">
                              <span className="tabular-nums text-[var(--muted)]">
                                {formatClock(entry.offsetSec)}
                              </span>
                              <span className="mx-2 text-[var(--rule-strong)]">·</span>
                              {entry.role === "ai"
                                ? `${runtimePersona.name}`
                                : entry.text.startsWith("Note —")
                                  ? "You · note"
                                  : "You"}
                            </p>
                            <p className="whitespace-pre-wrap text-[18px] font-normal leading-[1.72] tracking-[-0.011em] text-[#111111]">
                              {entry.text.startsWith("Note —")
                                ? entry.text.replace(/^Note —\s*/, "")
                                : entry.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}

                  {aiStream ? (
                    <li key={aiStream.lineId}>
                      {lines.length > 0 ? <TranscriptRule /> : null}
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <PersonaAvatar
                            persona={runtimePersona}
                            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#111111] font-mono text-[10px] font-medium text-[var(--accent-fg)]"
                          />
                          <div className="min-w-0 flex-1 space-y-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--faint)]">
                              <span className="tabular-nums text-[var(--muted)]">
                                {formatClock(aiStream.offsetSec)}
                              </span>
                              <span className="mx-2 text-[var(--rule-strong)]">·</span>
                              {runtimePersona.name}
                            </p>
                            <p className="whitespace-pre-wrap text-[18px] font-normal leading-[1.72] tracking-[-0.011em] text-[#111111]">
                              {aiStream.shown}
                              <span className="inline-block h-[1.1em] w-px translate-y-[0.08em] bg-[#111111] align-middle opacity-35" />
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ) : null}

                  {aiTyping ? (
                    <li key="system-wait" className="mt-12">
                      <TranscriptRule />
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--faint)]">
                        System
                      </p>
                      <p
                        className="mt-4 text-sm leading-relaxed text-[var(--muted)]"
                        aria-live="polite"
                      >
                        Interviewer is considering your last answer.
                      </p>
                    </li>
                  ) : null}
                </ol>
              ) : (
                <p className="mt-8 max-w-md text-sm leading-relaxed text-[var(--muted)]">
                  When you enter, this becomes a live transcript—not a chat thread.
                </p>
              )}
            </div>
          </main>

          {live ? (
            <div className="shrink-0 border-t border-[var(--rule)] bg-[var(--field)]/50 px-3 pb-3 pt-2 sm:px-5 sm:pb-3 sm:pt-2.5">
              <div className="w-full">
                <ComposerTopCurve />
                <div className="sim-composer-shell sim-transition -mt-[10px] rounded-b-2xl rounded-t-xl border-x border-b border-[var(--rule)] bg-[var(--field)] px-3 pb-3 pt-2.5 shadow-[0_-10px_32px_-24px_rgba(17,17,17,0.1)] sm:px-4 sm:pb-3 sm:pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-0 overflow-hidden rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] font-mono text-[10px] uppercase tracking-[0.14em]">
                      <button
                        type="button"
                        onClick={() => setComposeMode("reply")}
                        className={`rounded-l-lg px-3 py-2 transition-colors duration-200 ease-out ${
                          composeMode === "reply"
                            ? "bg-[#32a852] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                            : "text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
                        }`}
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposeMode("note")}
                        className={`rounded-r-lg border-l border-[var(--rule)] px-3 py-2 transition-colors duration-200 ease-out ${
                          composeMode === "note"
                            ? "bg-[#32a852] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                            : "text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
                        }`}
                      >
                        Note
                      </button>
                    </div>
                    <button
                      type="button"
                      className="sim-transition rounded-lg px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)] underline-offset-4 transition-colors duration-200 ease-out hover:bg-[var(--surface)] hover:text-[#111111] hover:underline"
                    >
                      Snippets
                    </button>
                  </div>
                  <label htmlFor="sim-input" className="sr-only">
                    {composeMode === "note" ? "Private note" : "Your reply"}
                  </label>
                  <div className="mt-2 rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <textarea
                      ref={composerInputRef}
                      id="sim-input"
                      rows={2}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (sessionBusy) return;
                          if (composeMode === "reply" && replyBlocked) return;
                          pushUser(draft);
                        }
                      }}
                      disabled={sessionBusy || (composeMode === "reply" && replyBlocked)}
                      placeholder={
                        composeMode === "note"
                          ? "Private note…"
                          : "Type a reply…"
                      }
                      className="max-h-[5.5rem] min-h-[2.5rem] w-full resize-none overflow-y-auto border-0 bg-transparent font-sans text-[15px] leading-[1.5] tracking-[-0.01em] text-[#111111] placeholder:text-[var(--faint)] disabled:cursor-not-allowed disabled:opacity-40 sm:max-h-[6.5rem]"
                    />
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                    <p className="mr-auto max-w-[min(100%,20rem)] font-mono text-[10px] leading-snug tracking-[0.06em] text-[var(--muted)] sm:order-first">
                      {replyBlocked
                        ? !getAccessToken()
                          ? "Sign in required — no access token."
                          : !isApiBaseConfigured()
                            ? "Set NEXT_PUBLIC_API_BASE to your API (e.g. http://localhost:8000)."
                            : "Chat unavailable."
                        : chatHttpError
                          ? chatHttpError
                          : sessionBusy
                            ? "Wait for the interviewer to finish."
                            : !draft.trim()
                              ? composeMode === "note"
                                ? "Add a note, then send. Notes are private."
                                : "Add a reply to enable Send."
                              : "Enter sends · Shift+Enter newline"}
                    </p>
                    <button
                      type="button"
                      disabled={sessionBusy || !draft.trim() || (composeMode === "reply" && replyBlocked)}
                      onClick={() => pushUser(draft)}
                      className={`min-w-[5.5rem] px-4 py-2 font-mono text-[10px] uppercase transition-opacity duration-200 ease-out ${
                        sessionBusy
                          ? "sim-btn-muted"
                          : !draft.trim()
                            ? "sim-btn-send-idle"
                            : "sim-btn-accent"
                      }`}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Prepare — editorial gate, no card */}
      {phase === "prepare" ? (
        <div
          className="sim-fade-in absolute inset-0 z-20 flex items-center justify-center bg-[#FAFAF7]/94 px-6 py-10 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prepare-title"
        >
          <div className="w-full max-w-lg">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
              aria-label="Close"
            >
              <IconClose />
            </button>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">
              Squinia simulation
            </p>
            <h1
              id="prepare-title"
              className="mt-4 text-balance font-sans text-[1.65rem] font-normal leading-tight tracking-[-0.03em] text-[#111111] sm:text-3xl"
            >
              Get ready for this transcript.
            </h1>
            <p className="mt-5 text-pretty text-[15px] leading-relaxed text-[var(--muted)]">
              You are entering a timed conversation. The surface is calm on purpose: fewer
              controls, more performance.
            </p>
            <ul className="mt-10 space-y-6 rounded-2xl border border-[var(--rule)] px-4 py-8 text-[15px] leading-relaxed text-[#111111]">
              <li className="flex gap-4">
                <span className="font-mono text-[11px] text-[var(--faint)]">01</span>
                <span>Find a quiet space and close anything that will pull you out of character.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-[11px] text-[var(--faint)]">02</span>
                <span>Reply as you would in the room. Notes are private and never sent as speech.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-[11px] text-[var(--faint)]">03</span>
                <span>When you are ready, enter. The clock starts the moment the door opens.</span>
              </li>
            </ul>
            <div className="mt-12 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={enterLive}
                className="sim-btn-accent px-7 py-3.5 font-mono text-[11px] uppercase"
              >
                Enter simulation
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:bg-[var(--field)] hover:underline"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Scenario + session rail — on demand (focus layout; same as phone/video “View info”) */}
      {infoPanelOpen ? (
        <div className="fixed inset-0 z-30" role="dialog" aria-modal="true" aria-labelledby="info-panel-title">
          <button
            type="button"
            className="absolute inset-0 bg-[#111111]/25 backdrop-blur-[1px]"
            aria-label="Close info panel"
            onClick={() => setInfoPanelOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,24rem)] flex-col border-l border-[var(--rule)] bg-[var(--surface)] shadow-[0_0_48px_-12px_rgba(0,0,0,0.18)]">
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--rule)] px-4">
              <span
                id="info-panel-title"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]"
              >
                View info
              </span>
              <button
                type="button"
                onClick={() => setInfoPanelOpen(false)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
                aria-label="Close"
              >
                <IconClose />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
              <div className="border-b border-[var(--rule)]">{personaRail}</div>
              {rail}
            </div>
          </div>
        </div>
      ) : null}

      <SimulationTeamFeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        kind="transcript"
        sessionId={sessionId}
      />

    </div>
  );
}
