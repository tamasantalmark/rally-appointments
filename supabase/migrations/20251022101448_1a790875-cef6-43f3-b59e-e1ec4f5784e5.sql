-- Create function to get user email by user_id
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id LIMIT 1;
$$;