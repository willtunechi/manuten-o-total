-- Drop the FK constraint that only allows machines, since tickets can reference components too
ALTER TABLE public.tickets DROP CONSTRAINT tickets_machine_id_fkey;