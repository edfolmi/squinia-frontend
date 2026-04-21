import type { Metadata } from "next";

import { StudentAppShell } from "./_components/student-app-shell";

export const metadata: Metadata = {
  title: "Student · Squinia",
  description: "Dashboard, scenarios, sessions, and assigned simulations",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentAppShell>{children}</StudentAppShell>;
}
