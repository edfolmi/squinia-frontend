import type { Metadata } from "next";

import { AuthPortalSync } from "./_components/auth-portal-sync";

export const metadata: Metadata = {
  title: "Account · Squinia",
  description: "Sign in, register, and manage your Squinia account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthPortalSync />
      {children}
    </>
  );
}
