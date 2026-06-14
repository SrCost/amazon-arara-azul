ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS beds jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rooms_max_guests_range'
  ) THEN
    ALTER TABLE public.rooms
      ADD CONSTRAINT rooms_max_guests_range CHECK (max_guests BETWEEN 1 AND 10);
  END IF;
END $$;