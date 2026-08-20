import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Experience {
  id: string;
  slug: string;
  base_price_per_person: number;
  photos: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export type ExperienceLang = "pt" | "en" | "es" | "fr" | "de";

export const EXPERIENCE_LANGS: ExperienceLang[] = ["pt", "en", "es", "fr", "de"];

export type ExperienceTextField =
  | "category"
  | "name"
  | "short_description"
  | "full_description"
  | "duration_label"
  | "what_to_wear"
  | "what_to_bring"
  | "operational_notes";

/** Lê um campo traduzível com fallback para português. */
export const localizedField = (
  experience: Experience | null | undefined,
  field: ExperienceTextField,
  language: string
): string => {
  if (!experience) return "";
  const lang = (EXPERIENCE_LANGS as string[]).includes(language.slice(0, 2))
    ? (language.slice(0, 2) as ExperienceLang)
    : "pt";
  const value = experience[`${field}_${lang}`];
  if (typeof value === "string" && value.trim()) return value;
  const fallback = experience[`${field}_pt`];
  return typeof fallback === "string" ? fallback : "";
};

const normalize = (rows: unknown[]): Experience[] =>
  (rows as Experience[]).map((row) => ({
    ...row,
    photos: Array.isArray(row.photos) ? row.photos : [],
    base_price_per_person: Number(row.base_price_per_person) || 0,
  }));

const fetchExperiences = async (onlyActive: boolean) => {
  let query = supabase
    .from("experiences")
    .select("*")
    .order("display_order", { ascending: true });

  if (onlyActive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return normalize(data ?? []);
};

const useExperiencesBase = (onlyActive: boolean) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setExperiences(await fetchExperiences(onlyActive));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar experiências");
    } finally {
      setLoading(false);
    }
  }, [onlyActive]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { experiences, loading, error, refetch };
};

/** Experiências ativas para a página pública. */
export const useExperiences = () => useExperiencesBase(true);

/** Todas as experiências, para o dashboard admin. */
export const useExperiencesAdmin = () => useExperiencesBase(false);
