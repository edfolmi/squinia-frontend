import type { Metadata } from "next";

import { SimulationReportScreen } from "../../_components/simulation-report-screen";

export const metadata: Metadata = {
  title: "Simulation report · Squinia",
  description: "Transcript, recording, and evaluation",
};

export default async function SimulationReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { sessionId } = await params;
  const sp = await searchParams;

  return <SimulationReportScreen sessionId={sessionId} kindHint={sp.kind} />;
}
