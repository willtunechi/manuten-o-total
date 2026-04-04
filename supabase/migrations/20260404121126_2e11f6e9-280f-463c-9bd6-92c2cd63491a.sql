
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.components ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.lubrication_plans ADD COLUMN IF NOT EXISTS photo_url text;

INSERT INTO storage.buckets (id, name, public) VALUES ('asset-photos', 'asset-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view asset photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'asset-photos');

CREATE POLICY "Authenticated users can upload asset photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'asset-photos');

CREATE POLICY "Authenticated users can update asset photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'asset-photos');

CREATE POLICY "Authenticated users can delete asset photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'asset-photos');
