-- Reset the flag for testing; this is a one-time data fix
-- Also recreate the function to ensure it works correctly
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.clear_must_change_password() TO authenticated;