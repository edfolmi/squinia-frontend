"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { SimulationKind } from "../_lib/attempt-id";
import { appendAttemptToScenarioId, buildSimulationPath, newAttemptToken } from "../_lib/attempt-id";
import { startBackendSimulationSession } from "../_lib/backend-simulation";

type Props = {
  scenarioId: string;
  kind: SimulationKind;
  cohortId?: string | null;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
};

const backendSessionsEnabled = () => process.env.NEXT_PUBLIC_USE_BACKEND_SESSIONS === "1";

/**
 * Navigates to a simulation attempt. With `NEXT_PUBLIC_USE_BACKEND_SESSIONS=1`, creates
 * `POST /api/v1/sessions` first so phone/video can join LiveKit; TEXT chat uses HTTP `/opening` and `/chat`.
 */
export function StartSimulationButton({
  scenarioId,
  kind,
  cohortId,
  className,
  children,
  disabled,
  title,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || busy}
      title={title}
      onClick={() => {
        if (disabled || busy) return;
        if (backendSessionsEnabled()) {
          setBusy(true);
          void (async () => {
            const mode = kind === "phone" ? "VOICE" : kind === "video" ? "VIDEO" : "TEXT";
            const selectedCohortId =
              cohortId !== undefined
                ? cohortId
                : typeof window !== "undefined"
                  ? window.localStorage.getItem("squinia:selectedCohortId")
                  : null;
            const started = await startBackendSimulationSession({ scenarioId, mode, cohortId: selectedCohortId });
            setBusy(false);
            if (!started) return;
            router.push(buildSimulationPath(started.session_id, kind));
          })();
          return;
        }
        const fullSessionId = appendAttemptToScenarioId(scenarioId, newAttemptToken());
        router.push(buildSimulationPath(fullSessionId, kind));
      }}
    >
      {children}
    </button>
  );
}
