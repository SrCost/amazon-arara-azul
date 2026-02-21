import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHeroSlidesAdmin, type HeroSlide } from "@/hooks/useHeroSlides";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, GripVertical, Image, Video, Loader2, Eye, EyeOff } from "lucide-react";

const HeroCarouselAdmin = () => {
  const { slides, loading, refetch } = useHeroSlidesAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    alt_text: "",
    media_type: "image",
    object_fit: "cover",
    background_color: "",
    hide_overlay: false,
    link_url: "",
    display_order: 0,
    is_active: true,
  });
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string>("");
  const [mobilePreview, setMobilePreview] = useState<string>("");

  const resetForm = () => {
    setForm({
      title: "",
      alt_text: "",
      media_type: "image",
      object_fit: "cover",
      background_color: "",
      hide_overlay: false,
      link_url: "",
      display_order: slides.length,
      is_active: true,
    });
    setDesktopFile(null);
    setMobileFile(null);
    setDesktopPreview("");
    setMobilePreview("");
    setEditingSlide(null);
  };

  const openNew = () => {
    resetForm();
    setForm(f => ({ ...f, display_order: slides.length }));
    setDialogOpen(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setForm({
      title: slide.title,
      alt_text: slide.alt_text,
      media_type: slide.media_type,
      object_fit: slide.object_fit,
      background_color: slide.background_color || "",
      hide_overlay: slide.hide_overlay,
      link_url: slide.link_url || "",
      display_order: slide.display_order,
      is_active: slide.is_active,
    });
    setDesktopPreview(slide.desktop_image_url);
    setMobilePreview(slide.mobile_image_url || "");
    setDesktopFile(null);
    setMobileFile(null);
    setDialogOpen(true);
  };

  const handleFileChange = (type: "desktop" | "mobile", file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "desktop") {
      setDesktopFile(file);
      setDesktopPreview(url);
    } else {
      setMobileFile(file);
      setMobilePreview(url);
    }
  };

  const uploadFile = async (file: File, prefix: string): Promise<string> => {
    const timestamp = Date.now();
    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `hero/${prefix}_${timestamp}_${sanitized}`;
    const { error } = await supabase.storage.from("gallery").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!editingSlide && !desktopFile) {
      toast.error("Imagem Desktop é obrigatória");
      return;
    }

    setSaving(true);
    try {
      let desktopUrl = editingSlide?.desktop_image_url || "";
      let mobileUrl = editingSlide?.mobile_image_url || null;

      if (desktopFile) {
        setUploading(true);
        desktopUrl = await uploadFile(desktopFile, "desktop");
      }
      if (mobileFile) {
        setUploading(true);
        mobileUrl = await uploadFile(mobileFile, "mobile");
      }
      setUploading(false);

      const record = {
        title: form.title.trim(),
        desktop_image_url: desktopUrl,
        mobile_image_url: mobileUrl || null,
        alt_text: form.alt_text.trim() || form.title.trim(),
        media_type: form.media_type,
        object_fit: form.object_fit,
        background_color: form.background_color || null,
        hide_overlay: form.hide_overlay,
        link_url: form.link_url || null,
        display_order: form.display_order,
        is_active: form.is_active,
      };

      if (editingSlide) {
        const { error } = await supabase.from("hero_slides").update(record).eq("id", editingSlide.id);
        if (error) throw error;
        toast.success("Slide atualizado!");
      } else {
        const { error } = await supabase.from("hero_slides").insert(record);
        if (error) throw error;
        toast.success("Slide criado!");
      }

      setDialogOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error("Error saving slide:", error);
      toast.error(error.message || "Erro ao salvar slide");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("hero_slides").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Slide excluído!");
      setDeleteId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir slide");
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    const { error } = await supabase
      .from("hero_slides")
      .update({ is_active: !slide.is_active })
      .eq("id", slide.id);
    if (error) {
      toast.error("Erro ao alterar status");
    } else {
      refetch();
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Carrossel da Homepage</h1>
          <p className="text-muted-foreground text-sm">Gerencie os slides do carrossel principal</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Slide
        </Button>
      </div>

      {slides.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum slide cadastrado. As imagens estáticas padrão serão exibidas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {slides.map((slide) => (
            <Card key={slide.id} className={!slide.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                  
                  <div className="flex gap-3 shrink-0">
                    <div className="w-32 h-18 rounded overflow-hidden bg-muted">
                      <img
                        src={slide.desktop_image_url}
                        alt={slide.alt_text}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {slide.mobile_image_url && (
                      <div className="w-12 h-18 rounded overflow-hidden bg-muted">
                        <img
                          src={slide.mobile_image_url}
                          alt={slide.alt_text}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{slide.title}</h3>
                      {slide.media_type === "video" && <Video className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">#{slide.display_order}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{slide.alt_text}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{slide.object_fit}</span>
                      {slide.hide_overlay && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">sem overlay</span>}
                      {slide.link_url && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">com link</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(slide)}
                      title={slide.is_active ? "Desativar" : "Ativar"}
                    >
                      {slide.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(slide)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(slide.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlide ? "Editar Slide" : "Novo Slide"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Título *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Banner Páscoa 2025" />
              </div>
              <div>
                <Label>Texto Alternativo</Label>
                <Input value={form.alt_text} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} placeholder="Descrição da imagem" />
              </div>
            </div>

            {/* Desktop Image */}
            <div>
              <Label>Imagem Desktop * <span className="text-xs text-muted-foreground">(Recomendado: 1920×700px)</span></Label>
              <Input type="file" accept="image/*,video/mp4" onChange={(e) => handleFileChange("desktop", e.target.files?.[0] || null)} className="mt-1" />
              {desktopPreview && (
                <div className="mt-2 rounded overflow-hidden border bg-muted" style={{ aspectRatio: "1920/700", maxHeight: 200 }}>
                  <img src={desktopPreview} alt="Preview Desktop" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            {/* Mobile Image */}
            <div>
              <Label>Imagem Mobile/Tablet <span className="text-xs text-muted-foreground">(Recomendado: 1080×1080px)</span></Label>
              <Input type="file" accept="image/*,video/mp4" onChange={(e) => handleFileChange("mobile", e.target.files?.[0] || null)} className="mt-1" />
              {mobilePreview && (
                <div className="mt-2 rounded overflow-hidden border bg-muted" style={{ aspectRatio: "1/1", maxHeight: 200, maxWidth: 200 }}>
                  <img src={mobilePreview} alt="Preview Mobile" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.media_type} onValueChange={(v) => setForm({ ...form, media_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ajuste</Label>
                <Select value={form.object_fit} onValueChange={(v) => setForm({ ...form, object_fit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Cor de Fundo</Label>
                <Input value={form.background_color} onChange={(e) => setForm({ ...form, background_color: e.target.value })} placeholder="#FFFFFF" />
              </div>
            </div>

            <div>
              <Label>Link (opcional)</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.hide_overlay} onCheckedChange={(v) => setForm({ ...form, hide_overlay: v })} />
                <Label>Ocultar overlay escuro</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Ativo</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {(saving || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Enviando..." : saving ? "Salvando..." : editingSlide ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir slide?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HeroCarouselAdmin;
