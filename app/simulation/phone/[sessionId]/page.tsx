import type { Metadata } from "next";

import { getPhoneRuntimeProps } from "../../_lib/scenario-library";
import { PhoneSimulationScreen } from "./phone-simulation-screen";

export const metadata: Metadata = {
  title: "Phone simulation · Squinia",
  description: "Voice call training room",
};

export default async function PhoneSimulationPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const props = getPhoneRuntimeProps(sessionId);

  return (
    <PhoneSimulationScreen
      sessionId={sessionId}
      scenarioTitle={props.scenarioTitle}
      callerName={props.callerName}
      callerNumber={props.callerNumber}
      learnerName={props.learnerName}
    />
  );
}
