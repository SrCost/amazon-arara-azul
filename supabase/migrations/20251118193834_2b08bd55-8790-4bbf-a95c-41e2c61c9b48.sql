-- Adicionar campo para identificar o bangalô específico
ALTER TABLE public.gallery_images 
ADD COLUMN bungalow_slug TEXT;

-- Adicionar índice para performance
CREATE INDEX idx_gallery_bungalow ON gallery_images(bungalow_slug);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.gallery_images.bungalow_slug IS 'Slug do bangalô específico quando category = bungalows (ex: suite-peneira, suite-paneiro, suite-tipiti)';