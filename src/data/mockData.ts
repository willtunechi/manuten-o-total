import type { Machine, Mechanic, Part, Ticket, Failure, Notification, MachineComponent } from './types';

export const machines: Machine[] = [
  { id: 'm1', tag: 'EXT-001', type: 'extrusora', model: 'Dupla Rosca 90mm', manufacturer: 'Rulli Standard', year: 2018, sector: 'Linha 1', status: 'operating', horimeter: 12450, dailyChecklistTotal: 12, dailyChecklistCompleted: 4, preventiveOverdue: 1, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'm2', tag: 'EXT-002', type: 'extrusora', model: 'Dupla Rosca 65mm', manufacturer: 'Coperion', year: 2020, sector: 'Linha 2', status: 'maintenance', horimeter: 8320, dailyChecklistTotal: 10, dailyChecklistCompleted: 0, preventiveOverdue: 2, preventiveUpcoming: 1, correctivePending: 2 },
  { id: 'm3', tag: 'EXT-003', type: 'extrusora', model: 'Dupla Rosca 120mm', manufacturer: 'Battenfeld', year: 2015, sector: 'Linha 3', status: 'stopped', horimeter: 22100, dailyChecklistTotal: 8, dailyChecklistCompleted: 8, preventiveOverdue: 0, preventiveUpcoming: 2, correctivePending: 1 },
  { id: 'm4', tag: 'EXT-004', type: 'extrusora', model: 'Dupla Rosca 60mm', manufacturer: 'Battenfeld', year: 2022, sector: 'Linha 4', status: 'scheduled', horimeter: 3100, dailyChecklistTotal: 15, dailyChecklistCompleted: 5, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'm5', tag: 'EXT-005', type: 'extrusora', model: 'Dupla Rosca 80mm', manufacturer: 'Coperion', year: 2021, sector: 'Linha 5', status: 'operating', horimeter: 6500, dailyChecklistTotal: 12, dailyChecklistCompleted: 12, preventiveOverdue: 0, preventiveUpcoming: 3, correctivePending: 0 },
  { id: 'm6', tag: 'EXT-006', type: 'extrusora', model: 'Dupla Rosca 100mm', manufacturer: 'Rulli Standard', year: 2019, sector: 'Linha 6', status: 'operating', horimeter: 9800, dailyChecklistTotal: 10, dailyChecklistCompleted: 2, preventiveOverdue: 1, preventiveUpcoming: 1, correctivePending: 3 },
  { id: 'm7', tag: 'MIST-001', type: 'misturador', model: 'Dupla Rosca Intensivo 500L', manufacturer: 'Rulli Standard', year: 2021, sector: 'Linha 1', status: 'operating', horimeter: 5200, dailyChecklistTotal: 8, dailyChecklistCompleted: 1, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'm8', tag: 'MIST-002', type: 'misturador', model: 'Dupla Rosca Horizontal 300L', manufacturer: 'KraussMaffei', year: 2019, sector: 'Linha 2', status: 'waiting', horimeter: 15780, dailyChecklistTotal: 14, dailyChecklistCompleted: 0, preventiveOverdue: 3, preventiveUpcoming: 2, correctivePending: 1 },
  { id: 'm9', tag: 'MIST-003', type: 'misturador', model: 'Dupla Rosca Vertical 400L', manufacturer: 'Rulli Standard', year: 2020, sector: 'Linha 3', status: 'operating', horimeter: 8900, dailyChecklistTotal: 12, dailyChecklistCompleted: 10, preventiveOverdue: 0, preventiveUpcoming: 1, correctivePending: 0 },
  { id: 'm10', tag: 'MIST-004', type: 'misturador', model: 'Dupla Rosca Intensivo 600L', manufacturer: 'KraussMaffei', year: 2022, sector: 'Linha 4', status: 'scheduled', horimeter: 2100, dailyChecklistTotal: 10, dailyChecklistCompleted: 10, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'm11', tag: 'MIST-005', type: 'misturador', model: 'Dupla Rosca Horizontal 350L', manufacturer: 'Battenfeld', year: 2018, sector: 'Linha 5', status: 'maintenance', horimeter: 12300, dailyChecklistTotal: 12, dailyChecklistCompleted: 3, preventiveOverdue: 2, preventiveUpcoming: 0, correctivePending: 4 },
  { id: 'm12', tag: 'MIST-006', type: 'misturador', model: 'Dupla Rosca Vertical 450L', manufacturer: 'Rulli Standard', year: 2021, sector: 'Linha 6', status: 'operating', horimeter: 7200, dailyChecklistTotal: 8, dailyChecklistCompleted: 4, preventiveOverdue: 0, preventiveUpcoming: 2, correctivePending: 0 },
];

