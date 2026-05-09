"use client";

export type RubricBoardItemApi = {
  id: string;
  rubric_board_id: string;
  criterion: string;
  description?: string | null;
  max_score: number;
  weight: number;
  sort_order: number;
};

export type RubricBoardApi = {
  id: string;
  tenant_id: string;
  created_by: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  items: RubricBoardItemApi[];
  updated_at?: string;
};

export function sortedRubricItems<T extends { sort_order?: number; id?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.id ?? "").localeCompare(String(b.id ?? "")));
}
