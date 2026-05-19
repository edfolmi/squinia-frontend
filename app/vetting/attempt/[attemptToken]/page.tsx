import type { Metadata } from "next";

import { VettingAttemptClient } from "./vetting-attempt-client";

export const metadata: Metadata = {
  title: "Assessment Attempt - Squinia Vetting",
  description: "Review and start a Squinia Vetting assessment.",
};

export default async function VettingAttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ attemptToken: string }>;
  searchParams: Promise<{ completed?: string }>;
}) {
  const { attemptToken } = await params;
  const query = await searchParams;
  return <VettingAttemptClient attemptToken={attemptToken} completed={query.completed === "1"} />;
}