export const components: MachineComponent[] = [
  // Componentes apenas para Extrusora (Misturador não tem componentes inicialmente)
  { id: 'c1', name: 'Trocador de Calor 1', tag: 'TR-001', type: 'trocador_calor', machineType: 'trocador_calor', status: 'operating', model: 'TC-2000', sector: 'Linha 1', dailyChecklistTotal: 5, dailyChecklistCompleted: 5, preventiveOverdue: 0, preventiveUpcoming: 1, correctivePending: 0 },
  { id: 'c2', name: 'Trocador de Calor 2', tag: 'TR-002', type: 'trocador_calor', machineType: 'trocador_calor', status: 'maintenance', model: 'TC-2500', sector: 'Linha 2', dailyChecklistTotal: 5, dailyChecklistCompleted: 0, preventiveOverdue: 2, preventiveUpcoming: 0, correctivePending: 1 },
  { id: 'c3', name: 'Trocador de Calor 3', tag: 'TR-003', type: 'trocador_calor', machineType: 'trocador_calor', status: 'operating', model: 'TC-2000', sector: 'Linha 3', dailyChecklistTotal: 5, dailyChecklistCompleted: 2, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'c4', name: 'Trocador de Calor 4', tag: 'TR-004', type: 'trocador_calor', machineType: 'trocador_calor', status: 'waiting', model: 'TC-3000', sector: 'Linha 4', dailyChecklistTotal: 6, dailyChecklistCompleted: 0, preventiveOverdue: 1, preventiveUpcoming: 1, correctivePending: 2 },
  { id: 'c5', name: 'Trocador de Calor 5', tag: 'TR-005', type: 'trocador_calor', machineType: 'trocador_calor', status: 'operating', model: 'TC-2500', sector: 'Linha 5', dailyChecklistTotal: 5, dailyChecklistCompleted: 5, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'c6', name: 'Trocador de Calor 6', tag: 'TR-006', type: 'trocador_calor', machineType: 'trocador_calor', status: 'operating', model: 'TC-3000', sector: 'Linha 6', dailyChecklistTotal: 6, dailyChecklistCompleted: 1, preventiveOverdue: 0, preventiveUpcoming: 2, correctivePending: 0 },

  { id: 'c7', name: 'Bomba de Vácuo 1', tag: 'BV-001', type: 'bomba_vacuo', machineType: 'bomba_vacuo', status: 'operating', model: 'BV-500', sector: 'Linha 1', dailyChecklistTotal: 3, dailyChecklistCompleted: 3, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'c8', name: 'Bomba de Vácuo 2', tag: 'BV-002', type: 'bomba_vacuo', machineType: 'bomba_vacuo', status: 'stopped', model: 'BV-500', sector: 'Linha 2', dailyChecklistTotal: 3, dailyChecklistCompleted: 0, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'c9', name: 'Bomba de Vácuo 3', tag: 'BV-003', type: 'bomba_vacuo', machineType: 'bomba_vacuo', status: 'operating', model: 'BV-600', sector: 'Linha 3', dailyChecklistTotal: 3, dailyChecklistCompleted: 1, preventiveOverdue: 0, preventiveUpcoming: 1, correctivePending: 0 },
  { id: 'c10', name: 'Bomba de Vácuo 4', tag: 'BV-004', type: 'bomba_vacuo', machineType: 'bomba_vacuo', status: 'maintenance', model: 'BV-700', sector: 'Linha 4', dailyChecklistTotal: 4, dailyChecklistCompleted: 0, preventiveOverdue: 1, preventiveUpcoming: 0, correctivePending: 1 },
  { id: 'c11', name: 'Bomba de Vácuo 5', tag: 'BV-005', type: 'bomba_vacuo', machineType: 'bomba_vacuo', status: 'operating', model: 'BV-600', sector: 'Linha 5', dailyChecklistTotal: 3, dailyChecklistCompleted: 3, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'c12', name: 'Bomba de Vácuo 6', tag: 'BV-006', type: 'bomba_vacuo', machineType: 'bomba_vacuo', status: 'operating', model: 'BV-700', sector: 'Linha 6', dailyChecklistTotal: 4, dailyChecklistCompleted: 2, preventiveOverdue: 0, preventiveUpcoming: 1, correctivePending: 0 },

  { id: 'c13', name: 'Gala 1', tag: 'GL-001', type: 'tanque_agua', machineType: 'tanque_agua', status: 'operating', model: 'GL-5000', sector: 'Linha 1', dailyChecklistTotal: 2, dailyChecklistCompleted: 2, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'c14', name: 'Gala 2', tag: 'GL-002', type: 'tanque_agua', machineType: 'tanque_agua', status: 'operating', model: 'GL-5000', sector: 'Linha 2', dailyChecklistTotal: 2, dailyChecklistCompleted: 0, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'c15', name: 'Gala 3', tag: 'GL-003', type: 'tanque_agua', machineType: 'tanque_agua', status: 'operating', model: 'GL-5000', sector: 'Linha 3', dailyChecklistTotal: 2, dailyChecklistCompleted: 1, preventiveOverdue: 0, preventiveUpcoming: 1, correctivePending: 0 },
  { id: 'c16', name: 'Gala 4', tag: 'GL-004', type: 'tanque_agua', machineType: 'tanque_agua', status: 'scheduled', model: 'GL-7000', sector: 'Linha 4', dailyChecklistTotal: 3, dailyChecklistCompleted: 0, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'c17', name: 'Gala 5', tag: 'GL-005', type: 'tanque_agua', machineType: 'tanque_agua', status: 'operating', model: 'GL-5000', sector: 'Linha 5', dailyChecklistTotal: 2, dailyChecklistCompleted: 2, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
  { id: 'c18', name: 'Gala 6', tag: 'GL-006', type: 'tanque_agua', machineType: 'tanque_agua', status: 'operating', model: 'GL-7000', sector: 'Linha 6', dailyChecklistTotal: 3, dailyChecklistCompleted: 3, preventiveOverdue: 0, preventiveUpcoming: 0, correctivePending: 0 },
];

export const mechanics: Mechanic[] = [];
export const parts: Part[] = [
  { id: 'p1', name: 'Rosca Principal 90mm', code: 'RSC-90-001', category: 'mechanical', stock: 2, minStock: 1, location: 'A-12', cost: 15000 },
  { id: 'p2', name: 'Cilindro Bimetálico', code: 'CIL-BIM-001', category: 'mechanical', stock: 1, minStock: 1, location: 'A-13', cost: 25000 },
  { id: 'p3', name: 'Redutor SEW 75cv', code: 'RED-SEW-75', category: 'mechanical', stock: 0, minStock: 1, location: 'B-05', cost: 35000 },
];

export const tickets: Ticket[] = [
  {
    id: 't1', code: 1, machineId: 'm1', type: 'corrective', symptom: 'Ruído metálico', title: 'Máquina fazendo barulho anormal', description: 'Ruído metálico vindo do redutor',
    priority: 'high', status: 'pending', reportedBy: 'Operador João', createdAt: '2024-01-15T07:30:00Z',
  },
  {
    id: 't2', code: 2, machineId: 'm3', type: 'corrective', symptom: 'Temperatura alta', title: 'Temperatura elevada', description: 'Zona 3 atingindo 280°C',
    priority: 'critical', status: 'pending', reportedBy: 'Operador Maria', createdAt: '2024-01-15T09:00:00Z',
  },
];

export const failures: Failure[] = [
  {
    id: 'f1', machineId: 'm1', componentId: 'c1', title: 'Quebra de Rosca', description: 'Rosca quebrou durante operação',
    occurredAt: '2024-01-10T14:30:00Z', downtime: 480, rootCause: 'Desgaste por uso prolongado', solution: 'Substituição da rosca',
  },
];

export const notifications: Notification[] = [
  {
    id: 'n1', type: 'alert', title: 'Estoque Baixo', message: 'Redutor SEW 75cv está em falta no estoque',
    createdAt: '2024-01-15T08:00:00Z', read: false,
  },
  {
    id: 'n2', type: 'info', title: 'Manutenção Agendada', message: 'Manutenção preventiva da EXT-002 agendada para 20/01',
    createdAt: '2024-01-15T09:00:00Z', read: true,
  },
];
