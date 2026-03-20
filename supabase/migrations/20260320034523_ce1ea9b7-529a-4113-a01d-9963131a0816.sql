
-- Migrate existing logistica users to planejador
UPDATE public.user_roles SET role = 'planejador' WHERE role = 'logistica';
UPDATE public.user_roles SET role = 'planejador' WHERE role = 'supervisor_logistica';

-- Update mechanics table too
UPDATE public.mechanics SET role = 'planejador' WHERE role = 'logistica';
UPDATE public.mechanics SET role = 'planejador' WHERE role = 'supervisor_logistica';
