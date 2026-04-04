
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS actual_hours numeric DEFAULT NULL;
ALTER TABLE public.plan_executions ADD COLUMN IF NOT EXISTS actual_hours numeric DEFAULT NULL;
ALTER TABLE public.lubrication_executions ADD COLUMN IF NOT EXISTS actual_hours numeric DEFAULT NULL;
