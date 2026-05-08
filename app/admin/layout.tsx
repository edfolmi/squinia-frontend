import { AdminShell } from "./_components/admin-shell";

export const metadata = {
  title: "Platform Admin | Squinia",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
