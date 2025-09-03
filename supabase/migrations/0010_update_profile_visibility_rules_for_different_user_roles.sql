-- Drop the existing, simple select policy
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Create a new, more advanced policy for viewing profiles
CREATE POLICY "Users can view profiles based on their role"
ON public.profiles FOR SELECT
USING (
  -- Rule 1: All users can view their own profile.
  auth.uid() = id OR

  -- Rule 2: Users with the 'Admin' role can view all profiles.
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin' OR

  -- Rule 3: HODs can view all profiles within their own department.
  (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'HOD' AND
    (SELECT department FROM public.profiles WHERE id = auth.uid()) = department
  )
);