"use client";

import { useEffect, useId, useState } from "react";

export type SimulationFeedbackKind = "transcript" | "phone" | "video";

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function kindLabel(kind: SimulationFeedbackKind) {
  switch (kind) {
    case "transcript":
      return "Live transcript";
    case "phone":
      return "Phone call";
    case "video":
      return "Video call";
  }
}

/**
 * Flags an issue or sends feedback to the product team (client-side placeholder until API wiring).
 */
export function SimulationTeamFeedbackDialog({
  open,
  onClose,
  kind,
  sessionId,
}: {
  open: boolean;
  onClose: () => void;
  kind: SimulationFeedbackKind;
  sessionId: string;
}) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const messageId = useId();

  useEffect(() => {
    if (!open) {
      setMessage("");
      setSent(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function submit() {
    setSent(true);
    window.setTimeout(() => {
      onClose();
    }, 2000);
  }

  const sessionShort = sessionId.length > 12 ? `${sessionId.slice(0, 8)}…` : sessionId;

  return (
    <div
      className="sim-fade-in fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-feedback-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-[#111111]/35 backdrop-blur-[2px]"
        aria-label="Close feedback"
        onClick={onClose}
      />
      <div className="relative z-[1] w-full max-w-md rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-6 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.25)] sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
          aria-label="Close"
        >
          <IconClose />
        </button>

        {sent ? (
          <div className="pr-10" role="status" aria-live="polite">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
              Sent
            </p>
            <h2
              id="team-feedback-title"
              className="mt-3 text-xl font-semibold tracking-[-0.02em] text-[#111111]"
            >
              Thanks — we got it
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
              Your note has been queued for the Squinia team and will surface in our support channel
              shortly. Thank you for the feedback.
            </p>
          </div>
        ) : (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
              Flag for team
            </p>
            <h2
              id="team-feedback-title"
              className="mt-3 pr-10 text-xl font-semibold tracking-[-0.02em] text-[#111111]"
            >
              Send feedback to our team
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
              Describe what went wrong or what we should know. Your report goes
              straight to our on-call channel for immediate triage. Session{" "}
              <span className="font-mono text-[12px] text-[#111111]">{sessionShort}</span> ·{" "}
              {kindLabel(kind)}.
            </p>
            <label htmlFor={messageId} className="mt-6 block text-[13px] font-medium text-[#111111]">
              Your message
            </label>
            <textarea
              id={messageId}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="e.g. Audio glitch at 2:00, unclear prompt, accessibility issue…"
              className="sim-transition mt-2 w-full resize-none rounded-xl border border-[var(--rule-strong)] bg-[var(--field)] px-4 py-3 text-[15px] leading-relaxed text-[#111111] placeholder:text-[var(--faint)] focus-visible:border-[var(--rule-strong)] focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
            <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="sim-transition cursor-pointer rounded-xl border border-[var(--rule-strong)] bg-transparent px-5 py-2.5 text-[13px] font-medium text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!message.trim()}
                className={`sim-transition rounded-xl px-5 py-2.5 text-[13px] font-semibold ${
                  message.trim()
                    ? "sim-btn-accent cursor-pointer"
                    : "cursor-not-allowed rounded-xl border border-[var(--rule)] bg-[var(--field)] text-[var(--faint)] opacity-80"
                }`}
              >
                Send to team
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
