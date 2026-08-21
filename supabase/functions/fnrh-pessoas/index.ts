// fnrh-pessoas — registro/consulta de pessoas na FNRH v2 (header cpf_solicitante obrigatório).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  fnrhFetch,
  getCpfSolicitante,
  getFnrhEnv,
  toErrorBody,
  FnrhError,
  maskDoc,
  maskName,
} from "../_shared/fnrh.ts";
import { corsHeaders, jsonResponse, getInternalAuth, unauthorizedResponse } from "../_shared/internal.ts";
import {
  CepSchema,
  CountryCodeSchema,
  DateSchema,
  DocumentAlphanumSchema,
} from "../_shared/fnrh-format.ts";

const PessoaSchema = z
  .object({
    nome: z.string().min(2).max(150),
    tipo_documento_id: z.union([z.string().max(30), z.number().int()]),
    numero_documento: DocumentAlphanumSchema,
    data_nascimento: DateSchema,
    genero_id: z.union([z.string().max(30), z.number().int()]).optional(),
    raca_id: z.union([z.string().max(30), z.number().int()]).optional(),
    opcao_deficiencia_id: z.union([z.string().max(30), z.number().int()]).optional(),
    tipos_deficiencia_ids: z.array(z.union([z.string().max(30), z.number().int()])).max(10).optional(),
    PaisNacionalidade_id: CountryCodeSchema,
    PaisResidencia_id: CountryCodeSchema,
    email: z.string().email().max(150).optional(),
    telefone: z.string().max(30).optional(),
    cep: CepSchema.optional(),
    endereco: z.string().max(200).optional(),
    cidade: z.string().max(100).optional(),
    uf: z.string().max(20).optional(),
  })
  .passthrough();

const BodySchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("registrar"), pessoa: PessoaSchema }),
  z.object({ acao: z.literal("detalhe"), id: z.string().min(1).max(60) }),
  z.object({
    acao: z.literal("buscar_documento"),
    tipo: z.string().min(1).max(30),
    numero: DocumentAlphanumSchema,
  }),
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user, reason } = await getInternalAuth(req);
    if (!user) return unauthorizedResponse(reason);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return jsonResponse(
        { error: "Parâmetros inválidos", code: "VALIDACAO", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }

    const env = getFnrhEnv();
    const p = parsed.data;

    const cpf = await getCpfSolicitante();
    if (!cpf) {
      throw new FnrhError(
        500,
        "CONFIG_AUSENTE",
        "CPF do solicitante (FNRH_CPF_SOLICITANTE) não configurado no backend.",
      );
    }
    const headers = { cpf_solicitante: cpf };

    if (p.acao === "registrar") {
      // Log sem dados pessoais em claro
      console.log(
        JSON.stringify({
          scope: "fnrh-pessoas",
          acao: "registrar",
          nome: maskName(p.pessoa.nome),
          documento: maskDoc(p.pessoa.numero_documento),
          timestamp: new Date().toISOString(),
        }),
      );
      const data = await fnrhFetch({
        method: "POST",
        path: "/pessoas",
        body: p.pessoa,
        headers,
        timeoutMs: 30000,
      });
      return jsonResponse({ env, data });
    }

    if (p.acao === "detalhe") {
      const data = await fnrhFetch({ method: "GET", path: `/pessoas/${p.id}`, headers, timeoutMs: 25000 });
      return jsonResponse({ env, data });
    }

    console.log(
      JSON.stringify({
        scope: "fnrh-pessoas",
        acao: "buscar_documento",
        tipo: p.tipo,
        documento: maskDoc(p.numero),
        timestamp: new Date().toISOString(),
      }),
    );
    const data = await fnrhFetch({
      method: "GET",
      path: `/pessoas/documento/${encodeURIComponent(p.tipo)}/${encodeURIComponent(p.numero)}`,
      headers,
      timeoutMs: 25000,
    });
    return jsonResponse({ env, data });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return jsonResponse(body, status);
  }
});
