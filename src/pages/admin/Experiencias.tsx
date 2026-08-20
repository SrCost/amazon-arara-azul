import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown,
  X,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import {
  useExperiencesAdmin,
  EXPERIENCE_LANGS,
  type Experience,
  type ExperienceLang,
} from "@/hooks/useExperiences";
import { formatBRL } from "@/lib/experiencePricing";

const STORAGE_BUCKET = "gallery";
const STORAGE_PREFIX = "experiences-module";

const TEXT_FIELDS = [
  { key: "category", label: "Categoria", long: false },
  { key: "name", label: "Nome", long: false },
  { key: "short_description", label: "Resumo (card)", long: true },
  { key: "full_description", label: "Descrição completa", long: true },
  { key: "duration_label", label: "Duração", long: false },
  { key: "what_to_wear", label: "O que vestir", long: true },
  { key: "what_to_bring", label: "O que levar", long: true },
  { key: "operational_notes", label: "Observações operacionais", long: true },
] as const;

type TextKey = (typeof TEXT_FIELDS)[number]["key"];
type TextState = Record<string, string>;

const emptyTexts = (): TextState => {
  const state: TextState = {};
  TEXT_FIELDS.forEach((field) => {
    EXPERIENCE_LANGS.forEach((lang) => {
      state[`${field.key}_${lang}`] = "";
    });
  });
  return state;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const AdminExperiencias = () => {
  const { experiences, loading, refetch } = useExperiencesAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Experience | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState(0);
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [texts, setTexts] = useState<TextState>(emptyTexts());

  const setText = (key: TextKey, lang: ExperienceLang, value: string) =>
    setTexts((prev) => ({ ...prev, [`${key}_${lang}`]: value }));

  const openNew = () => {
    setEditing(null);
    setSlug("");
    setPrice(0);
    setOrder(experiences.length + 1);
    setActive(true);
    setPhotos([]);
    setTexts(emptyTexts());
    setDialogOpen(true);
  };

  const openEdit = (experience: Experience) => {
    setEditing(experience);
    setSlug(experience.slug);
    setPrice(Number(experience.base_price_per_person) || 0);
    setOrder(experience.display_order);
    setActive(experience.is_active);
    setPhotos(experience.photos ?? []);
    const state = emptyTexts();
    Object.keys(state).forEach((key) => {
      const value = experience[key];
      state[key] = typeof value === "string" ? value : "";
    });
    setTexts(state);
    setDialogOpen(true);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const path = `${STORAGE_PREFIX}/${Date.now()}_${safeName}`;
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setPhotos((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) enviada(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar fotos");
    } finally {
      setUploading(false);
    }
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    setPhotos((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removePhoto = (index: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    const namePt = texts.name_pt.trim();
    if (!namePt) {
      toast.error("Informe o nome em português");
      return;
    }
    const finalSlug = slug.trim() ? slugify(slug) : slugify(namePt);
    if (!finalSlug) {
      toast.error("Slug inválido");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...texts,
        name_pt: namePt,
        slug: finalSlug,
        base_price_per_person: Number(price) || 0,
        display_order: Number(order) || 0,
        is_active: active,
        photos,
      } as unknown as Parameters<
        ReturnType<typeof supabase.from<"experiences">>["insert"]
      >[0];

      const { error } = editing
        ? await supabase.from("experiences").update(payload).eq("id", editing.id)
        : await supabase.from("experiences").insert(payload);

      if (error) throw error;
      toast.success(editing ? "Experiência atualizada" : "Experiência criada");
      setDialogOpen(false);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (experience: Experience) => {
    const { error } = await supabase
      .from("experiences")
      .update({ is_active: !experience.is_active })
      .eq("id", experience.id);
    if (error) {
      toast.error("Erro ao alterar status");
      return;
    }
    await refetch();
  };

  const moveExperience = async (experience: Experience, direction: -1 | 1) => {
    const index = experiences.findIndex((item) => item.id === experience.id);
    const neighbour = experiences[index + direction];
    if (!neighbour) return;
    const updates = [
      supabase
        .from("experiences")
        .update({ display_order: neighbour.display_order })
        .eq("id", experience.id),
      supabase
        .from("experiences")
        .update({ display_order: experience.display_order })
        .eq("id", neighbour.id),
    ];
    const results = await Promise.all(updates);
    if (results.some((result) => result.error)) {
      toast.error("Erro ao reordenar");
      return;
    }
    await refetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("experiences").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro ao excluir experiência");
      return;
    }
    const paths = (deleteTarget.photos ?? [])
      .map((url) => url.split(`/${STORAGE_BUCKET}/`)[1])
      .filter((path): path is string => Boolean(path));
    if (paths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    }
    toast.success("Experiência excluída");
    setDeleteTarget(null);
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Experiências</h1>
          <p className="text-sm text-muted-foreground">
            Passeios e vivências exibidos na página pública de Experiências
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova experiência
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : experiences.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">
              Nenhuma experiência cadastrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Foto</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Preço base</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ordem</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ativo</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {experiences.map((experience, index) => (
                    <tr key={experience.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        {experience.photos?.[0] ? (
                          <img
                            src={experience.photos[0]}
                            alt={String(experience.name_pt ?? "")}
                            className="h-12 w-16 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-12 w-16 rounded-md bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{String(experience.name_pt ?? "")}</p>
                        <p className="text-xs text-muted-foreground">{experience.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {String(experience.category_pt ?? "")}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {formatBRL(Number(experience.base_price_per_person) || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={index === 0}
                            onClick={() => moveExperience(experience, -1)}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-xs text-muted-foreground w-5 text-center">
                            {experience.display_order}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={index === experiences.length - 1}
                            onClick={() => moveExperience(experience, 1)}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={experience.is_active}
                          onCheckedChange={() => toggleActive(experience)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(experience)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(experience)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar experiência" : "Nova experiência"}</DialogTitle>
            <DialogDescription>
              Os textos podem ser preenchidos em cada idioma. Sem tradução, o site exibe o texto em
              português.
            </DialogDescription>
          </DialogHeader>

          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Preço base por pessoa (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ordem de exibição</Label>
                  <Input
                    type="number"
                    min={0}
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug (opcional)</Label>
                  <Input
                    value={slug}
                    placeholder="gerado pelo nome"
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label>Experiência ativa na página pública</Label>
              </div>

              <Tabs defaultValue="pt">
                <TabsList>
                  {EXPERIENCE_LANGS.map((lang) => (
                    <TabsTrigger key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {EXPERIENCE_LANGS.map((lang) => (
                  <TabsContent key={lang} value={lang} className="space-y-3 pt-4">
                    {TEXT_FIELDS.map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <Label>{field.label}</Label>
                        {field.long ? (
                          <Textarea
                            rows={field.key === "full_description" ? 5 : 2}
                            value={texts[`${field.key}_${lang}`] ?? ""}
                            onChange={(e) => setText(field.key, lang, e.target.value)}
                          />
                        ) : (
                          <Input
                            value={texts[`${field.key}_${lang}`] ?? ""}
                            onChange={(e) => setText(field.key, lang, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>

              <div className="space-y-2">
                <Label>Fotos</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={(e) => handleUpload(e.target.files)}
                />
                {uploading && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando fotos...
                  </p>
                )}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((photo, index) => (
                      <div key={photo} className="relative group rounded-md overflow-hidden border border-border">
                        <img src={photo} alt="" className="h-20 w-full object-cover" />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                            capa
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/85 p-0.5">
                          <button
                            type="button"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => movePhoto(index, -1)}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            onClick={() => movePhoto(index, 1)}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-destructive"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Prévia do card público */}
            <div className="space-y-2">
              <Label>Prévia do card</Label>
              <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-medium">
                <div className="aspect-[4/3] bg-gradient-forest">
                  {photos[0] && (
                    <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  {texts.category_pt && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {texts.category_pt}
                    </span>
                  )}
                  <p className="font-display font-semibold text-foreground">
                    {texts.name_pt || "Nome da experiência"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {texts.short_description_pt || "Resumo exibido no card."}
                  </p>
                  {texts.duration_label_pt && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {texts.duration_label_pt}
                    </p>
                  )}
                  <p className="text-sm text-foreground">
                    a partir de <strong>{formatBRL(Number(price) || 0)}</strong> por pessoa
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir experiência</AlertDialogTitle>
            <AlertDialogDescription>
              A experiência "{String(deleteTarget?.name_pt ?? "")}" e suas fotos serão removidas
              permanentemente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
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

export default AdminExperiencias;
