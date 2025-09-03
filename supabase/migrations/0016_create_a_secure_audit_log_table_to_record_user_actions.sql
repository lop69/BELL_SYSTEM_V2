-- Create audit_log table
CREATE TABLE public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for clarity
COMMENT ON TABLE public.audit_log IS 'Records user actions for accountability and auditing purposes.';
COMMENT ON COLUMN public.audit_log.user_id IS 'The user who performed the action.';
COMMENT ON COLUMN public.audit_log.action IS 'A machine-readable key for the action performed (e.g., CREATE_SCHEDULE).';
COMMENT ON COLUMN public.audit_log.details IS 'Contextual JSON data about the action (e.g., { "schedule_id": "..." }).';

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own audit logs"
ON public.audit_log
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Note: By default, no one can select, update, or delete logs from the client.
-- This is intentional for security. An admin role would be needed to view logs.