import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { uploadGalleryImage } from "@/lib/galleryUpload";
import { validateAltText } from "@/lib/galleryValidation";
import ImageDropZone from "./ImageDropZone";
import type { GalleryImageUpload, UploadProgress } from "@/types/gallery";

interface GalleryUploaderProps {
  onUploadComplete: () => void;
  onCancel: () => void;
}

const GalleryUploader = ({ onUploadComplete, onCancel }: GalleryUploaderProps) => {
  const [uploads, setUploads] = useState<GalleryImageUpload[]>([]);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    const newUploads: GalleryImageUpload[] = files.map(file => ({
      file,
      alt_text: '',
      category: 'experiences',
      preview: URL.createObjectURL(file),
    }));
    setUploads(prev => [...prev, ...newUploads]);
  };

  const removeUpload = (index: number) => {
    setUploads(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateUpload = (index: number, field: keyof GalleryImageUpload, value: string) => {
    setUploads(prev => prev.map((upload, i) => 
      i === index ? { ...upload, [field]: value } : upload
    ));
  };

  const handleUpload = async () => {
    // Validar todos os campos
    const errors: string[] = [];
    uploads.forEach((upload, i) => {
      const altError = validateAltText(upload.alt_text);
      if (altError) {
        errors.push(`Foto ${i + 1}: ${altError}`);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Erros de validação",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(uploads.map(u => ({
      fileName: u.file.name,
      progress: 0,
      status: 'pending',
    })));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < uploads.length; i++) {
      const upload = uploads[i];
      
      setProgress(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'uploading', progress: 50 } : p
      ));

      const result = await uploadGalleryImage(
        upload.file,
        upload.alt_text,
        upload.category,
        i
      );

      if (result.success) {
        successCount++;
        setProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'success', progress: 100 } : p
        ));
      } else {
        errorCount++;
        setProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'error', progress: 0, error: result.error } : p
        ));
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast({
        title: "Upload concluído",
        description: `${successCount} foto(s) enviada(s) com sucesso${errorCount > 0 ? `, ${errorCount} com erro` : ''}.`,
      });
      
      // Limpar uploads bem-sucedidos
      uploads.forEach(u => URL.revokeObjectURL(u.preview));
      setUploads([]);
      setProgress([]);
      onUploadComplete();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {uploads.length === 0 && (
        <ImageDropZone onFilesSelected={handleFilesSelected} disabled={isUploading} />
      )}

      {uploads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{uploads.length} foto(s) selecionada(s)</h3>
            {!isUploading && (
              <Button variant="outline" size="sm" onClick={() => setUploads([])}>
                Limpar todas
              </Button>
            )}
          </div>

          <div className="grid gap-4 max-h-[500px] overflow-y-auto">
            {uploads.map((upload, index) => {
              const uploadProgress = progress[index];
              
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex gap-4">
                    <img 
                      src={upload.preview} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm truncate max-w-[300px]">
                            {upload.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(upload.file.size)}
                          </p>
                        </div>
                        {!isUploading && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeUpload(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <div>
                          <Label htmlFor={`alt-${index}`} className="text-xs">
                            Descrição *
                          </Label>
                          <Input
                            id={`alt-${index}`}
                            placeholder="Descrição da foto (mínimo 10 caracteres)"
                            value={upload.alt_text}
                            onChange={e => updateUpload(index, 'alt_text', e.target.value)}
                            disabled={isUploading}
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`category-${index}`} className="text-xs">
                            Categoria
                          </Label>
                          <Select
                            value={upload.category}
                            onValueChange={value => updateUpload(index, 'category', value)}
                            disabled={isUploading}
                          >
                            <SelectTrigger id={`category-${index}`} className="text-sm">
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
                      </div>

                      {uploadProgress && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {uploadProgress.status === 'success' && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                            {uploadProgress.status === 'error' && (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {uploadProgress.status === 'pending' && 'Aguardando...'}
                              {uploadProgress.status === 'uploading' && 'Enviando...'}
                              {uploadProgress.status === 'success' && 'Enviado com sucesso!'}
                              {uploadProgress.status === 'error' && `Erro: ${uploadProgress.error}`}
                            </span>
                          </div>
                          {uploadProgress.status === 'uploading' && (
                            <Progress value={uploadProgress.progress} className="h-1" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Enviando...' : `Salvar ${uploads.length} foto(s)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryUploader;
