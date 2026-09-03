-- Corrección del trigger handle_new_user para evitar fallos de Unique Constraint en username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
  final_public_handle text;
  final_public_code text;
BEGIN
  -- 1. Intentar obtener un username base desde la metadata (Google o Email)
  base_username := lower(coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1)
  ));
  
  -- 2. Limpiar caracteres no alfanuméricos para evitar fallos
  base_username := regexp_replace(base_username, '[^a-z0-9]', '', 'g');
  IF length(base_username) = 0 THEN
    base_username := 'user';
  END IF;

  final_username := base_username;
  
  -- 2.5. Asegurar que el username sea único
  WHILE exists (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || substr(md5(random()::text), 1, 4);
  END LOOP;

  -- 3. Generar identificadores requeridos para Households
  final_public_handle := final_username || '-' || substr(new.id::text, 1, 4);
  final_public_code := 'TT-' || upper(substr(md5(random()::text), 1, 6));

  -- 4. Insertar el perfil
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name, 
    first_name, 
    avatar_url,
    public_handle, 
    public_code
  )
  VALUES (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'given_name', new.raw_user_meta_data ->> 'first_name', split_part(split_part(new.email, '@', 1), '.', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', ''),
    final_public_handle,
    final_public_code
  ) ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;
