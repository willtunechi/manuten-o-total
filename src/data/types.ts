export type MachineType = 'extrusora' | 'misturador' | 'bomba_vacuo' | 'trocador_calor' | 'tanque_agua';
export type MachineStatus = 'operating' | 'stopped' | 'maintenance' | 'waiting' | 'scheduled';
export type ComponentType = 'trocador_calor' | 'bomba_vacuo' | 'tanque_agua';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type OSType = 'corrective' | 'inspection';
export type TicketStatus = 'pending' | 'in_maintenance' | 'resolved';
export type UserRole = 'admin' | 'mechanic' | 'operator' | 'planejador' | 'supervisor_manutencao' | 'supervisor_operacoes';
export type AssetKind = 'machine' | 'component';
export type WorkOrderType = 'planned' | 'unplanned';
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed';
export type ComponentScope = 'single_machine' | 'all_of_type';
export type ComponentApplyMode = 'current' | 'current_and_future';

export interface Machine {
  id: string;
  tag: string;
  type: MachineType;
  model: string;
  manufacturer: string;
  year: number;
  sector: string;
  status: MachineStatus;
  horimeter: number;
  photoUrl?: string;
  dailyChecklistTotal?: number;
  dailyChecklistCompleted?: number;
  preventiveOverdue?: number;
  preventiveUpcoming?: number;
  correctivePending?: number;
}

export interface MachineComponent {
  id: string;
  name: string;
  tag: string;
  type: ComponentType;
  machineType: MachineType;
  machineId?: string;
  ruleId?: string;
  status: MachineStatus;
  model?: string;
  sector?: string;
  photoUrl?: string;
  dailyChecklistTotal?: number;
  dailyChecklistCompleted?: number;
  preventiveOverdue?: number;
  preventiveUpcoming?: number;
  correctivePending?: number;
}

export interface Line {
  id: string;
  name: string;
  active: boolean;
  isSystem?: boolean;
}

export interface ComponentRule {
  id: string;
  name: string;
  tag: string;
  type: ComponentType;
  machineType: MachineType;
  model?: string;
  applyMode: ComponentApplyMode;
  createdAt: string;
}

export interface LubricationPlan {
  id: string;
  assetId: string;
  assetKind: AssetKind;
  assetTag: string;
  assetName: string;
  machineType: MachineType;
  line: string;
  whatToLubricate: string;
  lubricantType: string;
  attentionPoints: string;
  frequencyDays: number;
  nextDueDate: string;
  lastExecutionAt?: string;
  active: boolean;
  photoUrl?: string;
}

export interface LubricationExecution {
  id: string;
  planId: string;
  executedAt: string;
  notes?: string;
  previousDueDate: string;
  nextDueDateAfterExecution: string;
  manuallyAdjusted: boolean;
  actualHours?: number;
}

export interface Mechanic {
  id: string;
  name: string;
  email?: string;
  role: 'mechanic' | 'operator' | 'planejador' | 'supervisor_manutencao' | 'supervisor_operacoes';
  shift: string;
  level: 'junior' | 'mid' | 'senior';
  available: boolean;
  machineIds?: string[];
  componentIds?: string[];
  canExecuteChecklist?: boolean;
  canExecutePreventive?: boolean;
  hourlyCost?: number;
  assignedTo?: string; // Compatibility
}

export interface Ticket {
  id: string;
  code: number;
  machineId: string;
  type: OSType;
  maintenanceType?: 'mechanical' | 'electrical';
  symptom: string;
  priority: Priority;
  createdBy?: string;
  reportedBy?: string; // Compatibility
  createdAt: string;
  resolvedAt?: string;
  status: TicketStatus;
  comment?: string;
  photoUrl?: string;
  resolutionPhotoUrl?: string;
  partsUsed?: { partId: string; quantity: number }[];
  actualHours?: number;
  title?: string; // Compatibility
  description?: string; // Compatibility
}

export interface PartUsage {
  partId: string;
  quantity: number;
}

export interface Part {
  id: string;
  sku?: string;
  code?: string; // Compatibility
  description?: string;
  name?: string; // Compatibility
  category?: string; // Compatibility
  unit?: string;
  location: string;
  quantity?: number;
  stock?: number; // Compatibility
  minStock: number;
  supplier?: string;
  unitCost?: number;
  cost?: number; // Compatibility
  photoUrl?: string;
}

export interface StockMovement {
  id: string;
  partId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
}

export interface MaintenancePlanItem {
  id: string;
  description: string;
  inspectionType: string;
  attentionPoints: string;
  frequencyDays: number;
  observation: string;
  responsible: 'operador' | 'manutencao';
}

