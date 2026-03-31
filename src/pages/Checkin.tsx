import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  full_name: z.string().trim().min(3, "Nome completo é obrigatório").max(200),
  document: z.string().trim().min(3, "Documento é obrigatório").max(50),
  birth_date: z.string().min(1, "Data de nascimento é obrigatória"),
  nationality: z.string().trim().min(2, "Nacionalidade é obrigatória").max(100),
  city_state: z.string().trim().min(2, "Cidade/Estado é obrigatório").max(200),
  address: z.string().max(500).optional(),
  transport_mode: z.string().max(100).optional(),
  travel_reason: z.string().max(100).optional(),
  estimated_arrival: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  accepted_terms: z.literal(true, { errorMap: () => ({ message: "Você deve aceitar os termos" }) }),
});

const TRANSPORT_OPTIONS = [
  { value: "carro", label: "Carro" },
  { value: "onibus", label: "Ônibus" },
  { value: "aviao_barco", label: "Avião + Barco" },
  { value: "barco", label: "Barco" },
  { value: "outro", label: "Outro" },
];

const TRAVEL_REASON_OPTIONS = [
  { value: "lazer", label: "Lazer" },
  { value: "negocios", label: "Negócios" },
  { value: "eventos", label: "Eventos" },
  { value: "saude", label: "Saúde" },
  { value: "outro", label: "Outros" },
];

const Checkin = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const { toast } = useToast();

  const [step, setStep] = useState<"validate" | "form" | "success">("validate");
  const [reservationId, setReservationId] = useState("");
  const [email, setEmail] = useState("");
  const [reservation, setReservation] = useState<ReservationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenUsed, setTokenUsed] = useState(tokenFromUrl || "");
  const [tokenExpired, setTokenExpired] = useState(false);

  // FNRH form fields
  const [fullName, setFullName] = useState("");
  const [document, setDocument] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [nationality, setNationality] = useState("");
  const [cityState, setCityState] = useState("");
  const [address, setAddress] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [travelReason, setTravelReason] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
        const info: ReservationInfo = {
          id: r.reservation_id,
          guest_name: r.guest_name,
          room_name: r.room_name,
          check_in: r.check_in,
          check_out: r.check_out,
          guests: r.guests,
          checkin_completed: r.checkin_completed,
        };
        setReservation(info);
        setFullName(r.guest_name || "");
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
        const info: ReservationInfo = {
          id: r.id,
          guest_name: r.guest_name,
          room_name: r.room_name,
          check_in: r.check_in,
          check_out: r.check_out,
          guests: r.guests,
          checkin_completed: r.checkin_completed,
        };
        setReservation(info);
        setFullName(r.guest_name || "");
        setStep("form");
      }
    }
    setLoading(false);
  }

  async function handleSubmitCheckin(e: React.FormEvent) {
    e.preventDefault();

    const parsed = checkinSchema.safeParse({
      full_name: fullName,
      document,
      birth_date: birthDate,
      nationality,
      city_state: cityState,
      address: address || undefined,
      transport_mode: transportMode || undefined,
      travel_reason: travelReason || undefined,
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
      p_full_name: fullName.trim(),
      p_birth_date: birthDate || null,
      p_nationality: nationality.trim() || null,
      p_city_state: cityState.trim() || null,
      p_address: address.trim() || null,
      p_transport_mode: transportMode || null,
      p_travel_reason: travelReason || null,
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
                {/* Dados Pessoais (FNRH) */}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Dados Pessoais</p>
                  <p className="text-xs text-muted-foreground">Ficha Nacional de Registro de Hóspedes</p>
                </div>

                <div>
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" required maxLength={200} />
                </div>

                <div>
                  <Label htmlFor="document">CPF ou Passaporte *</Label>
                  <Input id="document" value={document} onChange={(e) => setDocument(e.target.value)} placeholder="Número do documento" required maxLength={50} />
                </div>

                <div>
                  <Label htmlFor="birthDate">Data de Nascimento *</Label>
                  <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
                </div>

                <div>
                  <Label htmlFor="nationality">Nacionalidade *</Label>
                  <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Ex: Brasileira" required maxLength={100} />
                </div>

                <div>
                  <Label htmlFor="cityState">Cidade / Estado de Origem *</Label>
                  <Input id="cityState" value={cityState} onChange={(e) => setCityState(e.target.value)} placeholder="Ex: São Paulo / SP" required maxLength={200} />
                </div>

                <div>
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, CEP" maxLength={500} />
                </div>

                <div>
                  <Label htmlFor="transportMode">Meio de Transporte</Label>
                  <Select value={transportMode} onValueChange={setTransportMode}>
                    <SelectTrigger id="transportMode">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="travelReason">Motivo da Viagem</Label>
                  <Select value={travelReason} onValueChange={setTravelReason}>
                    <SelectTrigger id="travelReason">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAVEL_REASON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <hr className="my-2 border-border" />

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
