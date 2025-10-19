import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const location = useLocation();

  const translations = {
    pt: {
      home: "Início",
      lodges: "Pousadas",
      sustainability: "Sustentabilidade",
      howToGet: "Como Chegar",
      contact: "Contato",
      reserve: "Reservar Agora",
    },
    en: {
      home: "Home",
      lodges: "Lodges",
      sustainability: "Sustainability",
      howToGet: "How to Get There",
      contact: "Contact",
      reserve: "Book Now",
    },
  };

  const t = translations[lang];

  const navLinks = [
    { path: "/", label: t.home },
    { path: "/pousadas", label: t.lodges },
    { path: "/sustentabilidade", label: t.sustainability },
    { path: "/como-chegar", label: t.howToGet },
    { path: "/contato", label: t.contact },
  ];

  const toggleLanguage = () => {
    setLang(lang === "pt" ? "en" : "pt");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-primary">
              Pousadas Amazônia
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="text-muted-foreground hover:text-primary"
            >
              <Globe className="h-5 w-5" />
            </Button>

            <Button variant="default" size="lg" asChild>
              <Link to="/pousadas">{t.reserve}</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-primary px-2 py-2 ${
                    location.pathname === link.path
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  onClick={toggleLanguage}
                  className="text-muted-foreground"
                >
                  <Globe className="h-5 w-5 mr-2" />
                  {lang === "pt" ? "English" : "Português"}
                </Button>
              </div>

              <Button variant="default" size="lg" asChild className="w-full">
                <Link to="/pousadas" onClick={() => setIsOpen(false)}>
                  {t.reserve}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
