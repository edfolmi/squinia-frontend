"use client";

type Props = {
  error?: string | null;
  success?: string | null;
};

export function AuthFormMessage({ error, success }: Props) {
  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-[13px] text-red-900" role="alert">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="rounded-xl border border-[#166534]/30 bg-[#e6f4ea]/70 px-3 py-2 text-[13px] text-[#166534]">
        {success}
      </p>
    );
  }
  return null;
}
