
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS name_de text,
  ADD COLUMN IF NOT EXISTS description_de text;

UPDATE public.rooms
  SET name_de = COALESCE(name_de, name_en, name_pt),
      description_de = COALESCE(description_de, description_en, description_pt);

ALTER TABLE public.rooms
  ALTER COLUMN name_de SET NOT NULL,
  ALTER COLUMN description_de SET NOT NULL;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS guest_language text NOT NULL DEFAULT 'pt';
