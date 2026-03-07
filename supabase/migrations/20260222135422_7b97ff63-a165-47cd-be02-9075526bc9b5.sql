-- Add email column to mechanics table
ALTER TABLE public.mechanics ADD COLUMN email text UNIQUE;
