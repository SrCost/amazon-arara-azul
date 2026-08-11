// Suporte a múltiplas acomodações (bangalôs) em uma única reserva.
// Usado pelas Edge Functions de pagamento do site público.

export interface ExtraRoomInput {
  room_id: string;
  guests: number;
}

export interface Accommodation {
  room_id: string;
  room_name: string;
  guests: number;
  daily_rate: number;
  subtotal: number;
  position: number;
}

const GUEST_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.596,
  3: 2.0748,
  4: 2.6972,
};

const DEFAULT_BASE_PRICE = 1500.0;

export const getDailyRate = (guests: number, basePrice?: number): number => {
  const base = basePrice || DEFAULT_BASE_PRICE;
  const multiplier = GUEST_MULTIPLIERS[guests] || GUEST_MULTIPLIERS[2];
  return base * multiplier;
};

export const nightsBetween = (checkin: string, checkout: string): number =>
  Math.max(
    1,
    Math.round(
      (new Date(checkout).getTime() - new Date(checkin).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Valida e normaliza a lista de acomodações adicionais recebida do cliente. */
export function parseExtraRooms(raw: unknown, mainRoomId: string): ExtraRoomInput[] {
  if (!raw) return [];
  if (!Array.isArray(raw)) throw new Error("extra_rooms inválido");
  if (raw.length > 9) throw new Error("Limite de 10 acomodações por reserva excedido");

  const seen = new Set<string>([mainRoomId]);
  return raw.map((item: any) => {
    if (!item || !isUuid(item.room_id)) throw new Error("extra_rooms: room_id inválido");
    if (seen.has(item.room_id)) {
      throw new Error("extra_rooms: bangalô duplicado na mesma reserva");
    }
    seen.add(item.room_id);
    const guests = Math.min(Math.max(parseInt(String(item.guests)) || 1, 1), 10);
    return { room_id: item.room_id, guests };
  });
}

/**
 * Monta a lista completa de acomodações (principal + adicionais), validando
 * capacidade máxima e calculando diária/subtotal a partir dos preços do banco.
 */
export async function buildAccommodations(
  supabase: any,
  params: {
    mainRoomId: string;
    mainGuests: number;
    extraRooms: ExtraRoomInput[];
    checkin: string;
    checkout: string;
  }
): Promise<{ accommodations: Accommodation[]; totalGuests: number; nights: number }> {
  const { mainRoomId, mainGuests, extraRooms, checkin, checkout } = params;
  const roomIds = [mainRoomId, ...extraRooms.map((r) => r.room_id)];

  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, name_pt, price_per_night, max_guests, is_active")
    .in("id", roomIds);

  if (error || !rooms || rooms.length !== roomIds.length) {
    throw new Error("Bangalô não encontrado");
  }

  const nights = nightsBetween(checkin, checkout);
  const byId = new Map(rooms.map((r: any) => [r.id, r]));

  const entries = [
    { room_id: mainRoomId, guests: mainGuests },
    ...extraRooms,
  ];

  const accommodations: Accommodation[] = entries.map((entry, index) => {
    const room: any = byId.get(entry.room_id);
    if (!room?.is_active) throw new Error("Bangalô indisponível");
    if (entry.guests > Number(room.max_guests)) {
      throw new Error(
        `O bangalô ${room.name_pt} aceita no máximo ${room.max_guests} hóspede(s)`
      );
    }
    const daily = getDailyRate(entry.guests, Number(room.price_per_night) || 0);
    return {
      room_id: entry.room_id,
      room_name: room.name_pt,
      guests: entry.guests,
      daily_rate: Math.round(daily * 100) / 100,
      subtotal: Math.round(daily * nights * 100) / 100,
      position: index,
    };
  });

  return {
    accommodations,
    totalGuests: accommodations.reduce((sum, a) => sum + a.guests, 0),
    nights,
  };
}

/**
 * Verifica conflitos de datas para TODAS as acomodações da reserva,
 * considerando reservas (principal ou adicional) e bloqueios administrativos.
 * Retorna a lista de bangalôs indisponíveis (vazia quando tudo está livre).
 */
export async function findUnavailableRooms(
  supabase: any,
  params: {
    accommodations: Accommodation[];
    checkin: string;
    checkout: string;
    excludeEmail?: string;
    excludeReservationId?: string;
  }
): Promise<{ room_id: string; room_name: string }[]> {
  const { accommodations, checkin, checkout, excludeEmail, excludeReservationId } =
    params;
  const unavailable: { room_id: string; room_name: string }[] = [];

  for (const acc of accommodations) {
    // Reservas em que o bangalô é o principal
    let query = supabase
      .from("reservations")
      .select("id, check_in, check_out, guest_email")
      .in("status", ["pending", "confirmed"])
      .eq("room_id", acc.room_id)
      .lt("check_in", checkout)
      .gt("check_out", checkin);

    if (excludeEmail) query = query.neq("guest_email", excludeEmail);
    if (excludeReservationId) query = query.neq("id", excludeReservationId);

    const { data: mainConflicts } = await query;

    // Reservas em que o bangalô é acomodação adicional
    const { data: extraRows } = await supabase
      .from("reservation_rooms")
      .select("reservation_id, reservations!inner(id, check_in, check_out, status, guest_email)")
      .eq("room_id", acc.room_id);

    const extraConflicts = (extraRows || []).filter((row: any) => {
      const r = row.reservations;
      if (!r || !["pending", "confirmed"].includes(r.status)) return false;
      if (excludeEmail && r.guest_email === excludeEmail) return false;
      if (excludeReservationId && r.id === excludeReservationId) return false;
      return r.check_in < checkout && r.check_out > checkin;
    });

    // Bloqueios administrativos (data final inclusiva)
    const { data: blocks } = await supabase
      .from("blocked_dates")
      .select("id, start_date, end_date")
      .eq("room_id", acc.room_id)
      .lte("start_date", checkout)
      .gte("end_date", checkin);

    const blockConflicts = (blocks || []).filter((b: any) => {
      const end = new Date(b.end_date);
      end.setDate(end.getDate() + 1);
      return new Date(b.start_date) < new Date(checkout) && end > new Date(checkin);
    });

    if (
      (mainConflicts?.length || 0) > 0 ||
      extraConflicts.length > 0 ||
      blockConflicts.length > 0
    ) {
      unavailable.push({ room_id: acc.room_id, room_name: acc.room_name });
    }
  }

  return unavailable;
}

/** Grava/atualiza as acomodações da reserva em reservation_rooms. */
export async function persistReservationRooms(
  supabase: any,
  reservationId: string,
  accommodations: Accommodation[]
): Promise<void> {
  await supabase.from("reservation_rooms").delete().eq("reservation_id", reservationId);

  const { error } = await supabase.from("reservation_rooms").insert(
    accommodations.map((acc) => ({
      reservation_id: reservationId,
      room_id: acc.room_id,
      room_name: acc.room_name,
      guests: acc.guests,
      daily_rate: acc.daily_rate,
      subtotal: acc.subtotal,
      position: acc.position,
    }))
  );

  if (error) {
    console.error("Erro ao gravar reservation_rooms:", error);
    throw new Error("Falha ao registrar acomodações da reserva");
  }
}

/**
 * Total da reserva calculado no servidor (fonte da verdade).
 * Pacote com preço definido substitui o valor da acomodação principal.
 */
export function computeServerTotal(
  accommodations: Accommodation[],
  packagePrice?: number | null
): number {
  const extrasTotal = accommodations
    .slice(1)
    .reduce((sum, acc) => sum + acc.subtotal, 0);

  if (packagePrice && packagePrice > 0) {
    return Math.round((packagePrice + extrasTotal) * 100) / 100;
  }

  const total = accommodations.reduce((sum, acc) => sum + acc.subtotal, 0);
  return Math.round(total * 100) / 100;
}
