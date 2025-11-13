-- Add slug column to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Update slugs for existing suites
UPDATE public.rooms SET slug = 'suite-peneira' WHERE name_pt = 'Suíte Peneira';
UPDATE public.rooms SET slug = 'suite-paneiro' WHERE name_pt = 'Suíte Paneiro';
UPDATE public.rooms SET slug = 'suite-tipiti' WHERE name_pt = 'Suíte Tipiti';

-- Add index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_rooms_slug ON public.rooms(slug) WHERE is_active = true;