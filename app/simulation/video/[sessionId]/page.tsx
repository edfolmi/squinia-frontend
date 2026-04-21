import type { Metadata } from "next";

import { getVideoRuntimeProps } from "../../_lib/scenario-library";
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
  const props = getVideoRuntimeProps(sessionId);

  return (
    <VideoSimulationScreen
      sessionId={sessionId}
      scenarioTitle={props.scenarioTitle}
      remoteName={props.remoteName}
      remoteRole={props.remoteRole}
      learnerName={props.learnerName}
      personaBlurb={props.personaBlurb}
    />
  );
}
