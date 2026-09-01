import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

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
  gender: string;
  setGender: (value: string) => void;
  nextDestination: string;
  setNextDestination: (value: string) => void;
  emergencyContact: string;
  setEmergencyContact: (value: string) => void;
  dietaryRestrictions: string;
  setDietaryRestrictions: (value: string) => void;
  specialRequests: string;
  setSpecialRequests: (value: string) => void;
  acceptedTerms: boolean;
  setAcceptedTerms: (value: boolean) => void;
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
  gender,
  setGender,
  nextDestination,
  setNextDestination,
  emergencyContact,
  setEmergencyContact,
  dietaryRestrictions,
  setDietaryRestrictions,
  specialRequests,
  setSpecialRequests,
  acceptedTerms,
  setAcceptedTerms,
}: GuestInfoFormProps) => {
  const { t } = useTranslation();
  const [emailTouched, setEmailTouched] = useState(false);
  const emailIsValid = isValidEmail(guestEmail);
  const showEmailError = emailTouched && guestEmail && !emailIsValid;
  const req = <span className="text-destructive">*</span>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-4">{t("reservation.step3")}</h2>
        <p className="text-muted-foreground mb-6">{t("guestForm.subtitle")}</p>
      </div>

      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
        <Checkbox id="isForeign" checked={isForeign} onCheckedChange={(c) => setIsForeign(c as boolean)} />
        <Label htmlFor="isForeign" className="text-sm font-medium leading-none cursor-pointer">
          {t("guestForm.foreign")}
        </Label>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              {t("guestForm.fullName")} {req}
            </Label>
            <Input id="name" value={guestName} onChange={(e) => setGuestName(e.target.value)}
              placeholder={t("guestForm.fullNamePh")} className="mt-1" required />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              {t("guestForm.email")} {req}
            </Label>
            <Input id="email" type="email" value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder={t("guestForm.emailPh")}
              className={`mt-1 ${showEmailError ? 'border-destructive focus-visible:ring-destructive' : ''}`} required />
            {showEmailError && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t("guestForm.emailInvalid")}
              </p>
            )}
          </div>
        </div>

        {!isForeign && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf" className="text-sm font-medium">{t("guestForm.cpf")} {req}</Label>
                <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="birthDate" className="text-sm font-medium">{t("guestForm.birthDate")} {req}</Label>
                <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="mt-1" required />
              </div>
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">{t("guestForm.phone")} {req}</Label>
              <Input id="phone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder={t("guestForm.phonePhBR")} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="address" className="text-sm font-medium">{t("guestForm.address")}</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("guestForm.addressPh")} className="mt-1" />
            </div>
          </>
        )}

        {isForeign && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country" className="text-sm font-medium">{t("guestForm.country")} {req}</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t("guestForm.countryPh")} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="nationality" className="text-sm font-medium">{t("guestForm.nationality")} {req}</Label>
                <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder={t("guestForm.nationalityPh")} className="mt-1" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passport" className="text-sm font-medium">{t("guestForm.passport")} {req}</Label>
                <Input id="passport" value={passport} onChange={(e) => setPassport(e.target.value)} placeholder={t("guestForm.passportPh")} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="birthDateForeign" className="text-sm font-medium">{t("guestForm.birthDate")} {req}</Label>
                <Input id="birthDateForeign" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="mt-1" required />
              </div>
            </div>
            <div>
              <Label htmlFor="phoneForeign" className="text-sm font-medium">{t("guestForm.phoneIntl")} {req}</Label>
              <Input id="phoneForeign" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder={t("guestForm.phoneIntlPh")} className="mt-1" required />
              <p className="text-xs text-muted-foreground mt-1">{t("guestForm.phoneIntlNote")}</p>
            </div>
            <div>
              <Label htmlFor="addressForeign" className="text-sm font-medium">{t("guestForm.addressForeign")}</Label>
              <Input id="addressForeign" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("guestForm.addressForeignPh")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="nextDestination" className="text-sm font-medium">{t("guestForm.nextDestination")}</Label>
              <Input id="nextDestination" value={nextDestination} onChange={(e) => setNextDestination(e.target.value)} placeholder={t("guestForm.nextDestinationPh")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="emergencyContact" className="text-sm font-medium">{t("guestForm.emergency")}</Label>
              <Input id="emergencyContact" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder={t("guestForm.emergencyPh")} className="mt-1" />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="gender" className="text-sm font-medium">{t("guestForm.gender")}</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender" className="mt-1">
              <SelectValue placeholder={t("guestForm.genderNotInformed")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NAO_INFORMADO">{t("guestForm.genderNotInformed")}</SelectItem>
              <SelectItem value="MASCULINO">{t("guestForm.genderMale")}</SelectItem>
              <SelectItem value="FEMININO">{t("guestForm.genderFemale")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dietaryRestrictions" className="text-sm font-medium">{t("guestForm.dietary")}</Label>
          <Textarea id="dietaryRestrictions" value={dietaryRestrictions} onChange={(e) => setDietaryRestrictions(e.target.value)} placeholder={t("guestForm.dietaryPh")} rows={3} className="mt-1" />
        </div>

        <div>
          <Label htmlFor="requests" className="text-sm font-medium">{t("reservation.specialRequests")}</Label>
          <Textarea id="requests" value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder={t("guestForm.requestsPh")} rows={4} className="mt-1" />
        </div>

        <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30 mt-6">
          <Checkbox id="acceptTerms" checked={acceptedTerms} onCheckedChange={(c) => setAcceptedTerms(c as boolean)} className="mt-1" />
          <Label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
            {t("guestForm.termsLead")}{" "}
            <a href="/docs/termos-de-uso.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
              {t("guestForm.termsOfUse")}
            </a>
            {t("guestForm.comma")}{" "}
            <a href="/docs/politica-cancelamento.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
              {t("guestForm.cancellationPolicy")}
            </a>
            {" "}{t("guestForm.and")}{" "}
            <a href="/docs/politica-privacidade.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
              {t("guestForm.privacyPolicy")}
            </a>
            {" "}{t("guestForm.termsTail")}
            <span className="text-destructive ml-1">*</span>
          </Label>
        </div>
      </div>
    </div>
  );
};
