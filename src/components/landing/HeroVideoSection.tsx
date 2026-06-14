import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createWhatsAppLink } from "@/lib/whatsapp";
import { useVideoMenuSync } from "@/hooks/useVideoMenuSync";
import LandingNavbar from "./LandingNavbar";
import heroBungalow1 from "@/assets/hero-bungalow-1.jpg";

const HeroVideoSection = () => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const menuBgStyle = useVideoMenuSync(videoRef);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string>(heroBungalow1);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) Procura slide ativo de vídeo (menor display_order)
      const { data: videoSlide } = await supabase
        .from("hero_slides")
        .select("desktop_image_url, mobile_image_url")
        .eq("is_active", true)
        .eq("media_type", "video")
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (videoSlide?.desktop_image_url) {
        setVideoUrl(videoSlide.desktop_image_url);
      }

      // 2) Poster: primeira imagem ativa
      const { data: imageSlide } = await supabase
        .from("hero_slides")
        .select("desktop_image_url")
        .eq("is_active", true)
        .neq("media_type", "video")
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (imageSlide?.desktop_image_url) {
        setPosterUrl(imageSlide.desktop_image_url);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const whatsappHref = createWhatsAppLink(t("cta.whatsappMessage"));

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
      {/* Background: video ou poster */}
      {videoUrl && !reducedMotion ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <img
          src={posterUrl}
          alt={t("home.heroTitle")}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      )}

      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Navbar */}
      <LandingNavbar menuBgStyle={menuBgStyle} />

      {/* Conteúdo central */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h1
            className="font-display font-bold text-white mb-4 sm:mb-6 opacity-0 animate-fade-in-up drop-shadow-lg leading-tight"
            style={{ fontSize: "clamp(2rem, 6vw, 5rem)" }}
          >
            {t("home.heroTitle")}
          </h1>
          <p
            className="text-white/85 mb-8 max-w-2xl mx-auto opacity-0 animate-fade-in-up [animation-delay:120ms] drop-shadow"
            style={{ fontSize: "clamp(1rem, 2vw, 1.35rem)" }}
          >
            {t("home.heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center opacity-0 animate-fade-in-up [animation-delay:240ms]">
            <Button
              size="lg"
              className="bg-gradient-forest text-primary-foreground hover:opacity-90 h-14 px-8 text-base font-semibold rounded-lg shadow-lg"
              asChild
            >
              <Link to="/bangalos">
                <Calendar className="mr-2 h-5 w-5" />
                {t("nav.bookNow")}
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/60 text-white hover:bg-white/20 hover:text-white h-14 px-8 text-base font-semibold rounded-lg"
              asChild
            >
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                {t("cta.talkOnWhatsApp")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroVideoSection;
