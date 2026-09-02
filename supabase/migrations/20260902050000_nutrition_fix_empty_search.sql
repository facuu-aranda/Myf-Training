-- Corregir el ordenamiento cuando no hay término de búsqueda
CREATE OR REPLACE FUNCTION public.search_foods_ranked(search_term text, limit_count int, offset_count int)
RETURNS SETOF public.foods AS $$
BEGIN
  IF search_term IS NULL OR search_term = '' THEN
    -- Cuando no hay búsqueda, ordenamos alfabéticamente (normal)
    RETURN QUERY
    SELECT * FROM public.foods
    ORDER BY name_es ASC
    LIMIT limit_count OFFSET offset_count;
  ELSE
    -- Cuando sí hay búsqueda, priorizamos exactitud y longitud
    RETURN QUERY
    SELECT * FROM public.foods
    WHERE 
      name_es ILIKE '%' || search_term || '%' OR
      name ILIKE '%' || search_term || '%' OR
      name_en ILIKE '%' || search_term || '%' OR
      description ILIKE '%' || search_term || '%' OR
      category ILIKE '%' || search_term || '%'
    ORDER BY 
      CASE WHEN name_es ILIKE search_term THEN 0 ELSE 1 END,
      CASE WHEN name_es ILIKE search_term || '%' THEN 0 ELSE 1 END,
      char_length(name_es) ASC,
      name_es ASC
    LIMIT limit_count OFFSET offset_count;
  END IF;
END;
$$ LANGUAGE plpgsql;
