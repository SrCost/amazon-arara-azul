// Detect guest language from email TLD, country or nationality.
// Returns one of: 'pt' | 'en' | 'es' | 'fr' | 'de'.
export type GuestLang = "pt" | "en" | "es" | "fr" | "de";

const TLD_TO_LANG: Record<string, GuestLang> = {
  br: "pt", pt: "pt",
  de: "de", at: "de", ch: "de",
  es: "es", mx: "es", ar: "es", cl: "es", co: "es", pe: "es", uy: "es", ve: "es",
  fr: "fr", be: "fr", lu: "fr",
  uk: "en", us: "en", au: "en", ca: "en", ie: "en", nz: "en", za: "en",
};

const COUNTRY_TO_LANG: Record<string, GuestLang> = {
  brasil: "pt", brazil: "pt", portugal: "pt",
  germany: "de", deutschland: "de", alemanha: "de", austria: "de", áustria: "de", switzerland: "de", suíça: "de", suica: "de",
  espana: "es", españa: "es", spain: "es", espanha: "es", mexico: "es", méxico: "es", argentina: "es",
  france: "fr", frança: "fr", franca: "fr", belgium: "fr", bélgica: "fr",
  usa: "en", "united states": "en", "estados unidos": "en", uk: "en", "united kingdom": "en", "reino unido": "en", canada: "en", canadá: "en", australia: "en", austrália: "en", ireland: "en",
};

export const detectGuestLanguage = (opts: {
  email?: string;
  country?: string;
  nationality?: string;
  fallback?: GuestLang;
}): GuestLang => {
  const { email, country, nationality, fallback = "pt" } = opts;

  // Country/nationality have priority (more reliable than TLD)
  const norm = (s?: string) => s?.toLowerCase().trim();
  const c = norm(country);
  const n = norm(nationality);
  if (c && COUNTRY_TO_LANG[c]) return COUNTRY_TO_LANG[c];
  if (n && COUNTRY_TO_LANG[n]) return COUNTRY_TO_LANG[n];

  if (email) {
    const tld = email.split("@")[1]?.split(".").pop()?.toLowerCase();
    if (tld && TLD_TO_LANG[tld]) return TLD_TO_LANG[tld];
    // generic .com/.net/.org default to English when not Brazilian
    if (tld && ["com", "net", "org"].includes(tld)) return "en";
  }

  return fallback;
};
