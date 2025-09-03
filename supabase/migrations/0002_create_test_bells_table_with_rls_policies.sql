-- Create test_bells table
CREATE TABLE public.test_bells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.test_bells ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "test_bells_select_policy" ON public.test_bells
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "test_bells_insert_policy" ON public.test_bells
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "test_bells_update_policy" ON public.test_bells
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "test_bells_delete_policy" ON public.test_bells
FOR DELETE TO authenticated USING (auth.uid() = user_id);