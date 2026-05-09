export type RuntimePersona = {
  name: string;
  title: string;
  avatarUrl: string;
  blurb: string;
};

export const DEFAULT_PERSONA: RuntimePersona = {
  name: "Interviewer",
  title: "Simulation partner",
  avatarUrl: "",
  blurb: "",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? ""}`.toUpperCase();
}

export function personaFromScenarioLike(source: unknown): RuntimePersona {
  const root = object(source);
  const config = object(root.config);
  let persona = object(root.persona);
  if (Object.keys(persona).length === 0) {
    persona = object(config.persona);
  }
  const name = text(persona.name) || text(config.persona_name) || DEFAULT_PERSONA.name;
  const title = text(persona.title) || text(config.persona_title) || text(config.persona_role) || DEFAULT_PERSONA.title;
  const blurb =
    text(persona.communication_style) ||
    text(persona.personality) ||
    text(config.persona_blurb) ||
    text(config.config_notes) ||
    "";
  return {
    name,
    title,
    avatarUrl: text(persona.avatar_url),
    blurb,
  };
}

export function PersonaAvatar({
  persona,
  className = "",
  imageClassName = "",
}: {
  persona: Pick<RuntimePersona, "name" | "avatarUrl">;
  className?: string;
  imageClassName?: string;
}) {
  if (persona.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={persona.avatarUrl}
        alt=""
        className={`${className} ${imageClassName} object-cover`}
      />
    );
  }
  return (
    <div className={className} aria-hidden>
      {initialsFromName(persona.name)}
    </div>
  );
}
