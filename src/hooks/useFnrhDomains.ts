import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FnrhDomainKey =
  | "meios_transporte"
  | "motivos_viagem"
  | "hospedes_situacoes"
  | "generos"
  | "opcao_deficiencia"
  | "racas"
  | "tipos_deficiencia"
  | "tipos_documento"
  | "reservas_situacoes"
  | "fichas_situacoes";

export interface FnrhDomainItem {
  id: string;
  label: string;
}

type DomainMap = Partial<Record<FnrhDomainKey, FnrhDomainItem[]>>;

/** Normaliza formatos variados da FNRH em { id, label }. */
function normalize(raw: unknown): FnrhDomainItem[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.data)
      ? ((raw as Record<string, unknown>).data as unknown[])
      : Array.isArray((raw as Record<string, unknown>)?.conteudo)
        ? ((raw as Record<string, unknown>).conteudo as unknown[])
        : [];

  return list
    .map((item) => {
      if (typeof item === "string") return { id: item, label: item };
      const o = (item ?? {}) as Record<string, unknown>;
      const id = o.id ?? o.codigo ?? o.value ?? o.chave;
      const label = o.descricao ?? o.nome ?? o.label ?? o.valor ?? id;
      return id !== undefined ? { id: String(id), label: String(label) } : null;
    })
    .filter((v): v is FnrhDomainItem => Boolean(v));
}

/** Carrega e cacheia (por sessão) os domínios da FNRH para validar IDs no client. */
export function useFnrhDomains(autoLoad = true) {
  const [domains, setDomains] = useState<DomainMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    if (loaded.current) return;
    setLoading(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("fnrh-dominios", {
      body: { tipo: "todos" },
    });
    setLoading(false);
    if (fnError) {
      setError(fnError.message);
      return;
    }
    const payload = (data as { dominios?: Record<string, unknown> })?.dominios ?? {};
    const next: DomainMap = {};
    for (const [key, value] of Object.entries(payload)) {
      const items = normalize(value);
      if (items.length) next[key as FnrhDomainKey] = items;
    }
    setDomains(next);
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (autoLoad) void load();
  }, [autoLoad, load]);

  /** true quando o domínio não foi carregado (não bloqueia) ou o id existe nele. */
  const isValidId = useCallback(
    (key: FnrhDomainKey, id?: string | number | null) => {
      const list = domains[key];
      if (!list?.length || id === undefined || id === null || id === "") return true;
      return list.some((item) => item.id === String(id));
    },
    [domains],
  );

  return { domains, loading, error, reload: load, isValidId };
}
