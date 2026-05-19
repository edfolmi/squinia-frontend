import type { Metadata } from "next";

import { VettingLandingClient } from "./vetting-landing-client";

export const metadata: Metadata = {
  title: "Vetting Assessment - Squinia",
  description: "Complete a branded soft-skill vetting scenario.",
};

export default async function VettingPublicPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;
  return <VettingLandingClient publicSlug={publicSlug} />;
}
