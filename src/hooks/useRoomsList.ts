import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoomListItem {
  id: string;
  slug: string;
  name_pt: string;
}

export const useRoomsList = () => {
  return useQuery({
    queryKey: ["rooms-list"],
    queryFn: async (): Promise<RoomListItem[]> => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, slug, name_pt")
        .eq("is_active", true)
        .order("name_pt", { ascending: true });

      if (error) throw error;
      return (data ?? []).filter((r) => !!r.slug) as RoomListItem[];
    },
    staleTime: 5 * 60 * 1000,
  });
};
