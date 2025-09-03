export interface Schedule {
  id: string;
  name: string;
  schedule_group_id: string;
  is_active: boolean;
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

export interface ScheduleGroup {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  schedules: Schedule[];
}

export interface Device {
  id: string;
  device_name: string;
  is_connected: boolean;
  last_seen: string | null;
  schedule_groups: {
    schedules: {
      name: string;
      is_active: boolean;
    }[];
  } | null;
}