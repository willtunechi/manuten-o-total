
CREATE TABLE public.component_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.component_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access component_types"
  ON public.component_types
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO public.component_types (key, name) VALUES
  ('trocador_calor', 'Trocador de Calor'),
  ('bomba_vacuo', 'Bomba de Vácuo'),
  ('tanque_agua', 'Gala');
