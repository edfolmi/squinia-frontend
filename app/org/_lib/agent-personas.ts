"use client";

export type PersonaGender = "FEMALE" | "MALE" | "NON_BINARY" | "UNSPECIFIED";

export type AgentPersonaApi = {
  id: string;
  name: string;
  title?: string | null;
  gender: PersonaGender;
  avatar_url?: string | null;
  voice_provider?: string | null;
  voice_id?: string | null;
  personality?: string | null;
  communication_style?: string | null;
  background?: string | null;
  is_default?: boolean;
  updated_at?: string;
};

export const VOICE_OPTIONS = [
  { value: "", label: "Automatic voice" },
  { value: "aura-asteria-en", label: "Asteria - warm female" },
  { value: "aura-athena-en", label: "Athena - confident female" },
  { value: "aura-luna-en", label: "Luna - calm female" },
  { value: "aura-orion-en", label: "Orion - steady male" },
  { value: "aura-arcas-en", label: "Arcas - clear male" },
  { value: "aura-zeus-en", label: "Zeus - deep male" },
] as const;

export function personaInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? ""}`.toUpperCase();
}
