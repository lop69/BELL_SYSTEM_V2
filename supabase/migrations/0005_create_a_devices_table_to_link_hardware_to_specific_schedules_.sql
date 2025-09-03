-- Create devices table to store information about each ESP8266 device
CREATE TABLE public.devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_ip TEXT,
  is_connected BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for the new table
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only manage their own devices
CREATE POLICY "Users can manage their own devices" ON public.devices
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);