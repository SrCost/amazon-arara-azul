CREATE TABLE public.reservation_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id),
  room_name text,
  guests integer NOT NULL DEFAULT 1,
  daily_rate numeric,
  subtotal numeric,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservation_rooms_reservation ON public.reservation_rooms(reservation_id);
CREATE INDEX idx_reservation_rooms_room ON public.reservation_rooms(room_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservation_rooms TO authenticated;
GRANT ALL ON public.reservation_rooms TO service_role;

ALTER TABLE public.reservation_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reservation rooms"
ON public.reservation_rooms FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert reservation rooms"
ON public.reservation_rooms FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update reservation rooms"
ON public.reservation_rooms FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete reservation rooms"
ON public.reservation_rooms FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_reservation_rooms_updated_at
BEFORE UPDATE ON public.reservation_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_reservation_rooms_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.reservation_rooms
  WHERE reservation_id = NEW.reservation_id;

  IF v_count > 10 THEN
    RAISE EXCEPTION 'Limite maximo de 10 acomodacoes por reserva excedido';
  END IF;

  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_reservation_rooms_limit
AFTER INSERT ON public.reservation_rooms
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.enforce_reservation_rooms_limit();

INSERT INTO public.reservation_rooms (reservation_id, room_id, room_name, guests, daily_rate, subtotal, position)
SELECT r.id, r.room_id, r.room_name, COALESCE(r.guests, 1), r.daily_rate, r.total_price, 0
FROM public.reservations r
WHERE r.room_id IS NOT NULL;