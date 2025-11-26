-- Fix packages_public view to use SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures the view respects RLS policies of the querying user
DROP VIEW IF EXISTS public.packages_public;

CREATE VIEW public.packages_public
WITH (security_invoker=on)
AS
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