export const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILES_PER_UPLOAD = 10;

export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Formato não suportado. Use JPG, PNG ou WEBP.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Arquivo muito grande. Máximo 5MB.';
  }
  return null;
};

export const validateAltText = (text: string): string | null => {
  if (text.trim().length < 10) {
    return 'Descrição deve ter pelo menos 10 caracteres.';
  }
  if (text.trim().length > 200) {
    return 'Descrição deve ter no máximo 200 caracteres.';
  }
  return null;
};
