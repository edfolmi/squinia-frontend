import type { Metadata } from "next";

import { OrgAppShell } from "./_components/org-app-shell";

export const metadata: Metadata = {
  title: "Organization · Squinia",
  description: "Cohorts, scenarios, assignments, and analytics for bootcamp operators",
};

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <OrgAppShell>{children}</OrgAppShell>;
}
