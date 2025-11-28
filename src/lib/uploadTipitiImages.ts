import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "./imageCompression";
import { COMPRESSION_PRESETS } from "./compressionPresets";

// Import new Tipiti images
import tipitiExterior from "@/assets/tipiti-exterior.jpg";
import tipitiBedroom from "@/assets/tipiti-bedroom.jpg";
import tipitiInterior from "@/assets/tipiti-interior.jpg";
import tipitiBathroomDetail from "@/assets/tipiti-bathroom-detail.jpg";
import tipitiBathroom from "@/assets/tipiti-bathroom.jpg";

const images = [
  { src: tipitiExterior, alt: "Bangalô Tipiti - Vista externa com passarela de madeira", order: 1, fileName: "tipiti-exterior" },
  { src: tipitiBedroom, alt: "Bangalô Tipiti - Quartos com camas confortáveis", order: 2, fileName: "tipiti-bedroom" },
  { src: tipitiInterior, alt: "Bangalô Tipiti - Interior em madeira com detalhes artesanais", order: 3, fileName: "tipiti-interior" },
  { src: tipitiBathroomDetail, alt: "Bangalô Tipiti - Detalhe do lavatório artesanal com escultura", order: 4, fileName: "tipiti-bathroom-detail" },
  { src: tipitiBathroom, alt: "Bangalô Tipiti - Banheiro privativo em madeira", order: 5, fileName: "tipiti-bathroom" },
];

export const uploadTipitiImagesToGallery = async () => {
  const results = [];
  
  // First, delete old Tipiti images
  const { data: oldImages } = await supabase
    .from('gallery_images')
    .select('id, storage_path')
    .eq('bungalow_slug', 'bangalo-tipiti');
  
  if (oldImages && oldImages.length > 0) {
    // Delete from storage
    const pathsToDelete = oldImages.map(img => img.storage_path);
    await supabase.storage.from('gallery').remove(pathsToDelete);
    
    // Delete from database
    await supabase
      .from('gallery_images')
      .delete()
      .eq('bungalow_slug', 'bangalo-tipiti');
  }
  
  for (const image of images) {
    try {
      // Fetch the image
      const response = await fetch(image.src);
      const blob = await response.blob();
      const file = new File([blob], `${image.fileName}.jpg`, { type: "image/jpeg" });
      
      // Compress image
      const compressionResult = await compressImage(file, COMPRESSION_PRESETS.bungalows);
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `bungalows/${image.fileName}-${timestamp}.jpg`;
      
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
          file_name: `${image.fileName}.jpg`,
          storage_path: fileName,
          alt_text: image.alt,
          category: 'bungalows',
          bungalow_slug: 'bangalo-tipiti',
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
