-- Drop the old, complex test_bells table
DROP TABLE IF EXISTS public.test_bells;

-- Create a new, simple table for a single global test signal
CREATE TABLE public.global_test_signal (
  id INT PRIMARY KEY DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

-- Insert the single row that will be used for the global test
INSERT INTO public.global_test_signal (id, is_active) VALUES (1, false);

-- Enable Row Level Security
ALTER TABLE public.global_test_signal ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to read the test signal's status
CREATE POLICY "Public read access" ON public.global_test_signal
FOR SELECT USING (true);