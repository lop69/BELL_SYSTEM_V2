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