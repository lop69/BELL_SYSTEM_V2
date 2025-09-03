-- Drop the old user-based test_bells table
DROP TABLE IF EXISTS public.test_bells;

-- Create a new table keyed by schedule_id for more specific device testing
CREATE TABLE public.test_bells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT test_bells_schedule_id_key UNIQUE (schedule_id)
);

-- Add comments for clarity
COMMENT ON TABLE public.test_bells IS 'Stores temporary test signals for specific hardware schedules.';
COMMENT ON COLUMN public.test_bells.schedule_id IS 'Links the test signal to a specific schedule.';

-- Enable Row Level Security (REQUIRED)
ALTER TABLE public.test_bells ENABLE ROW LEVEL SECURITY;

-- Create policies ensuring users can only manage tests for schedules they own
CREATE POLICY "Users can manage test bells for their own schedules"
ON public.test_bells
FOR ALL
USING (
  auth.uid() = (SELECT user_id FROM public.schedules WHERE id = schedule_id)
);