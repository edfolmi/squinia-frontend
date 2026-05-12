"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ASSIGNMENT_RULES_STORAGE_KEY,
  getEffectiveAssignmentRules,
  type AssignmentRules,
} from "../../_lib/assignment-rules-storage";

export const ASSIGNMENT_RULES_CHANGED_EVENT = "squinia-assignment-rules-changed" as const;

export function dispatchAssignmentRulesChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ASSIGNMENT_RULES_CHANGED_EVENT));
  }
}

export function useEffectiveAssignmentRules(assignmentId: string, defaults: AssignmentRules): AssignmentRules {
  const defaultRules = useMemo(
    () => ({
      maxAttempts: defaults.maxAttempts,
      minScorePercent: defaults.minScorePercent,
    }),
    [defaults.maxAttempts, defaults.minScorePercent],
  );
  const [rules, setRules] = useState<AssignmentRules>(defaultRules);

  const refresh = useCallback(() => {
    setRules(getEffectiveAssignmentRules(assignmentId, defaultRules));
  }, [assignmentId, defaultRules]);

  useEffect(() => {
    const timeout = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timeout);
  }, [refresh]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.storageArea === localStorage && e.key === ASSIGNMENT_RULES_STORAGE_KEY) refresh();
    }
    function onCustom() {
      refresh();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(ASSIGNMENT_RULES_CHANGED_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ASSIGNMENT_RULES_CHANGED_EVENT, onCustom);
    };
  }, [refresh]);

  return rules;
}
