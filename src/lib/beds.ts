import type { TFunction } from "i18next";

export type Bed = { type: string; quantity: number };

export const BED_TYPE_OPTIONS = ["Casal", "Solteiro", "Rede"] as const;

/**
 * Normaliza o tipo armazenado (PT canônico) para uma chave i18n.
 * Tipos personalizados retornam null e devem ser exibidos com o valor literal.
 */
export const bedTypeKey = (type: string): "couple" | "single" | "hammock" | null => {
  const t = (type || "").trim().toLowerCase();
  if (t === "casal") return "couple";
  if (t === "solteiro") return "single";
  if (t === "rede") return "hammock";
  return null;
};

/**
 * Converte qualquer valor vindo do banco em um array tipado de camas.
 */
export const parseBeds = (raw: unknown): Bed[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b: any) => ({
      type: typeof b?.type === "string" ? b.type : "",
      quantity: Number(b?.quantity) || 0,
    }))
    .filter((b) => b.type && b.quantity > 0);
};

/**
 * Texto traduzido para uma cama individual ("1 cama de casal").
 */
export const formatBed = (bed: Bed, t: TFunction): string => {
  const key = bedTypeKey(bed.type);
  if (!key) {
    // tipo personalizado: usa label literal
    return `${bed.quantity} ${bed.type}${bed.quantity > 1 ? "s" : ""}`;
  }
  const suffix = bed.quantity > 1 ? "Plural" : "";
  return t(`lodge.beds.${key}${suffix}`, { count: bed.quantity });
};

/**
 * Resumo curto compacto, ex.: "1 casal · 2 solteiros · 1 rede".
 */
export const formatBedsShort = (beds: Bed[], t: TFunction): string =>
  beds.map((b) => formatBed(b, t)).join(" · ");
