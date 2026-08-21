import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useFnrhDomains } from "@/hooks/useFnrhDomains";
import { Search, RefreshCw } from "lucide-react";

const TODOS = "__todos__";

/** Consultas diretas na API FNRH (reservas, pré-check-ins e fichas). */
export default function FnrhConsultasPanel() {
  const { toast } = useToast();
  const { domains, loading: loadingDominios, reload } = useFnrhDomains();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<unknown>(null);

  // Reservas
  const [situacaoReserva, setSituacaoReserva] = useState<string>(TODOS);
  const [codigoReserva, setCodigoReserva] = useState("");
  const [dataEntrada, setDataEntrada] = useState("");
  const [dataSaida, setDataSaida] = useState("");
  const [pageReservas, setPageReservas] = useState(1);

  // Pré-check-ins
  const [tipoDocumento, setTipoDocumento] = useState<string>(TODOS);
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [preInicio, setPreInicio] = useState("");
  const [preFim, setPreFim] = useState("");

  // Fichas
  const [statusFicha, setStatusFicha] = useState<string>(TODOS);
  const [fichaInicio, setFichaInicio] = useState("");
  const [fichaFim, setFichaFim] = useState("");
  const [pageFichas, setPageFichas] = useState(1);

  const call = async (fn: string, body: Record<string, unknown>) => {
    setLoading(true);
    setResultado(null);
    const { data, error } = await supabase.functions.invoke(fn, { body });
    setLoading(false);
    if (error) {
      let mensagem = error.message;
      try {
        const parsed = await (error as { context?: Response }).context?.json?.();
        if (parsed?.error) mensagem = parsed.error;
      } catch {
        /* mantém a mensagem padrão */
      }
      toast({ title: "Consulta não concluída", description: mensagem, variant: "destructive" });
      return;
    }
    setResultado(data);
  };

  const opt = (key: Parameters<typeof domains.hasOwnProperty>[0] extends never ? never : never) => key;
  void opt;

  const renderSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    items: { id: string; label: string }[] | undefined,
  ) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {(items ?? []).map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const clean = (v: string) => (v && v !== TODOS ? v : undefined);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Consultas na API FNRH</CardTitle>
        <Button variant="ghost" size="sm" onClick={reload} disabled={loadingDominios}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingDominios ? "animate-spin" : ""}`} />
          Recarregar domínios
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="reservas">
          <TabsList>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="pre">Pré-check-ins</TabsTrigger>
            <TabsTrigger value="fichas">Fichas</TabsTrigger>
          </TabsList>

          <TabsContent value="reservas" className="space-y-3 pt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {renderSelect("Situação", situacaoReserva, setSituacaoReserva, domains.reservas_situacoes)}
              <div className="space-y-1">
                <Label className="text-xs">Código da reserva</Label>
                <Input value={codigoReserva} onChange={(e) => setCodigoReserva(e.target.value)} maxLength={60} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data de entrada</Label>
                <Input type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data de saída</Label>
                <Input type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="w-28 space-y-1">
                <Label className="text-xs">Página</Label>
                <Input
                  type="number"
                  min={1}
                  value={pageReservas}
                  onChange={(e) => setPageReservas(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <Button
                disabled={loading}
                onClick={() =>
                  call("fnrh-reservas", {
                    acao: "listar",
                    situacao: clean(situacaoReserva),
                    codigo_reserva: codigoReserva || undefined,
                    data_entrada: dataEntrada || undefined,
                    data_saida: dataSaida || undefined,
                    page_number: pageReservas,
                  })
                }
              >
                <Search className="h-4 w-4 mr-2" />
                Consultar reservas
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="pre" className="space-y-3 pt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {renderSelect("Tipo de documento", tipoDocumento, setTipoDocumento, domains.tipos_documento)}
              <div className="space-y-1">
                <Label className="text-xs">Número do documento</Label>
                <Input
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  maxLength={30}
                  placeholder="Somente números/letras"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data início</Label>
                <Input type="date" value={preInicio} onChange={(e) => setPreInicio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data fim</Label>
                <Input type="date" value={preFim} onChange={(e) => setPreFim(e.target.value)} />
              </div>
            </div>
            <Button
              disabled={loading}
              onClick={() =>
                call("fnrh-hospedes", {
                  acao: "pre_checkins",
                  tipo_documento: clean(tipoDocumento),
                  numero_documento: numeroDocumento || undefined,
                  data_inicio: preInicio || undefined,
                  data_fim: preFim || undefined,
                })
              }
            >
              <Search className="h-4 w-4 mr-2" />
              Consultar pré-check-ins
            </Button>
          </TabsContent>

          <TabsContent value="fichas" className="space-y-3 pt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {renderSelect("Status", statusFicha, setStatusFicha, domains.fichas_situacoes)}
              <div className="space-y-1">
                <Label className="text-xs">Data inicial</Label>
                <Input type="date" value={fichaInicio} onChange={(e) => setFichaInicio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data final</Label>
                <Input type="date" value={fichaFim} onChange={(e) => setFichaFim(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Página</Label>
                <Input
                  type="number"
                  min={1}
                  value={pageFichas}
                  onChange={(e) => setPageFichas(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>
            <Button
              disabled={loading}
              onClick={() =>
                call("fnrh-fichas", {
                  status: clean(statusFicha),
                  data_inicial: fichaInicio || undefined,
                  data_final: fichaFim || undefined,
                  page_number: pageFichas,
                })
              }
            >
              <Search className="h-4 w-4 mr-2" />
              Consultar fichas
            </Button>
          </TabsContent>
        </Tabs>

        {resultado !== null && (
          <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
