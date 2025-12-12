import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentRealtimeState {
  status: string;
  isConnected: boolean;
  lastUpdate: Date | null;
}

export const usePaymentRealtime = (
  reservationId: string | null,
  initialStatus: string = 'pending'
) => {
  const [state, setState] = useState<PaymentRealtimeState>({
    status: initialStatus,
    isConnected: false,
    lastUpdate: null
  });

  // Handle realtime updates
  const handlePaymentUpdate = useCallback((payload: any) => {
    console.log('=== PAYMENT REALTIME UPDATE ===');
    console.log('Payload:', payload);
    
    const newStatus = payload.new?.status;
    if (newStatus) {
      setState(prev => ({
        ...prev,
        status: newStatus,
        lastUpdate: new Date()
      }));
    }
  }, []);

  // Handle reservation updates (payment_status field)
  const handleReservationUpdate = useCallback((payload: any) => {
    console.log('=== RESERVATION REALTIME UPDATE ===');
    console.log('Payload:', payload);
    
    const paymentStatus = payload.new?.payment_status;
    if (paymentStatus) {
      setState(prev => ({
        ...prev,
        status: paymentStatus,
        lastUpdate: new Date()
      }));
    }
  }, []);

  useEffect(() => {
    if (!reservationId) {
      return;
    }

    console.log('=== INICIANDO REALTIME PARA RESERVA ===');
    console.log('Reservation ID:', reservationId);

    // Subscribe to payments table changes
    const paymentsChannel = supabase
      .channel(`payments-${reservationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `reservation_id=eq.${reservationId}`
        },
        handlePaymentUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `reservation_id=eq.${reservationId}`
        },
        handlePaymentUpdate
      )
      .subscribe((status) => {
        console.log('Payments channel status:', status);
        setState(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED'
        }));
      });

    // Subscribe to reservations table changes
    const reservationsChannel = supabase
      .channel(`reservations-${reservationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
          filter: `id=eq.${reservationId}`
        },
        handleReservationUpdate
      )
      .subscribe((status) => {
        console.log('Reservations channel status:', status);
      });

    // Cleanup on unmount
    return () => {
      console.log('=== REMOVENDO CHANNELS REALTIME ===');
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(reservationsChannel);
    };
  }, [reservationId, handlePaymentUpdate, handleReservationUpdate]);

  // Manual check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!reservationId) return null;

    try {
      // Check payments table
      const { data: payment } = await supabase
        .from('payments')
        .select('status')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (payment?.status) {
        setState(prev => ({
          ...prev,
          status: payment.status,
          lastUpdate: new Date()
        }));
        return payment.status;
      }

      // Fallback to reservation
      const { data: reservation } = await supabase
        .from('reservations')
        .select('payment_status')
        .eq('id', reservationId)
        .single();

      if (reservation?.payment_status) {
        setState(prev => ({
          ...prev,
          status: reservation.payment_status,
          lastUpdate: new Date()
        }));
        return reservation.payment_status;
      }

      return null;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  }, [reservationId]);

  return {
    paymentStatus: state.status,
    isConnected: state.isConnected,
    lastUpdate: state.lastUpdate,
    checkPaymentStatus,
    isPaid: state.status === 'paid' || state.status === 'approved',
    isPending: state.status === 'pending' || state.status === 'in_process',
    isFailed: state.status === 'failed' || state.status === 'rejected'
  };
};
