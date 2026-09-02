-- Restaurar los nombres completos de los alimentos USDA para no perder los detalles
UPDATE public.foods
SET 
  name_es = description,
  name = description,
  name_en = description
WHERE source_id IN (SELECT id FROM public.food_sources WHERE source_key LIKE 'usda-%')
  AND description IS NOT NULL
  AND description != '';
