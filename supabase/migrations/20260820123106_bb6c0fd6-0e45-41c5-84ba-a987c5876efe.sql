CREATE TABLE public.reservation_experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES public.experiences(id),
  experience_name text NOT NULL,
  participants integer NOT NULL DEFAULT 1,
  base_price_per_person numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (reservation_id, experience_id)
);

GRANT SELECT ON public.reservation_experiences TO authenticated;
GRANT ALL ON public.reservation_experiences TO service_role;

ALTER TABLE public.reservation_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reservation experiences"
ON public.reservation_experiences FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role manages reservation experiences"
ON public.reservation_experiences FOR ALL
USING (public.is_service_role())
WITH CHECK (public.is_service_role());

CREATE INDEX idx_reservation_experiences_reservation ON public.reservation_experiences(reservation_id);

CREATE TRIGGER update_reservation_experiences_updated_at
BEFORE UPDATE ON public.reservation_experiences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();