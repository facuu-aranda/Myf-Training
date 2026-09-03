-- 1. Añadir campos a profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS public_handle text,
ADD COLUMN IF NOT EXISTS public_code text,
ADD COLUMN IF NOT EXISTS discoverable boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'discoverable',
ADD COLUMN IF NOT EXISTS progress_visibility text NOT NULL DEFAULT 'household';

-- Generar public_code y public_handle para usuarios existentes
UPDATE public.profiles
SET 
  public_code = 'TT-' || upper(substr(md5(random()::text), 1, 6)),
  public_handle = lower(regexp_replace(username, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(id::text, 1, 4)
WHERE public_code IS NULL;

-- Ahora sí, marcamos como NOT NULL y añadimos Constraints
ALTER TABLE public.profiles
ALTER COLUMN public_handle SET NOT NULL,
ALTER COLUMN public_code SET NOT NULL,
ADD CONSTRAINT public_handle_unique UNIQUE (public_handle),
ADD CONSTRAINT public_code_unique UNIQUE (public_code);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_public_handle_lower_idx ON public.profiles (lower(public_handle));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_public_code_idx ON public.profiles (public_code);

-- 2. Households
CREATE TABLE IF NOT EXISTS public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  household_type text NOT NULL DEFAULT 'duo',
  legacy_couple_id uuid,
  owner_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_members integer NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Household Members
CREATE TABLE IF NOT EXISTS public.household_members (
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (household_id, user_id)
);

-- 4. Household Invitations
CREATE TABLE IF NOT EXISTS public.household_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  inviter_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash text,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Profile Follows
CREATE TABLE IF NOT EXISTS public.profile_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

-- 6. Migrar parejas (couples) existentes a households
DO $$
DECLARE
  c record;
  new_h_id uuid;
  u1 uuid;
  u2 uuid;
BEGIN
  FOR c IN SELECT * FROM public.couples LOOP
    SELECT user_id INTO u1 FROM public.couple_members WHERE couple_id = c.id ORDER BY joined_at ASC LIMIT 1;
    SELECT user_id INTO u2 FROM public.couple_members WHERE couple_id = c.id ORDER BY joined_at ASC OFFSET 1 LIMIT 1;
    
    IF u1 IS NOT NULL THEN
      INSERT INTO public.households (id, name, household_type, legacy_couple_id, owner_user_id, max_members, created_at, updated_at)
      VALUES (c.id, 'My Household', 'duo', c.id, u1, 2, c.created_at, c.created_at)
      RETURNING id INTO new_h_id;
      
      INSERT INTO public.household_members (household_id, user_id, role, joined_at) VALUES (new_h_id, u1, 'owner', c.created_at);
      
      IF u2 IS NOT NULL THEN
        INSERT INTO public.household_members (household_id, user_id, role, joined_at) VALUES (new_h_id, u2, 'member', c.created_at);
      END IF;
    END IF;
  END LOOP;
END
$$;

-- 7. View public_profiles
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  public_handle,
  public_code,
  display_name,
  first_name,
  avatar_url,
  discoverable
FROM public.profiles
WHERE active = true AND discoverable = true;

-- 8. RPC para búsqueda de perfiles
CREATE OR REPLACE FUNCTION public.search_public_profiles(search_query text, result_limit integer)
RETURNS SETOF public.public_profiles AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.public_profiles
  WHERE 
    lower(public_handle) = lower(search_query) OR
    public_code = search_query OR
    lower(public_handle) LIKE lower(search_query) || '%' OR
    lower(display_name) LIKE '%' || lower(search_query) || '%'
  ORDER BY
    CASE WHEN lower(public_handle) = lower(search_query) THEN 0 ELSE 1 END,
    CASE WHEN public_code = search_query THEN 0 ELSE 1 END,
    CASE WHEN lower(public_handle) LIKE lower(search_query) || '%' THEN 0 ELSE 1 END,
    display_name ASC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC Transaccional add_household_member (DUO capacity check)
CREATE OR REPLACE FUNCTION public.add_household_member(p_household_id uuid, p_user_id uuid, p_role text)
RETURNS boolean AS $$
DECLARE
  v_max int;
  v_count int;
BEGIN
  LOCK TABLE public.household_members IN EXCLUSIVE MODE;
  
  SELECT max_members INTO v_max FROM public.households WHERE id = p_household_id;
  IF v_max IS NULL THEN RETURN false; END IF;
  
  SELECT count(*) INTO v_count FROM public.household_members WHERE household_id = p_household_id AND left_at IS NULL;
  
  IF v_count >= v_max THEN
    RETURN false; 
  END IF;
  
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (p_household_id, p_user_id, p_role)
  ON CONFLICT (household_id, user_id) 
  DO UPDATE SET left_at = NULL, role = EXCLUDED.role;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: Habilitar Row Level Security
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_follows ENABLE ROW LEVEL SECURITY;

-- Políticas temporales simples (a ajustar en lib si es necesario)
-- households: puede ver quien es owner o miembro
CREATE POLICY "Households select" ON public.households FOR SELECT USING (
  owner_user_id = auth.uid() OR id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
);
CREATE POLICY "Households update" ON public.households FOR UPDATE USING (owner_user_id = auth.uid());
CREATE POLICY "Households insert" ON public.households FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Households delete" ON public.households FOR DELETE USING (owner_user_id = auth.uid());

-- household_members
CREATE POLICY "Household members select" ON public.household_members FOR SELECT USING (
  user_id = auth.uid() OR household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid())
);
CREATE POLICY "Household members all" ON public.household_members FOR ALL USING (
  household_id IN (SELECT id FROM public.households WHERE owner_user_id = auth.uid())
);

-- household_invitations
CREATE POLICY "Invitations select" ON public.household_invitations FOR SELECT USING (
  inviter_user_id = auth.uid() OR invitee_user_id = auth.uid()
);
CREATE POLICY "Invitations insert" ON public.household_invitations FOR INSERT WITH CHECK (
  inviter_user_id = auth.uid()
);
CREATE POLICY "Invitations update" ON public.household_invitations FOR UPDATE USING (
  invitee_user_id = auth.uid() OR inviter_user_id = auth.uid()
);

-- profile_follows
CREATE POLICY "Follows select" ON public.profile_follows FOR SELECT USING (
  follower_id = auth.uid() OR followed_id = auth.uid()
);
CREATE POLICY "Follows insert" ON public.profile_follows FOR INSERT WITH CHECK (
  follower_id = auth.uid()
);
CREATE POLICY "Follows update" ON public.profile_follows FOR UPDATE USING (
  followed_id = auth.uid() OR follower_id = auth.uid()
);
