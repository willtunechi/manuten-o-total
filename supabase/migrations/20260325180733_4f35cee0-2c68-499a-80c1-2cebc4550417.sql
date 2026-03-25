CREATE TABLE public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_mode text NOT NULL DEFAULT 'light',
  primary_color text NOT NULL DEFAULT '0 0% 10%',
  secondary_color text NOT NULL DEFAULT '0 0% 96%',
  accent_color text NOT NULL DEFAULT '0 0% 92%',
  sidebar_color text NOT NULL DEFAULT '0 0% 98%',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read theme" ON public.theme_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage theme" ON public.theme_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO public.theme_settings (theme_mode) VALUES ('light');