import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Leaf, MessageCircle } from "lucide-react";
import { createWhatsAppLink } from "@/lib/whatsapp";

interface ReservationInfo {
  id: string;
  guest_name: string;
  room_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  checkin_completed: boolean;
}

const checkinSchema = z.object({
  document: z.string().trim().min(3, "Documento é obrigatório").max(50),
  estimated_arrival: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  accepted_terms: z.literal(true, { errorMap: () => ({ message: "Você deve aceitar os termos" }) }),
});

const Checkin = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const { toast } = useToast();

  const [step, setStep] = useState<"validate" | "form" | "success">(tokenFromUrl ? "validate" : "validate");
  const [reservationId, setReservationId] = useState("");
  const [email, setEmail] = useState("");
  const [reservation, setReservation] = useState<ReservationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenUsed, setTokenUsed] = useState(tokenFromUrl || "");

  // Form fields
  const [document, setDocument] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  // Auto-validate token on mount
  useEffect(() => {
    if (tokenFromUrl) {
      validateToken(tokenFromUrl);
    }
  }, []);

  async function validateToken(token: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc("validate_booking_token", {
      p_token: token,
      p_type: "checkin",
    });

    if (error || !data || data.length === 0) {
      toast({ title: "Token inválido ou expirado", variant: "destructive" });
      setStep("validate");
      setTokenExpired(true);
    } else {
      const r = data[0];
      if (r.checkin_completed) {
        toast({ title: "Check-in já realizado", description: "Você já completou o check-in." });
        setStep("validate");
      } else {
        setReservation({
          id: r.reservation_id,
          guest_name: r.guest_name,
          room_name: r.room_name,
          check_in: r.check_in,
          check_out: r.check_out,
          guests: r.guests,
          checkin_completed: r.checkin_completed,
        });
        setStep("form");
      }
    }
    setLoading(false);
  }

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!reservationId.trim() || !email.trim()) return;
    setLoading(true);

    const { data, error } = await supabase.rpc("validate_reservation_for_guest", {
      p_reservation_id: reservationId.trim(),
      p_email: email.trim(),
    });

    if (error || !data || data.length === 0) {
      toast({ title: "Reserva não encontrada", description: "Verifique o código e o email informado.", variant: "destructive" });
    } else {
      const r = data[0];
      if (r.checkin_completed) {
        toast({ title: "Check-in já realizado" });
      } else {
        setReservation({
          id: r.id,
          guest_name: r.guest_name,
          room_name: r.room_name,
          check_in: r.check_in,
          check_out: r.check_out,
          guests: r.guests,
          checkin_completed: r.checkin_completed,
        });
        setStep("form");
      }
    }
    setLoading(false);
  }

  async function handleSubmitCheckin(e: React.FormEvent) {
    e.preventDefault();

    const parsed = checkinSchema.safeParse({
      document,
      estimated_arrival: estimatedArrival || undefined,
      notes: notes || undefined,
      accepted_terms: acceptedTerms,
    });

    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.rpc("submit_checkin", {
      p_reservation_id: reservation!.id,
      p_document: document.trim(),
      p_estimated_arrival: estimatedArrival.trim() || null,
      p_notes: notes.trim() || null,
      p_accepted_terms: true,
      p_token: tokenUsed || null,
    });

    if (error) {
      toast({ title: "Erro ao enviar check-in", description: error.message, variant: "destructive" });
    } else {
      setStep("success");
    }
    setLoading(false);
  }

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          {step === "validate" && (
            <div className="bg-card rounded-xl shadow-soft p-6 sm:p-8">
              <div className="text-center mb-6">
                <Leaf className="h-10 w-10 text-primary mx-auto mb-3" />
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Check-in Digital</h1>
                <p className="text-muted-foreground mt-2">Informe os dados da sua reserva para iniciar</p>
              </div>
              <form onSubmit={handleValidate} className="space-y-4">
                <div>
                  <Label htmlFor="reservationId">Código da Reserva</Label>
                  <Input id="reservationId" value={reservationId} onChange={(e) => setReservationId(e.target.value)} placeholder="ID da reserva" required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" required maxLength={255} />
                </div>
                <Button type="submit" className="w-full bg-gradient-forest hover:opacity-90" disabled={loading}>
                  {loading ? "Verificando..." : "Continuar"}
                </Button>
                {tokenExpired && (
                  <div className="text-center mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Seu link expirou? Entre em contato conosco:
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => window.open(createWhatsAppLink("Olá! Preciso de ajuda com meu check-in digital."), '_blank', 'noopener,noreferrer')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Falar no WhatsApp
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          {step === "form" && reservation && (
            <div className="bg-card rounded-xl shadow-soft p-6 sm:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-display font-bold text-foreground">Olá, {reservation.guest_name}!</h1>
                <p className="text-muted-foreground mt-1">Complete seu check-in para {reservation.room_name}</p>
                <p className="text-sm text-muted-foreground mt-1">{formatDate(reservation.check_in)} — {formatDate(reservation.check_out)}</p>
              </div>
              <form onSubmit={handleSubmitCheckin} className="space-y-4">
                <div>
                  <Label htmlFor="document">Documento (RG, CPF ou Passaporte) *</Label>
                  <Input id="document" value={document} onChange={(e) => setDocument(e.target.value)} placeholder="Número do documento" required maxLength={50} />
                </div>
                <div>
                  <Label htmlFor="arrival">Horário estimado de chegada</Label>
                  <Input id="arrival" value={estimatedArrival} onChange={(e) => setEstimatedArrival(e.target.value)} placeholder="Ex: 14:00" maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma necessidade especial?" maxLength={500} rows={3} />
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(v === true)} />
                  <Label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
                    Aceito os <a href="/docs/termos-de-uso.pdf" target="_blank" className="text-primary underline">termos de uso</a> e <a href="/docs/politica-privacidade.pdf" target="_blank" className="text-primary underline">política de privacidade</a>
                  </Label>
                </div>
                <Button type="submit" className="w-full bg-gradient-forest hover:opacity-90" disabled={loading || !acceptedTerms}>
                  {loading ? "Enviando..." : "Finalizar Check-in"}
                </Button>
              </form>
            </div>
          )}

          {step === "success" && (
            <div className="bg-card rounded-xl shadow-soft p-8 sm:p-12 text-center">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">Check-in Concluído!</h1>
              <p className="text-lg text-muted-foreground mb-2">
                Estamos preparando tudo para sua chegada, <strong>{reservation?.guest_name}</strong>.
              </p>
              <p className="text-muted-foreground">
                Nos vemos em breve na Pousada Arara Azul 🌿
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkin;
