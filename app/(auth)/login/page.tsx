import Link from "next/link";

import { AuthShell } from "../_components/auth-shell";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your work email and password."
      footer={
        <p>
          New here?{" "}
          <Link href="/register" className="font-medium text-[#111111] underline underline-offset-2">
            Create an account
          </Link>
          {" · "}
          <Link href="/forgot-password" className="font-medium text-[#111111] underline underline-offset-2">
            Forgot password
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
