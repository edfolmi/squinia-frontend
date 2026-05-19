import type { Metadata } from "next";

import { VettingAttemptDetailClient } from "./vetting-attempt-detail-client";

export const metadata: Metadata = {
  title: "Vetting Result - Squinia",
  description: "Review a Squinia Vetting candidate result.",
};

export default async function VettingAttemptDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <VettingAttemptDetailClient attemptId={attemptId} />;
}
