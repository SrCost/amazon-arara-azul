import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format, addMonths, subMonths } from "date-fns";

export interface CalendarReservation {
  id: string;
  room_id: string;
  room_name: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  guests: number;
  check_in: string;
  check_out: string;
  status: string | null;
  payment_status: string | null;
  operational_status: string | null;
  total_price: number;
  daily_rate: number | null;
  reservation_source: string | null;
  operational_notes: string | null;
  special_requests: string | null;
  created_at: string | null;
  package_id: string | null;
}

export interface BlockedDate {
  id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  block_type: string | null;
  created_at: string | null;
}

export interface Room {
  id: string;
  name_pt: string;
  name_en: string;
  slug: string | null;
  max_guests: number;
  price_per_night: number;
}

export const useCalendarReservations = (initialDate?: Date) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("id, name_pt, name_en, slug, max_guests, price_per_night")
        .eq("is_active", true)
        .order("name_pt");

      if (roomsError) throw roomsError;
      setRooms(roomsData || []);

      // Fetch reservations for the visible month (with buffer for overlapping reservations)
      const startStr = format(subMonths(monthStart, 1), "yyyy-MM-dd");
      const endStr = format(addMonths(monthEnd, 1), "yyyy-MM-dd");

      const { data: reservationsData, error: reservationsError } = await supabase
        .from("reservations")
        .select(`
          id,
          room_id,
          room_name,
          guest_name,
          guest_email,
          guest_phone,
          guests,
          check_in,
          check_out,
          status,
          payment_status,
          operational_status,
          total_price,
          daily_rate,
          reservation_source,
          operational_notes,
          special_requests,
          created_at,
          package_id
        `)
        .or(`check_in.gte.${startStr},check_out.gte.${startStr}`)
        .lte("check_in", endStr)
        .neq("status", "cancelled")
        .order("check_in");

      if (reservationsError) throw reservationsError;
      setReservations(reservationsData || []);

      // Fetch blocked dates
      const { data: blockedData, error: blockedError } = await supabase
        .from("blocked_dates")
        .select("*")
        .or(`start_date.gte.${startStr},end_date.gte.${startStr}`)
        .lte("start_date", endStr);

      if (blockedError) throw blockedError;
      setBlockedDates(blockedData || []);

    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.error("Erro ao carregar dados do calendário");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  // Setup realtime subscriptions
  useEffect(() => {
    const reservationsChannel = supabase
      .channel("calendar-reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => fetchData()
      )
      .subscribe();

    const blockedChannel = supabase
      .channel("calendar-blocked")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blocked_dates" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(blockedChannel);
    };
  }, [currentDate]);

  // Filter reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          res.guest_name.toLowerCase().includes(search) ||
          res.guest_email.toLowerCase().includes(search) ||
          (res.guest_phone && res.guest_phone.includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (res.operational_status !== statusFilter && res.status !== statusFilter) {
          return false;
        }
      }

      // Room filter
      if (roomFilter !== "all" && res.room_id !== roomFilter) {
        return false;
      }

      return true;
    });
  }, [reservations, searchTerm, statusFilter, roomFilter]);

  // Group reservations by room
  const reservationsByRoom = useMemo(() => {
    const grouped: Record<string, CalendarReservation[]> = {};
    rooms.forEach((room) => {
      grouped[room.id] = filteredReservations.filter((res) => res.room_id === room.id);
    });
    return grouped;
  }, [rooms, filteredReservations]);

  // Group blocked dates by room
  const blockedByRoom = useMemo(() => {
    const grouped: Record<string, BlockedDate[]> = {};
    rooms.forEach((room) => {
      grouped[room.id] = blockedDates.filter((block) => block.room_id === room.id);
    });
    return grouped;
  }, [rooms, blockedDates]);

  // Navigation
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());
  const goToDate = (date: Date) => setCurrentDate(date);

  // Check for conflicts - useCallback ensures fresh data on every call
  const checkConflict = useCallback((
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: string
  ): boolean => {
    console.log("🔍 checkConflict chamado:", {
      roomId,
      checkIn: format(checkIn, "yyyy-MM-dd"),
      checkOut: format(checkOut, "yyyy-MM-dd"),
      excludeReservationId,
      totalReservations: reservations.length,
    });

    const roomReservations = reservations.filter(
      (r) => r.room_id === roomId && r.id !== excludeReservationId
    );

    console.log("📋 Reservas no mesmo quarto:", roomReservations.map(r => ({
      id: r.id,
      guest: r.guest_name,
      checkIn: r.check_in,
      checkOut: r.check_out
    })));

    const roomBlocks = blockedDates.filter((b) => b.room_id === roomId);

    const checkInStr = format(checkIn, "yyyy-MM-dd");
    const checkOutStr = format(checkOut, "yyyy-MM-dd");

    // Check against existing reservations
    for (const res of roomReservations) {
      const hasConflict = 
        (checkInStr >= res.check_in && checkInStr < res.check_out) ||
        (checkOutStr > res.check_in && checkOutStr <= res.check_out) ||
        (checkInStr <= res.check_in && checkOutStr >= res.check_out);

      if (hasConflict) {
        console.log("⚠️ Conflito detectado com:", res);
        return true;
      }
    }

    // Check against blocked dates
    for (const block of roomBlocks) {
      if (
        (checkInStr >= block.start_date && checkInStr <= block.end_date) ||
        (checkOutStr >= block.start_date && checkOutStr <= block.end_date) ||
        (checkInStr <= block.start_date && checkOutStr >= block.end_date)
      ) {
        console.log("🚫 Conflito com bloqueio:", block);
        return true;
      }
    }

    console.log("✅ Sem conflitos");
    return false;
  }, [reservations, blockedDates]);

  return {
    currentDate,
    monthStart,
    monthEnd,
    rooms,
    reservations: filteredReservations,
    blockedDates,
    reservationsByRoom,
    blockedByRoom,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    roomFilter,
    setRoomFilter,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    goToDate,
    checkConflict,
    refresh: fetchData,
  };
};
