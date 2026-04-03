
ALTER TABLE public.stores ADD COLUMN is_direction boolean NOT NULL DEFAULT false;

INSERT INTO public.stores (name, city, is_direction) VALUES ('Direction Fnac', 'Siège', true);
