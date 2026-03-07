import type { MaintenancePlan } from './types';

// Items base para Extrusora - Preventivo
const extrusoraPreventiveItems = (prefix: string) => [
  { id: `${prefix}mpi1`, description: 'Redutor', inspectionType: 'Visual / Multímetro', attentionPoints: 'Nível de óleo, ruídos anormais, vibração, temperatura', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi2`, description: 'Pirômetros / Termopar', inspectionType: 'Multímetro / Calibração', attentionPoints: 'Leitura precisa, conexões, cabos', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi3`, description: 'Redutor Compactador', inspectionType: 'Visual / Multímetro', attentionPoints: 'Nível de óleo, ruídos, vibração', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi4`, description: 'Painel Elétrico', inspectionType: 'Visual / Multímetro', attentionPoints: 'Aquecimento, conexões soltas, sujeira', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi5`, description: 'Inversor do Motor', inspectionType: 'Multímetro', attentionPoints: 'Temperatura, alarmes, ventilação', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi6`, description: 'Cabeamento Painel', inspectionType: 'Visual', attentionPoints: 'Isolamento, organização, identificação', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi7`, description: 'Comandos / Relés Painel', inspectionType: 'Visual / Multímetro', attentionPoints: 'Funcionamento, aquecimento, desgaste', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi8`, description: 'Correias', inspectionType: 'Visual', attentionPoints: 'Desgaste, trincas, tensão', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi9`, description: 'Polias Movida e Motora', inspectionType: 'Visual', attentionPoints: 'Desgaste dos canais, alinhamento', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi10`, description: 'Fuso Compactador', inspectionType: 'Visual', attentionPoints: 'Desgaste, folgas, alinhamento', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi11`, description: 'Caixa de Transição Dupla', inspectionType: 'Visual', attentionPoints: 'Desgaste, vedação, temperatura', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi12`, description: 'Resistências Canhão', inspectionType: 'Multímetro', attentionPoints: 'Continuidade, isolação, fixação', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
];

// Items base para Extrusora - Checklist
const extrusoraChecklistItems = (prefix: string) => [
  { id: `${prefix}mpi27`, description: 'Nível Óleo', inspectionType: 'Visual', attentionPoints: 'Nível adequado, vazamentos', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi28`, description: 'Funil', inspectionType: 'Visual', attentionPoints: 'Obstruções, limpeza, fixação', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi29`, description: 'Sensores de Nível', inspectionType: 'Visual / Funcional', attentionPoints: 'Funcionamento correto, limpeza', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
];

// Items base para Misturador - Preventivo
const misturadorPreventiveItems = (prefix: string) => [
  { id: `${prefix}mpi13`, description: 'Hélices', inspectionType: 'Visual', attentionPoints: 'Desgaste, trincas, fixação', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi14`, description: 'Amperímetro', inspectionType: 'Multímetro', attentionPoints: 'Leitura precisa, calibração', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi15`, description: 'Correias', inspectionType: 'Visual', attentionPoints: 'Desgaste, trincas, tensão', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi16`, description: 'Redutor', inspectionType: 'Visual / Multímetro', attentionPoints: 'Nível de óleo, ruídos, vibração, temperatura', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi17`, description: 'Pirômetros / Termopar', inspectionType: 'Multímetro / Calibração', attentionPoints: 'Leitura precisa, conexões', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi18`, description: 'Cabeamento Painel', inspectionType: 'Visual', attentionPoints: 'Isolamento, organização', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi19`, description: 'Inversor', inspectionType: 'Multímetro', attentionPoints: 'Temperatura, alarmes, ventilação', frequencyDays: 30, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi20`, description: 'Cálice Misturador', inspectionType: 'Visual', attentionPoints: 'Desgaste interno, trincas', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi21`, description: 'Êmbolo', inspectionType: 'Visual', attentionPoints: 'Desgaste, vedação', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi22`, description: 'Polia Movida', inspectionType: 'Visual', attentionPoints: 'Desgaste canais, alinhamento', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi23`, description: 'Polia Motora', inspectionType: 'Visual', attentionPoints: 'Desgaste canais, alinhamento', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi24`, description: 'Comandos / Relés Painel', inspectionType: 'Visual / Multímetro', attentionPoints: 'Funcionamento, aquecimento', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi25`, description: 'Pistão Pneumático', inspectionType: 'Visual', attentionPoints: 'Vedação, curso, velocidade', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi26`, description: 'Borracha de Vedação', inspectionType: 'Visual', attentionPoints: 'Desgaste, ressecamento', frequencyDays: 60, observation: '', responsible: 'manutencao' as const },
];

