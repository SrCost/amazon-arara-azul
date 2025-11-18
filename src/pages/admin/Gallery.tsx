import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useAllGalleryImages } from "@/hooks/useGalleryImages";
import { deleteGalleryImage } from "@/lib/galleryUpload";
import { supabase } from "@/integrations/supabase/client";
import GalleryUploader from "@/components/admin/GalleryUploader";
import GalleryImageEditor from "@/components/admin/GalleryImageEditor";
import Lightbox from "@/components/Lightbox";

const Gallery = () => {
  const queryClient = useQueryClient();
  const { data: images = [], isLoading } = useAllGalleryImages();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Gerenciar Galeria</h1>
          <p className="text-muted-foreground">
            Faça upload e gerencie as fotos da galeria pública
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload de Fotos
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma imagem na galeria</p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar primeira foto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className={!image.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-0">
                <div className="relative group">
                  <img
                    src={image.url}
                    alt={image.alt_text}
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
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {getCategoryLabel(image.category)}
                    </Badge>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
