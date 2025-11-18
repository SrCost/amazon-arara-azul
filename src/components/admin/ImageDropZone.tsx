import { useCallback } from "react";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { validateImageFile, MAX_FILES_PER_UPLOAD } from "@/lib/galleryValidation";
import { toast } from "@/hooks/use-toast";

interface ImageDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const ImageDropZone = ({ onFilesSelected, disabled }: ImageDropZoneProps) => {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({
        title: "Arquivos rejeitados",
        description: "Alguns arquivos foram rejeitados. Verifique o formato e tamanho.",
        variant: "destructive",
      });
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    acceptedFiles.forEach(file => {
      const error = validateImageFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Erros de validação",
        description: errors.join(", "),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      if (validFiles.length > MAX_FILES_PER_UPLOAD) {
        toast({
          title: "Muitos arquivos",
          description: `Máximo ${MAX_FILES_PER_UPLOAD} arquivos por upload.`,
          variant: "destructive",
        });
        onFilesSelected(validFiles.slice(0, MAX_FILES_PER_UPLOAD));
      } else {
        onFilesSelected(validFiles);
      }
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: MAX_FILES_PER_UPLOAD,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-all duration-200
        ${isDragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-lg font-medium mb-2">
        {isDragActive ? 'Solte as fotos aqui' : 'Arraste fotos aqui ou clique para selecionar'}
      </p>
      <p className="text-sm text-muted-foreground">
        JPG, PNG ou WEBP • Máximo 5MB por arquivo • Até {MAX_FILES_PER_UPLOAD} fotos
      </p>
    </div>
  );
};

export default ImageDropZone;
