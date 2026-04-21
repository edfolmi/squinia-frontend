import Link from "next/link";

import { AuthShell } from "../_components/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="We will email you a secure link to choose a new password."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-[#111111] underline underline-offset-2">
            Back to sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
