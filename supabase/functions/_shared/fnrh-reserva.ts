// Montagem do payload de /hospedagem/registrar e persistência local.
// Usado por fnrh-criar-reserva e fnrh-reprocessar-reserva.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { fnrhFetch, getCpfSolicitante, FnrhError, maskDoc } from "./fnrh.ts";

export interface ReservationRow {
  id: string;
  check_in: string;
  check_out: string;
  guests: number | null;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  cpf: string | null;
  passport: string | null;
  birth_date: string | null;
  nationality: string | null;
  country: string | null;
  is_foreign: boolean | null;
  address: string | null;
  genero: string | null;
  documento_tipo: string | null;
  quantidade_hospede_adulto: number | null;
  quantidade_hospede_menor: number | null;
  room_name: string | null;
}

export const RESERVATION_FIELDS =
  "id, check_in, check_out, guests, guest_name, guest_email, guest_phone, cpf, passport, birth_date, nationality, country, is_foreign, address, genero, documento_tipo, quantidade_hospede_adulto, quantidade_hospede_menor, room_name, reserva_id_fnrh, hospede_id_fnrh, pessoa_id_fnrh, situacao_fnrh, link_precheckin";

function onlyDigits(v?: string | null) {
  return v ? v.replace(/\D/g, "") : "";
}

/** Descobre tipo/número de documento a partir dos campos existentes. */
export function resolveDocumento(r: ReservationRow): { tipo: string; numero: string } {
  const explicit = (r.documento_tipo || "").toUpperCase();
  const cpf = onlyDigits(r.cpf);
  if (explicit === "PASSAPORTE" && r.passport) return { tipo: "PASSAPORTE", numero: r.passport.trim() };
  if (explicit === "CPF" && cpf) return { tipo: "CPF", numero: cpf };
  if (r.is_foreign && r.passport) return { tipo: "PASSAPORTE", numero: r.passport.trim() };
  if (cpf) return { tipo: "CPF", numero: cpf };
  if (r.passport) return { tipo: "PASSAPORTE", numero: r.passport.trim() };
  return { tipo: "", numero: "" };
}

export function resolvePais(r: ReservationRow): string {
  const raw = (r.nationality || r.country || "").trim();
  if (!raw) return r.is_foreign ? "" : "BR";
  if (raw.length === 2) return raw.toUpperCase();
  const map: Record<string, string> = {
    brasil: "BR",
    brazil: "BR",
    brasileiro: "BR",
    brasileira: "BR",
    argentina: "AR",
    portugal: "PT",
    "estados unidos": "US",
    alemanha: "DE",
    franca: "FR",
    frança: "FR",
    espanha: "ES",
    italia: "IT",
    itália: "IT",
    chile: "CL",
    uruguai: "UY",
    paraguai: "PY",
    colombia: "CO",
    peru: "PE",
  };
  return map[raw.toLowerCase()] || raw.toUpperCase().slice(0, 2);
}

export function resolveGenero(r: ReservationRow): string {
  const g = (r.genero || "").trim().toUpperCase();
  if (["M", "MASCULINO"].includes(g)) return "MASCULINO";
  if (["F", "FEMININO"].includes(g)) return "FEMININO";
  if (g) return g;
  return "NAO_INFORMADO";
}

export interface FieldIssue {
  field: string;
  message: string;
}

/** Valida os campos mínimos exigidos pela FNRH. */
export function validateForFnrh(r: ReservationRow): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (!r.guest_name?.trim()) issues.push({ field: "guest_name", message: "Nome do hóspede é obrigatório." });
  const doc = resolveDocumento(r);
  if (!doc.numero) {
    issues.push({ field: "documento", message: "Informe CPF ou passaporte do hóspede principal." });
  }
  if (!r.birth_date) issues.push({ field: "birth_date", message: "Data de nascimento é obrigatória." });
  if (!resolvePais(r)) {
    issues.push({ field: "nationality", message: "País de nacionalidade é obrigatório." });
  }
  if (!r.check_in || !r.check_out) {
    issues.push({ field: "check_in/check_out", message: "Datas de entrada e saída são obrigatórias." });
  }
  return issues;
}

