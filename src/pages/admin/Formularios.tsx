import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, CheckCircle2, MinusCircle, Star } from "lucide-react";

interface CheckinRow {
  reservation_id: string;
  created_at: string | null;
  document: string | null;
  full_name: string | null;
  birth_date: string | null;
  nationality: string | null;
  city_state: string | null;
  address: string | null;
  transport_mode: string | null;
  travel_reason: string | null;
  estimated_arrival_time: string | null;
  notes: string | null;
}

interface CheckoutRow {
  reservation_id: string;
  created_at: string | null;
  rating: number | null;
  comment: string | null;
  issues: string | null;
}

interface PreArrivalRow {
  reservation_id: string;
  status: string | null;
  answered_at: string | null;
  dietary_restrictions: string[] | null;
  foods_to_avoid: string | null;
  children_info: string | null;
  special_occasion: string | null;
  special_occasion_detail: string | null;
  arrival_mode: string | null;
  estimated_arrival_time: string | null;
  transport_needs: string | null;
  additional_info: string | null;
}

interface ReservationRow {
  id: string;
  guest_name: string;
  guest_email: string | null;
  room_name: string | null;
  check_in: string;
  check_out: string;
  status: string | null;
}

const formatDate = (value: string | null) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

const codigo = (id: string) => `PAA-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

const YesNo = ({ ok }: { ok: boolean }) =>
  ok ? (
    <Badge variant="default" className="gap-1">
      <CheckCircle2 className="h-3 w-3" /> Respondido
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <MinusCircle className="h-3 w-3" /> Pendente
    </Badge>
  );

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-0.5">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm text-foreground break-words">{value?.trim() ? value : "—"}</p>
  </div>
);

const Formularios = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [checkouts, setCheckouts] = useState<CheckoutRow[]>([]);
  const [preArrivals, setPreArrivals] = useState<PreArrivalRow[]>([]);
  const [detalhe, setDetalhe] = useState<ReservationRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, ci, co, pa] = await Promise.all([
      supabase
        .from("reservations")
        .select("id, guest_name, guest_email, room_name, check_in, check_out, status")
        .order("check_in", { ascending: false })
        .limit(300),
      supabase
        .from("booking_checkins")
        .select(
          "reservation_id, created_at, document, full_name, birth_date, nationality, city_state, address, transport_mode, travel_reason, estimated_arrival_time, notes",
        ),
      supabase.from("booking_checkouts").select("reservation_id, created_at, rating, comment, issues"),
      supabase
        .from("pre_arrival_responses")
        .select(
          "reservation_id, status, answered_at, dietary_restrictions, foods_to_avoid, children_info, special_occasion, special_occasion_detail, arrival_mode, estimated_arrival_time, transport_needs, additional_info",
        ),
    ]);
    setLoading(false);

    const firstError = res.error || ci.error || co.error || pa.error;
    if (firstError) {
      toast({
        title: "Erro ao carregar formulários",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setReservations((res.data ?? []) as ReservationRow[]);
    setCheckins((ci.data ?? []) as CheckinRow[]);
    setCheckouts((co.data ?? []) as CheckoutRow[]);
    setPreArrivals((pa.data ?? []) as PreArrivalRow[]);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const byId = useMemo(() => {
    const ci = new Map(checkins.map((r) => [r.reservation_id, r]));
    const co = new Map(checkouts.map((r) => [r.reservation_id, r]));
    const pa = new Map(preArrivals.map((r) => [r.reservation_id, r]));
    return { ci, co, pa };
  }, [checkins, checkouts, preArrivals]);

  const filtradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return reservations;
    return reservations.filter(
      (r) =>
        r.guest_name.toLowerCase().includes(term) ||
        (r.guest_email ?? "").toLowerCase().includes(term) ||
        codigo(r.id).toLowerCase().includes(term),
    );
  }, [reservations, busca]);

  const stats = useMemo(
    () => ({
      total: reservations.length,
      preparacao: reservations.filter((r) => byId.pa.get(r.id)?.answered_at || byId.ci.has(r.id)).length,
      feedback: reservations.filter((r) => byId.co.has(r.id)).length,
    }),
    [reservations, byId],
  );

  const detalheCi = detalhe ? byId.ci.get(detalhe.id) : undefined;
  const detalheCo = detalhe ? byId.co.get(detalhe.id) : undefined;
  const detalhePa = detalhe ? byId.pa.get(detalhe.id) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Formulários dos hóspedes</h1>
          <p className="text-sm text-muted-foreground">
            Respostas de preparação da chegada e de feedback pós-estadia por reserva.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reservas listadas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Preparação respondida</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.preparacao}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Feedback recebido</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.feedback}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por hóspede, e-mail ou código"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Hóspede</TableHead>
                <TableHead>Acomodação</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Preparação</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Carregando…
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma reserva encontrada.
                  </TableCell>
                </TableRow>
              )}
              {filtradas.map((r) => {
                const pa = byId.pa.get(r.id);
                const ci = byId.ci.get(r.id);
                const co = byId.co.get(r.id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{codigo(r.id)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.guest_name}</div>
                      <div className="text-xs text-muted-foreground">{r.guest_email ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.room_name ?? "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(r.check_in)} → {formatDate(r.check_out)}
                    </TableCell>
                    <TableCell>
                      <YesNo ok={Boolean(pa?.answered_at || ci)} />
                    </TableCell>
                    <TableCell>
                      <YesNo ok={Boolean(co)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setDetalhe(r)}>
                        Ver respostas
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(detalhe)} onOpenChange={(open) => !open && setDetalhe(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detalhe ? `${detalhe.guest_name} — ${codigo(detalhe.id)}` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Pré-chegada (preferências)</h3>
              {detalhePa?.answered_at ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Respondido em" value={formatDateTime(detalhePa.answered_at)} />
                  <Field
                    label="Restrições alimentares"
                    value={(detalhePa.dietary_restrictions ?? []).join(", ")}
                  />
                  <Field label="Alimentos a evitar" value={detalhePa.foods_to_avoid} />
                  <Field label="Crianças" value={detalhePa.children_info} />
                  <Field label="Ocasião especial" value={detalhePa.special_occasion} />
                  <Field label="Detalhe da ocasião" value={detalhePa.special_occasion_detail} />
                  <Field label="Modo de chegada" value={detalhePa.arrival_mode} />
                  <Field label="Horário previsto" value={detalhePa.estimated_arrival_time} />
                  <Field label="Necessidades de transporte" value={detalhePa.transport_needs} />
                  <Field label="Informações adicionais" value={detalhePa.additional_info} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem resposta registrada.</p>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Check-in digital</h3>
              {detalheCi ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Enviado em" value={formatDateTime(detalheCi.created_at)} />
                  <Field label="Nome completo" value={detalheCi.full_name} />
                  <Field label="Documento" value={detalheCi.document} />
                  <Field label="Nascimento" value={formatDate(detalheCi.birth_date)} />
                  <Field label="Nacionalidade" value={detalheCi.nationality} />
                  <Field label="Cidade / Estado" value={detalheCi.city_state} />
                  <Field label="Endereço" value={detalheCi.address} />
                  <Field label="Transporte" value={detalheCi.transport_mode} />
                  <Field label="Motivo da viagem" value={detalheCi.travel_reason} />
                  <Field label="Horário previsto" value={detalheCi.estimated_arrival_time} />
                  <Field label="Observações" value={detalheCi.notes} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem resposta registrada.</p>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Feedback pós-estadia</h3>
              {detalheCo ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Enviado em" value={formatDateTime(detalheCo.created_at)} />
                  <div className="space-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Nota</p>
                    <div className="flex items-center gap-1 text-sm">
                      {detalheCo.rating ?? "—"}
                      <Star className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                  <Field label="Comentário" value={detalheCo.comment} />
                  <Field label="Problemas relatados" value={detalheCo.issues} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem resposta registrada.</p>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Formularios;
