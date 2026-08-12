// fnrh-listar-fichas — alimenta o painel de recepção usando a base local
// (mais rápido e sem consumir cota da FNRH), com filtros de data e status.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { getFnrhEnv, toErrorBody, FnrhError } from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse, serviceClient } from "../_shared/internal.ts";

const SITUACOES = [
  "PRECHECKIN_PENDENTE",
  "PRECHECKIN_REALIZADO",
  "CHECKIN_REALIZADO",
  "CHECKOUT_REALIZADO",
  "NOSHOW",
  "CANCELADO",
  "ERRO_SINCRONIZACAO",
  "DADOS_INCOMPLETOS",
  "NAO_SINCRONIZADA",

] as const;

const FiltersSchema = z.object({
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  situacao: z.enum(SITUACOES).optional(),
  busca: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const FIELDS =
  "id, guest_name, guest_email, guest_phone, room_name, check_in, check_out, guests, status, situacao_fnrh, link_precheckin, reserva_id_fnrh, hospede_id_fnrh, erro_sincronizacao_fnrh, fnrh_checkin_em, fnrh_checkout_em, created_at";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user, reason } = await getInternalAuth(req);
    if (!user) return unauthorizedResponse(reason);

    const url = new URL(req.url);
    const raw: Record<string, unknown> = Object.fromEntries(url.searchParams.entries());
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      Object.assign(raw, body ?? {});
    }
    for (const key of Object.keys(raw)) {
      if (raw[key] === "" || raw[key] === null) delete raw[key];
    }

    const parsed = FiltersSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse(
        { error: "Filtros inválidos", code: "VALIDACAO", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }
    const { data_inicio, data_fim, situacao, busca, limit } = parsed.data;

    const admin = serviceClient();
    let query = admin
      .from("reservations")
      .select(FIELDS)
      .order("check_in", { ascending: false })
      .limit(limit ?? 100);

    if (data_inicio) query = query.gte("check_in", data_inicio);
    if (data_fim) query = query.lte("check_in", data_fim);
    if (situacao === "NAO_SINCRONIZADA") {
      query = query.is("situacao_fnrh", null);
    } else if (situacao) {
      query = query.eq("situacao_fnrh", situacao);
    }
    if (busca) {
      const term = busca.replace(/[%,]/g, " ").trim();
      query = query.or(`guest_name.ilike.%${term}%,guest_email.ilike.%${term}%,id.eq.${
        /^[0-9a-f-]{36}$/i.test(term) ? term : "00000000-0000-0000-0000-000000000000"
      }`);
    }

    const { data, error } = await query;
    if (error) throw new FnrhError(500, "ERRO_BANCO", error.message);

    const fichas = (data ?? []).map((r) => ({
      ...r,
      situacao_fnrh: r.situacao_fnrh ?? "NAO_SINCRONIZADA",
    }));

    console.log(
      JSON.stringify({
        scope: "fnrh-listar-fichas",
        total: fichas.length,
        filtros: { data_inicio, data_fim, situacao, tem_busca: Boolean(busca) },
        timestamp: new Date().toISOString(),
      }),
    );

    return jsonResponse({ env: getFnrhEnv(), total: fichas.length, fichas });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
