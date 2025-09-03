-- Sample data for profiles (ensuring unique IDs for each entry)
INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
VALUES
  ('5bbc89d8-d6a9-4d10-9b49-d0d89679f1fb', 'John', 'Doe', 'https://example.com/avatar1.png')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  avatar_url = EXCLUDED.avatar_url;

-- Sample data for schedules (requires a user to exist in auth.users first)
INSERT INTO public.schedules (id, user_id, name)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '5bbc89d8-d6a9-4d10-9b49-d0d89679f1fb', 'Morning Schedule'),
  ('a0000000-0000-0000-0000-000000000002', '5bbc89d8-d6a9-4d10-9b49-d0d89679f1fb', 'Evening Schedule')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name;

-- Sample data for bells (requires schedules and users to exist)
INSERT INTO public.bells (id, schedule_id, user_id, time, label, days_of_week)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '5bbc89d8-d6a9-4d10-9b49-d0d89679f1fb', '08:00:00', 'First Bell', ARRAY[1,2,3,4,5]),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '5bbc89d8-d6a9-4d10-9b49-d0d89679f1fb', '12:00:00', 'Lunch Bell', ARRAY[1,2,3,4,5]),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', '5bbc89d8-d6a9-4d10-9b49-d0d89679f1fb', '18:00:00', 'Closing Bell', ARRAY[0,1,2,3,4,5,6])
ON CONFLICT (id) DO UPDATE SET
  schedule_id = EXCLUDED.schedule_id,
  user_id = EXCLUDED.user_id,
  time = EXCLUDED.time,
  label = EXCLUDED.label,
  days_of_week = EXCLUDED.days_of_week;

-- Sample data for test_bells (requires a user to exist in auth.users first)
INSERT INTO public.test_bells (id, user_id, is_active, triggered_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', '5bbc89d8-d6a9-4d10-9b49-d0d89679f1fb', FALSE, NULL)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  is_active = EXCLUDED.is_active,
  triggered_at = EXCLUDED.triggered_at;