-- Add new fields to reservations table for guest information
ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS is_foreign BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS passport TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS next_destination TEXT,
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN public.reservations.cpf IS 'CPF for Brazilian guests';
COMMENT ON COLUMN public.reservations.birth_date IS 'Date of birth for all guests';
COMMENT ON COLUMN public.reservations.is_foreign IS 'Flag to indicate if guest is foreign';
COMMENT ON COLUMN public.reservations.country IS 'Country of origin for foreign guests';
COMMENT ON COLUMN public.reservations.nationality IS 'Nationality for foreign guests';
COMMENT ON COLUMN public.reservations.passport IS 'Passport number for foreign guests';
COMMENT ON COLUMN public.reservations.address IS 'Address for all guests';
COMMENT ON COLUMN public.reservations.next_destination IS 'Next destination after stay';
COMMENT ON COLUMN public.reservations.dietary_restrictions IS 'Dietary restrictions or allergies';
COMMENT ON COLUMN public.reservations.emergency_contact IS 'Emergency contact information';