-- Add sequential code to tickets
CREATE SEQUENCE IF NOT EXISTS public.ticket_code_seq START WITH 1 INCREMENT BY 1;

-- Add the code column
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS code integer;

-- Set existing tickets with sequential codes based on creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.tickets
)
UPDATE public.tickets t
SET code = n.rn
FROM numbered n
WHERE t.id = n.id;

-- Set the sequence to continue after the max existing code
SELECT setval('public.ticket_code_seq', COALESCE((SELECT MAX(code) FROM public.tickets), 0));

-- Set default for new tickets
ALTER TABLE public.tickets ALTER COLUMN code SET DEFAULT nextval('public.ticket_code_seq');
ALTER TABLE public.tickets ALTER COLUMN code SET NOT NULL;