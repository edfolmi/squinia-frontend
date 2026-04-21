import type { Metadata } from "next";

import { getChatRuntimeProps } from "../_lib/scenario-library";
import { SimulationScreen } from "./simulation-screen";

export const metadata: Metadata = {
  title: "Simulation · Squinia",
  description: "Live training environment",
};

export default async function SimulationPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const props = getChatRuntimeProps(sessionId);

  return (
    <SimulationScreen
      sessionId={sessionId}
      personaName={props.personaName}
      personaTitle={props.personaTitle}
      scenarioTitle={props.scenarioTitle}
      learnerName={props.learnerName}
      meta={props.meta}
    />
  );
}
