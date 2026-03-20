-- Junction table for parts used in plan item results
CREATE TABLE public.plan_item_parts_used (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_item_result_id uuid NOT NULL REFERENCES public.plan_item_results(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1
);

ALTER TABLE public.plan_item_parts_used ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access plan_item_parts_used"
  ON public.plan_item_parts_used
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);