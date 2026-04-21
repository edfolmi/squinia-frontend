import type { Metadata } from "next";

import { StudentSettingsNav } from "./student-settings-nav";

export const metadata: Metadata = {
  title: "Account settings · Squinia",
  description: "Profile, organization, members, and billing",
};

export default function StudentSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <StudentSettingsNav />
      {children}
    </div>
  );
}
