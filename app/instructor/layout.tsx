import type { Metadata } from "next";

import { InstructorAppShell } from "./_components/instructor-app-shell";

export const metadata: Metadata = {
  title: "Instructor · Squinia",
  description: "Configure assigned simulations and attempt rules",
};

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <InstructorAppShell>{children}</InstructorAppShell>;
}
