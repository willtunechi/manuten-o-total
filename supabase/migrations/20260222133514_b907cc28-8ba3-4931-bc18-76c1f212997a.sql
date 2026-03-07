
-- =============================================
-- FASE 1: Todas as tabelas do sistema de manutenção
-- =============================================

-- Linhas de produção
CREATE TABLE public.lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Máquinas
CREATE TABLE public.machines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'extrusora',
  model TEXT NOT NULL DEFAULT '',
  manufacturer TEXT NOT NULL DEFAULT '',
  year INT NOT NULL DEFAULT 2024,
  sector TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'operating',
  horimeter NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Componentes
CREATE TABLE public.components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  type TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  rule_id UUID,
  status TEXT NOT NULL DEFAULT 'operating',
  model TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Peças / Estoque
CREATE TABLE public.parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT DEFAULT '',
  description TEXT DEFAULT '',
  unit TEXT DEFAULT 'un',
  location TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT DEFAULT '',
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mecânicos / Colaboradores
CREATE TABLE public.mechanics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'mechanic',
  shift TEXT NOT NULL DEFAULT 'Manhã',
  level TEXT NOT NULL DEFAULT 'mid',
  available BOOLEAN NOT NULL DEFAULT true,
  can_execute_checklist BOOLEAN NOT NULL DEFAULT true,
  can_execute_preventive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de junção: mecânicos <-> máquinas
CREATE TABLE public.mechanic_machines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mechanic_id UUID NOT NULL REFERENCES public.mechanics(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  UNIQUE(mechanic_id, machine_id)
);

-- Tabela de junção: mecânicos <-> componentes
CREATE TABLE public.mechanic_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mechanic_id UUID NOT NULL REFERENCES public.mechanics(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  UNIQUE(mechanic_id, component_id)
);

-- Tickets (chamados de manutenção)
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'corrective',
  maintenance_type TEXT,
  symptom TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  reported_by TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de junção: ticket <-> peças usadas
CREATE TABLE public.ticket_parts_used (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1
);

-- Falhas conhecidas
CREATE TABLE public.failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symptom TEXT DEFAULT '',
  probable_cause TEXT DEFAULT '',
  recommended_action TEXT DEFAULT '',
  common_parts TEXT[] DEFAULT '{}',
  machine_id TEXT DEFAULT '',
  component_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Planos de manutenção
CREATE TABLE public.maintenance_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'preventive',
  active BOOLEAN NOT NULL DEFAULT true,
  machine_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens dos planos de manutenção
CREATE TABLE public.maintenance_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.maintenance_plans(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  inspection_type TEXT NOT NULL DEFAULT '',
  attention_points TEXT NOT NULL DEFAULT '',
  frequency_days INT NOT NULL DEFAULT 30,
  observation TEXT NOT NULL DEFAULT '',
  responsible TEXT NOT NULL DEFAULT 'manutencao'
);

-- Execuções de planos
CREATE TABLE public.plan_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.maintenance_plans(id) ON DELETE CASCADE,
  machine_id TEXT DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resultados dos itens de execução
CREATE TABLE public.plan_item_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES public.plan_executions(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  result TEXT,
  completed_at TIMESTAMPTZ,
  mechanic_id TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  photo_url TEXT DEFAULT ''
);

-- Ordens de serviço
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id TEXT NOT NULL,
  asset_kind TEXT NOT NULL DEFAULT 'machine',
  type TEXT NOT NULL DEFAULT 'planned',
  status TEXT NOT NULL DEFAULT 'open',
  reopened BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  planned_hours NUMERIC NOT NULL DEFAULT 0,
  actual_hours NUMERIC,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- Paradas de ativos
CREATE TABLE public.asset_stop_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id TEXT NOT NULL,
  asset_kind TEXT NOT NULL DEFAULT 'machine',
  stopped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resumed_at TIMESTAMPTZ,
  reason TEXT DEFAULT 'other',
  description TEXT DEFAULT '',
  maintenance_type TEXT
);

-- Pedidos de compra
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  part_description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  supplier TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'searching_suppliers',
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Entradas de estoque
CREATE TABLE public.stock_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  invoice_number TEXT DEFAULT '',
  invoice_xml TEXT DEFAULT '',
  nfe_access_key TEXT DEFAULT '',
  entry_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT DEFAULT ''
);

-- Contagens de inventário
CREATE TABLE public.inventory_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  expected_quantity NUMERIC NOT NULL DEFAULT 0,
  counted_quantity NUMERIC NOT NULL DEFAULT 0,
  difference NUMERIC NOT NULL DEFAULT 0,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  counted_by TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT ''
);

-- Planos de lubrificação
CREATE TABLE public.lubrication_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id TEXT NOT NULL,
  asset_kind TEXT NOT NULL DEFAULT 'machine',
  asset_tag TEXT NOT NULL DEFAULT '',
  asset_name TEXT NOT NULL DEFAULT '',
  machine_type TEXT NOT NULL,
  line TEXT NOT NULL DEFAULT '',
  what_to_lubricate TEXT NOT NULL DEFAULT '',
  lubricant_type TEXT NOT NULL DEFAULT '',
  attention_points TEXT NOT NULL DEFAULT '',
  frequency_days INT NOT NULL DEFAULT 30,
  next_due_date TIMESTAMPTZ,
  last_execution_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Execuções de lubrificação
CREATE TABLE public.lubrication_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.lubrication_plans(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT DEFAULT '',
  previous_due_date TIMESTAMPTZ,
  next_due_date_after TIMESTAMPTZ,
  manually_adjusted BOOLEAN NOT NULL DEFAULT false
);

-- Regras de componentes
CREATE TABLE public.component_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  type TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  model TEXT DEFAULT '',
  apply_mode TEXT NOT NULL DEFAULT 'current',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- RLS: Habilitar em todas as tabelas
-- Permitir acesso total para usuários autenticados
-- =============================================

ALTER TABLE public.lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanic_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanic_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_parts_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_item_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_stop_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lubrication_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lubrication_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_rules ENABLE ROW LEVEL SECURITY;

-- Políticas: acesso total para autenticados (app interno de fábrica)
CREATE POLICY "auth_all" ON public.lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.machines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.components FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.parts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.mechanics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.mechanic_machines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.mechanic_components FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.ticket_parts_used FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.failures FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.maintenance_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.maintenance_plan_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.plan_executions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.plan_item_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.asset_stop_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.stock_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.inventory_counts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.lubrication_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.lubrication_executions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.component_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON public.machines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON public.components FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mechanics_updated_at BEFORE UPDATE ON public.mechanics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_plans_updated_at BEFORE UPDATE ON public.maintenance_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
