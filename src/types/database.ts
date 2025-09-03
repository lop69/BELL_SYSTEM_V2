export interface Schedule {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Bell {
  id: string;
  schedule_id: string;
  user_id: string;
  time: string;
  label: string;
  days_of_week: number[];
  created_at: string;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  role: string | null;
  department: string | null;
  push_notifications_enabled: boolean | null;
  email_summary_enabled: boolean | null;
}