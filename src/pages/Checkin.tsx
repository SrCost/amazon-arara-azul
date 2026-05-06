import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";
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

const localeMap: Record<string, string> = {
  pt: "pt-BR", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE",
};

const Checkin = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const { toast } = useToast();
  const { t } = useTranslation();

  const checkinSchema = z.object({
    full_name: z.string().trim().min(3, t("checkinPage.fullName")).max(200),
    document: z.string().trim().min(3, t("checkinPage.docLabel")).max(50),
    birth_date: z.string().min(1, t("checkinPage.birthDate")),
    nationality: z.string().trim().min(2, t("checkinPage.nationality")).max(100),
    city_state: z.string().trim().min(2, t("checkinPage.cityState")).max(200),
    address: z.string().max(500).optional(),
    transport_mode: z.string().max(100).optional(),
    travel_reason: z.string().max(100).optional(),
    estimated_arrival: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
    accepted_terms: z.literal(true, { errorMap: () => ({ message: t("checkinPage.acceptTermsLead") }) }),
  });

  const TRANSPORT_OPTIONS = [
    { value: "carro", label: t("checkinPage.transportOpts.carro") },
    { value: "onibus", label: t("checkinPage.transportOpts.onibus") },
    { value: "aviao_barco", label: t("checkinPage.transportOpts.aviao_barco") },
    { value: "barco", label: t("checkinPage.transportOpts.barco") },
    { value: "outro", label: t("checkinPage.transportOpts.outro") },
  ];

  const TRAVEL_REASON_OPTIONS = [
    { value: "lazer", label: t("checkinPage.reasonOpts.lazer") },
    { value: "negocios", label: t("checkinPage.reasonOpts.negocios") },
    { value: "eventos", label: t("checkinPage.reasonOpts.eventos") },
    { value: "saude", label: t("checkinPage.reasonOpts.saude") },
    { value: "outro", label: t("checkinPage.reasonOpts.outro") },
  ];

  const [step, setStep] = useState<"validate" | "form" | "success">("validate");
  const [reservationId, setReservationId] = useState("");
  const [email, setEmail] = useState("");
  const [reservation, setReservation] = useState<ReservationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenUsed] = useState(tokenFromUrl || "");
  const [tokenExpired, setTokenExpired] = useState(false);

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
    if (tokenFromUrl) validateToken(tokenFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function validateToken(token: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc("validate_booking_token", {
      p_token: token,
      p_type: "checkin",
    });
    if (error || !data || data.length === 0) {
      toast({ title: t("checkinPage.tokenInvalid"), variant: "destructive" });
      setStep("validate");
      setTokenExpired(true);
    } else {
      const r = data[0];
      if (r.checkin_completed) {
        toast({ title: t("checkinPage.alreadyDone"), description: t("checkinPage.alreadyDoneDesc") });
        setStep("validate");
      } else {
        setReservation({
          id: r.reservation_id, guest_name: r.guest_name, room_name: r.room_name,
          check_in: r.check_in, check_out: r.check_out, guests: r.guests, checkin_completed: r.checkin_completed,
        });
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
      p_reservation_id: reservationId.trim(), p_email: email.trim(),
    });
    if (error || !data || data.length === 0) {
      toast({ title: t("checkinPage.reservationNotFound"), description: t("checkinPage.reservationNotFoundDesc"), variant: "destructive" });
    } else {
      const r = data[0];
      if (r.checkin_completed) {
        toast({ title: t("checkinPage.alreadyDone") });
      } else {
        setReservation({
          id: r.id, guest_name: r.guest_name, room_name: r.room_name,
          check_in: r.check_in, check_out: r.check_out, guests: r.guests, checkin_completed: r.checkin_completed,
        });
        setFullName(r.guest_name || "");
        setStep("form");
      }
    }
    setLoading(false);
  }

  async function handleSubmitCheckin(e: React.FormEvent) {
    e.preventDefault();
    const parsed = checkinSchema.safeParse({
      full_name: fullName, document, birth_date: birthDate, nationality, city_state: cityState,
      address: address || undefined, transport_mode: transportMode || undefined,
      travel_reason: travelReason || undefined, estimated_arrival: estimatedArrival || undefined,
      notes: notes || undefined, accepted_terms: acceptedTerms,
    });
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.rpc("submit_checkin", {
      p_reservation_id: reservation!.id, p_document: document.trim(),
      p_estimated_arrival: estimatedArrival.trim() || null, p_notes: notes.trim() || null,
      p_accepted_terms: true, p_token: tokenUsed || null,
      p_full_name: fullName.trim(), p_birth_date: birthDate || null,
      p_nationality: nationality.trim() || null, p_city_state: cityState.trim() || null,
      p_address: address.trim() || null, p_transport_mode: transportMode || null,
      p_travel_reason: travelReason || null,
    });
    if (error) {
      toast({ title: t("checkinPage.errorSubmit"), description: error.message, variant: "destructive" });
    } else {
      setStep("success");
    }
    setLoading(false);
  }

  const lang = i18n.language?.split("-")[0] || "pt";
  const dateLocale = localeMap[lang] || "pt-BR";
  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString(dateLocale, { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          {step === "validate" && (
            <div className="bg-card rounded-xl shadow-soft p-6 sm:p-8">
              <div className="text-center mb-6">
                <Leaf className="h-10 w-10 text-primary mx-auto mb-3" />
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{t("checkinPage.title")}</h1>
                <p className="text-muted-foreground mt-2">{t("checkinPage.subtitle")}</p>
              </div>
              <form onSubmit={handleValidate} className="space-y-4">
                <div>
                  <Label htmlFor="reservationId">{t("checkinPage.reservationCode")}</Label>
                  <Input id="reservationId" value={reservationId} onChange={(e) => setReservationId(e.target.value)}
                    placeholder={t("checkinPage.reservationCodePh")} required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="email">{t("checkinPage.email")}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("checkinPage.emailPh")} required maxLength={255} />
                </div>
                <Button type="submit" className="w-full bg-gradient-forest hover:opacity-90" disabled={loading}>
                  {loading ? t("checkinPage.verifying") : t("checkinPage.continue")}
                </Button>
                {tokenExpired && (
                  <div className="text-center mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">{t("checkinPage.tokenExpiredHelp")}</p>
                    <Button type="button" variant="outline" className="cursor-pointer"
                      onClick={() => window.open(createWhatsAppLink(t("checkinPage.whatsappMsg")), '_blank', 'noopener,noreferrer')}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {t("checkinPage.whatsappBtn")}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          {step === "form" && reservation && (
            <div className="bg-card rounded-xl shadow-soft p-6 sm:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-display font-bold text-foreground">{t("checkinPage.hello", { name: reservation.guest_name })}</h1>
                <p className="text-muted-foreground mt-1">{t("checkinPage.completeFor", { room: reservation.room_name })}</p>
                <p className="text-sm text-muted-foreground mt-1">{formatDate(reservation.check_in)} — {formatDate(reservation.check_out)}</p>
              </div>
              <form onSubmit={handleSubmitCheckin} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t("checkinPage.personalData")}</p>
                  <p className="text-xs text-muted-foreground">{t("checkinPage.fnrh")}</p>
                </div>

                <div>
                  <Label htmlFor="fullName">{t("checkinPage.fullName")} *</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("checkinPage.fullNamePh")} required maxLength={200} />
                </div>
                <div>
                  <Label htmlFor="document">{t("checkinPage.docLabel")} *</Label>
                  <Input id="document" value={document} onChange={(e) => setDocument(e.target.value)}
                    placeholder={t("checkinPage.docPh")} required maxLength={50} />
                </div>
                <div>
                  <Label htmlFor="birthDate">{t("checkinPage.birthDate")} *</Label>
                  <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="nationality">{t("checkinPage.nationality")} *</Label>
                  <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)}
                    placeholder={t("checkinPage.nationalityPh")} required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="cityState">{t("checkinPage.cityState")} *</Label>
                  <Input id="cityState" value={cityState} onChange={(e) => setCityState(e.target.value)}
                    placeholder={t("checkinPage.cityStatePh")} required maxLength={200} />
                </div>
                <div>
                  <Label htmlFor="address">{t("checkinPage.address")}</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("checkinPage.addressPh")} maxLength={500} />
                </div>
                <div>
                  <Label htmlFor="transportMode">{t("checkinPage.transport")}</Label>
                  <Select value={transportMode} onValueChange={setTransportMode}>
                    <SelectTrigger id="transportMode"><SelectValue placeholder={t("checkinPage.selectPh")} /></SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="travelReason">{t("checkinPage.travelReason")}</Label>
                  <Select value={travelReason} onValueChange={setTravelReason}>
                    <SelectTrigger id="travelReason"><SelectValue placeholder={t("checkinPage.selectPh")} /></SelectTrigger>
                    <SelectContent>
                      {TRAVEL_REASON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <hr className="my-2 border-border" />

                <div>
                  <Label htmlFor="arrival">{t("checkinPage.arrival")}</Label>
                  <Input id="arrival" value={estimatedArrival} onChange={(e) => setEstimatedArrival(e.target.value)}
                    placeholder={t("checkinPage.arrivalPh")} maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="notes">{t("checkinPage.notes")}</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("checkinPage.notesPh")} maxLength={500} rows={3} />
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(v === true)} />
                  <Label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
                    {t("checkinPage.acceptTermsLead")}{" "}
                    <a href="/docs/termos-de-uso.pdf" target="_blank" className="text-primary underline">{t("checkinPage.termsOfUse")}</a>
                    {" "}{t("checkinPage.and")}{" "}
                    <a href="/docs/politica-privacidade.pdf" target="_blank" className="text-primary underline">{t("checkinPage.privacyPolicy")}</a>
                  </Label>
                </div>
                <Button type="submit" className="w-full bg-gradient-forest hover:opacity-90" disabled={loading || !acceptedTerms}>
                  {loading ? t("checkinPage.sending") : t("checkinPage.submit")}
                </Button>
              </form>
            </div>
          )}

          {step === "success" && (
            <div className="bg-card rounded-xl shadow-soft p-8 sm:p-12 text-center">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">{t("checkinPage.successTitle")}</h1>
              <p className="text-lg text-muted-foreground mb-2">
                {t("checkinPage.successLead")} <strong>{reservation?.guest_name}</strong>.
              </p>
              <p className="text-muted-foreground">{t("checkinPage.successOutro")}</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkin;
