import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Reservation {
  check_in: string;
  check_out: string;
  status: string;
}

export const useRoomAvailability = (roomId: string) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  useEffect(() => {
    if (roomId) {
      fetchReservations();
      setupRealtimeSubscription();
    }
  }, [roomId]);

  const fetchReservations = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("reservations")
        .select("check_in, check_out, status")
        .eq("room_id", roomId)
        .in("status", ["pending", "confirmed"])
        .gte("check_out", today.toISOString().split('T')[0])
        .order("check_in", { ascending: true });

      if (error) throw error;

      setReservations(data || []);
      calculateBlockedDates(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Erro ao carregar disponibilidade");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`room-${roomId}-availability`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateBlockedDates = (reservations: Reservation[]) => {
    const blocked: Date[] = [];

    reservations.forEach(reservation => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);

      // Block all dates within reservation period
      const currentDate = new Date(checkIn);
      while (currentDate <= checkOut) {
        blocked.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    setBlockedDates(blocked);
  };

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return !blockedDates.some(
      blocked => blocked.toISOString().split('T')[0] === dateStr
    );
  };

  const checkAvailability = (checkIn: Date, checkOut: Date): boolean => {
    const currentDate = new Date(checkIn);
    
    while (currentDate < checkOut) {
      if (!isDateAvailable(currentDate)) {
        return false;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return true;
  };

  const getNextAvailableDates = (): { checkIn: Date | null; checkOut: Date | null } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let checkIn: Date | null = null;
    let consecutiveDays = 0;
    const currentDate = new Date(today);

    // Look for first available 2-night period in next 90 days
    for (let i = 0; i < 90; i++) {
      if (isDateAvailable(currentDate)) {
        if (!checkIn) {
          checkIn = new Date(currentDate);
        }
        consecutiveDays++;
        
        if (consecutiveDays >= 2) {
          const checkOut = new Date(currentDate);
          checkOut.setDate(checkOut.getDate() + 1);
          return { checkIn, checkOut };
        }
      } else {
        checkIn = null;
        consecutiveDays = 0;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { checkIn: null, checkOut: null };
  };

  return {
    reservations,
    loading,
    blockedDates,
    isDateAvailable,
    checkAvailability,
    getNextAvailableDates,
    refreshAvailability: fetchReservations,
  };
};
