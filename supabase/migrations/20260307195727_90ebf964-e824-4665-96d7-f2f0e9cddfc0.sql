
-- =============================================
-- EXTRUSORA PREVENTIVO (6 planos × 12 itens)
-- =============================================

-- EXT-001 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo EXT-001', 'extrusora', 'preventive', ARRAY['588f65f8-ea54-4215-85d2-e6d16e2f7e2e']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor Compactador', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Painel Elétrico', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor do Motor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polias Movida e Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Fuso Compactador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Caixa de Transição Dupla', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Resistências Canhão', 'Multímetro', 60, 'manutencao', '', '');

-- EXT-002 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo EXT-002', 'extrusora', 'preventive', ARRAY['16e126ba-1480-441e-a2e8-50cd60227700']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor Compactador', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Painel Elétrico', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor do Motor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polias Movida e Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Fuso Compactador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Caixa de Transição Dupla', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Resistências Canhão', 'Multímetro', 60, 'manutencao', '', '');

-- EXT-003 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo EXT-003', 'extrusora', 'preventive', ARRAY['55988a7d-51bb-4b30-89b6-1b7725cb3409']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor Compactador', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Painel Elétrico', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor do Motor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polias Movida e Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Fuso Compactador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Caixa de Transição Dupla', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Resistências Canhão', 'Multímetro', 60, 'manutencao', '', '');

-- EXT-004 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo EXT-004', 'extrusora', 'preventive', ARRAY['b42d6d0e-af35-4082-ab59-92ff345adf92']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor Compactador', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Painel Elétrico', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor do Motor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polias Movida e Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Fuso Compactador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Caixa de Transição Dupla', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Resistências Canhão', 'Multímetro', 60, 'manutencao', '', '');

-- EXT-005 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo EXT-005', 'extrusora', 'preventive', ARRAY['7cd938b5-330f-4a7c-b8d5-482591f84a37']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor Compactador', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Painel Elétrico', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor do Motor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polias Movida e Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Fuso Compactador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Caixa de Transição Dupla', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Resistências Canhão', 'Multímetro', 60, 'manutencao', '', '');

-- EXT-006 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo EXT-006', 'extrusora', 'preventive', ARRAY['88be2a51-4974-4d3c-82ae-b10ae0f446bf']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor Compactador', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Painel Elétrico', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor do Motor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polias Movida e Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Fuso Compactador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Caixa de Transição Dupla', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Resistências Canhão', 'Multímetro', 60, 'manutencao', '', '');

-- =============================================
-- EXTRUSORA CHECKLIST DIÁRIO (6 planos × 3 itens)
-- =============================================

-- EXT-001 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário EXT-001', 'extrusora', 'checklist', ARRAY['588f65f8-ea54-4215-85d2-e6d16e2f7e2e']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensores de Nível', 'Visual / Funcional', 1, 'operador', '', '');

-- EXT-002 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário EXT-002', 'extrusora', 'checklist', ARRAY['16e126ba-1480-441e-a2e8-50cd60227700']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensores de Nível', 'Visual / Funcional', 1, 'operador', '', '');

-- EXT-003 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário EXT-003', 'extrusora', 'checklist', ARRAY['55988a7d-51bb-4b30-89b6-1b7725cb3409']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensores de Nível', 'Visual / Funcional', 1, 'operador', '', '');

-- EXT-004 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário EXT-004', 'extrusora', 'checklist', ARRAY['b42d6d0e-af35-4082-ab59-92ff345adf92']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensores de Nível', 'Visual / Funcional', 1, 'operador', '', '');

-- EXT-005 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário EXT-005', 'extrusora', 'checklist', ARRAY['7cd938b5-330f-4a7c-b8d5-482591f84a37']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensores de Nível', 'Visual / Funcional', 1, 'operador', '', '');

-- EXT-006 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário EXT-006', 'extrusora', 'checklist', ARRAY['88be2a51-4974-4d3c-82ae-b10ae0f446bf']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensores de Nível', 'Visual / Funcional', 1, 'operador', '', '');

-- =============================================
-- MISTURADOR PREVENTIVO (6 planos × 14 itens)
-- =============================================

-- MIST-001 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo MIST-001', 'misturador', 'preventive', ARRAY['b531bc11-d145-4d5f-a40d-f1ab44604602']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Hélices', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Amperímetro', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cálice Misturador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Êmbolo', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Movida', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 60, 'manutencao', '', '');

-- MIST-002 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo MIST-002', 'misturador', 'preventive', ARRAY['3b1ed744-7551-4732-b708-12975b8eb2d1']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Hélices', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Amperímetro', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cálice Misturador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Êmbolo', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Movida', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 60, 'manutencao', '', '');

-- MIST-003 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo MIST-003', 'misturador', 'preventive', ARRAY['bace2472-fc9c-47db-9b75-07c8c29b311a']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Hélices', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Amperímetro', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cálice Misturador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Êmbolo', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Movida', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 60, 'manutencao', '', '');

-- MIST-004 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo MIST-004', 'misturador', 'preventive', ARRAY['12e7eb93-1a39-481d-8662-cc4b14f8bf52']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Hélices', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Amperímetro', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cálice Misturador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Êmbolo', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Movida', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 60, 'manutencao', '', '');

