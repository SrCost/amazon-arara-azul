export const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (before compression)
export const MAX_FILES_PER_UPLOAD = 10;

export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Formato não suportado. Use JPG, PNG ou WEBP.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Arquivo muito grande. Máximo 10MB (será compactado automaticamente).';
  }
  return null;
};

export async function validateImageDimensions(
  file: File
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      if (img.width < 800 || img.height < 800) {
        resolve('Imagem muito pequena. Mínimo 800x800px.');
      } else {
        resolve(null);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('Não foi possível ler a imagem.');
    };
    
    img.src = url;
  });
}

export const validateAltText = (text: string): string | null => {
  if (text.trim().length < 10) {
    return 'Descrição deve ter pelo menos 10 caracteres.';
  }
  if (text.trim().length > 200) {
    return 'Descrição deve ter no máximo 200 caracteres.';
  }
  return null;
};
