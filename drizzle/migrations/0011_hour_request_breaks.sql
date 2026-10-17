ALTER TABLE public.hour_change_requests ADD COLUMN IF NOT EXISTS new_break_start text, ADD COLUMN IF NOT EXISTS new_break_end text;

CREATE OR REPLACE FUNCTION public.respond_hour_request(_id uuid, _action text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.hour_change_requests; dk text; ws date; j jsonb;
BEGIN
  SELECT * INTO r FROM public.hour_change_requests WHERE id=_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  IF r.status <> 'pending_manager' THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _action = 'cancel' THEN
    IF r.employee_id NOT IN (SELECT public.my_employee_ids()) THEN RAISE EXCEPTION 'forbidden'; END IF;
    UPDATE public.hour_change_requests SET status='cancelled', updated_at=now() WHERE id=_id; RETURN;
  END IF;
  IF NOT public.can_manage_store(r.store_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  ws := r.date - (extract(isodow from r.date)::int - 1);
  IF _action = 'reject' THEN
    UPDATE public.hour_change_requests SET status='rejected', decided_by=auth.uid(), updated_at=now() WHERE id=_id;
    INSERT INTO public.schedule_notifications(employee_id, store_id, week_start, message)
      VALUES (r.employee_id, r.store_id, ws, 'Demande de changement d''horaire refusée / Aanvraag uurwijziging geweigerd');
    RETURN;
  END IF;
  IF _action <> 'approve' THEN RAISE EXCEPTION 'invalid action'; END IF;
  dk := (ARRAY['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'])[extract(isodow from r.date)::int];
  INSERT INTO public.weekly_schedules(employee_id, week_start) SELECT r.employee_id, ws
    WHERE NOT EXISTS (SELECT 1 FROM public.weekly_schedules x WHERE x.employee_id=r.employee_id AND x.week_start=ws);
  EXECUTE format('UPDATE public.weekly_schedules SET %I=$1, %I=$2, updated_at=now() WHERE employee_id=$3 AND week_start=$4', dk||'_start', dk||'_end')
    USING NULLIF(r.new_start,''), NULLIF(r.new_end,''), r.employee_id, ws;
  IF NULLIF(r.new_break_start,'') IS NOT NULL AND NULLIF(r.new_break_end,'') IS NOT NULL THEN
    EXECUTE format('UPDATE public.weekly_schedules SET %I=$1, %I=$2 WHERE employee_id=$3 AND week_start=$4', dk||'_break_start', dk||'_break_end')
      USING r.new_break_start, r.new_break_end, r.employee_id, ws;
    SELECT to_jsonb(w) INTO j FROM public.weekly_schedules w WHERE employee_id=r.employee_id AND week_start=ws;
    UPDATE public.weekly_schedules SET hours_modified = public.calc_week_net_hours(j) WHERE employee_id=r.employee_id AND week_start=ws;
  ELSE
    PERFORM public.fix_day_break(r.employee_id, ws, dk);
  END IF;
  UPDATE public.hour_change_requests SET status='approved', decided_by=auth.uid(), updated_at=now() WHERE id=_id;
  INSERT INTO public.schedule_notifications(employee_id, store_id, week_start, message)
    VALUES (r.employee_id, r.store_id, ws, 'Changement d''horaire approuvé / Uurwijziging goedgekeurd');
END $function$;