export interface MaintenancePlan {
  id: string;
  name: string;
  machineType: MachineType;
  machineId?: string; // legado — use machineIds
  machineIds?: string[]; // vincula o plano a uma ou mais máquinas
  planType: 'preventive' | 'checklist';
  items: MaintenancePlanItem[];
  active: boolean;
}

export interface PlanItemResult {
  itemId: string;
  completed: boolean;
  result?: 'ok' | 'nok';
  completedAt?: string;
  mechanicId?: string;
  comment?: string;
  photoUrl?: string;
  partsUsed: { partId: string; quantity: number }[];
}

export type StopReason = 'checklist' | 'preventive' | 'corrective' | 'lubrication' | 'no_production' | 'other';

export interface MachineStopRecord {
  id: string;
  stoppedAt: string;
  resumedAt?: string;
  reason?: StopReason;
  description?: string;
  maintenanceType?: 'mechanical' | 'electrical'; // Added
}

export interface AssetStopRecord extends MachineStopRecord {
  assetId: string;
  assetKind: AssetKind;
}

export interface PlanExecution {
  id: string;
  planId: string;
  machineId?: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
  actualHours?: number;
  itemResults: PlanItemResult[];
  machineStops: MachineStopRecord[];
}

export interface WorkOrder {
  id: string;
  assetId: string;
  assetKind: AssetKind;
  type: WorkOrderType;
  status: WorkOrderStatus;
  reopened: boolean;
  title: string;
  description: string;
  plannedHours: number;
  actualHours?: number;
  openedAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// Keep old types for backward compat references
export interface PreventivePlan {
  id: string;
  machineType: MachineType;
  frequencyDays?: number;
  frequencyHours?: number;
  checklist: string[];
  estimatedTime: number;
  recommendedParts: string[];
  nextDue: string;
  active: boolean;
}

export interface ChecklistTemplate {
  id: string;
  machineType: MachineType;
  name: string;
  items: string[];
}

export interface Failure {
  id: string;
  symptom?: string;
  title?: string; // Compatibility
  description?: string; // Compatibility
  probableCause?: string;
  occurredAt?: string; // Compatibility
  downtime?: number; // Compatibility
  rootCause?: string; // Compatibility
  solution?: string; // Compatibility
  recommendedAction?: string;
  commonParts?: string[]; // Made optional
  machineId?: string; // Compatibility
  componentId?: string; // Compatibility
}

export interface Notification {
  id: string;
  type: 'preventive_due' | 'alert' | 'info';
  title?: string; // Compatibility
  message: string;
  read: boolean;
  createdAt: string;
}

export const MACHINE_TYPE_LABELS: Record<MachineType, string> = {
  extrusora: 'Extrusora',
  misturador: 'Misturador',
  bomba_vacuo: 'Bomba de Vácuo',
  trocador_calor: 'Trocador de Calor',
  tanque_agua: 'Gala',
};

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  trocador_calor: 'Trocador de Calor',
  bomba_vacuo: 'Bomba de Vácuo',
  tanque_agua: 'Gala',
};

export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  operating: 'Operando',
  stopped: 'Parada',
  maintenance: 'Em Manutenção',
  waiting: 'Aguardando Peça',
  scheduled: 'Parada Programada',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export const OS_TYPE_LABELS: Record<OSType, string> = {
  corrective: 'Corretiva',
  inspection: 'Inspeção',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  pending: 'Pendente',
  in_maintenance: 'Em Manutenção',
  resolved: 'Resolvido',
};

export const WORK_ORDER_TYPE_LABELS: Record<WorkOrderType, string> = {
  planned: 'Planejada',
  unplanned: 'Nao planejada',
};

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  open: 'Aberta',
  in_progress: 'Em andamento',
  completed: 'Concluida',
};

// Purchase Orders
export type PurchaseStatus = 'searching_suppliers' | 'quoting' | 'ordered' | 'awaiting_delivery' | 'received';

export interface PurchaseOrder {
  id: string;
  partId: string;
  partDescription: string;
  quantity: number;
  supplier: string;
  status: PurchaseStatus;
  createdAt: string;
  updatedAt: string;
  notes: string;
  unitCost: number;
  totalCost: number;
}

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  searching_suppliers: 'Buscando Fornecedores',
  quoting: 'Em Cotação',
  ordered: 'Pedido Realizado',
  awaiting_delivery: 'Aguardando Entrega',
  received: 'Recebido',
};

// Stock Entries
export interface StockEntry {
  id: string;
  partId: string;
  quantity: number;
  purchaseOrderId?: string;
  invoiceNumber?: string;
  invoiceXml?: string;
  nfeAccessKey?: string;
  entryDate: string;
  notes: string;
}

// Inventory Count
export interface InventoryCount {
  id: string;
  partId: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
  registeredAt: string;
  countedBy: string;
  notes: string;
}




