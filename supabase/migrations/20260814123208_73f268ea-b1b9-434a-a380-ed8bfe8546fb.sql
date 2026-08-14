ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS day_hours jsonb;

UPDATE public.store_settings
SET day_hours = jsonb_build_object(
  'lundi', jsonb_build_object('start', lpad(schedule_start_hour::text,2,'0')||':00', 'end', lpad(schedule_end_hour::text,2,'0')||':00', 'closed', false),
  'mardi', jsonb_build_object('start', lpad(schedule_start_hour::text,2,'0')||':00', 'end', lpad(schedule_end_hour::text,2,'0')||':00', 'closed', false),
  'mercredi', jsonb_build_object('start', lpad(schedule_start_hour::text,2,'0')||':00', 'end', lpad(schedule_end_hour::text,2,'0')||':00', 'closed', false),
  'jeudi', jsonb_build_object('start', lpad(schedule_start_hour::text,2,'0')||':00', 'end', lpad(schedule_end_hour::text,2,'0')||':00', 'closed', false),
  'vendredi', jsonb_build_object('start', lpad(schedule_start_hour::text,2,'0')||':00', 'end', lpad(schedule_end_hour::text,2,'0')||':00', 'closed', false),
  'samedi', jsonb_build_object('start', lpad(schedule_start_hour::text,2,'0')||':00', 'end', lpad(schedule_end_hour::text,2,'0')||':00', 'closed', false),
  'dimanche', jsonb_build_object('start', lpad(schedule_start_hour::text,2,'0')||':00', 'end', lpad(schedule_end_hour::text,2,'0')||':00', 'closed', false)
)
WHERE day_hours IS NULL;