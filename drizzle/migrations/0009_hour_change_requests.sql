CREATE TABLE public.hour_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  current_start text, current_end text,
  new_start text, new_end text,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending_manager' CHECK (status IN ('pending_manager','approved','rejected','cancelled')),
  decided_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.hour_change_requests TO authenticated;
GRANT ALL ON public.hour_change_requests TO service_role;
ALTER TABLE public.hour_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY hcr_select ON public.hour_change_requests FOR SELECT TO authenticated
  USING (employee_id IN (SELECT public.my_employee_ids()) OR public.can_manage_store(store_id));
CREATE POLICY hcr_insert ON public.hour_change_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id IN (SELECT public.my_employee_ids()) AND status='pending_manager'
    AND store_id = (SELECT e.store_id FROM public.employees e WHERE e.id = employee_id));

CREATE OR REPLACE FUNCTION public.respond_hour_request(_id uuid, _action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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
  UPDATE public.hour_change_requests SET status='approved', decided_by=auth.uid(), updated_at=now() WHERE id=_id;
  INSERT INTO public.schedule_notifications(employee_id, store_id, week_start, message)
    VALUES (r.employee_id, r.store_id, ws, 'Changement d''horaire approuvé / Uurwijziging goedgekeurd');
END $$;
REVOKE ALL ON FUNCTION public.respond_hour_request(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.respond_hour_request(uuid, text) TO authenticated;