"use client";

import { useRouter } from "next/navigation";

import type { SimulationKind } from "../_lib/attempt-id";
import { appendAttemptToScenarioId, buildSimulationPath, newAttemptToken } from "../_lib/attempt-id";

type Props = {
  scenarioId: string;
  kind: SimulationKind;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
};

/**
 * Navigates to a new simulation attempt (unique session id per click) so each run gets its own report.
 */
export function StartSimulationButton({
  scenarioId,
  kind,
  className,
  children,
  disabled,
  title,
}: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      title={title}
      onClick={() => {
        if (disabled) return;
        const fullSessionId = appendAttemptToScenarioId(scenarioId, newAttemptToken());
        router.push(buildSimulationPath(fullSessionId, kind));
      }}
    >
      {children}
    </button>
  );
}
