CREATE OR REPLACE FUNCTION public.fix_day_break(_emp uuid, _ws date, _dk text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s text; e text; bs text; be text; bad boolean := false;
BEGIN
  IF _dk NOT IN ('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche') THEN RAISE EXCEPTION 'invalid day'; END IF;
  EXECUTE format('SELECT %I,%I,%I,%I FROM public.weekly_schedules WHERE employee_id=$1 AND week_start=$2',
    _dk||'_start',_dk||'_end',_dk||'_break_start',_dk||'_break_end') INTO s,e,bs,be USING _emp,_ws;
  IF bs IS NOT NULL OR be IS NOT NULL THEN
    BEGIN
      IF s IS NULL OR e IS NULL OR bs IS NULL OR be IS NULL THEN bad := true;
      ELSIF EXTRACT(EPOCH FROM (e::time - s::time))/3600.0 <= 6 THEN bad := true;
      ELSIF bs::time < s::time OR be::time > e::time OR be::time <= bs::time THEN bad := true;
      END IF;
    EXCEPTION WHEN OTHERS THEN bad := true; END;
    IF bad THEN
      EXECUTE format('UPDATE public.weekly_schedules SET %I=NULL,%I=NULL WHERE employee_id=$1 AND week_start=$2',
        _dk||'_break_start',_dk||'_break_end') USING _emp,_ws;
    END IF;
  END IF;
  UPDATE public.weekly_schedules w SET hours_modified = public.calc_week_net_hours(to_jsonb(w))
    WHERE employee_id=_emp AND week_start=_ws;
END $$;
REVOKE EXECUTE ON FUNCTION public.fix_day_break(uuid,date,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.respond_hour_request(_id uuid, _action text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.hour_change_requests; dk text; ws date;
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
  PERFORM public.fix_day_break(r.employee_id, ws, dk);
  UPDATE public.hour_change_requests SET status='approved', decided_by=auth.uid(), updated_at=now() WHERE id=_id;
  INSERT INTO public.schedule_notifications(employee_id, store_id, week_start, message)
    VALUES (r.employee_id, r.store_id, ws, 'Changement d''horaire approuvé / Uurwijziging goedgekeurd');
END $function$;

CREATE OR REPLACE FUNCTION public.respond_shift_swap(_id uuid, _action text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE s public.shift_swaps; dk_r text; dk_t text; ws_r date; ws_t date;
  r_start text; r_end text; t_start text; t_end text;
BEGIN
  SELECT * INTO s FROM public.shift_swaps WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  IF _action = 'cancel' THEN
    IF s.requester_id NOT IN (SELECT public.my_employee_ids()) OR s.status NOT IN ('pending_colleague','pending_manager') THEN RAISE EXCEPTION 'forbidden'; END IF;
    UPDATE public.shift_swaps SET status='cancelled', updated_at=now() WHERE id=_id; RETURN;
  END IF;
  IF _action IN ('accept','decline') THEN
    IF s.target_id NOT IN (SELECT public.my_employee_ids()) OR s.status <> 'pending_colleague' THEN RAISE EXCEPTION 'forbidden'; END IF;
    UPDATE public.shift_swaps SET status = CASE WHEN _action='accept' THEN 'pending_manager' ELSE 'declined' END, updated_at=now() WHERE id=_id;
    RETURN;
  END IF;
  IF _action IN ('approve','reject') THEN
    IF NOT public.can_manage_store(s.store_id) OR s.status <> 'pending_manager' THEN RAISE EXCEPTION 'forbidden'; END IF;
    IF _action = 'reject' THEN
      UPDATE public.shift_swaps SET status='rejected', decided_by=auth.uid(), updated_at=now() WHERE id=_id; RETURN;
    END IF;
    dk_r := (ARRAY['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'])[extract(isodow from s.requester_date)::int];
    dk_t := (ARRAY['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'])[extract(isodow from s.target_date)::int];
    ws_r := s.requester_date - (extract(isodow from s.requester_date)::int - 1);
    ws_t := s.target_date - (extract(isodow from s.target_date)::int - 1);
    INSERT INTO public.weekly_schedules(employee_id, week_start) SELECT DISTINCT e, w FROM (VALUES (s.requester_id, ws_r),(s.target_id, ws_r),(s.requester_id, ws_t),(s.target_id, ws_t)) v(e,w)
      WHERE NOT EXISTS (SELECT 1 FROM public.weekly_schedules x WHERE x.employee_id=v.e AND x.week_start=v.w);
    EXECUTE format('SELECT %I, %I FROM public.weekly_schedules WHERE employee_id=$1 AND week_start=$2', dk_r||'_start', dk_r||'_end') INTO r_start, r_end USING s.requester_id, ws_r;
    IF s.requester_date = s.target_date THEN
      EXECUTE format('SELECT %I, %I FROM public.weekly_schedules WHERE employee_id=$1 AND week_start=$2', dk_r||'_start', dk_r||'_end') INTO t_start, t_end USING s.target_id, ws_r;
      EXECUTE format('UPDATE public.weekly_schedules SET %I=$1, %I=$2, updated_at=now() WHERE employee_id=$3 AND week_start=$4', dk_r||'_start', dk_r||'_end') USING t_start, t_end, s.requester_id, ws_r;
      EXECUTE format('UPDATE public.weekly_schedules SET %I=$1, %I=$2, updated_at=now() WHERE employee_id=$3 AND week_start=$4', dk_r||'_start', dk_r||'_end') USING r_start, r_end, s.target_id, ws_r;
    ELSE
      EXECUTE format('SELECT %I, %I FROM public.weekly_schedules WHERE employee_id=$1 AND week_start=$2', dk_t||'_start', dk_t||'_end') INTO t_start, t_end USING s.target_id, ws_t;
      EXECUTE format('UPDATE public.weekly_schedules SET %I=$1, %I=$2, updated_at=now() WHERE employee_id=$3 AND week_start=$4', dk_r||'_start', dk_r||'_end') USING r_start, r_end, s.target_id, ws_r;
      EXECUTE format('UPDATE public.weekly_schedules SET %I=NULL, %I=NULL, updated_at=now() WHERE employee_id=$1 AND week_start=$2', dk_r||'_start', dk_r||'_end') USING s.requester_id, ws_r;
      EXECUTE format('UPDATE public.weekly_schedules SET %I=$1, %I=$2, updated_at=now() WHERE employee_id=$3 AND week_start=$4', dk_t||'_start', dk_t||'_end') USING t_start, t_end, s.requester_id, ws_t;
      EXECUTE format('UPDATE public.weekly_schedules SET %I=NULL, %I=NULL, updated_at=now() WHERE employee_id=$1 AND week_start=$2', dk_t||'_start', dk_t||'_end') USING s.target_id, ws_t;
      PERFORM public.fix_day_break(s.requester_id, ws_t, dk_t);
      PERFORM public.fix_day_break(s.target_id, ws_t, dk_t);
    END IF;
    PERFORM public.fix_day_break(s.requester_id, ws_r, dk_r);
    PERFORM public.fix_day_break(s.target_id, ws_r, dk_r);
    UPDATE public.shift_swaps SET status='approved', decided_by=auth.uid(), updated_at=now() WHERE id=_id;
    INSERT INTO public.schedule_notifications(employee_id, store_id, week_start, message)
      VALUES (s.requester_id, s.store_id, ws_r, 'Échange de shift approuvé / Ruil goedgekeurd'),
             (s.target_id, s.store_id, ws_t, 'Échange de shift approuvé / Ruil goedgekeurd');
    RETURN;
  END IF;
  RAISE EXCEPTION 'invalid action';
END $function$;

UPDATE public.weekly_schedules SET samedi_break_start=NULL, samedi_break_end=NULL
  WHERE id='66be665b-1800-408e-bca6-497169fc67b8';
UPDATE public.weekly_schedules w SET hours_modified = public.calc_week_net_hours(to_jsonb(w))
  WHERE id='66be665b-1800-408e-bca6-497169fc67b8';