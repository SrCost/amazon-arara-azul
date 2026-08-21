// Regras de formato/validação exigidas pela API FNRH v2.
import { z } from "https://esm.sh/zod@3.23.8";

/** Data: YYYY-MM-DD com zero à esquerda. */
export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato YYYY-MM-DD (ex.: 2026-08-20).");

/** DateTime: ISO 8601 em UTC, sufixo Z. */
export const DateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
    "Use ISO 8601 em UTC com Z (ex.: 2026-08-20T14:30:00.000Z).",
  );

/** País: ISO 3166-1 alpha-2. */
export const CountryCodeSchema = z
  .string()
  .regex(/^[A-Za-z]{2}$/, "Use o código ISO do país com 2 letras (ex.: BR, DE).")
  .transform((v) => v.toUpperCase());

/** Documento: apenas dígitos, sem máscara. */
export const DocumentNumberSchema = z
  .string()
  .min(3)
  .max(30)
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length >= 3, "Número de documento inválido.");

/** Passaporte pode conter letras: remove só caracteres especiais. */
export const DocumentAlphanumSchema = z
  .string()
  .min(3)
  .max(30)
  .transform((v) => v.replace(/[^0-9A-Za-z]/g, "").toUpperCase());

/** CEP: 8 dígitos sem hífen. */
export const CepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 8, "CEP deve ter 8 dígitos, sem hífen.");

/** Paginação: page_number começa em 1. */
export const PageNumberSchema = z.coerce.number().int().min(1).default(1);
export const PageSizeSchema = z.coerce.number().int().min(1).max(100).default(20);

export const CpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos.");

/** Normaliza uma data-hora arbitrária para ISO UTC com Z. */
export function toIsoUtc(value?: string | Date | null): string {
  const d = value ? new Date(value) : new Date();
  return new Date(d.getTime()).toISOString();
}

/** Converte Date/string em YYYY-MM-DD. */
export function toDateOnly(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(value).toISOString().slice(0, 10);
}

/** Remove chaves vazias de um objeto de query. */
export function cleanQuery(
  input: Record<string, string | number | boolean | undefined | null>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}
