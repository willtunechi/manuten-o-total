CREATE OR REPLACE FUNCTION public.clear_must_change_password()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles
  SET must_change_password = false
  WHERE user_id = auth.uid();
END;
$$;