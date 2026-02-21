
-- Create hero_slides table for managing homepage carousel
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  desktop_image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  alt_text TEXT NOT NULL DEFAULT '',
  media_type TEXT NOT NULL DEFAULT 'image',
  object_fit TEXT NOT NULL DEFAULT 'cover',
  background_color TEXT,
  hide_overlay BOOLEAN NOT NULL DEFAULT false,
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Public can read active slides
CREATE POLICY "Anyone can view active slides"
ON public.hero_slides FOR SELECT
USING (is_active = true);

-- Admins can manage all slides
CREATE POLICY "Admins can manage slides"
ON public.hero_slides FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_hero_slides_updated_at
BEFORE UPDATE ON public.hero_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
