import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Send, Loader2, HeartPulse } from "lucide-react";

interface Props {
  reservationId: string;
  guestName: string;
  guestEmail: string;
}

interface PreArrivalStatus {
  status: string;
  last_sent_at: string | null;
  answered_at: string | null;
}

interface AdminAnswers {
  status: string;
  first_sent_at: string | null;
  last_sent_at: string | null;
  answered_at: string | null;
  updated_at: string | null;
  reminders_sent: number;
  last_send_origin: string | null;
  dietary_restrictions: string[] | null;
  foods_to_avoid: string | null;
  children_info: string | null;
  special_occasion: string | null;
  special_occasion_detail: string | null;
  arrival_mode: string | null;
  estimated_arrival_time: string | null;
  transport_needs: string | null;
  additional_info: string | null;
  can_view_health: boolean;
  health_condition: string | null;
  mobility_limitations: string | null;
  continuous_medication: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  sent: "Enviado",
  answered: "Respondido",
  updated: "Atualizado",
};

const STATUS_VARIANT: Record<string, "secondary" | "outline" | "default"> = {
  pending: "outline",
  sent: "secondary",
  answered: "default",
  updated: "default",
};

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

const PreArrivalCell = ({ reservationId, guestName, guestEmail }: Props) => {
  const [state, setState] = useState<PreArrivalStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [answersOpen, setAnswersOpen] = useState(false);
  const [answers, setAnswers] = useState<AdminAnswers | null>(null);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  const loadStatus = async () => {
    const { data } = await supabase
      .from("pre_arrival_responses")
      .select("status, last_sent_at, answered_at")
      .eq("reservation_id", reservationId)
      .maybeSingle();
    setState((data as PreArrivalStatus) || null);
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  const status = state?.status || "none";
  const answered = Boolean(state?.answered_at);

  const handleSend = async () => {
    setSending(true);
    const { error } = await supabase.functions.invoke("send-pre-arrival-email", {
      body: { reservationId, origin: "manual" },
    });
    setSending(false);
    setConfirmOpen(false);

    if (error) {
      console.error("send-pre-arrival-email", error);
      toast.error("Não foi possível enviar o formulário de Pré-Chegada");
      return;
    }
    toast.success("Formulário de Pré-Chegada enviado");
    loadStatus();
  };

  const openAnswers = async () => {
    setAnswersOpen(true);
    setLoadingAnswers(true);
    const { data, error } = await supabase.rpc("get_pre_arrival_admin", {
      _reservation_id: reservationId,
    });
    setLoadingAnswers(false);
    if (error) {
      console.error("get_pre_arrival_admin", error);
      toast.error("Não foi possível carregar as respostas");
      return;
    }
    setAnswers(((data as AdminAnswers[] | null) || [])[0] || null);
  };

  const field = (label: string, value?: string | null) => (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value && value.trim() ? value : "—"}</p>
    </div>
  );

  return (
    <div className="flex flex-col items-start gap-1">
      {status === "none" ? (
        <span className="text-xs text-muted-foreground">Não enviado</span>
      ) : (
        <Badge variant={STATUS_VARIANT[status] || "outline"} className="text-[11px]">
          {STATUS_LABEL[status] || status}
        </Badge>
      )}

      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" className="h-7 px-2" title="Enviar Pré-Chegada" onClick={() => setConfirmOpen(true)}>
          <Send className="h-3.5 w-3.5" />
        </Button>
        {answered && (
          <Button size="sm" variant="ghost" className="h-7 px-2" title="Ver respostas" onClick={openAnswers}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar o formulário de Pré-Chegada para {guestName}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>E-mail de destino: <strong>{guestEmail || "—"}</strong></p>
                {answered && (
                  <p className="text-destructive">
                    Este questionário já foi respondido. Deseja realmente reenviar o acesso?
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSend();
              }}
              disabled={sending || !guestEmail}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={answersOpen} onOpenChange={setAnswersOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Respostas de Pré-Chegada — {guestName}</DialogTitle>
            <DialogDescription>
              Primeira resposta: {fmtDateTime(answers?.answered_at)} · Última atualização: {fmtDateTime(answers?.updated_at)}
            </DialogDescription>
          </DialogHeader>

          {loadingAnswers ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !answers ? (
            <p className="text-sm text-muted-foreground">Ainda sem respostas para esta reserva.</p>
          ) : (
            <div className="space-y-5">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Alimentação</h3>
                {field("Restrições", (answers.dietary_restrictions || []).join(", "))}
                {field("Alimentos a evitar", answers.foods_to_avoid)}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Crianças e ocasião</h3>
                {field("Crianças", answers.children_info)}
                {field("Ocasião especial", answers.special_occasion)}
                {field("Detalhes da ocasião", answers.special_occasion_detail)}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Transporte e chegada</h3>
                {field("Meio de chegada", answers.arrival_mode)}
                {field("Horário estimado", answers.estimated_arrival_time)}
                {field("Necessidades de transporte", answers.transport_needs)}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Informações adicionais</h3>
                {field("Observações", answers.additional_info)}
              </section>

              <section className="space-y-3 rounded-lg border border-border p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  Saúde e Bem-Estar
                </h3>
                {answers.can_view_health ? (
                  <>
                    {field("Condição de saúde", answers.health_condition)}
                    {field("Limitações de mobilidade", answers.mobility_limitations)}
                    {field("Medicação contínua", answers.continuous_medication)}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    As informações de saúde são visíveis apenas para o administrador principal.
                  </p>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreArrivalCell;
