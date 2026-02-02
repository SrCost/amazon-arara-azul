import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { SOCIAL_LINKS } from "@/config/socialLinks";

const FindUsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            {t("home.findUsTitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.findUsSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {/* Airbnb Card */}
          <a
            href={SOCIAL_LINKS.airbnb}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-border hover:border-primary hover:shadow-medium transition-all bg-card"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <svg 
                viewBox="0 0 32 32" 
                fill="currentColor" 
                className="w-10 h-10 text-[#FF5A5F] group-hover:scale-110 transition-transform"
              >
                <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.01.415.001.228c0 4.062-2.877 6.478-6.357 6.478-2.224 0-4.556-1.258-6.709-3.386l-.257-.26-.172-.179h-.104l-.257.26c-2.106 2.175-4.39 3.416-6.607 3.564l-.274.002c-3.48 0-6.358-2.416-6.358-6.479 0-1.07.218-2.127.85-3.594l.155-.354c.986-2.296 5.146-11.005 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.239 0-2.053.539-2.987 2.21l-.523 1.008c-1.926 3.776-6.06 12.43-7.031 14.692l-.137.318c-.499 1.146-.655 1.893-.655 2.772 0 2.665 1.765 4.479 4.357 4.479 1.603 0 3.489-.966 5.313-2.901l.376-.405.236-.263.236.263c1.793 1.98 3.73 3.075 5.376 3.297l.313.009c2.592 0 4.358-1.814 4.358-4.479 0-.879-.156-1.626-.655-2.772l-.137-.319c-.97-2.26-5.105-10.916-7.031-14.691l-.523-1.008C18.053 3.539 17.239 3 16 3zm0 7c2.485 0 4.5 2.015 4.5 4.5S18.485 19 16 19s-4.5-2.015-4.5-4.5S13.515 10 16 10zm0 2c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/>
              </svg>
            </div>
            <div className="flex items-center gap-2 text-base font-medium text-muted-foreground group-hover:text-primary transition-colors">
              <span>Airbnb</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </a>

          {/* Booking.com Card */}
          <a
            href={SOCIAL_LINKS.booking}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-border hover:border-primary hover:shadow-medium transition-all bg-card"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <svg 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-10 h-10 text-[#003580] group-hover:scale-110 transition-transform"
              >
                <path d="M2.273 6.545V4.364C2.273 3.545 2.818 3 3.636 3h6.546c.818 0 1.364.545 1.364 1.364v2.181c0 .818-.546 1.364-1.364 1.364H3.636c-.818 0-1.363-.546-1.363-1.364zm0 6.546V10.91c0-.818.545-1.364 1.363-1.364h6.546c.818 0 1.364.546 1.364 1.364v2.181c0 .818-.546 1.364-1.364 1.364H3.636c-.818 0-1.363-.546-1.363-1.364zm0 6.545v-2.181c0-.818.545-1.364 1.363-1.364h6.546c.818 0 1.364.546 1.364 1.364v2.181c0 .818-.546 1.364-1.364 1.364H3.636c-.818 0-1.363-.546-1.363-1.364zm10.909-13.09V4.363C13.182 3.545 13.727 3 14.545 3h6.546c.818 0 1.364.545 1.364 1.364v2.181c0 .818-.546 1.364-1.364 1.364h-6.546c-.818 0-1.363-.546-1.363-1.364zm0 6.545V10.91c0-.818.545-1.364 1.363-1.364h6.546c.818 0 1.364.546 1.364 1.364v2.181c0 .818-.546 1.364-1.364 1.364h-6.546c-.818 0-1.363-.546-1.363-1.364z"/>
              </svg>
            </div>
            <div className="flex items-center gap-2 text-base font-medium text-muted-foreground group-hover:text-primary transition-colors">
              <span>Booking.com</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FindUsSection;