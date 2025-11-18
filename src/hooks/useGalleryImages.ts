import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const useGalleryImages = (category?: string) => {
  return useQuery({
    queryKey: ['gallery-images', category],
    queryFn: async () => {
      let query = supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(img => ({
        src: `${SUPABASE_URL}/storage/v1/object/public/gallery/${img.storage_path}`,
        alt: img.alt_text,
        id: img.id,
      }));
    },
  });
};

export const useAllGalleryImages = () => {
  return useQuery({
    queryKey: ['gallery-images-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(img => ({
        ...img,
        url: `${SUPABASE_URL}/storage/v1/object/public/gallery/${img.storage_path}`,
      }));
    },
  });
};
