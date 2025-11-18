import { supabase } from "@/integrations/supabase/client";

interface UploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export const uploadGalleryImage = async (
  file: File,
  altText: string,
  category: string,
  displayOrder: number = 0,
  bungalowSlug?: string
): Promise<UploadResult> => {
  try {
    // Gerar nome único
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const storagePath = `${category}/${fileName}`;
    
    // Upload para storage
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) throw uploadError;
    
    // Inserir registro na tabela
    const { error: dbError } = await supabase
      .from('gallery_images')
      .insert({
        file_name: file.name,
        storage_path: storagePath,
        alt_text: altText,
        category,
        bungalow_slug: bungalowSlug,
        display_order: displayOrder,
      });
    
    if (dbError) throw dbError;
    
    return { success: true, path: storagePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteGalleryImage = async (id: string, storagePath: string): Promise<boolean> => {
  try {
    // Deletar do storage
    const { error: storageError } = await supabase.storage
      .from('gallery')
      .remove([storagePath]);
    
    if (storageError) throw storageError;
    
    // Deletar registro da tabela
    const { error: dbError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id);
    
    if (dbError) throw dbError;
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};
