import type { Metadata } from "next";

import { SettingsAppShell } from "./_components/settings-app-shell";

export const metadata: Metadata = {
  title: "Settings · Squinia",
  description: "Profile, organization, members, and billing",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsAppShell>{children}</SettingsAppShell>;
}
