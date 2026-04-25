/**
 * Deterministic UUIDs for demo scenario **slugs** (`published-phone-1`, …).
 * Kept in sync with ``squinia-backend/scripts/seed_demo_simulation_data.py`` via
 * ``uuid.uuid5(UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8"), "squinia.demo.v1:" + slug)``.
 *
 * ``POST /api/v1/sessions`` requires a UUID ``scenario_id``; mock hubs still use slug ids.
 */
export const DEMO_BACKEND_SCENARIO_UUID: Record<string, string> = {
  "published-phone-1": "fd0675f1-5252-5044-b11f-71d55abc626b",
  "published-video-1": "ecab85b2-c3a0-57bf-b6e6-12b925d9d635",
  "published-weekly": "de219052-a610-5bd6-a8b5-2d8c422700c7",
  "published-chat-escalation": "c558c74f-b61a-5cf6-a600-2a9d6dbc0a87",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve slug or pass through an existing UUID for ``POST /sessions``. */
export function scenarioIdForSessionApi(slugOrUuid: string): string {
  const t = slugOrUuid.trim();
  if (UUID_RE.test(t)) return t.toLowerCase();
  return DEMO_BACKEND_SCENARIO_UUID[t] ?? t;
}