// Items base para Misturador - Checklist
const misturadorChecklistItems = (prefix: string) => [
  { id: `${prefix}mpi30`, description: 'Tampa Misturador', inspectionType: 'Visual', attentionPoints: 'Vedação, fixação, desgaste', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi31`, description: 'Sensor da Tampa', inspectionType: 'Visual / Funcional', attentionPoints: 'Funcionamento, posicionamento', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi32`, description: 'Pistão Pneumático (acionamento)', inspectionType: 'Funcional', attentionPoints: 'Acionamento correto, velocidade', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi33`, description: 'Pistão Pneumático (visual)', inspectionType: 'Visual', attentionPoints: 'Vazamentos, haste, fixação', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi34`, description: 'Dutos Ar Comprimido', inspectionType: 'Visual', attentionPoints: 'Vazamentos, conexões, pressão', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi35`, description: 'Engates', inspectionType: 'Visual', attentionPoints: 'Fixação, vazamentos, desgaste', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi36`, description: 'Acionamento do Pistão', inspectionType: 'Funcional', attentionPoints: 'Resposta, velocidade, pressão', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi37`, description: 'Borracha de Vedação', inspectionType: 'Visual', attentionPoints: 'Desgaste, ressecamento', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi38`, description: 'Nível Óleo', inspectionType: 'Visual', attentionPoints: 'Nível adequado, vazamentos', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi39`, description: 'Plataforma', inspectionType: 'Visual', attentionPoints: 'Limpeza, segurança, fixação', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi40`, description: 'Funil de Carga (Moega)', inspectionType: 'Visual', attentionPoints: 'Obstruções, limpeza, fixação', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
  { id: `${prefix}mpi41`, description: 'Pirômetros', inspectionType: 'Visual / Funcional', attentionPoints: 'Leitura correta, conexões', frequencyDays: 1, observation: '', responsible: 'manutencao' as const },
];

export const maintenancePlans: MaintenancePlan[] = [
  // ---- EXTRUSORAS ----
  { id: 'mp-m1-prev', name: 'Plano Preventivo EXT-001', machineType: 'extrusora', machineId: 'm1', machineIds: ['m1'], planType: 'preventive', active: true, items: extrusoraPreventiveItems('m1_') },
  { id: 'mp-m1-chk',  name: 'Checklist Diário EXT-001', machineType: 'extrusora', machineId: 'm1', machineIds: ['m1'], planType: 'checklist',  active: true, items: extrusoraChecklistItems('m1_') },
  { id: 'mp-m2-prev', name: 'Plano Preventivo EXT-002', machineType: 'extrusora', machineId: 'm2', machineIds: ['m2'], planType: 'preventive', active: true, items: extrusoraPreventiveItems('m2_') },
  { id: 'mp-m2-chk',  name: 'Checklist Diário EXT-002', machineType: 'extrusora', machineId: 'm2', machineIds: ['m2'], planType: 'checklist',  active: true, items: extrusoraChecklistItems('m2_') },
  { id: 'mp-m3-prev', name: 'Plano Preventivo EXT-003', machineType: 'extrusora', machineId: 'm3', machineIds: ['m3'], planType: 'preventive', active: true, items: extrusoraPreventiveItems('m3_') },
  { id: 'mp-m3-chk',  name: 'Checklist Diário EXT-003', machineType: 'extrusora', machineId: 'm3', machineIds: ['m3'], planType: 'checklist',  active: true, items: extrusoraChecklistItems('m3_') },
  { id: 'mp-m4-prev', name: 'Plano Preventivo EXT-004', machineType: 'extrusora', machineId: 'm4', machineIds: ['m4'], planType: 'preventive', active: true, items: extrusoraPreventiveItems('m4_') },
  { id: 'mp-m4-chk',  name: 'Checklist Diário EXT-004', machineType: 'extrusora', machineId: 'm4', machineIds: ['m4'], planType: 'checklist',  active: true, items: extrusoraChecklistItems('m4_') },
  { id: 'mp-m5-prev', name: 'Plano Preventivo EXT-005', machineType: 'extrusora', machineId: 'm5', machineIds: ['m5'], planType: 'preventive', active: true, items: extrusoraPreventiveItems('m5_') },
  { id: 'mp-m5-chk',  name: 'Checklist Diário EXT-005', machineType: 'extrusora', machineId: 'm5', machineIds: ['m5'], planType: 'checklist',  active: true, items: extrusoraChecklistItems('m5_') },
  { id: 'mp-m6-prev', name: 'Plano Preventivo EXT-006', machineType: 'extrusora', machineId: 'm6', machineIds: ['m6'], planType: 'preventive', active: true, items: extrusoraPreventiveItems('m6_') },
  { id: 'mp-m6-chk',  name: 'Checklist Diário EXT-006', machineType: 'extrusora', machineId: 'm6', machineIds: ['m6'], planType: 'checklist',  active: true, items: extrusoraChecklistItems('m6_') },

  // ---- MISTURADORES ----
  { id: 'mp-m7-prev',  name: 'Plano Preventivo MIST-001', machineType: 'misturador', machineId: 'm7',  machineIds: ['m7'],  planType: 'preventive', active: true, items: misturadorPreventiveItems('m7_') },
  { id: 'mp-m7-chk',   name: 'Checklist Diário MIST-001', machineType: 'misturador', machineId: 'm7',  machineIds: ['m7'],  planType: 'checklist',  active: true, items: misturadorChecklistItems('m7_') },
  { id: 'mp-m8-prev',  name: 'Plano Preventivo MIST-002', machineType: 'misturador', machineId: 'm8',  machineIds: ['m8'],  planType: 'preventive', active: true, items: misturadorPreventiveItems('m8_') },
  { id: 'mp-m8-chk',   name: 'Checklist Diário MIST-002', machineType: 'misturador', machineId: 'm8',  machineIds: ['m8'],  planType: 'checklist',  active: true, items: misturadorChecklistItems('m8_') },
  { id: 'mp-m9-prev',  name: 'Plano Preventivo MIST-003', machineType: 'misturador', machineId: 'm9',  machineIds: ['m9'],  planType: 'preventive', active: true, items: misturadorPreventiveItems('m9_') },
  { id: 'mp-m9-chk',   name: 'Checklist Diário MIST-003', machineType: 'misturador', machineId: 'm9',  machineIds: ['m9'],  planType: 'checklist',  active: true, items: misturadorChecklistItems('m9_') },
  { id: 'mp-m10-prev', name: 'Plano Preventivo MIST-004', machineType: 'misturador', machineId: 'm10', machineIds: ['m10'], planType: 'preventive', active: true, items: misturadorPreventiveItems('m10_') },
  { id: 'mp-m10-chk',  name: 'Checklist Diário MIST-004', machineType: 'misturador', machineId: 'm10', machineIds: ['m10'], planType: 'checklist',  active: true, items: misturadorChecklistItems('m10_') },
  { id: 'mp-m11-prev', name: 'Plano Preventivo MIST-005', machineType: 'misturador', machineId: 'm11', machineIds: ['m11'], planType: 'preventive', active: true, items: misturadorPreventiveItems('m11_') },
  { id: 'mp-m11-chk',  name: 'Checklist Diário MIST-005', machineType: 'misturador', machineId: 'm11', machineIds: ['m11'], planType: 'checklist',  active: true, items: misturadorChecklistItems('m11_') },
  { id: 'mp-m12-prev', name: 'Plano Preventivo MIST-006', machineType: 'misturador', machineId: 'm12', machineIds: ['m12'], planType: 'preventive', active: true, items: misturadorPreventiveItems('m12_') },
  { id: 'mp-m12-chk',  name: 'Checklist Diário MIST-006', machineType: 'misturador', machineId: 'm12', machineIds: ['m12'], planType: 'checklist',  active: true, items: misturadorChecklistItems('m12_') },

  // ---- BOMBA DE VÁCUO (genérico por tipo) ----
  {
    id: 'mp5',
    name: 'Checklist Bomba de Vácuo',
    machineType: 'bomba_vacuo',
    planType: 'checklist',
    active: true,
    items: [
      { id: 'mpi42', description: 'Verificar nível e aparência do óleo (sem espuma ou leiteamento)', inspectionType: 'Visual', attentionPoints: 'Óleo limpo, nível correto, sem contaminação visível', frequencyDays: 1, observation: '', responsible: 'operador' },
      { id: 'mpi43', description: 'Checar temperatura e ruído anormal da bomba', inspectionType: 'Visual / Auditivo', attentionPoints: 'Temperatura e ruído dentro dos padrões normais', frequencyDays: 1, observation: '', responsible: 'operador' },
      { id: 'mpi44', description: 'Inspecionar mangueiras e conexões quanto a vazamentos de ar', inspectionType: 'Visual', attentionPoints: 'Sem vazamentos, mangueiras firmes e conexões vedadas', frequencyDays: 1, observation: '', responsible: 'operador' },
      { id: 'mpi45', description: 'Drenar condensado do reservatório (se bomba de anel líquido)', inspectionType: 'Operacional', attentionPoints: 'Condensado drenado completamente', frequencyDays: 7, observation: '', responsible: 'manutencao' },
      { id: 'mpi46', description: 'Limpar filtros de linha e separador de partículas', inspectionType: 'Visual / Limpeza', attentionPoints: 'Filtros limpos e fluxo de vácuo livre', frequencyDays: 7, observation: '', responsible: 'manutencao' },
      { id: 'mpi47', description: 'Registrar nível de vácuo e comparar com o padrão de operação', inspectionType: 'Medição', attentionPoints: 'Nível de vácuo >= -0,8 bar (ajustar conforme processo)', frequencyDays: 7, observation: '', responsible: 'manutencao' },
      { id: 'mpi48', description: 'Trocar o óleo conforme recomendação do fabricante', inspectionType: 'Troca de fluido', attentionPoints: 'Óleo novo e limpo após troca', frequencyDays: 30, observation: '', responsible: 'manutencao' },
      { id: 'mpi49', description: 'Inspecionar palhetas, rolamentos e vedação', inspectionType: 'Visual / Mecânico', attentionPoints: 'Componentes sem desgaste excessivo', frequencyDays: 30, observation: '', responsible: 'manutencao' },
      { id: 'mpi50', description: 'Limpar ou substituir cartucho do filtro de vácuo', inspectionType: 'Manutenção', attentionPoints: 'Filtro limpo e sem obstruções', frequencyDays: 30, observation: '', responsible: 'manutencao' },
      { id: 'mpi51', description: 'Limpeza geral da bomba e verificação do sistema de desgaseificação', inspectionType: 'Inspeção geral', attentionPoints: 'Bomba limpa, conexões firmes e operação estável', frequencyDays: 30, observation: '', responsible: 'manutencao' },
    ],
  },
];
