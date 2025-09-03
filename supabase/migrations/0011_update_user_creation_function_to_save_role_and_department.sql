CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  full_name TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- Extract first_name and last_name if provided directly from sign-up form
  first_name_val := new.raw_user_meta_data ->> 'first_name';
  last_name_val := new.raw_user_meta_data ->> 'last_name';

  -- If not provided (e.g., social login), try to parse from 'full_name' or 'name'
  IF first_name_val IS NULL THEN
    full_name := COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name');
    IF full_name IS NOT NULL THEN
      first_name_val := split_part(full_name, ' ', 1);
      last_name_val := substring(full_name from position(' ' in full_name) + 1);
      IF last_name_val = '' THEN
        last_name_val := NULL;
      END IF;
    END IF;
  END IF;

  -- Insert all collected data into the public.profiles table
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, role, department)
  VALUES (
    new.id,
    first_name_val,
    last_name_val,
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'role',
    new.raw_user_meta_data ->> 'department'
  );
  RETURN new;
END;
$function$