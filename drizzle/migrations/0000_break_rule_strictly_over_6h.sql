CREATE OR REPLACE FUNCTION public.calc_week_net_hours(_schedule jsonb)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  d text;
  days text[] := ARRAY['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
  s text; e text; bs text; be text;
  gross numeric := 0;
  breaks numeric := 0;
  day_gross numeric;
  pause numeric;
BEGIN
  IF _schedule IS NULL THEN RETURN 0; END IF;
  FOREACH d IN ARRAY days LOOP
    s := _schedule ->> (d || '_start');
    e := _schedule ->> (d || '_end');
    IF s IS NOT NULL AND e IS NOT NULL AND s NOT IN ('EXT','ROULEMENT') THEN
      BEGIN
        day_gross := EXTRACT(EPOCH FROM (e::time - s::time)) / 3600.0;
      EXCEPTION WHEN OTHERS THEN
        day_gross := 0;
      END;
      IF day_gross IS NULL OR day_gross < 0 THEN day_gross := 0; END IF;
      gross := gross + day_gross;
      bs := _schedule ->> (d || '_break_start');
      be := _schedule ->> (d || '_break_end');
      IF bs IS NOT NULL AND be IS NOT NULL THEN
        BEGIN
          pause := EXTRACT(EPOCH FROM (be::time - bs::time)) / 3600.0;
        EXCEPTION WHEN OTHERS THEN
          pause := 0;
        END;
        IF pause IS NULL OR pause < 0 THEN pause := 0; END IF;
        breaks := breaks + pause;
      ELSIF day_gross > 6 THEN
        breaks := breaks + 1;
      END IF;
    END IF;
  END LOOP;
  RETURN GREATEST(gross - breaks, 0);
END;
$function$