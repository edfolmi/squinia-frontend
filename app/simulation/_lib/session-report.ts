/**
 * Client-side session report payload for the post-simulation page.
 * Persisted in IndexedDB so recordings (Blob) survive navigation.
 */

export type SimulationReportKind = "chat" | "phone" | "video";

export type ReportTranscriptLine = {
  id: string;
  role: "learner" | "interviewer";
  name: string;
  title?: string;
  text: string;
  offsetSec: number;
};

export type SessionMetrics = {
  handlingTimeSec: number;
  handlingDeltaSec: number;
  frtSec: number;
  artSec: number;
  transferRatePct: number;
  lastMessageSec: number;
};

export type CompetencyTone = "success" | "warn" | "neutral";

export type CompetencyBlock = {
  id: string;
  title: string;
  score: number;
  max: number;
  label: "Strong" | "Average" | "Developing";
  tone: CompetencyTone;
  summary: string;
  example: string;
  improvement: string;
};

export type SessionEvaluation = {
  overallScore: number;
  overallMax: number;
  band: "Great" | "Solid" | "Growing";
  summary: string;
  scorecardLabel: string;
  competencies: CompetencyBlock[];
};

export type SessionReportStored = {
  version: 1;
  sessionId: string;
  kind: SimulationReportKind;
  scenarioTitle: string;
  learnerName: string;
  learnerInitials: string;
  interviewerName: string;
  interviewerTitle: string;
  endedAt: string;
  metrics: SessionMetrics;
  transcript: ReportTranscriptLine[];
  evaluation: SessionEvaluation;
  /** Present for video when capture succeeded */
  recording?: Blob;
  recordingMime?: string;
};

const DB_NAME = "squinia-simulation-reports";
const DB_VERSION = 1;
const STORE = "sessionReports";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
  });
}

export async function saveSessionReport(data: SessionReportStored): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    tx.objectStore(STORE).put(data, data.sessionId);
  });
  db.close();
}

