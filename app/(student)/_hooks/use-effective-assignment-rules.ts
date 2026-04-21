"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [rules, setRules] = useState<AssignmentRules>(defaults);

  const refresh = useCallback(() => {
    setRules(getEffectiveAssignmentRules(assignmentId, defaults));
  }, [assignmentId, defaults.maxAttempts, defaults.minScorePercent]);

  useEffect(() => {
    refresh();
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
