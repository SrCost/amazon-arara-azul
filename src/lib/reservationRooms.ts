import { supabase } from "@/integrations/supabase/client";

export const MAX_RESERVATION_ROOMS = 10;

export interface ReservationRoomItem {
  id?: string;
  reservation_id?: string;
  room_id: string;
  room_name: string | null;
  guests: number;
  daily_rate?: number | null;
  subtotal?: number | null;
  position?: number;
}

/**
 * Busca as acomodações (itens) de um conjunto de reservas.
 * Retorna um mapa reservation_id -> itens ordenados.
 */
export const fetchReservationRoomsMap = async (
  reservationIds: string[]
): Promise<Record<string, ReservationRoomItem[]>> => {
  if (reservationIds.length === 0) return {};

  const { data, error } = await supabase
    .from("reservation_rooms")
    .select("id, reservation_id, room_id, room_name, guests, daily_rate, subtotal, position")
    .in("reservation_id", reservationIds)
    .order("position", { ascending: true });

  if (error) {
    console.error("Erro ao buscar acomodações da reserva:", error);
    return {};
  }

  const map: Record<string, ReservationRoomItem[]> = {};
  (data || []).forEach((item) => {
    const key = item.reservation_id as string;
    if (!map[key]) map[key] = [];
    map[key].push(item as ReservationRoomItem);
  });
  return map;
};

/**
 * Substitui as acomodações de uma reserva pelos itens informados.
 * Compatibilidade: reservas com um único item continuam idênticas ao formato antigo.
 */
export const saveReservationRooms = async (
  reservationId: string,
  items: ReservationRoomItem[]
) => {
  const trimmed = items.slice(0, MAX_RESERVATION_ROOMS);

  const { error: deleteError } = await supabase
    .from("reservation_rooms")
    .delete()
    .eq("reservation_id", reservationId);

  if (deleteError) throw deleteError;

  if (trimmed.length === 0) return;

  const { error: insertError } = await supabase.from("reservation_rooms").insert(
    trimmed.map((item, index) => ({
      reservation_id: reservationId,
      room_id: item.room_id,
      room_name: item.room_name ?? null,
      guests: item.guests,
      daily_rate: item.daily_rate ?? null,
      subtotal: item.subtotal ?? null,
      position: index,
    }))
  );

  if (insertError) throw insertError;
};

/** Resumo textual das acomodações: "1 × Peneira, 2 × Tipiti" */
export const formatRoomsSummary = (
  items: Pick<ReservationRoomItem, "room_name">[] | undefined,
  fallback?: string | null
): string => {
  if (!items || items.length === 0) return fallback || "N/A";

  const counts = new Map<string, number>();
  items.forEach((item) => {
    const name = item.room_name || "Bangalô";
    counts.set(name, (counts.get(name) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, count]) => (count > 1 ? `${count} × ${name}` : name))
    .join(", ");
};
