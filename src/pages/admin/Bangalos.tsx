import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, Loader2, Image as ImageIcon, Eye, Power } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Bangalo {
  id: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  name_fr: string;
  description_pt: string;
  description_en: string;
  description_es: string;
  description_fr: string;
  price_per_night: number;
  max_guests: number;
  slug: string;
  amenities: any;
  is_active: boolean;
}

const AdminBangalos = () => {
  const [bangalos, setBangalos] = useState<Bangalo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBangalo, setEditingBangalo] = useState<Bangalo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bangaloToDelete, setBangaloToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name_pt: "",
    name_en: "",
    name_es: "",
    name_fr: "",
    description_pt: "",
    description_en: "",
    description_es: "",
    description_fr: "",
    price_per_night: 1330,
    max_guests: 3,
    slug: "",
    amenities: [] as string[],
  });

  useEffect(() => {
    fetchBangalos();
  }, []);

  const fetchBangalos = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("name_pt", { ascending: true });

      if (error) throw error;
      setBangalos(data || []);
    } catch (error: any) {
      console.error("Error fetching bangalos:", error);
      toast.error("Erro ao carregar bangalôs");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bangalo: Bangalo) => {
    setEditingBangalo(bangalo);
    setIsCreating(false);
    setFormData({
      name_pt: bangalo.name_pt,
      name_en: bangalo.name_en,
      name_es: bangalo.name_es,
      name_fr: bangalo.name_fr,
      description_pt: bangalo.description_pt,
      description_en: bangalo.description_en,
      description_es: bangalo.description_es,
      description_fr: bangalo.description_fr,
      price_per_night: Number(bangalo.price_per_night),
      max_guests: bangalo.max_guests,
      slug: bangalo.slug,
      amenities: Array.isArray(bangalo.amenities) ? bangalo.amenities : [],
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingBangalo(null);
    setIsCreating(true);
    setFormData({
      name_pt: "",
      name_en: "",
      name_es: "",
      name_fr: "",
      description_pt: "",
      description_en: "",
      description_es: "",
      description_fr: "",
      price_per_night: 1330,
      max_guests: 3,
      slug: "",
      amenities: [],
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name_pt || !formData.slug) {
      toast.error("Preencha ao menos o nome em português e o slug");
      return;
    }

    try {
      setSaving(true);

      if (isCreating) {
        // Create new bangalo
        const { error } = await supabase
          .from("rooms")
          .insert({
            name_pt: formData.name_pt,
            name_en: formData.name_en || formData.name_pt,
            name_es: formData.name_es || formData.name_pt,
            name_fr: formData.name_fr || formData.name_pt,
            name_de: formData.name_pt,
            description_pt: formData.description_pt,
            description_en: formData.description_en || formData.description_pt,
            description_es: formData.description_es || formData.description_pt,
            description_fr: formData.description_fr || formData.description_pt,
            description_de: formData.description_pt,
            price_per_night: formData.price_per_night,
            max_guests: formData.max_guests,
            slug: formData.slug,
            amenities: formData.amenities,
            is_active: true,
          });

        if (error) throw error;
        toast.success("Bangalô criado com sucesso!");
      } else {
        // Update existing bangalo
        if (!editingBangalo) return;

        const { error } = await supabase
          .from("rooms")
          .update({
            name_pt: formData.name_pt,
            name_en: formData.name_en,
            name_es: formData.name_es,
            name_fr: formData.name_fr,
            description_pt: formData.description_pt,
            description_en: formData.description_en,
            description_es: formData.description_es,
            description_fr: formData.description_fr,
            price_per_night: formData.price_per_night,
            max_guests: formData.max_guests,
            slug: formData.slug,
            amenities: formData.amenities,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingBangalo.id);

        if (error) throw error;
        toast.success("Bangalô atualizado com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingBangalo(null);
      setIsCreating(false);
      fetchBangalos();
    } catch (error: any) {
      console.error("Error saving bangalo:", error);
      toast.error(isCreating ? "Erro ao criar bangalô" : "Erro ao atualizar bangalô");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bangaloToDelete) return;

    try {
      const { error } = await supabase
        .from("rooms")
        .update({ is_active: false })
        .eq("id", bangaloToDelete);

      if (error) throw error;

      toast.success("Bangalô desativado com sucesso!");
      setDeleteDialogOpen(false);
      setBangaloToDelete(null);
      fetchBangalos();
    } catch (error: any) {
      console.error("Error deactivating bangalo:", error);
      toast.error("Erro ao desativar bangalô");
    }
  };

  const openDeleteDialog = (id: string) => {
    setBangaloToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleActivate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ is_active: true })
        .eq("id", id);

      if (error) throw error;
      toast.success("Bangalô ativado com sucesso!");
      fetchBangalos();
    } catch (error: any) {
      console.error("Error activating bangalo:", error);
      toast.error("Erro ao ativar bangalô");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Bangalôs</h1>
          <p className="text-muted-foreground mt-1">
            Edite informações, preços e comodidades dos bangalôs
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Criar Novo Bangalô
        </Button>
      </div>

      {/* Bangalos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bangalos.map((bangalo) => (
          <Card key={bangalo.id} className={!bangalo.is_active ? "opacity-50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{bangalo.name_pt}</span>
                {!bangalo.is_active && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">Inativo</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Preço por noite</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {Number(bangalo.price_per_night).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Capacidade</p>
                <p className="font-medium">{bangalo.max_guests} hóspedes</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Slug</p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{bangalo.slug}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Comodidades</p>
                <p className="text-sm">
                  {Array.isArray(bangalo.amenities) ? bangalo.amenities.length : 0} itens
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(bangalo)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link to={`/admin/gallery?category=bungalows&slug=${bangalo.slug}`}>
                    <ImageIcon className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link to={`/bangalos/${bangalo.slug}`} target="_blank">
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                {!bangalo.is_active ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleActivate(bangalo.id)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(bangalo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Criar Novo Bangalô" : "Editar Bangalô"}</DialogTitle>
            <DialogDescription>
              {isCreating ? "Preencha as informações do novo bangalô" : "Atualize as informações do bangalô em todos os idiomas"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="pt" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pt">Português</TabsTrigger>
              <TabsTrigger value="en">Inglês</TabsTrigger>
              <TabsTrigger value="es">Espanhol</TabsTrigger>
              <TabsTrigger value="fr">Francês</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
            </TabsList>

            {/* Portuguese Tab */}
            <TabsContent value="pt" className="space-y-4 py-4">
              <div>
                <Label htmlFor="name_pt">Nome *</Label>
                <Input
                  id="name_pt"
                  value={formData.name_pt}
                  onChange={(e) => setFormData({ ...formData, name_pt: e.target.value })}
                  placeholder="Suíte Peneira"
                />
              </div>
              <div>
                <Label htmlFor="desc_pt">Descrição</Label>
                <Textarea
                  id="desc_pt"
                  value={formData.description_pt}
                  onChange={(e) => setFormData({ ...formData, description_pt: e.target.value })}
                  rows={6}
                  placeholder="Descreva o bangalô..."
                />
              </div>
            </TabsContent>

            {/* English Tab */}
            <TabsContent value="en" className="space-y-4 py-4">
              <div>
                <Label htmlFor="name_en">Name</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Peneira Suite"
                />
              </div>
              <div>
                <Label htmlFor="desc_en">Description</Label>
                <Textarea
                  id="desc_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={6}
                  placeholder="Describe the bungalow..."
                />
              </div>
            </TabsContent>

            {/* Spanish Tab */}
            <TabsContent value="es" className="space-y-4 py-4">
              <div>
                <Label htmlFor="name_es">Nombre</Label>
                <Input
                  id="name_es"
                  value={formData.name_es}
                  onChange={(e) => setFormData({ ...formData, name_es: e.target.value })}
                  placeholder="Suite Peneira"
                />
              </div>
              <div>
                <Label htmlFor="desc_es">Descripción</Label>
                <Textarea
                  id="desc_es"
                  value={formData.description_es}
                  onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                  rows={6}
                  placeholder="Describe el bungaló..."
                />
              </div>
            </TabsContent>

            {/* French Tab */}
            <TabsContent value="fr" className="space-y-4 py-4">
              <div>
                <Label htmlFor="name_fr">Nom</Label>
                <Input
                  id="name_fr"
                  value={formData.name_fr}
                  onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                  placeholder="Suite Peneira"
                />
              </div>
              <div>
                <Label htmlFor="desc_fr">Description</Label>
                <Textarea
                  id="desc_fr"
                  value={formData.description_fr}
                  onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                  rows={6}
                  placeholder="Décrivez le bungalow..."
                />
              </div>
            </TabsContent>

            {/* Config Tab */}
            <TabsContent value="config" className="space-y-4 py-4">
              {/* Price and Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço por noite (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_per_night}
                    onChange={(e) => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="guests">Máximo de hóspedes</Label>
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.max_guests}
                    onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug">Slug (URL amigável) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="suite-peneira"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL: /bangalos/{formData.slug || "seu-slug"}
                </p>
              </div>

              {/* Amenities */}
              <div>
                <Label htmlFor="amenities">Comodidades (uma por linha)</Label>
                <Textarea
                  id="amenities"
                  value={formData.amenities.join("\n")}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value.split("\n").filter(a => a.trim()) })}
                  rows={6}
                  placeholder="Wi-Fi de alta velocidade&#10;Ar condicionado&#10;Varanda privativa com rede&#10;Água quente"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formData.amenities.length} comodidades
                </p>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold mb-2 text-sm">Preview</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nome:</span> {formData.name_pt || "Sem nome"}</p>
                  <p><span className="font-medium">Preço:</span> R$ {formData.price_per_night.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p><span className="font-medium">Capacidade:</span> {formData.max_guests} hóspedes</p>
                  <p><span className="font-medium">URL:</span> /bangalos/{formData.slug || "seu-slug"}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name_pt || !formData.slug}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCreating ? "Criando..." : "Salvando..."}
                </>
              ) : (
                isCreating ? "Criar Bangalô" : "Salvar Alterações"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Bangalô?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá desativar o bangalô. Ele não aparecerá mais nas buscas,
              mas as reservas existentes serão mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBangalos;
