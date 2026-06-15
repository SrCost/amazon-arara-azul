import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAllGalleryImages } from "@/hooks/useGalleryImages";
import { deleteGalleryImage } from "@/lib/galleryUpload";
import { supabase } from "@/integrations/supabase/client";
import GalleryUploader from "@/components/admin/GalleryUploader";
import GalleryImageEditor from "@/components/admin/GalleryImageEditor";
import Lightbox from "@/components/Lightbox";
import { uploadPaneiroImagesToGallery } from "@/lib/uploadPaneiroImages";
import { uploadPeneiraImagesToGallery } from "@/lib/uploadPeneiraImages";
import { uploadTipitiImagesToGallery } from "@/lib/uploadTipitiImages";
import { useRoomsList } from "@/hooks/useRoomsList";

const Gallery = () => {
  const queryClient = useQueryClient();
  const { data: allImages = [], isLoading } = useAllGalleryImages();
  const { data: rooms = [] } = useRoomsList();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [bungalowFilter, setBungalowFilter] = useState<string>('all');
  const [isUploadingPaneiro, setIsUploadingPaneiro] = useState(false);
  const [isUploadingPeneira, setIsUploadingPeneira] = useState(false);
  const [isUploadingTipiti, setIsUploadingTipiti] = useState(false);

  // Filtrar imagens baseado nos filtros selecionados
  const images = allImages.filter(img => {
    if (categoryFilter !== 'all' && img.category !== categoryFilter) return false;
    if (categoryFilter === 'bungalows' && bungalowFilter !== 'all' && img.bungalow_slug !== bungalowFilter) return false;
    return true;
  });

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['gallery-images-admin'] });
    setUploadDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingImageId) return;

    const image = images.find(img => img.id === deletingImageId);
    if (!image) return;

    const success = await deleteGalleryImage(image.id, image.storage_path);

    if (success) {
      toast({
        title: "Imagem excluída",
        description: "A imagem foi removida da galeria.",
      });
      queryClient.invalidateQueries({ queryKey: ['gallery-images-admin'] });
    } else {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a imagem.",
        variant: "destructive",
      });
    }

    setDeletingImageId(null);
  };

  const toggleActive = async (image: any) => {
    const { error } = await supabase
      .from('gallery_images')
      .update({ is_active: !image.is_active })
      .eq('id', image.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da imagem.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: image.is_active ? "Imagem desativada" : "Imagem ativada",
      description: `A imagem agora está ${image.is_active ? 'oculta' : 'visível'} na galeria pública.`,
    });

    queryClient.invalidateQueries({ queryKey: ['gallery-images-admin'] });
  };

  const handlePaneiroUpload = async () => {
    setIsUploadingPaneiro(true);
    try {
      const results = await uploadPaneiroImagesToGallery();
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      if (errorCount === 0) {
        toast({
          title: "Upload concluído",
          description: `${successCount} fotos do Bangalô Paneiro foram adicionadas à galeria.`,
        });
      } else {
        toast({
          title: "Upload parcial",
          description: `${successCount} fotos enviadas, ${errorCount} com erro.`,
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['gallery-images-admin'] });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload das imagens.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPaneiro(false);
    }
  };

  const handlePeneiraUpload = async () => {
    setIsUploadingPeneira(true);
    try {
      const results = await uploadPeneiraImagesToGallery();
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      if (errorCount === 0) {
        toast({
          title: "Upload concluído",
          description: `${successCount} fotos do Bangalô Peneira foram adicionadas à galeria.`,
        });
      } else {
        toast({
          title: "Upload parcial",
          description: `${successCount} fotos enviadas, ${errorCount} com erro.`,
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['gallery-images-admin'] });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload das imagens.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPeneira(false);
    }
  };

  const handleTipitiUpload = async () => {
    setIsUploadingTipiti(true);
    try {
      const results = await uploadTipitiImagesToGallery();
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      if (errorCount === 0) {
        toast({
          title: "Upload concluído",
          description: `${successCount} fotos do Bangalô Tipiti foram adicionadas à galeria.`,
        });
      } else {
        toast({
          title: "Upload parcial",
          description: `${successCount} fotos enviadas, ${errorCount} com erro.`,
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['gallery-images-admin'] });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload das imagens.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingTipiti(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      experiences: 'Experiências',
      bungalows: 'Bangalôs',
      food: 'Gastronomia',
      nature: 'Natureza',
      wildlife: 'Fauna',
    };
    return labels[category] || category;
  };

  const getBungalowLabel = (slug: string | null) => {
    if (!slug) return null;
    const room = rooms.find((r) => r.slug === slug);
    return room?.name_pt || slug;
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">Gerenciar Galeria</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Faça upload e gerencie as fotos da galeria pública
            </p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Upload de Fotos
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
          <div className="flex-1 sm:max-w-xs">
            <label className="text-sm font-medium mb-2 block">Categoria</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="experiences">Experiências</SelectItem>
                <SelectItem value="bungalows">Bangalôs</SelectItem>
                <SelectItem value="food">Gastronomia</SelectItem>
                <SelectItem value="nature">Natureza</SelectItem>
                <SelectItem value="wildlife">Fauna</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {categoryFilter === 'bungalows' && (
            <div className="flex-1 sm:max-w-xs">
              <label className="text-sm font-medium mb-2 block">Bangalô</label>
              <Select value={bungalowFilter} onValueChange={setBungalowFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Bangalôs</SelectItem>
                  <SelectItem value="bangalo-peneira">Bangalô Peneira</SelectItem>
                  <SelectItem value="bangalo-paneiro">Bangalô Paneiro</SelectItem>
                  <SelectItem value="bangalo-tipiti">Bangalô Tipiti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            {images.length} foto(s) encontrada(s)
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">Nenhuma imagem na galeria</p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar primeira foto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className={!image.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-0">
                <div className="relative group">
                  <img
                    src={image.url}
                    alt={image.alt_text}
                    width={300}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-square object-cover rounded-t-lg cursor-pointer"
                    onClick={() => openLightbox(index)}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setEditingImage(image)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => toggleActive(image)}
                    >
                      {image.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => setDeletingImageId(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm line-clamp-2 flex-1">{image.alt_text}</p>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryLabel(image.category)}
                      </Badge>
                      {image.bungalow_slug && (
                        <Badge variant="outline" className="text-xs">
                          {getBungalowLabel(image.bungalow_slug)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ordem: {image.display_order}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload de Fotos</DialogTitle>
          </DialogHeader>
          <GalleryUploader
            onUploadComplete={handleUploadComplete}
            onCancel={() => setUploadDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingImage && (
        <GalleryImageEditor
          image={editingImage}
          open={!!editingImage}
          onClose={() => setEditingImage(null)}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['gallery-images-admin'] });
            setEditingImage(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingImageId} onOpenChange={() => setDeletingImageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={images.map(img => ({ src: img.url, alt: img.alt_text }))}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
};

export default Gallery;
