import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface HospedeCompletarPayload {
  documento_tipo?: "CPF" | "PASSAPORTE";
  cpf?: string;
  passport?: string;
  birth_date?: string;
  nationality?: string;
  genero?: string;
  quantidade_hospede_adulto?: number;
  quantidade_hospede_menor?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string;
  guests: number | null;
  pendingFields: string[];
  submitting: boolean;
  initial?: HospedeCompletarPayload;
  onSubmit: (payload: HospedeCompletarPayload) => void;
}

const PAISES = [
  { value: "BR", label: "Brasil" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colômbia" },
  { value: "DE", label: "Alemanha" },
  { value: "ES", label: "Espanha" },
  { value: "FR", label: "França" },
  { value: "IT", label: "Itália" },
  { value: "PT", label: "Portugal" },
  { value: "PY", label: "Paraguai" },
  { value: "PE", label: "Peru" },
  { value: "US", label: "Estados Unidos" },
  { value: "UY", label: "Uruguai" },
  { value: "NL", label: "Holanda" },
  { value: "GB", label: "Reino Unido" },
];

export const CompletarDadosFnrhModal = ({
  open,
  onOpenChange,
  guestName,
  guests,
  pendingFields,
  submitting,
  initial,
  onSubmit,
}: Props) => {
  const [docTipo, setDocTipo] = useState<"CPF" | "PASSAPORTE">("CPF");
  const [documento, setDocumento] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [nationality, setNationality] = useState("BR");
  const [genero, setGenero] = useState("NAO_INFORMADO");
  const [adultos, setAdultos] = useState(String(guests ?? 1));
  const [menores, setMenores] = useState("0");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErro(null);
      const tipo: "CPF" | "PASSAPORTE" =
        initial?.cpf ? "CPF" : initial?.passport ? "PASSAPORTE" : (initial?.documento_tipo ?? "CPF");
      setDocTipo(tipo);
      setDocumento(tipo === "CPF" ? (initial?.cpf ?? "") : (initial?.passport ?? ""));
      setBirthDate(initial?.birth_date ?? "");
      setNationality(initial?.nationality || "BR");
      setGenero(initial?.genero || "NAO_INFORMADO");
      setAdultos(String(initial?.quantidade_hospede_adulto ?? guests ?? 1));
      setMenores(String(initial?.quantidade_hospede_menor ?? 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, guests]);

  const needsDoc = pendingFields.includes("documento");
  const needsBirth = pendingFields.includes("birth_date");
  const needsNationality = pendingFields.includes("nationality");

  const handleSubmit = () => {
    if (needsDoc && !documento.trim()) {
      setErro("Informe o número do documento.");
      return;
    }
    if (needsBirth && !birthDate) {
      setErro("Informe a data de nascimento.");
      return;
    }

    const payload: HospedeCompletarPayload = {
      genero,
      quantidade_hospede_adulto: Math.max(1, Number(adultos) || 1),
      quantidade_hospede_menor: Math.max(0, Number(menores) || 0),
    };

    if (documento.trim()) {
      payload.documento_tipo = docTipo;
      if (docTipo === "CPF") payload.cpf = documento.replace(/\D/g, "");
      else payload.passport = documento.trim();
    }
    if (birthDate) payload.birth_date = birthDate;
    if (nationality) payload.nationality = nationality;

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Completar dados da ficha</DialogTitle>
          <DialogDescription>
            A FNRH exige alguns dados obrigatórios que não estão na reserva de{" "}
            <span className="font-medium">{guestName}</span>. Preencha abaixo para enviar a ficha.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Documento</Label>
              <Select value={docTipo} onValueChange={(v) => setDocTipo(v as "CPF" | "PASSAPORTE")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="PASSAPORTE">Passaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Número {needsDoc && <span className="text-destructive">*</span>}</Label>
              <Input
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder={docTipo === "CPF" ? "000.000.000-00" : "AB1234567"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>
                Data de nascimento {needsBirth && <span className="text-destructive">*</span>}
              </Label>
              <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>
                Nacionalidade {needsNationality && <span className="text-destructive">*</span>}
              </Label>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAISES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Gênero</Label>
              <Select value={genero} onValueChange={setGenero}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MASCULINO">Masculino</SelectItem>
                  <SelectItem value="FEMININO">Feminino</SelectItem>
                  <SelectItem value="NAO_INFORMADO">Não informado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Adultos</Label>
              <Input
                type="number"
                min={1}
                value={adultos}
                onChange={(e) => setAdultos(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Menores</Label>
              <Input
                type="number"
                min={0}
                value={menores}
                onChange={(e) => setMenores(e.target.value)}
              />
            </div>
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Enviando..." : "Salvar e enviar ficha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompletarDadosFnrhModal;
