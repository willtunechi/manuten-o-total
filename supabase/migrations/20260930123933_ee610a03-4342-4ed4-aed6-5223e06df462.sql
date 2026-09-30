CREATE TABLE public.stop_reasons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  counts_in_indicators boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stop_reasons TO authenticated;
GRANT ALL ON public.stop_reasons TO service_role;
ALTER TABLE public.stop_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.stop_reasons FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.shifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  start_time text NOT NULL DEFAULT '',
  end_time text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.job_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  base_role app_role NOT NULL DEFAULT 'mechanic',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_roles TO authenticated;
GRANT ALL ON public.job_roles TO service_role;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.job_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.mechanics ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.asset_stop_records ALTER COLUMN reason TYPE text;