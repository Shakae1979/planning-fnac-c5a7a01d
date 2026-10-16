ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS has_weather boolean NOT NULL DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS has_shift_swaps boolean NOT NULL DEFAULT false;

CREATE TABLE public.shift_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  requester_date date NOT NULL,
  target_date date NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending_colleague',
  decided_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shift_swaps TO authenticated;
GRANT ALL ON public.shift_swaps TO service_role;
ALTER TABLE public.shift_swaps ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_employee_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.employees
  WHERE email IS NOT NULL AND lower(email) = lower(coalesce(auth.jwt() ->> 'email',''))
$$;

CREATE OR REPLACE FUNCTION public.can_manage_store(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin')
    OR ((public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'manager'))
        AND EXISTS (SELECT 1 FROM public.user_store_assignments a WHERE a.user_id = auth.uid() AND a.store_id = _store_id))
$$;

CREATE POLICY swaps_select ON public.shift_swaps FOR SELECT TO authenticated
USING (requester_id IN (SELECT public.my_employee_ids()) OR target_id IN (SELECT public.my_employee_ids()) OR public.can_manage_store(store_id));

CREATE POLICY swaps_insert ON public.shift_swaps FOR INSERT TO authenticated
WITH CHECK (requester_id IN (SELECT public.my_employee_ids()) AND status = 'pending_colleague'
  AND EXISTS (SELECT 1 FROM public.employees e WHERE e.id = requester_id AND e.store_id = shift_swaps.store_id)
  AND EXISTS (SELECT 1 FROM public.employees e WHERE e.id = target_id AND e.store_id = shift_swaps.store_id));

CREATE OR REPLACE FUNCTION public.respond_shift_swap(_id uuid, _action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    -- ensure rows exist
    INSERT INTO public.weekly_schedules(employee_id, week_start) SELECT e, w FROM (VALUES (s.requester_id, ws_r),(s.target_id, ws_r),(s.requester_id, ws_t),(s.target_id, ws_t)) v(e,w)
      WHERE NOT EXISTS (SELECT 1 FROM public.weekly_schedules x WHERE x.employee_id=v.e AND x.week_start=v.w);
    EXECUTE format('SELECT %I, %I FROM public.weekly_schedules WHERE employee_id=$1 AND week_start=$2', dk_r||'_start', dk_r||'_end') INTO r_start, r_end USING s.requester_id, ws_r;
    IF s.requester_date = s.target_date THEN
      EXECUTE format('SELECT %I, %I FROM public.weekly_schedules WHERE employee_id=$1 AND week_start=$2', dk_r||'_start', dk_r||'_end') INTO t_start, t_end USING s.target_id, ws_r;
      EXECUTE format('UPDATE public.weekly_schedules SET %I=$1, %I=$2, updated_at=now() WHERE employee_id=$3 AND week_start=$4', dk_r||'_start', dk_r||'_end') USING t_start, t_end, s.requester_id, ws_r;
      EXECUTE format('UPDATE public.weekly_schedules SET %I=$1, %I=$2, updated_at=now() WHERE employee_id=$3 AND week_start=$4', dk_r||'_start', dk_r||'_end') USING r_start, r_end, s.target_id, ws_r;
    ELSE
      EXECUTE format('SELECT %I, %I FROM public.weekly_schedules WHERE employee_id=$1 AND week_start=$2', dk_t||'_start', dk_t||'_end') INTO t_start, t_end USING s.target_id, ws_t;
      -- target takes requester's shift on requester_date; requester gets 'REPOS'
      EXECUTE format('UPDATE public.weekly_schedules SET %I=$1, %I=$2, updated_at=now() WHERE employee_id=$3 AND week_start=$4', dk_r||'_start', dk_r||'_end') USING r_start, r_end, s.target_id, ws_r;
      EXECUTE format('UPDATE public.weekly_schedules SET %I=NULL, %I=NULL, updated_at=now() WHERE employee_id=$1 AND week_start=$2', dk_r||'_start', dk_r||'_end') USING s.requester_id, ws_r;
      -- requester takes target's shift on target_date; target freed
      EXECUTE format('UPDATE public.weekly_schedules SET %I=$1, %I=$2, updated_at=now() WHERE employee_id=$3 AND week_start=$4', dk_t||'_start', dk_t||'_end') USING t_start, t_end, s.requester_id, ws_t;
      EXECUTE format('UPDATE public.weekly_schedules SET %I=NULL, %I=NULL, updated_at=now() WHERE employee_id=$1 AND week_start=$2', dk_t||'_start', dk_t||'_end') USING s.target_id, ws_t;
    END IF;
    UPDATE public.shift_swaps SET status='approved', decided_by=auth.uid(), updated_at=now() WHERE id=_id;
    INSERT INTO public.schedule_notifications(employee_id, store_id, week_start, message)
      VALUES (s.requester_id, s.store_id, ws_r, 'Échange de shift approuvé / Ruil goedgekeurd'),
             (s.target_id, s.store_id, ws_t, 'Échange de shift approuvé / Ruil goedgekeurd');
    RETURN;
  END IF;
  RAISE EXCEPTION 'invalid action';
END $$;

REVOKE EXECUTE ON FUNCTION public.respond_shift_swap(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.respond_shift_swap(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.my_employee_ids() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.my_employee_ids() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_manage_store(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_store(uuid) TO authenticated;