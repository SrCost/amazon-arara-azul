import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { SOCIAL_LINKS } from "@/config/socialLinks";

interface Package {
  id: string;
  name: string;
  duration: string;
  people: number;
  price: number;
  description?: string;
}

interface PackageSelectionProps {
  packages: Package[];
  selectedPackage: string | null;
  onSelectPackage: (packageId: string | null) => void;
  wantsConsultorContact?: boolean;
  onWantsConsultorContactChange?: (value: boolean) => void;
}

export const PackageSelection = ({
  packages,
  selectedPackage,
  onSelectPackage,
  wantsConsultorContact = false,
  onWantsConsultorContactChange,
}: PackageSelectionProps) => {
  const getShortDescription = (pkg: Package) => {
    const isUirapuru = pkg.name?.toLowerCase().includes('uirapuru');
    const isGaviao = pkg.name?.toLowerCase().includes('gavião') || pkg.name?.toLowerCase().includes('panema');
    
    if (isGaviao) return '✨ Pacote exclusivo e personalizável com consultor especializado.';
    if (isUirapuru) return '💑 Exclusivo para casais. Jantar romântico + vivências amazônicas.';
    if (pkg.name?.toLowerCase().includes('japiim')) return '🦜 Experiência completa de 5 dias com passeios e vivências.';
    if (pkg.name?.toLowerCase().includes('araraúna')) return '🦜 Pacote mais completo: 7 dias de imersão total na Amazônia.';
    return pkg.description;
  };

  const isCustomizablePackage = (pkg: Package) => {
    return pkg.price === 0 || pkg.name?.toLowerCase().includes('gavião') || pkg.name?.toLowerCase().includes('panema');
  };

  const selectedPkg = packages.find(p => p.id === selectedPackage);
  const isCustomizableSelected = selectedPkg && isCustomizablePackage(selectedPkg);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-4">
          Escolher Pacote (Opcional)
        </h2>
        <p className="text-muted-foreground mb-6">
          Selecione um de nossos pacotes exclusivos ou prossiga sem pacote
        </p>
      </div>

      {/* Gavião Panema - Card minimalista com link direto para WhatsApp */}
      {packages.filter(pkg => isCustomizablePackage(pkg)).map((pkg) => (
        <a
          key={pkg.id}
          href={`${SOCIAL_LINKS.whatsapp}&text=${encodeURIComponent('Olá! Gostaria de saber mais sobre o Pacote Gavião Panema personalizado.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="border-dashed border-amber-300 bg-amber-50/30 hover:bg-amber-50/50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 dark:border-amber-700 transition-all cursor-pointer">
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                    {pkg.name}
                  </h4>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Pacote 100% personalizável com consultor
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Conversar</span>
              </div>
            </CardContent>
          </Card>
        </a>
      ))}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            selectedPackage === null
              ? "border-primary border-2"
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => onSelectPackage(null)}
        >
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Sem Pacote</h3>
            <p className="text-sm text-muted-foreground">
              Reservar apenas a hospedagem
            </p>
          </CardContent>
        </Card>

        {packages.filter(pkg => !isCustomizablePackage(pkg)).map((pkg) => {
          const isUirapuru = pkg.name?.toLowerCase().includes('uirapuru');
          
          return (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all ${
                selectedPackage === pkg.id
                  ? "border-primary border-2"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => onSelectPackage(pkg.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{pkg.name}</h3>
                  {isUirapuru && (
                    <span className="text-xs bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full font-semibold">
                      Casal
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {pkg.duration} • {pkg.people} {pkg.people === 1 ? 'pessoa' : 'pessoas'}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {getShortDescription(pkg)}
                </p>
                <p className="text-lg font-bold text-primary">
                  R$ {Number(pkg.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-600 font-medium mt-1">
                  ✓ Estadia já inclusa no valor
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
};
