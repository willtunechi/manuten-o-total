-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'logistica';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor_manutencao';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor_operacoes';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor_logistica';