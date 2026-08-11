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
import { Eye, Send, Loader2 } from "lucide-react";
import PreArrivalDetails, { type ReservationSummaryInfo } from "./PreArrivalDetails";

export interface PreArrivalStatusRow {
  reservation_id: string;
  status: string;
  last_sent_at: string | null;
  answered_at: string | null;
  reminders_sent: number | null;
  last_send_origin: string | null;
}

interface Props {
  reservationId: string;
  guestName: string;
  guestEmail: string;
  /** Status pré-carregado em lote pela listagem (evita 1 consulta por linha). */
  preArrival?: PreArrivalStatusRow | null;
  variant?: "cell" | "panel";
  reservation?: ReservationSummaryInfo;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "🟡 Pendente",
  sent: "🟠 Enviado",
  answered: "🟢 Respondido",
  updated: "🔵 Atualizado",
};

const STATUS_VARIANT: Record<string, "secondary" | "outline" | "default"> = {
  pending: "outline",
  sent: "secondary",
  answered: "default",
  updated: "default",
};

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

const PreArrivalCell = ({
  reservationId,
  guestName,
  guestEmail,
  preArrival,
  variant = "cell",
  reservation,
}: Props) => {
  const [state, setState] = useState<PreArrivalStatusRow | null>(preArrival ?? null);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [answersOpen, setAnswersOpen] = useState(false);

  useEffect(() => {
    setState(preArrival ?? null);
  }, [preArrival, reservationId]);

  const reloadStatus = async () => {
    const { data } = await supabase
      .from("pre_arrival_responses")
      .select("reservation_id, status, last_sent_at, answered_at, reminders_sent, last_send_origin")
      .eq("reservation_id", reservationId)
      .maybeSingle();
    setState((data as PreArrivalStatusRow) || null);
  };

  const status = state?.status || "none";
  const answered = Boolean(state?.answered_at);
  const neverSent = !state || !state.last_sent_at;

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
    reloadStatus();
  };

  const statusBadge =
    status === "none" ? (
      <span className="text-xs text-muted-foreground">Não enviado</span>
    ) : (
      <Badge variant={STATUS_VARIANT[status] || "outline"} className="text-[11px]">
        {STATUS_LABEL[status] || status}
      </Badge>
    );

  const sendButton = (
    <Button
      size={variant === "panel" ? "sm" : "sm"}
      variant={variant === "panel" ? "outline" : "ghost"}
      className={variant === "panel" ? "min-h-10" : "h-7 px-2"}
      title={neverSent ? "Enviar Pré-Chegada" : "Enviar novamente"}
      onClick={() => setConfirmOpen(true)}
    >
      <Send className={variant === "panel" ? "mr-2 h-4 w-4" : "h-3.5 w-3.5"} />
      {variant === "panel" ? (neverSent ? "Enviar Pré-Chegada" : "Enviar novamente") : null}
    </Button>
  );

  const viewButton = answered ? (
    <Button
      size="sm"
      variant={variant === "panel" ? "default" : "ghost"}
      className={variant === "panel" ? "min-h-10" : "h-7 px-2"}
      title="Visualizar respostas"
      onClick={() => setAnswersOpen(true)}
    >
      <Eye className={variant === "panel" ? "mr-2 h-4 w-4" : "h-3.5 w-3.5"} />
      {variant === "panel" ? "Visualizar respostas" : null}
    </Button>
  ) : null;

  const dialogs = (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar o formulário de Pré-Chegada para {guestName}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <span className="block">
                  E-mail de destino: <strong>{guestEmail || "—"}</strong>
                </span>
                {answered && (
                  <span className="block text-destructive">
                    Este questionário já foi respondido. Deseja realmente reenviar o acesso?
                  </span>
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
            <DialogTitle>Respostas de Pré-Chegada</DialogTitle>
            <DialogDescription>Somente leitura — enviado pelo próprio hóspede.</DialogDescription>
          </DialogHeader>
          {answersOpen && (
            <PreArrivalDetails
              reservationId={reservationId}
              reservation={{ guest_name: guestName, ...(reservation || {}) }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );

  if (variant === "panel") {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {statusBadge}
          <span className="text-xs text-muted-foreground">
            Respondido em: {fmtDateTime(state?.answered_at)}
          </span>
          <span className="text-xs text-muted-foreground">
            Último envio: {fmtDateTime(state?.last_sent_at)}
            {state?.last_send_origin
              ? ` (${state.last_send_origin === "auto" ? "automático" : "manual"})`
              : ""}
          </span>
          {(state?.reminders_sent || 0) > 0 && (
            <span className="text-xs text-muted-foreground">Lembretes: {state?.reminders_sent}</span>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {viewButton}
          {sendButton}
        </div>
        {dialogs}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {statusBadge}
      <div className="flex items-center gap-1">
        {sendButton}
        {viewButton}
      </div>
      {dialogs}
    </div>
  );
};

export default PreArrivalCell;
