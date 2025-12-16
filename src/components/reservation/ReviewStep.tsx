import { Check } from "lucide-react";

interface ReviewStepProps {
  lodgeName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: string;
  checkIn?: Date;
  checkOut?: Date;
  paymentMethod: string;
  selectedPackage: string | null;
  packages: any[];
  calculateTotal: () => number;
}

export const ReviewStep = ({
  lodgeName,
  guestName,
  guestEmail,
  guestPhone,
  guests,
  checkIn,
  checkOut,
  paymentMethod,
  selectedPackage,
  packages,
  calculateTotal,
}: ReviewStepProps) => {
  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Cartão de Crédito';
      case 'pix': return 'PIX';
      default: return method;
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <Check className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-display font-bold mb-4">
          Revisão da Reserva
        </h2>
        <p className="text-muted-foreground">
          Confirme os detalhes da sua reserva
        </p>
      </div>

      <div className="bg-muted p-6 rounded-lg text-left space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bangalô:</span>
          <span className="font-medium">{lodgeName}</span>
        </div>
        
        {selectedPackage && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pacote:</span>
            <span className="font-medium">
              {packages.find(p => p.id === selectedPackage)?.name}
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hóspede:</span>
          <span className="font-medium">{guestName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">E-mail:</span>
          <span className="font-medium text-sm">{guestEmail}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Telefone:</span>
          <span className="font-medium">{guestPhone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hóspedes:</span>
          <span className="font-medium">{guests} {parseInt(guests) === 1 ? 'pessoa' : 'pessoas'}</span>
        </div>
        
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check-in:</span>
            <span className="font-medium">
              {checkIn?.toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-muted-foreground">Check-out:</span>
            <span className="font-medium">
              {checkOut?.toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-muted-foreground">Noites:</span>
            <span className="font-medium">{nights}</span>
          </div>
        </div>
        
        {selectedPackage && (
          <div className="border-t pt-3 mt-3 space-y-2">
            <div className="bg-green-50 p-2 rounded text-xs text-green-800">
              ✓ Estadia já incluída no valor do pacote
            </div>
          </div>
        )}
        
        <div className="flex justify-between pt-3 border-t mt-3">
          <span className="font-semibold text-lg">Total:</span>
          <span className="text-2xl font-bold text-primary">
            R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className="flex justify-between pt-2">
          <span className="text-muted-foreground">Método de pagamento:</span>
          <span className="font-medium capitalize">
            {getPaymentMethodLabel(paymentMethod)}
          </span>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
        <p className="text-sm text-yellow-800">
          <strong>Importante:</strong> Após confirmar, você receberá um e-mail com os detalhes da reserva. 
          O pagamento será processado e você receberá a confirmação final em breve.
        </p>
      </div>
    </div>
  );
};
