-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  alt_text TEXT NOT NULL,
  category TEXT DEFAULT 'experiences',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_gallery_active ON gallery_images(is_active);
CREATE INDEX idx_gallery_category ON gallery_images(category);
CREATE INDEX idx_gallery_order ON gallery_images(display_order);

-- Trigger for updated_at
CREATE TRIGGER trg_gallery_updated_at
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for audit logging
CREATE TRIGGER trg_audit_gallery_images
  AFTER INSERT OR UPDATE OR DELETE ON public.gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_activity();

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_images table
CREATE POLICY "Anyone can view active gallery images"
ON public.gallery_images FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage gallery images"
ON public.gallery_images FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true);

-- RLS Policies for storage.objects
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can delete gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);