import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";

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

        {packages.map((pkg) => {
          const isUirapuru = pkg.name?.toLowerCase().includes('uirapuru');
          const isCustomizable = isCustomizablePackage(pkg);
          
          return (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all ${
                selectedPackage === pkg.id
                  ? "border-primary border-2"
                  : "border-border hover:border-primary/50"
              } ${isCustomizable ? "bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20" : ""}`}
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
                  {isCustomizable && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                      Personalizado
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {pkg.duration} • {pkg.people} {pkg.people === 1 ? 'pessoa' : 'pessoas'}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {getShortDescription(pkg)}
                </p>
                {isCustomizable ? (
                  <div>
                    <p className="text-lg font-bold text-amber-600">
                      Sob Consulta
                    </p>
                    <p className="text-xs text-amber-600 font-medium mt-1">
                      💬 Fale com nosso consultor
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-bold text-primary">
                      R$ {Number(pkg.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      ✓ Estadia já inclusa no valor
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Checkbox for consultant contact when customizable package is selected */}
      {isCustomizableSelected && onWantsConsultorContactChange && (
        <Card className="mt-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="consultor-contact"
                checked={wantsConsultorContact}
                onCheckedChange={(checked) => onWantsConsultorContactChange(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="consultor-contact" className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                  <Phone className="h-4 w-4 text-amber-600" />
                  Deseja contato com o consultor?
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Um de nossos consultores entrará em contato para montar seu roteiro personalizado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
