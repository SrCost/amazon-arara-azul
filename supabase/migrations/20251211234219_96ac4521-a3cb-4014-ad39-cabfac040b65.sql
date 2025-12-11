-- Atualizar slugs antigos de suite-* para bangalo-*
UPDATE public.gallery_images 
SET bungalow_slug = 'bangalo-peneira' 
WHERE bungalow_slug = 'suite-peneira';

UPDATE public.gallery_images 
SET bungalow_slug = 'bangalo-paneiro' 
WHERE bungalow_slug = 'suite-paneiro';

UPDATE public.gallery_images 
SET bungalow_slug = 'bangalo-tipiti' 
WHERE bungalow_slug = 'suite-tipiti';