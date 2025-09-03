-- Function to get the active schedule for a user's group and its bells for a specific day
CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id uuid, p_day_of_week int)
RETURNS TABLE(
  schedule_name text,
  bell_id uuid,
  bell_time time,
  bell_label text,
  bell_days_of_week int[]
) AS $$
BEGIN
  RETURN QUERY
  WITH user_active_schedule AS (
    SELECT s.id, s.name
    FROM schedules s
    JOIN schedule_groups sg ON s.schedule_group_id = sg.id
    WHERE sg.user_id = p_user_id AND s.is_active = true
    LIMIT 1
  )
  SELECT
    uas.name,
    b.id,
    b.time,
    b.label,
    b.days_of_week
  FROM bells b
  JOIN user_active_schedule uas ON b.schedule_id = uas.id
  WHERE p_day_of_week = ANY(b.days_of_week)
  ORDER BY b.time;
END;
$$ LANGUAGE plpgsql;