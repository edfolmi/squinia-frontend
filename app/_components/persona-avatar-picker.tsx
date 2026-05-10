"use client";

import { DEFAULT_PERSONA_AVATARS } from "../_lib/default-persona-avatars";

export function PersonaAvatarPicker({
  value,
  onSelect,
}: {
  value?: string | null;
  onSelect: (imageUrl: string) => void;
}) {
  return (
    <div className="grid max-w-md grid-cols-5 gap-3">
      {DEFAULT_PERSONA_AVATARS.map((avatar) => {
        const selected = value === avatar.image_url;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.image_url)}
            title={avatar.label}
            aria-label={`Choose ${avatar.label}`}
            aria-pressed={selected}
            className={`rounded-full border p-1 transition-colors ${
              selected
                ? "border-[var(--accent)] bg-[rgba(50,168,82,0.12)]"
                : "border-[var(--rule)] bg-[var(--surface)] hover:border-[var(--rule-strong)] hover:bg-[var(--field)]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar.image_url}
              alt=""
              className="aspect-square w-full rounded-full object-cover"
            />
          </button>
        );
      })}
    </div>
  );
}
