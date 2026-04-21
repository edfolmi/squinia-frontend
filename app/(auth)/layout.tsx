import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account · Squinia",
  description: "Sign in, register, and manage your Squinia account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
