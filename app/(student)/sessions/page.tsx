import Link from "next/link";

import { RECENT_SESSIONS } from "../_lib/student-mock-data";
import { SessionsTable } from "./sessions-table";

export default function SessionsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Session history</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Simulations are grouped by scenario. Click a scenario to expand and open the report for any attempt. Preview
          data until your API backs this list.
        </p>
      </div>

      <SessionsTable rows={RECENT_SESSIONS} />

      <p className="text-[13px] leading-relaxed text-[var(--muted)]">
        Reports load from this browser for sessions you have finished here (same session id). After you run a
        simulation from <Link href="/scenarios" className="font-medium text-[#111111] underline underline-offset-2">Scenarios</Link>, open its report from this list.
      </p>
    </div>
  );
}
