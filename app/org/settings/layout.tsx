import type { Metadata } from "next";

import { OrgSettingsNav } from "./org-settings-nav";

export const metadata: Metadata = {
  title: "Organization settings · Squinia",
  description: "Organization account, members, billing, and branding",
};

export default function OrgSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <OrgSettingsNav />
      {children}
    </div>
  );
}
