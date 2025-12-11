import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateAltText } from "@/lib/galleryValidation";
import type { GalleryImage } from "@/types/gallery";

interface GalleryImageEditorProps {
  image: GalleryImage & { url: string };
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const BUNGALOW_OPTIONS = [
  { value: "", label: "Nenhum" },
  { value: "bangalo-peneira", label: "Bangalô Peneira" },
  { value: "bangalo-paneiro", label: "Bangalô Paneiro" },
  { value: "bangalo-tipiti", label: "Bangalô Tipiti" },
];

const GalleryImageEditor = ({ image, open, onClose, onSave }: GalleryImageEditorProps) => {
  const [altText, setAltText] = useState(image.alt_text);
  const [category, setCategory] = useState<string>(image.category);
  const [bungalowSlug, setBungalowSlug] = useState<string>(image.bungalow_slug || "");
  const [displayOrder, setDisplayOrder] = useState(image.display_order);
  const [isActive, setIsActive] = useState(image.is_active);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const altError = validateAltText(altText);
    if (altError) {
      toast({
        title: "Erro de validação",
        description: altError,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from('gallery_images')
      .update({
        alt_text: altText,
        category,
        bungalow_slug: category === 'bungalows' ? (bungalowSlug || null) : null,
        display_order: displayOrder,
        is_active: isActive,
      })
      .eq('id', image.id);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Imagem atualizada",
      description: "As alterações foram salvas com sucesso.",
    });

    onSave();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Imagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={image.url} 
              alt={image.alt_text} 
              className="w-full h-48 object-cover"
            />
          </div>

          <div>
            <Label htmlFor="alt-text">Descrição da imagem *</Label>
            <Textarea
              id="alt-text"
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder="Descrição detalhada (10-200 caracteres)"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {altText.length}/200 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="experiences">Experiências</SelectItem>
                <SelectItem value="bungalows">Bangalôs</SelectItem>
                <SelectItem value="food">Gastronomia</SelectItem>
                <SelectItem value="nature">Natureza</SelectItem>
                <SelectItem value="wildlife">Fauna</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bungalow selection - only show when category is bungalows */}
          {category === 'bungalows' && (
            <div>
              <Label htmlFor="bungalow">Bangalô</Label>
              <Select value={bungalowSlug} onValueChange={setBungalowSlug}>
                <SelectTrigger id="bungalow">
                  <SelectValue placeholder="Selecione o bangalô" />
                </SelectTrigger>
                <SelectContent>
                  {BUNGALOW_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Associe esta imagem a um bangalô específico
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="order">Ordem de exibição</Label>
            <Input
              id="order"
              type="number"
              value={displayOrder}
              onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Menor número aparece primeiro
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="active">Imagem ativa</Label>
              <p className="text-xs text-muted-foreground">
                Desative para ocultar na galeria pública
              </p>
            </div>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryImageEditor;
