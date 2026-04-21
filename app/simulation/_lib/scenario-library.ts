import type { SimulationSessionMeta } from "../[sessionId]/simulation-screen";

import { parseAttemptSessionId } from "./attempt-id";

export type ChatRuntimeProps = {
  personaName: string;
  personaTitle: string;
  scenarioTitle: string;
  learnerName: string;
  meta: SimulationSessionMeta;
};

const CHAT_DEFAULT: ChatRuntimeProps = {
  personaName: "Julia Merrick",
  personaTitle: "Technical team lead",
  scenarioTitle: "Practice simulation",
  learnerName: "Ephraim Daniel",
  meta: {
    language: "English",
    channel: "Live transcript",
    difficulty: "Medium",
    scorecard: "Behavioral capstone",
    learnerRole: "Learner",
    learnerContext: "Preview cohort",
    personaBlurb: "Direct, fair, and pressed for time.",
  },
};

const CHAT_SCENARIOS: Record<string, ChatRuntimeProps> = {
  "published-weekly": {
    personaName: "Julia Merrick",
    personaTitle: "Technical team lead",
    scenarioTitle: "Weekly update for leadership",
    learnerName: "Ephraim Daniel",
    meta: {
      language: "English",
      channel: "Live transcript",
      difficulty: "Medium",
      scorecard: "Behavioral capstone",
      learnerRole: "AI engineer — learner",
      learnerContext: "2025-02 · AI engineering bootcamp",
      personaBlurb: "Mid-20s technical lead, direct, fair, and pressed for time.",
    },
  },
  "published-chat-escalation": {
    personaName: "Jordan Lee",
    personaTitle: "Customer success lead",
    scenarioTitle: "Customer escalation thread",
    learnerName: "Ephraim Daniel",
    meta: {
      language: "English",
      channel: "Live transcript",
      difficulty: "Beginner",
      scorecard: "Service recovery",
      learnerRole: "Support engineer — learner",
      learnerContext: "Escalation handling track",
      personaBlurb: "Calm, policy-aware, and focused on clear next steps with the customer.",
    },
  },
};

export type PhoneRuntimeProps = {
  scenarioTitle: string;
  callerName: string;
  callerNumber: string;
  learnerName: string;
};

const PHONE_SCENARIOS: Record<string, PhoneRuntimeProps> = {
  "published-phone-1": {
    scenarioTitle: "Weekly update check-in",
    callerName: "Matty",
    callerNumber: "+1 (573) 425-7038",
    learnerName: "Ephraim",
  },
};

export type VideoRuntimeProps = {
  scenarioTitle: string;
  remoteName: string;
  remoteRole: string;
  learnerName: string;
  personaBlurb: string;
};

const VIDEO_SCENARIOS: Record<string, VideoRuntimeProps> = {
  "published-video-1": {
    scenarioTitle: "Stakeholder video review",
    remoteName: "Geet Huberman",
    remoteRole: "Executive interviewer",
    learnerName: "Ephraim",
    personaBlurb:
      "Direct, time-boxed, and listening for structure under pressure. This room uses your real camera and microphone — nothing is uploaded until you wire the API.",
  },
};

export function getChatRuntimeProps(sessionId: string): ChatRuntimeProps {
  const { scenarioId } = parseAttemptSessionId(sessionId);
  return CHAT_SCENARIOS[scenarioId] ?? CHAT_DEFAULT;
}

export function getPhoneRuntimeProps(sessionId: string): PhoneRuntimeProps {
  const { scenarioId } = parseAttemptSessionId(sessionId);
  return (
    PHONE_SCENARIOS[scenarioId] ?? {
      scenarioTitle: "Phone simulation",
      callerName: "Interviewer",
      callerNumber: "—",
      learnerName: "Ephraim",
    }
  );
}

export function getVideoRuntimeProps(sessionId: string): VideoRuntimeProps {
  const { scenarioId } = parseAttemptSessionId(sessionId);
  return (
    VIDEO_SCENARIOS[scenarioId] ?? {
      scenarioTitle: "Video simulation",
      remoteName: "Interviewer",
      remoteRole: "Reviewer",
      learnerName: "Ephraim",
      personaBlurb: "Preview scenario — connect your API for custom personas.",
    }
  );
}
