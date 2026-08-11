import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";
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
import { CheckCircle, Leaf, MessageCircle, HeartPulse, Utensils, Baby, Gift, Car, Info } from "lucide-react";
import { createWhatsAppLink } from "@/lib/whatsapp";

interface PreArrivalData {
  reservation_id: string;
  guest_name: string;
  reservation_code: string;
  check_in: string;
  check_out: string;
  guests: number;
  rooms_summary: string | null;
  guest_language: string;
  status: string;
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
  health_condition: string | null;
  mobility_limitations: string | null;
  continuous_medication: string | null;
}

const localeMap: Record<string, string> = {
  pt: "pt-BR", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE",
};

const DIET_KEYS = ["vegetarian", "vegan", "glutenFree", "lactoseFree", "diabetic", "other"];
const OCCASION_KEYS = ["none", "honeymoon", "birthday", "anniversary", "proposal", "other"];
const ARRIVAL_KEYS = ["car", "bus", "boat", "plane", "transfer", "other"];

const Section = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    {description && <p className="text-sm text-muted-foreground mb-4 md:ml-12">{description}</p>}
    <div className="space-y-4 mt-4 md:ml-12">{children}</div>
  </section>
);

const PreArrival = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useTranslation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PreArrivalData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [diet, setDiet] = useState<string[]>([]);
  const [foodsToAvoid, setFoodsToAvoid] = useState("");
  const [childrenInfo, setChildrenInfo] = useState("");
  const [occasion, setOccasion] = useState("");
  const [occasionDetail, setOccasionDetail] = useState("");
  const [arrivalMode, setArrivalMode] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [transportNeeds, setTransportNeeds] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [healthCondition, setHealthCondition] = useState("");
  const [mobility, setMobility] = useState("");
  const [medication, setMedication] = useState("");

  useEffect(() => {
    document.title = "Pré-Chegada — Pousada Rará Azul";
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    const previous = meta.content;
    meta.content = "noindex, nofollow";
    return () => {
      if (created) meta?.remove();
      else if (meta) meta.content = previous;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      const { data: rows, error } = await supabase.rpc("get_pre_arrival_by_token", { _token: token });
      if (error) console.error("get_pre_arrival_by_token", error);

      const row = (rows as PreArrivalData[] | null)?.[0] ?? null;
      if (row) {
        setData(row);
        if (row.guest_language && localeMap[row.guest_language]) {
          i18n.changeLanguage(row.guest_language);
        }
        setDiet(row.dietary_restrictions || []);
        setFoodsToAvoid(row.foods_to_avoid || "");
        setChildrenInfo(row.children_info || "");
        setOccasion(row.special_occasion || "");
        setOccasionDetail(row.special_occasion_detail || "");
        setArrivalMode(row.arrival_mode || "");
        setArrivalTime(row.estimated_arrival_time || "");
        setTransportNeeds(row.transport_needs || "");
        setAdditionalInfo(row.additional_info || "");
        setHealthCondition(row.health_condition || "");
        setMobility(row.mobility_limitations || "");
        setMedication(row.continuous_medication || "");
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString(localeMap[i18n.language] || "pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });

  const toggleDiet = (key: string) =>
    setDiet((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_pre_arrival", {
      _token: token,
      _language: i18n.language || "pt",
      _dietary_restrictions: diet,
      _foods_to_avoid: foodsToAvoid.trim().slice(0, 500) || null,
      _children_info: childrenInfo.trim().slice(0, 500) || null,
      _special_occasion: occasion || null,
      _special_occasion_detail: occasionDetail.trim().slice(0, 500) || null,
      _arrival_mode: arrivalMode || null,
      _estimated_arrival_time: arrivalTime.trim().slice(0, 100) || null,
      _transport_needs: transportNeeds.trim().slice(0, 500) || null,
      _additional_info: additionalInfo.trim().slice(0, 1000) || null,
      _health_condition: healthCondition.trim().slice(0, 500) || null,
      _mobility_limitations: mobility.trim().slice(0, 500) || null,
      _continuous_medication: medication.trim().slice(0, 500) || null,
    });
    setSubmitting(false);

    if (error) {
      console.error("submit_pre_arrival", error);
      toast({ title: t("preArrival.errorSave"), variant: "destructive" });
      return;
    }

    supabase.functions
      .invoke("notify-pre-arrival", { body: { token } })
      .catch((e) => console.error("notify-pre-arrival", e));

    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const whatsappLink = createWhatsAppLink(t("preArrival.whatsappMsg"));

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-3xl px-4 py-24 md:py-28">{children}</main>
      <Footer />
    </div>
  );

  if (loading) {
    return (
      <Shell>
        <p className="text-center text-muted-foreground">{t("preArrival.loading")}</p>
      </Shell>
    );
  }

  if (!token || !data) {
    const expired = Boolean(token);
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Leaf className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {expired ? t("preArrival.expiredTitle") : t("preArrival.invalidTitle")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {expired ? t("preArrival.expiredDesc") : t("preArrival.invalidDesc")}
          </p>
          <Button asChild>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              {t("preArrival.whatsappBtn")}
            </a>
          </Button>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">{t("preArrival.successTitle")}</h1>
          <p className="text-muted-foreground mb-2">{t("preArrival.successDesc")}</p>
          <p className="text-sm text-muted-foreground">{t("preArrival.successUpdate")}</p>
        </div>
      </Shell>
    );
  }

  const alreadyAnswered = Boolean(data.answered_at);

  return (
    <Shell>
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Leaf className="h-4 w-4" />
          {t("preArrival.title")}
        </span>
        <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground">
          {data.guest_name}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("preArrival.subtitle")}</p>
      </header>

      <div className="rounded-2xl border border-border bg-muted/40 p-5 mb-6">
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">{t("preArrival.reservation")}</dt>
            <dd className="font-medium text-foreground">{data.reservation_code}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("preArrival.guests")}</dt>
            <dd className="font-medium text-foreground">{data.guests}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("preArrival.bungalows")}</dt>
            <dd className="font-medium text-foreground">{data.rooms_summary || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("preArrival.checkIn")}</dt>
            <dd className="font-medium text-foreground">{formatDate(data.check_in)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("preArrival.checkOut")}</dt>
            <dd className="font-medium text-foreground">{formatDate(data.check_out)}</dd>
          </div>
        </dl>
      </div>

      <p className="mb-6 text-muted-foreground leading-relaxed">{t("preArrival.intro")}</p>

      {alreadyAnswered && (
        <p className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
          {t("preArrival.answeredBadge")}
        </p>
      )}

      <div className="space-y-5">
        <Section icon={Utensils} title={t("preArrival.food.title")} description={t("preArrival.food.desc")}>
          <div>
            <Label className="mb-3 block">{t("preArrival.food.restrictions")}</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {DIET_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={diet.includes(key)} onCheckedChange={() => toggleDiet(key)} />
                  {t(`preArrival.diet.${key}`)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="foods-avoid">{t("preArrival.food.avoid")}</Label>
            <Textarea
              id="foods-avoid"
              value={foodsToAvoid}
              maxLength={500}
              placeholder={t("preArrival.food.avoidPh")}
              onChange={(e) => setFoodsToAvoid(e.target.value)}
            />
          </div>
        </Section>

        <Section
          icon={HeartPulse}
          title={t("preArrival.health.title")}
          description={t("preArrival.health.notice")}
        >
          <div>
            <Label htmlFor="health-condition">{t("preArrival.health.condition")}</Label>
            <Textarea
              id="health-condition"
              value={healthCondition}
              maxLength={500}
              onChange={(e) => setHealthCondition(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="mobility">{t("preArrival.health.mobility")}</Label>
            <Input id="mobility" value={mobility} maxLength={500} onChange={(e) => setMobility(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="medication">{t("preArrival.health.medication")}</Label>
            <Input id="medication" value={medication} maxLength={500} onChange={(e) => setMedication(e.target.value)} />
          </div>
        </Section>

        <Section icon={Baby} title={t("preArrival.kids.title")}>
          <div>
            <Label htmlFor="children">{t("preArrival.kids.info")}</Label>
            <Textarea
              id="children"
              value={childrenInfo}
              maxLength={500}
              placeholder={t("preArrival.kids.infoPh")}
              onChange={(e) => setChildrenInfo(e.target.value)}
            />
          </div>
        </Section>

        <Section icon={Gift} title={t("preArrival.occasion.title")}>
          <div>
            <Label>{t("preArrival.occasion.select")}</Label>
            <Select value={occasion} onValueChange={setOccasion}>
              <SelectTrigger>
                <SelectValue placeholder={t("preArrival.occasionOpts.none")} />
              </SelectTrigger>
              <SelectContent>
                {OCCASION_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`preArrival.occasionOpts.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="occasion-detail">{t("preArrival.occasion.detail")}</Label>
            <Textarea
              id="occasion-detail"
              value={occasionDetail}
              maxLength={500}
              placeholder={t("preArrival.occasion.detailPh")}
              onChange={(e) => setOccasionDetail(e.target.value)}
            />
          </div>
        </Section>

        <Section icon={Car} title={t("preArrival.transport.title")}>
          <div>
            <Label>{t("preArrival.transport.mode")}</Label>
            <Select value={arrivalMode} onValueChange={setArrivalMode}>
              <SelectTrigger>
                <SelectValue placeholder={t("preArrival.arrivalOpts.car")} />
              </SelectTrigger>
              <SelectContent>
                {ARRIVAL_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`preArrival.arrivalOpts.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="arrival-time">{t("preArrival.transport.time")}</Label>
            <Input
              id="arrival-time"
              value={arrivalTime}
              maxLength={100}
              placeholder="14:00"
              onChange={(e) => setArrivalTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="transport-needs">{t("preArrival.transport.needs")}</Label>
            <Textarea
              id="transport-needs"
              value={transportNeeds}
              maxLength={500}
              placeholder={t("preArrival.transport.needsPh")}
              onChange={(e) => setTransportNeeds(e.target.value)}
            />
          </div>
        </Section>

        <Section icon={Info} title={t("preArrival.additional.title")}>
          <div>
            <Label htmlFor="additional">{t("preArrival.additional.info")}</Label>
            <Textarea
              id="additional"
              value={additionalInfo}
              maxLength={1000}
              placeholder={t("preArrival.additional.infoPh")}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
          </div>
        </Section>
      </div>

      <p className="mt-8 text-center text-muted-foreground">{t("preArrival.closing")}</p>

      <div className="mt-6 flex justify-center">
        <Button size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? t("preArrival.submitting")
            : alreadyAnswered
              ? t("preArrival.update")
              : t("preArrival.submit")}
        </Button>
      </div>
    </Shell>
  );
};

export default PreArrival;
