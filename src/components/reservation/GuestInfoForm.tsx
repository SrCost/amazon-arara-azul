import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";

// Email validation helper
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

interface GuestInfoFormProps {
  isForeign: boolean;
  setIsForeign: (value: boolean) => void;
  guestName: string;
  setGuestName: (value: string) => void;
  guestEmail: string;
  setGuestEmail: (value: string) => void;
  guestPhone: string;
  setGuestPhone: (value: string) => void;
  cpf: string;
  setCpf: (value: string) => void;
  birthDate: string;
  setBirthDate: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  nationality: string;
  setNationality: (value: string) => void;
  passport: string;
  setPassport: (value: string) => void;
  nextDestination: string;
  setNextDestination: (value: string) => void;
  emergencyContact: string;
  setEmergencyContact: (value: string) => void;
  dietaryRestrictions: string;
  setDietaryRestrictions: (value: string) => void;
  specialRequests: string;
  setSpecialRequests: (value: string) => void;
}

export const GuestInfoForm = ({
  isForeign,
  setIsForeign,
  guestName,
  setGuestName,
  guestEmail,
  setGuestEmail,
  guestPhone,
  setGuestPhone,
  cpf,
  setCpf,
  birthDate,
  setBirthDate,
  address,
  setAddress,
  country,
  setCountry,
  nationality,
  setNationality,
  passport,
  setPassport,
  nextDestination,
  setNextDestination,
  emergencyContact,
  setEmergencyContact,
  dietaryRestrictions,
  setDietaryRestrictions,
  specialRequests,
  setSpecialRequests,
}: GuestInfoFormProps) => {
  const { t } = useTranslation();
  const [emailTouched, setEmailTouched] = useState(false);
  const emailIsValid = isValidEmail(guestEmail);
  const showEmailError = emailTouched && guestEmail && !emailIsValid;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-4">
          {t("reservation.step3")}
        </h2>
        <p className="text-muted-foreground mb-6">
          Preencha seus dados para a reserva
        </p>
      </div>

      {/* Foreign Guest Checkbox */}
      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="isForeign"
          checked={isForeign}
          onCheckedChange={(checked) => setIsForeign(checked as boolean)}
        />
        <Label
          htmlFor="isForeign"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Sou estrangeiro
        </Label>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Nome completo"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              E-mail <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="seu@email.com"
              className={`mt-1 ${showEmailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              required
            />
            {showEmailError && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Digite um e-mail válido (ex: nome@email.com)
              </p>
            )}
          </div>
        </div>

        {/* Brazilian Guest Fields */}
        {!isForeign && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf" className="text-sm font-medium">
                  CPF <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="birthDate" className="text-sm font-medium">
                  Data de Nascimento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Telefone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+55 (92) 99999-9999"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-medium">
                Endereço
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade, estado"
                className="mt-1"
              />
            </div>
          </>
        )}

        {/* Foreign Guest Fields */}
        {isForeign && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country" className="text-sm font-medium">
                  País de Origem <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Brazil, United States, etc."
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="nationality" className="text-sm font-medium">
                  Nacionalidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Brazilian, American, etc."
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passport" className="text-sm font-medium">
                  Passaporte <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="passport"
                  value={passport}
                  onChange={(e) => setPassport(e.target.value)}
                  placeholder="Número do passaporte"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="birthDateForeign" className="text-sm font-medium">
                  Data de Nascimento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="birthDateForeign"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phoneForeign" className="text-sm font-medium">
                Telefone Internacional <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phoneForeign"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Incluir código do país
              </p>
            </div>

            <div>
              <Label htmlFor="addressForeign" className="text-sm font-medium">
                Endereço no País de Origem
              </Label>
              <Input
                id="addressForeign"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, City, State, Country"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="nextDestination" className="text-sm font-medium">
                Próximo Destino Após Hospedagem
              </Label>
              <Input
                id="nextDestination"
                value={nextDestination}
                onChange={(e) => setNextDestination(e.target.value)}
                placeholder="Cidade/País"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="emergencyContact" className="text-sm font-medium">
                Contato de Emergência Internacional
              </Label>
              <Input
                id="emergencyContact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Nome e telefone"
                className="mt-1"
              />
            </div>
          </>
        )}

        {/* Common Fields */}
        <div>
          <Label htmlFor="dietaryRestrictions" className="text-sm font-medium">
            Alergias ou Restrições Alimentares
          </Label>
          <Textarea
            id="dietaryRestrictions"
            value={dietaryRestrictions}
            onChange={(e) => setDietaryRestrictions(e.target.value)}
            placeholder="Descreva qualquer alergia ou restrição alimentar"
            rows={3}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="requests" className="text-sm font-medium">
            {t("reservation.specialRequests")}
          </Label>
          <Textarea
            id="requests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Alguma solicitação especial? (opcional)"
            rows={4}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};