-- MIST-005 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo MIST-005', 'misturador', 'preventive', ARRAY['d0c3cafc-e139-4e5e-a29b-6afbc66a20bb']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Hélices', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Amperímetro', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cálice Misturador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Êmbolo', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Movida', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 60, 'manutencao', '', '');

-- MIST-006 Preventivo
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Preventivo MIST-006', 'misturador', 'preventive', ARRAY['9366096c-8392-4423-95e7-c66124498b2c']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Hélices', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Amperímetro', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Correias', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Redutor', 'Visual / Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pirômetros / Termopar', 'Multímetro / Calibração', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cabeamento Painel', 'Visual', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inversor', 'Multímetro', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Cálice Misturador', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Êmbolo', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Movida', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Polia Motora', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Comandos / Relés Painel', 'Visual / Multímetro', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático', 'Visual', 60, 'manutencao', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 60, 'manutencao', '', '');

-- =============================================
-- MISTURADOR CHECKLIST DIÁRIO (6 planos × 12 itens)
-- =============================================

-- MIST-001 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário MIST-001', 'misturador', 'checklist', ARRAY['b531bc11-d145-4d5f-a40d-f1ab44604602']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Tampa Misturador', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensor da Tampa', 'Visual / Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (acionamento)', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (visual)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Dutos Ar Comprimido', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Engates', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Acionamento do Pistão', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Plataforma', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil de Carga (Moega)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pirômetros', 'Visual / Funcional', 1, 'operador', '', '');

-- MIST-002 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário MIST-002', 'misturador', 'checklist', ARRAY['3b1ed744-7551-4732-b708-12975b8eb2d1']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Tampa Misturador', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensor da Tampa', 'Visual / Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (acionamento)', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (visual)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Dutos Ar Comprimido', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Engates', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Acionamento do Pistão', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Plataforma', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil de Carga (Moega)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pirômetros', 'Visual / Funcional', 1, 'operador', '', '');

-- MIST-003 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário MIST-003', 'misturador', 'checklist', ARRAY['bace2472-fc9c-47db-9b75-07c8c29b311a']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Tampa Misturador', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensor da Tampa', 'Visual / Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (acionamento)', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (visual)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Dutos Ar Comprimido', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Engates', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Acionamento do Pistão', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Plataforma', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil de Carga (Moega)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pirômetros', 'Visual / Funcional', 1, 'operador', '', '');

-- MIST-004 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário MIST-004', 'misturador', 'checklist', ARRAY['12e7eb93-1a39-481d-8662-cc4b14f8bf52']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Tampa Misturador', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensor da Tampa', 'Visual / Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (acionamento)', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (visual)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Dutos Ar Comprimido', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Engates', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Acionamento do Pistão', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Plataforma', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil de Carga (Moega)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pirômetros', 'Visual / Funcional', 1, 'operador', '', '');

-- MIST-005 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário MIST-005', 'misturador', 'checklist', ARRAY['d0c3cafc-e139-4e5e-a29b-6afbc66a20bb']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Tampa Misturador', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensor da Tampa', 'Visual / Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (acionamento)', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (visual)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Dutos Ar Comprimido', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Engates', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Acionamento do Pistão', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Plataforma', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil de Carga (Moega)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pirômetros', 'Visual / Funcional', 1, 'operador', '', '');

-- MIST-006 Checklist
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Diário MIST-006', 'misturador', 'checklist', ARRAY['9366096c-8392-4423-95e7-c66124498b2c']::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Tampa Misturador', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Sensor da Tampa', 'Visual / Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (acionamento)', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pistão Pneumático (visual)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Dutos Ar Comprimido', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Engates', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Acionamento do Pistão', 'Funcional', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Borracha de Vedação', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Nível Óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Plataforma', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Funil de Carga (Moega)', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Pirômetros', 'Visual / Funcional', 1, 'operador', '', '');

-- =============================================
-- BOMBA DE VÁCUO — Checklist Genérico (1 plano × 10 itens)
-- =============================================
WITH plan AS (
  INSERT INTO maintenance_plans (name, machine_type, plan_type, machine_ids, active)
  VALUES ('Checklist Bomba de Vácuo', 'bomba_vacuo', 'checklist', '{}'::uuid[], true)
  RETURNING id
)
INSERT INTO maintenance_plan_items (plan_id, description, inspection_type, frequency_days, responsible, attention_points, observation) VALUES
((SELECT id FROM plan), 'Verificar nível e aparência do óleo', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Checar temperatura e ruído anormal', 'Visual / Auditivo', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Inspecionar mangueiras e conexões', 'Visual', 1, 'operador', '', ''),
((SELECT id FROM plan), 'Drenar condensado do reservatório', 'Operacional', 7, 'manutencao', '', ''),
((SELECT id FROM plan), 'Limpar filtros de linha', 'Visual / Limpeza', 7, 'manutencao', '', ''),
((SELECT id FROM plan), 'Registrar nível de vácuo', 'Medição', 7, 'manutencao', '', ''),
((SELECT id FROM plan), 'Trocar o óleo', 'Troca de fluido', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Inspecionar palhetas, rolamentos e vedação', 'Visual / Mecânico', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Limpar/substituir cartucho do filtro', 'Manutenção', 30, 'manutencao', '', ''),
((SELECT id FROM plan), 'Limpeza geral e verificação desgaseificação', 'Inspeção geral', 30, 'manutencao', '', '');