export async function loadSessionReport(sessionId: string): Promise<SessionReportStored | null> {
  const db = await openDb();
  const row = await new Promise<SessionReportStored | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const rq = tx.objectStore(STORE).get(sessionId);
    rq.onsuccess = () => resolve(rq.result as SessionReportStored | undefined);
    rq.onerror = () => reject(rq.error ?? new Error("IndexedDB read failed"));
  });
  db.close();
  return row ?? null;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function formatMetricDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function hashSeed(parts: (string | number)[]): number {
  const s = parts.join("|");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildMetrics(kind: SimulationReportKind, elapsedSec: number, messageCount: number): SessionMetrics {
  const seed = hashSeed([kind, elapsedSec, messageCount]);
  const ht = Math.max(9, elapsedSec);
  const delta = -(120 + (seed % 720));
  const frt = 12 + (seed % 48);
  const art = 6 + (seed % 22);
  const tr = 42 + (seed % 40);
  const lm = Math.min(ht, 8 + (seed % 52));
  return {
    handlingTimeSec: ht,
    handlingDeltaSec: delta,
    frtSec: frt,
    artSec: art,
    transferRatePct: tr,
    lastMessageSec: lm,
  };
}

function buildCompetencies(seed: number, kind: SimulationReportKind): CompetencyBlock[] {
  const tone = (i: number): CompetencyTone =>
    (seed + i) % 5 === 0 ? "warn" : (seed + i) % 7 === 0 ? "neutral" : "success";
  const label = (t: CompetencyTone): CompetencyBlock["label"] =>
    t === "success" ? "Strong" : t === "warn" ? "Average" : "Developing";
  const base: Omit<CompetencyBlock, "score" | "label" | "tone">[] = [
    {
      id: "c1",
      title: "Proactive initiative",
      max: 20,
      summary:
        "You surfaced next steps early and proposed a concrete follow-up without waiting to be prompted. In a live " +
        kind +
        " room, that reduces rework and keeps the stakeholder oriented.",
      example:
        "Strong moments are when you name the decision, the owner, and the timeline in one breath — even if the plan is tentative.",
      improvement:
        "Next time, lead with the single risk you want leadership to absorb first, then expand outward only if they invite depth.",
    },
    {
      id: "c2",
      title: "Communication of reasoning",
      max: 20,
      summary:
        "Your reasoning was mostly clear; a few transitions compressed cause and effect. Tightening the chain from signal → implication → ask would read as more executive-ready.",
      example:
        "Good pattern: “Here is what changed, here is what it implies for the milestone, here is what I need from you.”",
      improvement:
        "Replace long setup with one crisp headline, then offer detail as an optional branch (“I can go deeper on X if useful”).",
    },
    {
      id: "c3",
      title: "Adaptive problem solving",
      max: 20,
      summary:
        "You adjusted when the conversation shifted, and you avoided getting stuck on a single framing. That flexibility is visible in how you re-anchored to outcomes.",
      example:
        "You reframed blockers as choices with tradeoffs rather than dead ends.",
      improvement:
        "When surprised by a question, pause with a one-line acknowledgement before answering — it reads as composed, not evasive.",
    },
    {
      id: "c4",
      title: "Professional presence",
      max: 20,
      summary:
        "Tone stayed constructive under time pressure. Minor tightening on pacing would make the same content feel more decisive.",
      example:
        "You kept answers bounded to the timebox without sounding curt.",
      improvement:
        "Practice ending answers with a deliberate close: recommendation + next step + question.",
    },
  ];
  return base.map((b, i) => {
    const t = tone(i);
    const max = b.max;
    const score =
      t === "success" ? 16 + ((seed + i) % 5) : t === "warn" ? 11 + ((seed + i) % 5) : 8 + ((seed + i) % 5);
    return {
      ...b,
      score: Math.min(max, score),
      label: label(t),
      tone: t,
    };
  });
}

export function buildEvaluation(
  kind: SimulationReportKind,
  elapsedSec: number,
  transcriptLines: number,
  scorecardLabel: string,
): SessionEvaluation {
  const seed = hashSeed([kind, elapsedSec, transcriptLines]);
  const competencies = buildCompetencies(seed, kind);
  const sum = competencies.reduce((a, c) => a + c.score, 0);
  const max = competencies.reduce((a, c) => a + c.max, 0);
  const overall = Math.min(max, Math.round(sum * (0.92 + (seed % 8) / 100)));
  const band: SessionEvaluation["band"] =
    overall >= 82 ? "Great" : overall >= 68 ? "Solid" : "Growing";
  const summary =
    band === "Great"
      ? "Strong overall performance: you were structured, specific, and outcome-oriented. The main growth edge is tightening how you communicate technical tradeoffs to a non-expert listener in fewer sentences."
      : band === "Solid"
        ? "Solid performance with clear strengths in pacing and professionalism. Improve by making your asks more explicit and by closing each thread with a crisp decision summary."
        : "Good foundation. Focus next on clarity under pressure: shorter headlines, clearer asks, and one explicit next step per answer.";

  return {
    overallScore: overall,
    overallMax: max,
    band,
    summary,
    scorecardLabel,
    competencies,
  };
}

export function buildStoredChatReport(args: {
  sessionId: string;
  scenarioTitle: string;
  learnerName: string;
  interviewerName: string;
  interviewerTitle: string;
  scorecardLabel: string;
  lines: { id: string; role: "ai" | "user"; text: string; offsetSec: number }[];
  elapsedSec: number;
}): SessionReportStored {
  const transcript: ReportTranscriptLine[] = args.lines.map((l) => {
    const isNote = l.role === "user" && l.text.startsWith("Note —");
    const body = isNote ? l.text.replace(/^Note —\s*/, "") : l.text;
    return {
      id: l.id,
      role: l.role === "ai" ? "interviewer" : "learner",
      name:
        l.role === "ai"
          ? args.interviewerName
          : isNote
            ? `${args.learnerName} · note`
            : args.learnerName,
      title: l.role === "ai" ? args.interviewerTitle : undefined,
      text: body,
      offsetSec: l.offsetSec,
    };
  });
  const metrics = buildMetrics("chat", args.elapsedSec, transcript.length);
  const evaluation = buildEvaluation(
    "chat",
    args.elapsedSec,
    transcript.filter((t) => !t.name.includes("note")).length,
    args.scorecardLabel,
  );
  return {
    version: 1,
    sessionId: args.sessionId,
    kind: "chat",
    scenarioTitle: args.scenarioTitle,
    learnerName: args.learnerName,
    learnerInitials: initialsFromName(args.learnerName),
    interviewerName: args.interviewerName,
    interviewerTitle: args.interviewerTitle,
    endedAt: new Date().toISOString(),
    metrics,
    transcript,
    evaluation,
  };
}

export function buildStoredPhoneReport(args: {
  sessionId: string;
  scenarioTitle: string;
  learnerName: string;
  callerName: string;
  callerSubtitle: string;
  callElapsedSec: number;
  scorecardLabel: string;
  recording?: Blob | null;
  recordingMime?: string;
}): SessionReportStored {
  const hasAudio = Boolean(args.recording && args.recording.size > 0);
  const transcript: ReportTranscriptLine[] = [
    {
      id: "phone-1",
      role: "interviewer",
      name: args.callerName,
      title: args.callerSubtitle,
      text: hasAudio
        ? "This line will be replaced by your telephony transcript when the dialer API is connected. Your learner-side microphone is already captured in the replay above."
        : "Voice transcript and turn-by-turn timing will appear here once your telephony pipeline is connected.",
      offsetSec: 0,
    },
    {
      id: "phone-2",
      role: "learner",
      name: args.learnerName,
      text: hasAudio
        ? "Your microphone was recorded for this session. Use the audio replay to review tone, pacing, and clarity."
        : "Session completed in the phone simulation room.",
      offsetSec: Math.min(args.callElapsedSec, 1),
    },
  ];
  const metrics = buildMetrics("phone", args.callElapsedSec, 2);
  const evaluation = buildEvaluation("phone", args.callElapsedSec, 2, args.scorecardLabel);
  const out: SessionReportStored = {
    version: 1,
    sessionId: args.sessionId,
    kind: "phone",
    scenarioTitle: args.scenarioTitle,
    learnerName: args.learnerName,
    learnerInitials: initialsFromName(args.learnerName),
    interviewerName: args.callerName,
    interviewerTitle: args.callerSubtitle,
    endedAt: new Date().toISOString(),
    metrics,
    transcript,
    evaluation,
  };
  if (hasAudio && args.recording) {
    out.recording = args.recording;
    out.recordingMime = (args.recordingMime ?? args.recording.type) || "audio/webm";
  }
  return out;
}

export function buildStoredVideoReport(args: {
  sessionId: string;
  scenarioTitle: string;
  learnerName: string;
  remoteName: string;
  remoteRole: string;
  callElapsedSec: number;
  scorecardLabel: string;
  recording: Blob | null;
  recordingMime?: string;
}): SessionReportStored {
  const transcript: ReportTranscriptLine[] = [
    {
      id: "vid-1",
      role: "interviewer",
      name: args.remoteName,
      title: args.remoteRole,
      text: "Video session transcript will sync from your realtime provider. Review the recording on the left for pacing, framing, and presence.",
      offsetSec: 0,
    },
    {
      id: "vid-2",
      role: "learner",
      name: args.learnerName,
      text: "Learner camera and optional screen capture were recorded locally for this preview.",
      offsetSec: Math.min(args.callElapsedSec, 1),
    },
  ];
  const metrics = buildMetrics("video", args.callElapsedSec, 2);
  const evaluation = buildEvaluation("video", args.callElapsedSec, 2, args.scorecardLabel);
  const out: SessionReportStored = {
    version: 1,
    sessionId: args.sessionId,
    kind: "video",
    scenarioTitle: args.scenarioTitle,
    learnerName: args.learnerName,
    learnerInitials: initialsFromName(args.learnerName),
    interviewerName: args.remoteName,
    interviewerTitle: args.remoteRole,
    endedAt: new Date().toISOString(),
    metrics,
    transcript,
    evaluation,
  };
  if (args.recording && args.recording.size > 0) {
    out.recording = args.recording;
    out.recordingMime = (args.recordingMime ?? args.recording.type) || "video/webm";
  }
  return out;
}

export function downloadEvaluationJson(report: SessionReportStored, filenameBase: string) {
  const { recording: _r, ...rest } = report;
  const json = JSON.stringify(rest, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}-evaluation.json`;
  a.click();
  URL.revokeObjectURL(url);
}
