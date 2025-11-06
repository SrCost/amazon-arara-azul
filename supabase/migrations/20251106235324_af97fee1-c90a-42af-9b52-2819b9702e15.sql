-- Add room_name column to reservations table to store lodge name
-- This will make it easier to display the lodge name in admin panels
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS room_name TEXT;

-- Update existing reservations with room names from rooms table
UPDATE public.reservations r
SET room_name = CASE 
  WHEN rm.name_pt IS NOT NULL THEN rm.name_pt
  ELSE 'Pousada'
END
FROM public.rooms rm
WHERE r.room_id = rm.id AND r.room_name IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON public.reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);