import type { Metadata } from "next";
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

  return (
    <PhoneSimulationScreen
      sessionId={sessionId}
      scenarioTitle="Weekly update check-in"
      callerName="Matty"
      callerNumber="+1 (573) 425-7038"
      learnerName="Ephraim"
    />
  );
}
