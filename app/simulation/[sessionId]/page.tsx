import type { Metadata } from "next";
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

  return (
    <SimulationScreen
      sessionId={sessionId}
      personaName="Julia Merrick"
      personaTitle="Technical team lead"
      scenarioTitle="Weekly update for leadership"
      meta={{
        language: "English",
        channel: "Live transcript",
        difficulty: "Medium",
        scorecard: "Behavioral capstone",
        learnerRole: "AI engineer — learner",
        learnerContext: "2025-02 · AI engineering bootcamp",
        personaBlurb: "Mid-20s technical lead, direct, fair, and pressed for time.",
      }}
    />
  );
}
