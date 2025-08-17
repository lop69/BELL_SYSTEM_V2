-- Add a UNIQUE constraint to the user_id column in the test_bells table
-- This ensures that each user can only have one test_bell entry, making upserts reliable.
ALTER TABLE public.test_bells
ADD CONSTRAINT test_bells_user_id_key UNIQUE (user_id);