import type { Metadata } from "next";

import { OrgVettingDashboardClient } from "./vetting-dashboard-client";

export const metadata: Metadata = {
  title: "Vetting - Squinia",
  description: "Create and manage soft-skill candidate vetting assessments.",
};

export default function OrgVettingPage() {
  return <OrgVettingDashboardClient />;
}
