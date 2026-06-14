import { useEffect, useState, type CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoAraraAzul from "@/assets/logo-arara-azul.png";

interface LandingNavbarProps {
  menuBgStyle?: CSSProperties;
}

const LandingNavbar = ({ menuBgStyle }: LandingNavbarProps) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const menuItems = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.lodges"), href: "/bangalos" },
    { label: t("nav.packages"), href: "/pacotes" },
    { label: t("nav.experiences"), href: "/experiencias" },
    { label: t("nav.sustainability"), href: "/sustentabilidade" },
    { label: t("nav.howToGetThere"), href: "/como-chegar" },
    { label: t("nav.contact"), href: "/contato" },
  ];

  const languages = [
    { code: "pt", label: "Português" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-foreground/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={logoAraraAzul}
              alt="Pousada Arara Azul"
              className="h-12 sm:h-14 lg:h-16 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                style={menuBgStyle}
                className={`px-3 py-2 rounded-md text-sm font-medium text-white hover:text-white/80 backdrop-blur-sm transition-colors ${
                  location.pathname === item.href ? "ring-1 ring-white/40" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  style={menuBgStyle}
                  className="text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  <Globe className="h-4 w-4 mr-1" />
                  {i18n.language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="bg-gradient-forest text-primary-foreground hover:opacity-90 ml-2 rounded-full px-5"
              asChild
            >
              <Link to="/bangalos">{t("nav.bookNow")}</Link>
            </Button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {isOpen && (
          <div className="lg:hidden bg-foreground/95 backdrop-blur-md border-t border-white/10 animate-slide-in-down">
            <div className="py-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 rounded-md"
                >
                  {item.label}
                </Link>
              ))}
              <div className="px-4 pt-3 grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 rounded-md text-sm ${
                      i18n.language === lang.code
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <div className="px-4 pt-3 pb-2">
                <Button
                  className="w-full bg-gradient-forest text-primary-foreground"
                  asChild
                >
                  <Link to="/bangalos" onClick={() => setIsOpen(false)}>
                    {t("nav.bookNow")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;
