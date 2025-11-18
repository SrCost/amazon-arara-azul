import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "./imageCompression";
import { COMPRESSION_PRESETS } from "./compressionPresets";

// Import images
import lodge1 from "@/assets/lodge-1.jpg";
import lodge2 from "@/assets/lodge-2.jpg";
import lodge3 from "@/assets/lodge-3.jpg";
import lodge4 from "@/assets/lodge-4.jpg";

const images = [
  { src: lodge1, alt: "Bangalô Peneira - Vista externa com arquitetura tradicional", order: 1 },
  { src: lodge2, alt: "Bangalô Peneira - Varanda privativa com rede", order: 2 },
  { src: lodge3, alt: "Bangalô Peneira - Interior aconchegante", order: 3 },
  { src: lodge4, alt: "Bangalô Peneira - Detalhe da decoração artesanal", order: 4 },
];

export const uploadPeneiraImagesToGallery = async () => {
  const results = [];
  
  for (const image of images) {
    try {
      // Fetch the image
      const response = await fetch(image.src);
      const blob = await response.blob();
      const file = new File([blob], `peneira-${image.order}.jpg`, { type: "image/jpeg" });
      
      // Compress image
      const compressionResult = await compressImage(file, COMPRESSION_PRESETS.bungalows);
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `bungalows/peneira-${image.order}-${timestamp}.jpg`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, compressionResult.compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Insert record in database
      const { error: dbError } = await supabase
        .from('gallery_images')
        .insert({
          file_name: `peneira-${image.order}.jpg`,
          storage_path: fileName,
          alt_text: image.alt,
          category: 'bungalows',
          bungalow_slug: 'bangalo-peneira',
          display_order: image.order,
        });
      
      if (dbError) throw dbError;
      
      results.push({ success: true, file: fileName });
    } catch (error: any) {
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
};
