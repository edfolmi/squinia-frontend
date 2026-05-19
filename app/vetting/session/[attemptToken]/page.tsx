import type { Metadata } from "next";

import { VettingSessionClient } from "./vetting-session-client";

export const metadata: Metadata = {
  title: "Live Assessment - Squinia Vetting",
  description: "Complete a live Squinia Vetting scenario.",
};

export default async function VettingSessionPage({
  params,
}: {
  params: Promise<{ attemptToken: string }>;
}) {
  const { attemptToken } = await params;
  return <VettingSessionClient attemptToken={attemptToken} />;
}
