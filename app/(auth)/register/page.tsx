import Link from "next/link";

import { AuthShell } from "../_components/auth-shell";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Join your cohort on Squinia with your work email."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#111111] underline underline-offset-2">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
