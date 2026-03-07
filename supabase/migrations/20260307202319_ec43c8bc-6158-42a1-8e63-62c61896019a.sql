
-- Create locations table
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access locations" ON public.locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access suppliers" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO public.locations (name) VALUES ('Não Cadastrada');
INSERT INTO public.suppliers (name) VALUES ('Fornecedor Exemplo A');
