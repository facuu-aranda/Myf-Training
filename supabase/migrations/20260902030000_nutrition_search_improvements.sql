-- Función para simplificar nombres a un máximo de 2 partes (separadas por coma)
CREATE OR REPLACE FUNCTION public.simplify_food_name(full_name text) RETURNS text AS $$
DECLARE
  parts text[];
BEGIN
  IF full_name IS NULL OR full_name = '' THEN
    RETURN full_name;
  END IF;

  parts := string_to_array(full_name, ',');
  IF array_length(parts, 1) > 2 THEN
    RETURN trim(parts[1]) || ', ' || trim(parts[2]);
  END IF;
  
  RETURN full_name;
END;
$$ LANGUAGE plpgsql;

-- Actualizar los alimentos USDA existentes en la base de datos
UPDATE public.foods
SET 
  description = name_es, -- Guardar la traduccion completa original en description
  name_es = public.simplify_food_name(name_es),
  name = public.simplify_food_name(name),
  name_en = public.simplify_food_name(name_en)
WHERE source_id IN (SELECT id FROM public.food_sources WHERE source_key LIKE 'usda-%');

-- Función RPC para búsqueda rankeada
CREATE OR REPLACE FUNCTION public.search_foods_ranked(search_term text, limit_count int, offset_count int)
RETURNS SETOF public.foods AS $$
BEGIN
  IF search_term IS NULL OR search_term = '' THEN
    RETURN QUERY
    SELECT * FROM public.foods
    ORDER BY char_length(name_es) ASC, name_es ASC
    LIMIT limit_count OFFSET offset_count;
  ELSE
    RETURN QUERY
    SELECT * FROM public.foods
    WHERE 
      name_es ILIKE '%' || search_term || '%' OR
      name ILIKE '%' || search_term || '%' OR
      name_en ILIKE '%' || search_term || '%' OR
      description ILIKE '%' || search_term || '%' OR
      category ILIKE '%' || search_term || '%'
    ORDER BY 
      -- Exact matches first (highest priority)
      CASE WHEN name_es ILIKE search_term THEN 0 ELSE 1 END,
      -- Starts with matches next
      CASE WHEN name_es ILIKE search_term || '%' THEN 0 ELSE 1 END,
      -- Then order by the length of the name (shorter = simpler/more generic)
      char_length(name_es) ASC,
      name_es ASC
    LIMIT limit_count OFFSET offset_count;
  END IF;
END;
$$ LANGUAGE plpgsql;
