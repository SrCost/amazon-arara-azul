import { format } from "date-fns";

/**
 * Postgres DATE chega no frontend como "YYYY-MM-DD".
 * `new Date("YYYY-MM-DD")` é interpretado como UTC e pode “voltar um dia” em timezones negativos (ex.: Brasil).
 * Este helper força interpretação em horário local para evitar falsos conflitos e datas exibidas incorretamente.
 */
export const parseDateOnly = (value: string): Date => {
  if (!value) return new Date(NaN);
  // Se já vier com horário, preserva
  if (value.includes("T")) return new Date(value);
  // Sem "Z" => interpretado como horário local
  return new Date(`${value}T00:00:00`);
};

export const formatDateOnly = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};
