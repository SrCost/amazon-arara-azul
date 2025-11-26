-- Drop and recreate packages_public view without SECURITY DEFINER
DROP VIEW IF EXISTS public.packages_public;

-- Recreate the view without SECURITY DEFINER to fix security linter warning
CREATE VIEW public.packages_public AS
SELECT 
  id,
  name,
  slug,
  description,
  duration,
  people,
  price,
  inclusions,
  experiences
FROM public.packages
WHERE is_active = true;