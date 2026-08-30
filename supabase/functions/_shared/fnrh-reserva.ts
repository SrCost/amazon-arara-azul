// Montagem do payload de /hospedagem/registrar e persistência local.
// Usado por fnrh-criar-reserva e fnrh-reprocessar-reserva.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { fnrhFetch, getCpfSolicitante, FnrhError, maskDoc, maskName } from "./fnrh.ts";

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
  channel_reference_id?: string | null;
}

export const RESERVATION_FIELDS =
  "id, check_in, check_out, guests, guest_name, guest_email, guest_phone, cpf, passport, birth_date, nationality, country, is_foreign, address, genero, documento_tipo, quantidade_hospede_adulto, quantidade_hospede_menor, room_name, channel_reference_id, reserva_id_fnrh, hospede_id_fnrh, pessoa_id_fnrh, situacao_fnrh, link_precheckin";

function onlyDigits(v?: string | null) {
  return v ? v.replace(/\D/g, "") : "";
}

/** Número canônico da reserva (mesma regra exibida ao hóspede: PAA-XXXXXX). */
export function resolveNumeroReserva(r: ReservationRow): string {
  const external = (r.channel_reference_id || "").trim();
  if (external) return external;
  const suffix = (r.id || "").replace(/-/g, "").slice(0, 6).toUpperCase();
  return suffix ? `PAA-${suffix}` : "";
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Normaliza para YYYY-MM-DD ou retorna "" quando o valor não é uma data usável. */
export function toDateOnlyStrict(value?: string | null): string {
  if (!value) return "";
  const raw = String(value).trim();
  const iso = DATE_RE.test(raw) ? raw : "";
  if (iso) return iso;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

/** Datas placeholder (1900-01-01 e afins) nunca podem ser enviadas. */
function isPlausibleDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= 2000 && year <= 2100;
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

/**
 * Completa dados faltantes da reserva com o que o hóspede já informou no
 * check-in digital (booking_checkins) e no questionário de pré-chegada.
 * Persiste o resultado em `reservations` para não exigir digitação dupla.
 */
export async function enrichReservationFromGuestForms(
  admin: SupabaseClient,
  r: ReservationRow,
): Promise<ReservationRow> {
  const needs =
    !r.birth_date || !r.nationality || !r.address || !r.documento_tipo || !onlyDigits(r.cpf);
  if (!needs) return r;

  const { data: checkin } = await admin
    .from("booking_checkins")
    .select("document, full_name, birth_date, nationality, address, city_state")
    .eq("reservation_id", r.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!checkin) return r;

  const patch: Record<string, unknown> = {};
  const merged: ReservationRow = { ...r };

  if (!merged.birth_date && checkin.birth_date) {
    merged.birth_date = checkin.birth_date;
    patch.birth_date = checkin.birth_date;
  }
  if (!merged.nationality && checkin.nationality) {
    merged.nationality = checkin.nationality;
    patch.nationality = checkin.nationality;
  }
  const endereco = checkin.address || checkin.city_state;
  if (!merged.address && endereco) {
    merged.address = endereco;
    patch.address = endereco;
  }

  const doc = (checkin.document || "").trim();
  const docDigits = onlyDigits(doc);
  if (!onlyDigits(merged.cpf) && !merged.passport && doc) {
    if (docDigits.length === 11) {
      merged.cpf = docDigits;
      merged.documento_tipo = "CPF";
      patch.cpf = docDigits;
      patch.documento_tipo = "CPF";
    } else {
      merged.passport = doc;
      merged.documento_tipo = "PASSAPORTE";
      patch.passport = doc;
      patch.documento_tipo = "PASSAPORTE";
    }
  }

  if (Object.keys(patch).length > 0) {
    await admin.from("reservations").update(patch).eq("id", r.id);
    console.log(
      JSON.stringify({
        scope: "fnrh-enrich",
        reservation_id: r.id,
        campos_preenchidos: Object.keys(patch),
      }),
    );
  }

  return merged;
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

  if (!resolveNumeroReserva(r)) {
    issues.push({ field: "numero_reserva", message: "Reserva sem número válido — verifique o cadastro." });
  }

  const entrada = toDateOnlyStrict(r.check_in);
  const saida = toDateOnlyStrict(r.check_out);
  if (!isPlausibleDate(entrada) || !isPlausibleDate(saida)) {
    issues.push({
      field: "check_in/check_out",
      message: "Datas de entrada e saída inválidas — verifique o cadastro da reserva.",
    });
  } else if (saida <= entrada) {
    issues.push({ field: "check_out", message: "A data de saída deve ser posterior à de entrada." });
  }

  const adultos = r.quantidade_hospede_adulto ?? r.guests ?? 0;
  if (!adultos || adultos < 1) {
    issues.push({ field: "quantidade_hospede_adulto", message: "Informe pelo menos 1 hóspede adulto." });
  }

  return issues;
}

/**
 * Payload de POST /hospedagem/registrar no formato aceito pela API FNRH v2 (snake_case).
 * Não existe fallback silencioso: campo obrigatório ausente aborta o envio com erro claro.
 */
export function buildRegistrarPayload(r: ReservationRow, extra?: Record<string, unknown>) {
  const doc = resolveDocumento(r);
  const numeroReserva = resolveNumeroReserva(r);
  const dataEntrada = toDateOnlyStrict(r.check_in);
  const dataSaida = toDateOnlyStrict(r.check_out);
  const adultos = r.quantidade_hospede_adulto ?? r.guests ?? 0;
  const menores = r.quantidade_hospede_menor ?? 0;

  const faltando: string[] = [];
  if (!numeroReserva) faltando.push("numero_reserva");
  if (!isPlausibleDate(dataEntrada)) faltando.push("data_entrada");
  if (!isPlausibleDate(dataSaida)) faltando.push("data_saida");
  if (!adultos || adultos < 1) faltando.push("quantidade_hospede_adulto");
  if (!r.guest_name?.trim()) faltando.push("nome_hospede");
  if (!doc.numero) faltando.push("numero_documento");
  if (faltando.length > 0) {
    throw new FnrhError(
      400,
      "PAYLOAD_INCOMPLETO",
      `Reserva sem dados válidos para a FNRH (${faltando.join(", ")}). Verifique o cadastro antes de sincronizar.`,
      faltando,
    );
  }
  if (dataSaida <= dataEntrada) {
    throw new FnrhError(
      400,
      "PAYLOAD_INCOMPLETO",
      "A data de saída da reserva deve ser posterior à data de entrada.",
      ["data_saida"],
    );
  }

  return {
    reserva: {
      numero_reserva: numeroReserva,
      data_entrada: dataEntrada,
      data_saida: dataSaida,
      quantidade_hospede_adulto: adultos,
      quantidade_hospede_menor: menores,
      observacao: r.room_name || undefined,
    },
    hospede: {
      nome: r.guest_name!.trim(),
      tipo_documento: doc.tipo,
      numero_documento: doc.numero,
      pais_nacionalidade: resolvePais(r),
      pais_residencia: resolvePais(r),
      data_nascimento: toDateOnlyStrict(r.birth_date) || undefined,
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
  const cpfSolicitante = await getCpfSolicitante();
  if (!cpfSolicitante) {
    throw new FnrhError(500, "CONFIG_AUSENTE", "FNRH_CPF_SOLICITANTE não configurado no backend.");
  }

  const payload = buildRegistrarPayload(r);
  console.log(
    JSON.stringify({
      scope: "fnrh-registrar",
      reservation_id: r.id,
      numero_reserva: payload.reserva.numero_reserva,
      data_entrada: payload.reserva.data_entrada,
      data_saida: payload.reserva.data_saida,
      quantidade_hospede_adulto: payload.reserva.quantidade_hospede_adulto,
      quantidade_hospede_menor: payload.reserva.quantidade_hospede_menor,
      hospede: maskName(payload.hospede.nome),
      documento: maskDoc(payload.hospede.numero_documento),
      pais: payload.hospede.pais_nacionalidade,
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
