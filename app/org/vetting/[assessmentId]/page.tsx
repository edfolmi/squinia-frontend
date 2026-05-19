import type { Metadata } from "next";

import { VettingAssessmentDetailClient } from "./vetting-assessment-detail-client";

export const metadata: Metadata = {
  title: "Vetting Assessment - Squinia",
  description: "Manage a Squinia Vetting assessment.",
};

export default async function VettingAssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <VettingAssessmentDetailClient assessmentId={assessmentId} />;
}
