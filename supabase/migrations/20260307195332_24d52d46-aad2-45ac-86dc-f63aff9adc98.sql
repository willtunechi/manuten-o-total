
-- Insert 12 machines
INSERT INTO machines (tag, type, model, manufacturer, year, sector, status, horimeter) VALUES
('EXT-001', 'extrusora', 'Dupla Rosca 90mm', 'Rulli Standard', 2018, 'Linha 1', 'operating', 0),
('EXT-002', 'extrusora', 'Dupla Rosca 65mm', 'Coperion', 2020, 'Linha 2', 'operating', 0),
('EXT-003', 'extrusora', 'Dupla Rosca 120mm', 'Battenfeld', 2015, 'Linha 3', 'operating', 0),
('EXT-004', 'extrusora', 'Dupla Rosca 60mm', 'Battenfeld', 2022, 'Linha 4', 'operating', 0),
('EXT-005', 'extrusora', 'Dupla Rosca 80mm', 'Coperion', 2021, 'Linha 5', 'operating', 0),
('EXT-006', 'extrusora', 'Dupla Rosca 100mm', 'Rulli Standard', 2019, 'Linha 6', 'operating', 0),
('MIST-001', 'misturador', 'Dupla Rosca Intensivo 500L', 'Rulli Standard', 2021, 'Linha 1', 'operating', 0),
('MIST-002', 'misturador', 'Dupla Rosca Horizontal 300L', 'KraussMaffei', 2019, 'Linha 2', 'operating', 0),
('MIST-003', 'misturador', 'Dupla Rosca Vertical 400L', 'Rulli Standard', 2020, 'Linha 3', 'operating', 0),
('MIST-004', 'misturador', 'Dupla Rosca Intensivo 600L', 'KraussMaffei', 2022, 'Linha 4', 'operating', 0),
('MIST-005', 'misturador', 'Dupla Rosca Horizontal 350L', 'Battenfeld', 2018, 'Linha 5', 'operating', 0),
('MIST-006', 'misturador', 'Dupla Rosca Vertical 450L', 'Rulli Standard', 2021, 'Linha 6', 'operating', 0);

-- Insert 18 components
INSERT INTO components (tag, type, name, model, sector, machine_type, status) VALUES
('TR-001', 'trocador_calor', 'Trocador de Calor TR-001', 'TC-2000', 'Linha 1', 'extrusora', 'operating'),
('TR-002', 'trocador_calor', 'Trocador de Calor TR-002', 'TC-2500', 'Linha 2', 'extrusora', 'operating'),
('TR-003', 'trocador_calor', 'Trocador de Calor TR-003', 'TC-2000', 'Linha 3', 'extrusora', 'operating'),
('TR-004', 'trocador_calor', 'Trocador de Calor TR-004', 'TC-3000', 'Linha 4', 'extrusora', 'operating'),
('TR-005', 'trocador_calor', 'Trocador de Calor TR-005', 'TC-2500', 'Linha 5', 'extrusora', 'operating'),
('TR-006', 'trocador_calor', 'Trocador de Calor TR-006', 'TC-3000', 'Linha 6', 'extrusora', 'operating'),
('BV-001', 'bomba_vacuo', 'Bomba de Vácuo BV-001', 'BV-500', 'Linha 1', 'extrusora', 'operating'),
('BV-002', 'bomba_vacuo', 'Bomba de Vácuo BV-002', 'BV-500', 'Linha 2', 'extrusora', 'operating'),
('BV-003', 'bomba_vacuo', 'Bomba de Vácuo BV-003', 'BV-600', 'Linha 3', 'extrusora', 'operating'),
('BV-004', 'bomba_vacuo', 'Bomba de Vácuo BV-004', 'BV-700', 'Linha 4', 'extrusora', 'operating'),
('BV-005', 'bomba_vacuo', 'Bomba de Vácuo BV-005', 'BV-600', 'Linha 5', 'extrusora', 'operating'),
('BV-006', 'bomba_vacuo', 'Bomba de Vácuo BV-006', 'BV-700', 'Linha 6', 'extrusora', 'operating'),
('GL-001', 'tanque_agua', 'Gala GL-001', 'GL-5000', 'Linha 1', 'extrusora', 'operating'),
('GL-002', 'tanque_agua', 'Gala GL-002', 'GL-5000', 'Linha 2', 'extrusora', 'operating'),
('GL-003', 'tanque_agua', 'Gala GL-003', 'GL-5000', 'Linha 3', 'extrusora', 'operating'),
('GL-004', 'tanque_agua', 'Gala GL-004', 'GL-7000', 'Linha 4', 'extrusora', 'operating'),
('GL-005', 'tanque_agua', 'Gala GL-005', 'GL-5000', 'Linha 5', 'extrusora', 'operating'),
('GL-006', 'tanque_agua', 'Gala GL-006', 'GL-7000', 'Linha 6', 'extrusora', 'operating');
