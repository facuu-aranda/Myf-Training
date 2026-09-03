-- Permitir que un usuario pueda borrarse a sí mismo de un household
CREATE POLICY "Household members delete self" ON public.household_members 
FOR DELETE USING (user_id = auth.uid());

-- Actualizar la política de perfiles para que se basen en el hogar (household) y no en la vieja tabla couples
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (
  id = auth.uid() 
  OR id IN (
    SELECT user_id FROM public.household_members 
    WHERE household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  )
);
