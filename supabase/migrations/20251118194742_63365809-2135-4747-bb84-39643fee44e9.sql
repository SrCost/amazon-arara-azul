-- Add compression statistics column to gallery_images
ALTER TABLE public.gallery_images
ADD COLUMN compression_stats JSONB DEFAULT NULL;

COMMENT ON COLUMN public.gallery_images.compression_stats IS 'Stores image compression metadata: original_size, compressed_size, compression_ratio, dimensions, quality, format';

-- Create index for querying compression stats
CREATE INDEX idx_gallery_images_compression_stats ON public.gallery_images USING GIN (compression_stats);