export function buildRegistrarPayload(r: ReservationRow, extra?: Record<string, unknown>) {
  const doc = resolveDocumento(r);
  const adultos = r.quantidade_hospede_adulto ?? r.guests ?? 1;
  const menores = r.quantidade_hospede_menor ?? 0;

  return {
    reserva: {
      dataEntrada: r.check_in,
      dataSaida: r.check_out,
      quantidadeHospedeAdulto: adultos,
      quantidadeHospedeMenor: menores,
      codigoReservaMeioHospedagem: r.id,
      observacao: r.room_name || undefined,
    },
    hospede: {
      nome: r.guest_name?.trim(),
      tipoDocumento: doc.tipo,
      numeroDocumento: doc.numero,
      paisNacionalidade: resolvePais(r),
      dataNascimento: r.birth_date,
      genero: resolveGenero(r),
      email: r.guest_email || undefined,
      telefone: r.guest_phone || undefined,
      endereco: r.address || undefined,
    },
    ...(extra || {}),
  };
}

function pick(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") {
      const nested = pick(v, keys);
      if (nested) return nested;
    }
  }
  return null;
}

export interface RegistrarResult {
  reserva_id_fnrh: string | null;
  hospede_id_fnrh: string | null;
  pessoa_id_fnrh: string | null;
  link_precheckin: string | null;
  situacao_fnrh: string;
  raw: unknown;
}

/** Chama POST /hospedagem/registrar e normaliza a resposta. */
export async function registrarHospedagem(r: ReservationRow): Promise<RegistrarResult> {
  const cpfSolicitante = getCpfSolicitante();
  if (!cpfSolicitante) {
    throw new FnrhError(500, "CONFIG_AUSENTE", "FNRH_CPF_SOLICITANTE não configurado no backend.");
  }

  const payload = buildRegistrarPayload(r);
  console.log(
    JSON.stringify({
      scope: "fnrh-registrar",
      reservation_id: r.id,
      documento: maskDoc(payload.hospede.numeroDocumento),
      pais: payload.hospede.paisNacionalidade,
      timestamp: new Date().toISOString(),
    }),
  );

  const raw = await fnrhFetch<Record<string, unknown>>({
    method: "POST",
    path: "/hospedagem/registrar",
    body: payload,
    headers: { cpf_solicitante: cpfSolicitante },
    timeoutMs: 30000,
  });

  return {
    reserva_id_fnrh: pick(raw, ["reservaId", "idReserva", "reserva_id", "id"]),
    hospede_id_fnrh: pick(raw, ["hospedeId", "idHospede", "hospede_id"]),
    pessoa_id_fnrh: pick(raw, ["pessoaId", "idPessoa", "pessoa_id"]),
    link_precheckin: pick(raw, ["linkPreCheckin", "linkPrecheckin", "urlPreCheckin", "link"]),
    situacao_fnrh: pick(raw, ["situacao", "status"]) || "PRECHECKIN_PENDENTE",
    raw,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Colunas de id da FNRH são uuid no banco: só grava se o formato bater. */
function asUuid(value: string | null): string | null {
  return value && UUID_RE.test(value) ? value : null;
}

/** Persiste sucesso da sincronização na reserva local. */
export async function saveSyncSuccess(
  admin: SupabaseClient,
  reservationId: string,
  result: RegistrarResult,
) {
  await admin
    .from("reservations")
    .update({
      reserva_id_fnrh: asUuid(result.reserva_id_fnrh),
      hospede_id_fnrh: asUuid(result.hospede_id_fnrh),
      pessoa_id_fnrh: asUuid(result.pessoa_id_fnrh),
      link_precheckin: result.link_precheckin,
      situacao_fnrh: result.situacao_fnrh,
      erro_sincronizacao_fnrh: null,
    })
    .eq("id", reservationId);
}

/** Persiste falha da sincronização sem travar a reserva local. */
export async function saveSyncError(admin: SupabaseClient, reservationId: string, message: string) {
  await admin
    .from("reservations")
    .update({
      situacao_fnrh: "ERRO_SINCRONIZACAO",
      erro_sincronizacao_fnrh: message.slice(0, 1000),
    })
    .eq("id", reservationId);
}
