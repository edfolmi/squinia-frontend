"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { v1 } from "@/app/_lib/v1-client";

import type { AgentPersonaApi, PersonaGender } from "../_lib/agent-personas";
import { VOICE_OPTIONS } from "../_lib/agent-personas";
import { PersonaAvatar } from "./persona-avatar";

type Props = {
  mode: "new" | "edit";
  initial?: AgentPersonaApi | null;
};

type SaveResult = { persona: AgentPersonaApi };

const genders: { value: PersonaGender; label: string }[] = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "UNSPECIFIED", label: "Unspecified" },
];

const MAX_AVATAR_BYTES = 750 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function AgentPersonaForm({ mode, initial }: Props) {
  const router = useRouter();
  const base = useMemo<AgentPersonaApi>(
    () =>
      initial ?? {
        id: "new",
        name: "",
        title: "",
        gender: "UNSPECIFIED",
        avatar_url: "",
        voice_provider: "deepgram",
        voice_id: "",
        personality: "",
        communication_style: "",
        background: "",
        is_default: false,
      },
    [initial],
  );

  const [name, setName] = useState(base.name);
  const [title, setTitle] = useState(base.title ?? "");
  const [gender, setGender] = useState<PersonaGender>(base.gender ?? "UNSPECIFIED");
  const [avatarUrl, setAvatarUrl] = useState(base.avatar_url ?? "");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [voiceId, setVoiceId] = useState(base.voice_id ?? "");
  const [personality, setPersonality] = useState(base.personality ?? "");
  const [communicationStyle, setCommunicationStyle] = useState(base.communication_style ?? "");
  const [background, setBackground] = useState(base.background ?? "");
  const [isDefault, setIsDefault] = useState(Boolean(base.is_default));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onAvatarFile(file: File | null) {
    setError(null);
    if (!file) return;
    if (!AVATAR_TYPES.has(file.type)) {
      setError("Please upload a JPG, PNG, WEBP, or GIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Please choose an image smaller than 750 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
        setAvatarFileName(file.name);
      }
    };
    reader.onerror = () => setError("We could not read that image. Please try another file.");
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = {
      name,
      title: title || undefined,
      gender,
      avatar_url: avatarUrl || undefined,
      voice_provider: "deepgram",
      voice_id: voiceId || undefined,
      personality: personality || undefined,
      communication_style: communicationStyle || undefined,
      background: background || undefined,
      is_default: isDefault,
      meta: {},
    };
    try {
      const res =
        mode === "new"
          ? await v1.post<SaveResult>("agent-personas", payload)
          : await v1.patch<SaveResult>(`agent-personas/${base.id}`, payload);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      if (mode === "new") {
        router.push(`/org/personas/${res.data.persona.id}/edit`);
      } else {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <PersonaAvatar name={name || "Persona"} src={avatarUrl} size="lg" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">
              {name || "New persona"}
            </h2>
            <p className="mt-1 text-[14px] text-[var(--muted)]">{title || "Reusable simulation partner"}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="personaName" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Name
            </label>
            <input
              id="personaName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Julia Merrick"
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div>
            <label htmlFor="personaTitle" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Role title
            </label>
            <input
              id="personaTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Technical team lead"
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div>
            <label htmlFor="personaGender" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Presentation
            </label>
            <select
              id="personaGender"
              value={gender}
              onChange={(e) => setGender(e.target.value as PersonaGender)}
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            >
              {genders.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="voice" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Call voice
            </label>
            <select
              id="voice"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.value || "auto"} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Avatar image
            </span>
            <div className="rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <PersonaAvatar name={name || "Persona"} src={avatarUrl} size="lg" />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="avatarFile"
                    className="inline-flex cursor-pointer items-center rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[13px] font-medium text-[#111111] transition-colors hover:bg-[var(--field)]"
                  >
                    Upload image
                  </label>
                  <input
                    id="avatarFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                  <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
                    JPG, PNG, WEBP, or GIF. Keep it under 750 KB.
                    {avatarFileName ? ` Selected: ${avatarFileName}` : ""}
                  </p>
                </div>
                {avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl("");
                      setAvatarFileName("");
                    }}
                    className="rounded-xl px-3 py-2 text-[12px] font-medium text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="personality" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Personality
            </label>
            <textarea
              id="personality"
              rows={3}
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Direct, fair, calm under pressure, asks for specifics."
              className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="style" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Communication style
            </label>
            <textarea
              id="style"
              rows={3}
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
              placeholder="Concise, realistic, asks one follow-up at a time."
              className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="background" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Background
            </label>
            <textarea
              id="background"
              rows={3}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Context the AI should remember whenever this persona is used."
              className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 rounded border-[var(--rule-strong)]" />
            <span className="text-[14px] text-[var(--muted)]">Use as the default persona for new scenarios</span>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={submitting} className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-50">
          {submitting ? "Saving..." : mode === "new" ? "Create persona" : "Save changes"}
        </button>
        {saved ? <p className="text-[13px] text-[#166534]">Changes saved.</p> : null}
      </div>
    </form>
  );
}
