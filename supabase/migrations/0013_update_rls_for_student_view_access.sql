-- Drop old SELECT policies to replace them
DROP POLICY IF EXISTS "Allow SELECT access based on role" ON public.schedules;
DROP POLICY IF EXISTS "Allow SELECT access based on role" ON public.bells;
DROP POLICY IF EXISTS "Allow SELECT access based on role" ON public.devices;

-- Recreate policies with added view access for Students
-- RLS Policies for 'schedules' table
CREATE POLICY "Allow SELECT access based on role" ON public.schedules FOR SELECT
  USING (
    (get_my_role() = 'Admin') OR
    (auth.uid() = user_id) OR
    ((get_my_role() = 'HOD' OR get_my_role() = 'Student') AND (SELECT department FROM public.profiles WHERE id = user_id) = get_my_department())
  );

-- RLS Policies for 'bells' table
CREATE POLICY "Allow SELECT access based on role" ON public.bells FOR SELECT
  USING (
    (get_my_role() = 'Admin') OR
    (auth.uid() = user_id) OR
    ((get_my_role() = 'HOD' OR get_my_role() = 'Student') AND (SELECT department FROM public.profiles WHERE id = user_id) = get_my_department())
  );

-- RLS Policies for 'devices' table
CREATE POLICY "Allow SELECT access based on role" ON public.devices FOR SELECT
  USING (
    (get_my_role() = 'Admin') OR
    (auth.uid() = user_id) OR
    ((get_my_role() = 'HOD' OR get_my_role() = 'Student') AND (SELECT department FROM public.profiles WHERE id = user_id) = get_my_department())
  );