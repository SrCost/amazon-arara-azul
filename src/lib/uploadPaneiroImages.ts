// Temporary helper to upload Paneiro images to gallery
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadData {
  filePath: string;
  fileName: string;
  altText: string;
  displayOrder: number;
}

const imagesToUpload: ImageUploadData[] = [
  {
    filePath: '/src/assets/paneiro-exterior.jpg',
    fileName: 'paneiro-exterior.jpg',
    altText: 'Bangalô Paneiro - Vista exterior com telhado de palha e varanda',
    displayOrder: 1
  },
  {
    filePath: '/src/assets/paneiro-balcony.jpg',
    fileName: 'paneiro-balcony.jpg',
    altText: 'Bangalô Paneiro - Varanda privativa com vista para a floresta',
    displayOrder: 2
  },
  {
    filePath: '/src/assets/paneiro-interior.jpg',
    fileName: 'paneiro-interior.jpg',
    altText: 'Bangalô Paneiro - Interior espaçoso com camas confortáveis',
    displayOrder: 3
  },
  {
    filePath: '/src/assets/paneiro-entrance.jpg',
    fileName: 'paneiro-entrance.jpg',
    altText: 'Bangalô Paneiro - Entrada do banheiro com detalhes artesanais',
    displayOrder: 4
  },
  {
    filePath: '/src/assets/paneiro-bathroom.jpg',
    fileName: 'paneiro-bathroom.jpg',
    altText: 'Bangalô Paneiro - Banheiro rústico com acabamento em madeira',
    displayOrder: 5
  }
];

export async function uploadPaneiroImagesToGallery() {
  console.log('Starting Paneiro images upload to gallery...');
  
  for (const imageData of imagesToUpload) {
    try {
      // Fetch the image file from assets
      const response = await fetch(imageData.filePath);
      const blob = await response.blob();
      const file = new File([blob], imageData.fileName, { type: 'image/jpeg' });
      
      // Generate unique storage path
      const timestamp = Date.now();
      const storagePath = `bungalows/${timestamp}_${imageData.fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) {
        console.error(`Upload error for ${imageData.fileName}:`, uploadError);
        continue;
      }
      
      // Insert record in gallery_images table
      const { error: dbError } = await supabase
        .from('gallery_images')
        .insert({
          file_name: imageData.fileName,
          storage_path: storagePath,
          alt_text: imageData.altText,
          category: 'bungalows',
          bungalow_slug: 'bangalo-paneiro',
          display_order: imageData.displayOrder,
          is_active: true,
        });
      
      if (dbError) {
        console.error(`Database error for ${imageData.fileName}:`, dbError);
        continue;
      }
      
      console.log(`✓ Successfully uploaded: ${imageData.fileName}`);
    } catch (error) {
      console.error(`Error processing ${imageData.fileName}:`, error);
    }
  }
  
  console.log('Upload process completed!');
}
