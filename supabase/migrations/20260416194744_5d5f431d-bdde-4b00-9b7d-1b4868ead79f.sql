
-- Sequence for building maintenance code
CREATE SEQUENCE IF NOT EXISTS building_request_code_seq START 1;

-- Building sectors
CREATE TABLE public.building_sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.building_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access building_sectors"
ON public.building_sectors FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Building locations
CREATE TABLE public.building_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector_id uuid REFERENCES public.building_sectors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.building_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access building_locations"
ON public.building_locations FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Building maintenance requests
CREATE TABLE public.building_maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code integer NOT NULL DEFAULT nextval('building_request_code_seq'),
  sector_id uuid REFERENCES public.building_sectors(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.building_locations(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  requested_by text,
  assigned_to text,
  photo_url text,
  resolution_notes text,
  resolution_photo_url text,
  actual_hours numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  resolved_at timestamptz
);

ALTER TABLE public.building_maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access building_maintenance_requests"
ON public.building_maintenance_requests FOR ALL TO authenticated
USING (true) WITH CHECK (true);
