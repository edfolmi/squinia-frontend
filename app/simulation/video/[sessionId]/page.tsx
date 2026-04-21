import type { Metadata } from "next";
import { VideoSimulationScreen } from "./video-simulation-screen";

export const metadata: Metadata = {
  title: "Video simulation · Squinia",
  description: "Video call training room",
};

export default async function VideoSimulationPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <VideoSimulationScreen
      sessionId={sessionId}
      scenarioTitle="Stakeholder video review"
      remoteName="Geet Huberman"
      remoteRole="Executive interviewer"
      learnerName="Ephraim"
      personaBlurb="Direct, time-boxed, and listening for structure under pressure. This room uses your real camera and microphone — nothing is uploaded until you wire the API."
    />
  );
}
