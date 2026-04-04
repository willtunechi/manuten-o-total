// DataContext - global state management (v9 - full database persistence)
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  Machine,
  Mechanic,
  Part,
  Ticket,
  PreventivePlan,
  Failure,
  Notification,
  PurchaseOrder,
  StockEntry,
  InventoryCount,
  ChecklistTemplate,
  MaintenancePlan,
  MaintenancePlanItem,
  PlanExecution,
  PlanItemResult,
  MachineStopRecord,
  MachineComponent,
  MachineStatus,
  StopReason,
  AssetStopRecord,
  WorkOrder,
  WorkOrderType,
} from "@/data/types";
import { toast } from "@/hooks/use-toast";

type Supplier = { id: string; name: string };

interface DataContextType {
  machines: Machine[];
  mechanics: Mechanic[];
  parts: Part[];
  tickets: Ticket[];
  preventivePlans: PreventivePlan[];
  failures: Failure[];
  notifications: Notification[];
  checklistTemplates: ChecklistTemplate[];
  purchaseOrders: PurchaseOrder[];
  stockEntries: StockEntry[];
  inventoryCounts: InventoryCount[];
  maintenancePlans: MaintenancePlan[];
  planExecutions: PlanExecution[];
  workOrders: WorkOrder[];
  assetStopRecords: AssetStopRecord[];
  suppliers: Supplier[];
  userAssignedMachineIds: string[] | null; // null = no restriction (admin/supervisor)
  userAssignedComponentIds: string[] | null;
  addMachine: (m: Omit<Machine, "id">) => void;
  updateMachine: (id: string, m: Partial<Machine>) => void;
  removeMachine: (id: string) => void;
  addMechanic: (m: Omit<Mechanic, "id">) => void;
  updateMechanic: (id: string, m: Partial<Mechanic>) => void;
  removeMechanic: (id: string) => void;
  addPart: (p: Omit<Part, "id">) => void;
  addPartSync: (p: Omit<Part, "id">) => Part;
  updatePart: (id: string, p: Partial<Part>) => void;
  removePart: (id: string) => void;
  addTicket: (t: Omit<Ticket, "id">) => void;
  updateTicket: (id: string, t: Partial<Ticket>) => void;
  removeTicket: (id: string) => void;
  addPreventivePlan: (p: Omit<PreventivePlan, "id">) => void;
  updatePreventivePlan: (id: string, p: Partial<PreventivePlan>) => void;
  removePreventivePlan: (id: string) => void;
  addFailure: (f: Omit<Failure, "id">) => void;
  updateFailure: (id: string, f: Partial<Failure>) => void;
  removeFailure: (id: string) => void;
  addPurchaseOrder: (p: Omit<PurchaseOrder, "id">) => void;
  updatePurchaseOrder: (id: string, p: Partial<PurchaseOrder>) => void;
  removePurchaseOrder: (id: string) => void;
  addChecklistTemplate: (t: Omit<ChecklistTemplate, "id">) => void;
  updateChecklistTemplate: (id: string, t: Partial<ChecklistTemplate>) => void;
  removeChecklistTemplate: (id: string) => void;
  addStockEntry: (e: Omit<StockEntry, "id">) => void;
  addInventoryCount: (c: Omit<InventoryCount, "id">) => void;
  addMaintenancePlan: (p: Omit<MaintenancePlan, "id">) => void;
  updateMaintenancePlan: (id: string, p: Partial<MaintenancePlan>) => void;
  removeMaintenancePlan: (id: string) => void;
  startPlanExecution: (planId: string, machineId?: string) => Promise<string>;
  updatePlanItemResult: (executionId: string, itemResult: PlanItemResult) => Promise<void>;
  completePlanExecution: (executionId: string) => Promise<void>;
  stopMachineForExecution: (executionId: string) => void;
  resumeMachineForExecution: (executionId: string) => void;
  addWorkOrder: (w: {
    assetId: string;
    assetKind: "machine" | "component";
    type: WorkOrderType;
    title: string;
    description: string;
    plannedHours: number;
  }) => void;
  updateWorkOrder: (id: string, w: Partial<WorkOrder>) => void;
  removeWorkOrder: (id: string) => void;
  startWorkOrder: (id: string) => void;
  finishWorkOrder: (id: string, actualHours: number) => void;
  reopenWorkOrder: (id: string) => void;
  components: MachineComponent[];
  addComponent: (c: Omit<MachineComponent, "id">) => void;
  updateComponent: (id: string, c: Partial<MachineComponent>) => void;
  removeComponent: (id: string) => void;
  stopMachine: (id: string, reason: StopReason, description: string, maintenanceType?: 'mechanical' | 'electrical') => void;
  resumeMachine: (id: string) => void;
  stopComponent: (id: string, reason: StopReason, description: string, maintenanceType?: 'mechanical' | 'electrical') => void;
  resumeComponent: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

let idCounter = 1000;
const genId = (prefix: string) => `${prefix}${++idCounter}`;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [preventivePlans, setPreventivePlans] = useState<PreventivePlan[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [notifications] = useState<Notification[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [inventoryCounts, setInventoryCounts] = useState<InventoryCount[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>([]);
  const [planExecutions, setPlanExecutions] = useState<PlanExecution[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assetStopRecords, setAssetStopRecords] = useState<AssetStopRecord[]>([]);
  const [components, setComponents] = useState<MachineComponent[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [userAssignedMachineIds, setUserAssignedMachineIds] = useState<string[] | null>(null);
  const [userAssignedComponentIds, setUserAssignedComponentIds] = useState<string[] | null>(null);

  // ─── LOADERS ───────────────────────────────────────────────

  const loadMachines = useCallback(async () => {
    const { data, error } = await supabase.from("machines").select("*");
    if (error) { console.error("load machines:", error); return; }
    setMachines((data || []).map((m) => ({
      id: m.id,
      tag: m.tag,
      type: m.type as Machine["type"],
      model: m.model,
      manufacturer: m.manufacturer,
      year: m.year,
      sector: m.sector,
      status: m.status as Machine["status"],
      horimeter: Number(m.horimeter),
      photoUrl: (m as any).photo_url || undefined,
    })));
  }, []);

  const loadComponents = useCallback(async () => {
    const { data, error } = await supabase.from("components").select("*");
    if (error) { console.error("load components:", error); return; }
    setComponents((data || []).map((c) => ({
      id: c.id,
      name: c.name,
      tag: c.tag,
      type: c.type as MachineComponent["type"],
      machineType: c.machine_type as MachineComponent["machineType"],
      machineId: c.machine_id || undefined,
      ruleId: c.rule_id || undefined,
      status: c.status as MachineComponent["status"],
      model: c.model || undefined,
      sector: c.sector || undefined,
      photoUrl: (c as any).photo_url || undefined,
    })));
  }, []);

  const loadMechanics = useCallback(async () => {
    const { data: mechs, error } = await supabase.from("mechanics").select("*");
    if (error) { console.error("load mechanics:", error); return; }
    const { data: machAssoc } = await supabase.from("mechanic_machines").select("*");
    const { data: compAssoc } = await supabase.from("mechanic_components").select("*");
    setMechanics((mechs || []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email || undefined,
      role: m.role as Mechanic["role"],
      shift: m.shift,
      level: m.level as Mechanic["level"],
      available: m.available,
      canExecuteChecklist: m.can_execute_checklist,
      canExecutePreventive: m.can_execute_preventive,
      hourlyCost: (m as any).hourly_cost ?? 0,
      machineIds: (machAssoc || []).filter((a) => a.mechanic_id === m.id).map((a) => a.machine_id),
      componentIds: (compAssoc || []).filter((a) => a.mechanic_id === m.id).map((a) => a.component_id),
    })));
  }, []);

  const loadParts = useCallback(async () => {
    const { data, error } = await supabase.from("parts").select("*");
    if (error) { console.error("load parts:", error); return; }
    setParts((data || []).map((p) => ({
      id: p.id,
      sku: p.sku || p.id,
      description: p.description || p.id,
      unit: p.unit || "un",
      location: p.location,
      quantity: Number(p.quantity),
      minStock: Number(p.min_stock),
      supplier: p.supplier || undefined,
      unitCost: Number(p.unit_cost),
      photoUrl: (p as any).photo_url || undefined,
    })));
  }, []);

  const loadTickets = useCallback(async () => {
    const { data, error } = await supabase.from("tickets").select("*");
    if (error) { console.error("load tickets:", error); return; }
    const { data: partsUsed } = await supabase.from("ticket_parts_used").select("*");
    setTickets((data || []).map((t) => ({
      id: t.id,
      code: (t as any).code || 0,
      machineId: t.machine_id,
      type: t.type as Ticket["type"],
      maintenanceType: t.maintenance_type as Ticket["maintenanceType"],
      symptom: t.symptom,
      priority: t.priority as Ticket["priority"],
      reportedBy: t.reported_by || undefined,
      createdAt: t.created_at,
      resolvedAt: t.resolved_at || undefined,
      status: t.status as Ticket["status"],
      comment: (t.comment && t.comment !== "null") ? t.comment : undefined,
      photoUrl: t.photo_url || undefined,
      resolutionPhotoUrl: (t as any).resolution_photo_url || undefined,
      partsUsed: (partsUsed || []).filter((pu) => pu.ticket_id === t.id).map((pu) => ({
        partId: pu.part_id,
        quantity: Number(pu.quantity),
      })),
    })));
  }, []);

  const loadFailures = useCallback(async () => {
    const { data, error } = await supabase.from("failures").select("*");
    if (error) { console.error("load failures:", error); return; }
    setFailures((data || []).map((f) => ({
      id: f.id,
      symptom: f.symptom || undefined,
      probableCause: f.probable_cause || undefined,
      recommendedAction: f.recommended_action || undefined,
      commonParts: f.common_parts || [],
      machineId: f.machine_id || undefined,
      componentId: f.component_id || undefined,
    })));
  }, []);

  const loadPurchaseOrders = useCallback(async () => {
    const { data, error } = await supabase.from("purchase_orders").select("*");
    if (error) { console.error("load purchase_orders:", error); return; }
    setPurchaseOrders((data || []).map((p) => ({
      id: p.id,
      partId: p.part_id || "",
      partDescription: p.part_description,
      quantity: Number(p.quantity),
      supplier: p.supplier,
      status: p.status as PurchaseOrder["status"],
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      notes: p.notes || "",
      unitCost: Number(p.unit_cost),
      totalCost: Number(p.total_cost),
    })));
  }, []);

  const loadStockEntries = useCallback(async () => {
    const { data, error } = await supabase.from("stock_entries").select("*");
    if (error) { console.error("load stock_entries:", error); return; }
    setStockEntries((data || []).map((e) => ({
      id: e.id,
      partId: e.part_id,
      quantity: Number(e.quantity),
      purchaseOrderId: e.purchase_order_id || undefined,
      invoiceNumber: e.invoice_number || undefined,
      invoiceXml: e.invoice_xml || undefined,
      nfeAccessKey: e.nfe_access_key || undefined,
      entryDate: e.entry_date,
      notes: e.notes || "",
    })));
  }, []);

  const loadInventoryCounts = useCallback(async () => {
    const { data, error } = await supabase.from("inventory_counts").select("*");
    if (error) { console.error("load inventory_counts:", error); return; }
    setInventoryCounts((data || []).map((c) => ({
      id: c.id,
      partId: c.part_id,
      expectedQuantity: Number(c.expected_quantity),
      countedQuantity: Number(c.counted_quantity),
      difference: Number(c.difference),
      registeredAt: c.registered_at,
      countedBy: c.counted_by,
      notes: c.notes || "",
    })));
  }, []);

  const loadMaintenancePlans = useCallback(async () => {
    const { data: plans, error } = await supabase.from("maintenance_plans").select("*");
    if (error) { console.error("load maintenance_plans:", error); return; }
    const { data: items } = await supabase.from("maintenance_plan_items").select("*");
    setMaintenancePlans((plans || []).map((p) => ({
      id: p.id,
      name: p.name,
      machineType: p.machine_type as MaintenancePlan["machineType"],
      machineIds: p.machine_ids || [],
      machineId: (p.machine_ids || [])[0],
      planType: p.plan_type as MaintenancePlan["planType"],
      active: p.active,
      items: (items || []).filter((i) => i.plan_id === p.id).map((i) => ({
        id: i.id,
        description: i.description,
        inspectionType: i.inspection_type,
        attentionPoints: i.attention_points,
        frequencyDays: i.frequency_days,
        observation: i.observation,
        responsible: i.responsible as MaintenancePlanItem["responsible"],
      })),
    })));
  }, []);

  const loadPlanExecutions = useCallback(async () => {
    const { data: execs, error } = await supabase.from("plan_executions").select("*");
    if (error) { console.error("load plan_executions:", error); return; }
    const { data: results } = await supabase.from("plan_item_results").select("*");
    const { data: planPartsUsed } = await supabase.from("plan_item_parts_used").select("*");
    const partsUsedByResultId = new Map<string, { partId: string; quantity: number }[]>();
    (planPartsUsed || []).forEach((pu) => {
      const list = partsUsedByResultId.get(pu.plan_item_result_id) || [];
      list.push({ partId: pu.part_id, quantity: Number(pu.quantity) });
      partsUsedByResultId.set(pu.plan_item_result_id, list);
    });
    setPlanExecutions((execs || []).map((e) => ({
      id: e.id,
      planId: e.plan_id,
      machineId: e.machine_id || undefined,
      startedAt: e.started_at,
      completedAt: e.completed_at || undefined,
      status: e.status as PlanExecution["status"],
      machineStops: [],
      itemResults: (results || []).filter((r) => r.execution_id === e.id).map((r) => ({
        itemId: r.item_id,
        completed: r.completed,
        result: r.result as PlanItemResult["result"],
        completedAt: r.completed_at || undefined,
        mechanicId: r.mechanic_id || undefined,
        comment: r.comment || undefined,
        photoUrl: r.photo_url || undefined,
        partsUsed: partsUsedByResultId.get(r.id) || [],
      })),
    })));
  }, []);

  const loadWorkOrders = useCallback(async () => {
    const { data, error } = await supabase.from("work_orders").select("*");
    if (error) { console.error("load work_orders:", error); return; }
    setWorkOrders((data || []).map((w) => ({
      id: w.id,
      assetId: w.asset_id,
      assetKind: w.asset_kind as WorkOrder["assetKind"],
      type: w.type as WorkOrder["type"],
      status: w.status as WorkOrder["status"],
      reopened: w.reopened,
      title: w.title,
      description: w.description,
      plannedHours: Number(w.planned_hours),
      actualHours: w.actual_hours != null ? Number(w.actual_hours) : undefined,
      openedAt: w.opened_at,
      startedAt: w.started_at || undefined,
      finishedAt: w.finished_at || undefined,
    })));
  }, []);

  const loadAssetStopRecords = useCallback(async () => {
    const { data, error } = await supabase.from("asset_stop_records").select("*");
    if (error) { console.error("load asset_stop_records:", error); return; }
    setAssetStopRecords((data || []).map((r) => ({
      id: r.id,
      assetId: r.asset_id,
      assetKind: r.asset_kind as AssetStopRecord["assetKind"],
      stoppedAt: r.stopped_at,
      resumedAt: r.resumed_at || undefined,
      reason: r.reason as StopReason | undefined,
      description: r.description || undefined,
      maintenanceType: r.maintenance_type as AssetStopRecord["maintenanceType"],
    })));
  }, []);

  const loadSuppliers = useCallback(async () => {
    const { data, error } = await supabase.from("suppliers").select("*").order("name");
    if (error) { console.error("load suppliers:", error); return; }
    setSuppliers((data || []).map((s) => ({ id: s.id, name: s.name })));
  }, []);

  // ─── RESOLVE USER ASSIGNMENTS ────────────────────────────────

  useEffect(() => {
    const resolveUserAssignments = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const role = roleData?.role;
      // Only restrict for operator and mechanic roles
      if (role !== "operator" && role !== "mechanic") {
        setUserAssignedMachineIds(null);
        setUserAssignedComponentIds(null);
        return;
      }

      // Find mechanic record by email
      const { data: mechanicData } = await supabase
        .from("mechanics")
        .select("id")
        .eq("email", session.user.email || "")
        .maybeSingle();

      if (!mechanicData) {
        // No mechanic record found - show nothing
        setUserAssignedMachineIds([]);
        setUserAssignedComponentIds([]);
        return;
      }

      const { data: machAssoc } = await supabase
        .from("mechanic_machines")
        .select("machine_id")
        .eq("mechanic_id", mechanicData.id);

      const { data: compAssoc } = await supabase
        .from("mechanic_components")
        .select("component_id")
        .eq("mechanic_id", mechanicData.id);

      setUserAssignedMachineIds((machAssoc || []).map((a) => a.machine_id));
      setUserAssignedComponentIds((compAssoc || []).map((a) => a.component_id));
    };

    resolveUserAssignments();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      resolveUserAssignments();
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── INITIAL LOAD ──────────────────────────────────────────

  useEffect(() => {
    loadMachines();
    loadComponents();
    loadMechanics();
    loadParts();
    loadTickets();
    loadFailures();
    loadPurchaseOrders();
    loadStockEntries();
    loadInventoryCounts();
    loadMaintenancePlans();
    loadPlanExecutions();
    loadWorkOrders();
    loadAssetStopRecords();
    loadSuppliers();
  }, []);

  // ─── MACHINES ──────────────────────────────────────────────

  const addMachine = useCallback(async (m: Omit<Machine, "id">) => {
    const { error } = await supabase.from("machines").insert({
      tag: m.tag, type: m.type, model: m.model, manufacturer: m.manufacturer,
      year: m.year, sector: m.sector, status: m.status, horimeter: m.horimeter,
      photo_url: m.photoUrl || null,
    } as any);
    if (error) { toast({ title: "Erro ao cadastrar máquina", description: error.message, variant: "destructive" }); return; }
    await loadMachines();
    toast({ title: "Máquina cadastrada com sucesso" });
  }, [loadMachines]);

  const updateMachine = useCallback(async (id: string, m: Partial<Machine>) => {
    const update: Record<string, unknown> = {};
    if (m.tag !== undefined) update.tag = m.tag;
    if (m.type !== undefined) update.type = m.type;
    if (m.model !== undefined) update.model = m.model;
    if (m.manufacturer !== undefined) update.manufacturer = m.manufacturer;
    if (m.year !== undefined) update.year = m.year;
    if (m.sector !== undefined) update.sector = m.sector;
    if (m.status !== undefined) update.status = m.status;
    if (m.horimeter !== undefined) update.horimeter = m.horimeter;
    if (m.photoUrl !== undefined) update.photo_url = m.photoUrl || null;
    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("machines").update(update).eq("id", id);
      if (error) { toast({ title: "Erro ao atualizar máquina", description: error.message, variant: "destructive" }); return; }
    }
    await loadMachines();
    toast({ title: "Máquina atualizada" });
  }, [loadMachines]);

  const removeMachine = useCallback(async (id: string) => {
    const { error } = await supabase.from("machines").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover máquina", description: error.message, variant: "destructive" }); return; }
    await loadMachines();
    toast({ title: "Máquina removida" });
  }, [loadMachines]);

  // ─── COMPONENTS ────────────────────────────────────────────

  const addComponent = useCallback(async (c: Omit<MachineComponent, "id">) => {
    const { error } = await supabase.from("components").insert({
      name: c.name, tag: c.tag, type: c.type, machine_type: c.machineType,
      machine_id: c.machineId || null, rule_id: c.ruleId || null,
      status: c.status || "operating", model: c.model || "", sector: c.sector || "",
      photo_url: c.photoUrl || null,
    } as any);
    if (error) { toast({ title: "Erro ao cadastrar componente", description: error.message, variant: "destructive" }); return; }
    await loadComponents();
    toast({ title: "Componente cadastrado" });
  }, [loadComponents]);

  const updateComponent = useCallback(async (id: string, c: Partial<MachineComponent>) => {
    const update: Record<string, unknown> = {};
    if (c.name !== undefined) update.name = c.name;
    if (c.tag !== undefined) update.tag = c.tag;
    if (c.type !== undefined) update.type = c.type;
    if (c.machineType !== undefined) update.machine_type = c.machineType;
    if (c.machineId !== undefined) update.machine_id = c.machineId || null;
    if (c.ruleId !== undefined) update.rule_id = c.ruleId || null;
    if (c.status !== undefined) update.status = c.status;
    if (c.model !== undefined) update.model = c.model;
    if (c.sector !== undefined) update.sector = c.sector;
    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("components").update(update).eq("id", id);
      if (error) { toast({ title: "Erro ao atualizar componente", description: error.message, variant: "destructive" }); return; }
    }
    await loadComponents();
    toast({ title: "Componente atualizado" });
  }, [loadComponents]);

  const removeComponent = useCallback(async (id: string) => {
    const { error } = await supabase.from("components").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover componente", description: error.message, variant: "destructive" }); return; }
    await loadComponents();
    toast({ title: "Componente removido" });
  }, [loadComponents]);

  // ─── MECHANICS ─────────────────────────────────────────────

  const addMechanic = useCallback(async (m: Omit<Mechanic, "id">) => {
    const { data, error } = await supabase.from("mechanics").insert({
      name: m.name, email: m.email || null, role: m.role, shift: m.shift,
      level: m.level, available: m.available,
      can_execute_checklist: m.canExecuteChecklist ?? false,
      can_execute_preventive: m.canExecutePreventive ?? false,
      hourly_cost: m.hourlyCost ?? 0,
    }).select().single();
    if (error) { toast({ title: "Erro ao cadastrar colaborador", description: error.message, variant: "destructive" }); return; }
    if (m.machineIds?.length) {
      await supabase.from("mechanic_machines").insert(m.machineIds.map((mid) => ({ mechanic_id: data.id, machine_id: mid })));
    }
    if (m.componentIds?.length) {
      await supabase.from("mechanic_components").insert(m.componentIds.map((cid) => ({ mechanic_id: data.id, component_id: cid })));
    }
    await loadMechanics();
    toast({ title: "Colaborador cadastrado com sucesso" });
  }, [loadMechanics]);

  const updateMechanic = useCallback(async (id: string, m: Partial<Mechanic>) => {
    const updateData: Record<string, unknown> = {};
    if (m.name !== undefined) updateData.name = m.name;
    if (m.email !== undefined) updateData.email = m.email || null;
    if (m.role !== undefined) updateData.role = m.role;
    if (m.shift !== undefined) updateData.shift = m.shift;
    if (m.level !== undefined) updateData.level = m.level;
    if (m.available !== undefined) updateData.available = m.available;
    if (m.canExecuteChecklist !== undefined) updateData.can_execute_checklist = m.canExecuteChecklist;
    if (m.canExecutePreventive !== undefined) updateData.can_execute_preventive = m.canExecutePreventive;
    if (m.hourlyCost !== undefined) updateData.hourly_cost = m.hourlyCost;
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.from("mechanics").update(updateData).eq("id", id);
      if (error) { toast({ title: "Erro ao atualizar colaborador", description: error.message, variant: "destructive" }); return; }
    }
    if (m.machineIds !== undefined) {
      await supabase.from("mechanic_machines").delete().eq("mechanic_id", id);
      if (m.machineIds.length > 0) {
        await supabase.from("mechanic_machines").insert(m.machineIds.map((mid) => ({ mechanic_id: id, machine_id: mid })));
      }
    }
    if (m.componentIds !== undefined) {
      await supabase.from("mechanic_components").delete().eq("mechanic_id", id);
      if (m.componentIds.length > 0) {
        await supabase.from("mechanic_components").insert(m.componentIds.map((cid) => ({ mechanic_id: id, component_id: cid })));
      }
    }
    await loadMechanics();
    toast({ title: "Colaborador atualizado" });
  }, [loadMechanics]);

  const removeMechanic = useCallback(async (id: string) => {
    const { error } = await supabase.from("mechanics").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover colaborador", description: error.message, variant: "destructive" }); return; }
    await loadMechanics();
    toast({ title: "Colaborador removido" });
  }, [loadMechanics]);

  // ─── PARTS ─────────────────────────────────────────────────

  const addPart = useCallback(async (p: Omit<Part, "id">) => {
    const { error } = await supabase.from("parts").insert({
      sku: p.sku || p.code || "", description: p.description || p.name || "",
      unit: p.unit || "un", location: p.location || "",
      quantity: p.quantity ?? p.stock ?? 0, min_stock: p.minStock || 0,
      supplier: p.supplier || "", unit_cost: p.unitCost ?? p.cost ?? 0,
    });
    if (error) { toast({ title: "Erro ao cadastrar peça", description: error.message, variant: "destructive" }); return; }
    await loadParts();
    toast({ title: "Peça cadastrada com sucesso" });
  }, [loadParts]);

  const addPartSync = useCallback((p: Omit<Part, "id">): Part => {
    const newPart: Part = { ...p, id: genId("p") };
    // Fire and forget the DB insert, reload will pick it up
    supabase.from("parts").insert({
      sku: p.sku || p.code || "", description: p.description || p.name || "",
      unit: p.unit || "un", location: p.location || "",
      quantity: p.quantity ?? p.stock ?? 0, min_stock: p.minStock || 0,
      supplier: p.supplier || "", unit_cost: p.unitCost ?? p.cost ?? 0,
    }).then(({ data, error }) => {
      if (!error && data) loadParts();
      else loadParts(); // reload anyway to sync
    });
    // Return temp part for immediate UI use
    setParts((prev) => [...prev, newPart]);
    return newPart;
  }, [loadParts]);

  const updatePart = useCallback(async (id: string, p: Partial<Part>) => {
    const update: Record<string, unknown> = {};
    if (p.sku !== undefined) update.sku = p.sku;
    if (p.description !== undefined) update.description = p.description;
    if (p.unit !== undefined) update.unit = p.unit;
    if (p.location !== undefined) update.location = p.location;
    if (p.quantity !== undefined) update.quantity = p.quantity;
    if (p.minStock !== undefined) update.min_stock = p.minStock;
    if (p.supplier !== undefined) update.supplier = p.supplier;
    if (p.unitCost !== undefined) update.unit_cost = p.unitCost;
    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("parts").update(update).eq("id", id);
      if (error) { toast({ title: "Erro ao atualizar peça", description: error.message, variant: "destructive" }); return; }
    }
    await loadParts();
    toast({ title: "Peça atualizada" });
  }, [loadParts]);

  const removePart = useCallback(async (id: string) => {
    const { error } = await supabase.from("parts").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover peça", description: error.message, variant: "destructive" }); return; }
    await loadParts();
    toast({ title: "Peça removida" });
  }, [loadParts]);

  // ─── TICKETS ───────────────────────────────────────────────

  const addTicket = useCallback(async (t: Omit<Ticket, "id">) => {
    const { data, error } = await supabase.from("tickets").insert({
      machine_id: t.machineId, type: t.type,
      maintenance_type: t.maintenanceType || null,
      symptom: t.symptom, priority: t.priority,
      reported_by: t.reportedBy || t.createdBy || "",
      status: t.status || "pending",
      comment: t.comment || "", photo_url: t.photoUrl || "",
    }).select().single();
    if (error) { toast({ title: "Erro ao abrir chamado", description: error.message, variant: "destructive" }); return; }
    if (t.partsUsed?.length) {
      await supabase.from("ticket_parts_used").insert(t.partsUsed.map((pu) => ({
        ticket_id: data.id, part_id: pu.partId, quantity: pu.quantity,
      })));
    }
    await loadTickets();
    toast({ title: "Chamado aberto com sucesso" });
  }, [loadTickets]);

  const updateTicket = useCallback(async (id: string, t: Partial<Ticket>) => {
    const update: Record<string, unknown> = {};
    if (t.machineId !== undefined) update.machine_id = t.machineId;
    if (t.type !== undefined) update.type = t.type;
    if (t.maintenanceType !== undefined) update.maintenance_type = t.maintenanceType;
    if (t.symptom !== undefined) update.symptom = t.symptom;
    if (t.priority !== undefined) update.priority = t.priority;
    if (t.status !== undefined) update.status = t.status;
    if (t.comment !== undefined) update.comment = t.comment;
    if (t.photoUrl !== undefined) update.photo_url = t.photoUrl;
    if (t.resolutionPhotoUrl !== undefined) update.resolution_photo_url = t.resolutionPhotoUrl;
    if (t.resolvedAt !== undefined) update.resolved_at = t.resolvedAt;
    if (t.reportedBy !== undefined) update.reported_by = t.reportedBy;

    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("tickets").update(update).eq("id", id);
      if (error) { toast({ title: "Erro ao atualizar chamado", description: error.message, variant: "destructive" }); return; }
    }

    // Handle parts used: sync and deduct stock for new parts
    if (t.partsUsed !== undefined) {
      // Get previously saved parts to compare
      const { data: prevParts } = await supabase.from("ticket_parts_used").select("part_id, quantity").eq("ticket_id", id);
      const prevMap = new Map((prevParts || []).map((p) => [p.part_id, Number(p.quantity)]));

      // Replace parts in junction table
      await supabase.from("ticket_parts_used").delete().eq("ticket_id", id);
      if (t.partsUsed.length > 0) {
        await supabase.from("ticket_parts_used").insert(t.partsUsed.map((pu) => ({
          ticket_id: id, part_id: pu.partId, quantity: pu.quantity,
        })));
      }

      // Calculate net change per part and update stock
      const newMap = new Map(t.partsUsed.map((pu) => [pu.partId, Number(pu.quantity)]));
      const allPartIds = new Set([...prevMap.keys(), ...newMap.keys()]);
      for (const partId of allPartIds) {
        const prevQty = prevMap.get(partId) || 0;
        const newQty = newMap.get(partId) || 0;
        const delta = newQty - prevQty; // positive = deduct more, negative = return stock
        if (delta !== 0) {
          // Fetch latest quantity from DB to avoid stale state
          const { data: freshPart } = await supabase.from("parts").select("quantity").eq("id", partId).maybeSingle();
          if (freshPart) {
            const newStock = Math.max(0, (Number(freshPart.quantity) || 0) - delta);
            const { error } = await supabase.from("parts").update({ quantity: newStock }).eq("id", partId);
            if (error) {
              console.error("Erro ao baixar estoque (ticket):", error);
              toast({ title: "Erro ao baixar estoque", description: error.message, variant: "destructive" });
            }
          }
        }
      }
      await loadParts();
    }

    await loadTickets();
    toast({ title: "Chamado atualizado" });
  }, [loadTickets, loadParts, parts]);

  const removeTicket = useCallback(async (id: string) => {
    await supabase.from("ticket_parts_used").delete().eq("ticket_id", id);
    const { error } = await supabase.from("tickets").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover chamado", description: error.message, variant: "destructive" }); return; }
    await loadTickets();
    toast({ title: "Chamado removido" });
  }, [loadTickets]);

  // ─── FAILURES ──────────────────────────────────────────────

  const addFailure = useCallback(async (f: Omit<Failure, "id">) => {
    const { error } = await supabase.from("failures").insert({
      symptom: f.symptom || f.title || "",
      probable_cause: f.probableCause || f.rootCause || "",
      recommended_action: f.recommendedAction || f.solution || "",
      common_parts: f.commonParts || [],
      machine_id: f.machineId || null, component_id: f.componentId || null,
    });
    if (error) { toast({ title: "Erro ao cadastrar falha", description: error.message, variant: "destructive" }); return; }
    await loadFailures();
    toast({ title: "Falha cadastrada" });
  }, [loadFailures]);

  const updateFailure = useCallback(async (id: string, f: Partial<Failure>) => {
    const update: Record<string, unknown> = {};
    if (f.symptom !== undefined) update.symptom = f.symptom;
    if (f.probableCause !== undefined) update.probable_cause = f.probableCause;
    if (f.recommendedAction !== undefined) update.recommended_action = f.recommendedAction;
    if (f.commonParts !== undefined) update.common_parts = f.commonParts;
    if (f.machineId !== undefined) update.machine_id = f.machineId;
    if (f.componentId !== undefined) update.component_id = f.componentId;
    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("failures").update(update).eq("id", id);
      if (error) { toast({ title: "Erro ao atualizar falha", description: error.message, variant: "destructive" }); return; }
    }
    await loadFailures();
    toast({ title: "Falha atualizada" });
  }, [loadFailures]);

  const removeFailure = useCallback(async (id: string) => {
    const { error } = await supabase.from("failures").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover falha", description: error.message, variant: "destructive" }); return; }
    await loadFailures();
    toast({ title: "Falha removida" });
  }, [loadFailures]);

  // ─── PURCHASE ORDERS ───────────────────────────────────────

  const addPurchaseOrder = useCallback(async (p: Omit<PurchaseOrder, "id">) => {
    const { error } = await supabase.from("purchase_orders").insert({
      part_id: p.partId || null, part_description: p.partDescription,
      quantity: p.quantity, supplier: p.supplier, status: p.status,
      notes: p.notes || "", unit_cost: p.unitCost, total_cost: p.totalCost,
    });
    if (error) { toast({ title: "Erro ao criar pedido de compra", description: error.message, variant: "destructive" }); return; }
    await loadPurchaseOrders();
    toast({ title: "Pedido de compra criado" });
  }, [loadPurchaseOrders]);

  const updatePurchaseOrder = useCallback(async (id: string, p: Partial<PurchaseOrder>) => {
    const update: Record<string, unknown> = {};
    if (p.partId !== undefined) update.part_id = p.partId || null;
    if (p.partDescription !== undefined) update.part_description = p.partDescription;
    if (p.quantity !== undefined) update.quantity = p.quantity;
    if (p.supplier !== undefined) update.supplier = p.supplier;
    if (p.status !== undefined) update.status = p.status;
    if (p.notes !== undefined) update.notes = p.notes;
    if (p.unitCost !== undefined) update.unit_cost = p.unitCost;
    if (p.totalCost !== undefined) update.total_cost = p.totalCost;
    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("purchase_orders").update(update).eq("id", id);
      if (error) { toast({ title: "Erro ao atualizar pedido", description: error.message, variant: "destructive" }); return; }
    }
    await loadPurchaseOrders();
    toast({ title: "Pedido de compra atualizado" });
  }, [loadPurchaseOrders]);

  const removePurchaseOrder = useCallback(async (id: string) => {
    const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover pedido", description: error.message, variant: "destructive" }); return; }
    await loadPurchaseOrders();
    toast({ title: "Pedido de compra removido" });
  }, [loadPurchaseOrders]);

  // ─── STOCK ENTRIES ─────────────────────────────────────────

  const addStockEntry = useCallback(async (e: Omit<StockEntry, "id">) => {
    const { error } = await supabase.from("stock_entries").insert({
      part_id: e.partId, quantity: e.quantity,
      purchase_order_id: e.purchaseOrderId || null,
      invoice_number: e.invoiceNumber || "", invoice_xml: e.invoiceXml || "",
      nfe_access_key: e.nfeAccessKey || "", notes: e.notes || "",
    });
    if (error) { toast({ title: "Erro ao registrar entrada", description: error.message, variant: "destructive" }); return; }

    // Update part quantity
    const part = parts.find((p) => p.id === e.partId);
    if (part) {
      await supabase.from("parts").update({ quantity: (part.quantity || 0) + e.quantity }).eq("id", e.partId);
    }

    // If linked to purchase order, update its status
    if (e.purchaseOrderId) {
      await supabase.from("purchase_orders").update({ status: "received" }).eq("id", e.purchaseOrderId);
      await loadPurchaseOrders();
    }

    await loadStockEntries();
    await loadParts();
    toast({ title: "Entrada de peça registrada" });
  }, [loadStockEntries, loadParts, loadPurchaseOrders, parts]);

  // ─── INVENTORY COUNTS ──────────────────────────────────────

  const addInventoryCount = useCallback(async (c: Omit<InventoryCount, "id">) => {
    const { error } = await supabase.from("inventory_counts").insert({
      part_id: c.partId, expected_quantity: c.expectedQuantity,
      counted_quantity: c.countedQuantity, difference: c.difference,
      counted_by: c.countedBy, notes: c.notes || "",
    });
    if (error) { toast({ title: "Erro ao registrar contagem", description: error.message, variant: "destructive" }); return; }

    // Update part quantity to counted
    await supabase.from("parts").update({ quantity: c.countedQuantity }).eq("id", c.partId);

    await loadInventoryCounts();
    await loadParts();
    toast({ title: "Contagem registrada" });
  }, [loadInventoryCounts, loadParts]);

  // ─── PREVENTIVE PLANS (legacy, kept in-memory) ────────────

  const addPreventivePlan = useCallback((p: Omit<PreventivePlan, "id">) => {
    setPreventivePlans((prev) => [...prev, { ...p, id: genId("pp") }]);
    toast({ title: "Plano preventivo criado" });
  }, []);
  const updatePreventivePlan = useCallback((id: string, p: Partial<PreventivePlan>) => {
    setPreventivePlans((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));
    toast({ title: "Plano preventivo atualizado" });
  }, []);
  const removePreventivePlan = useCallback((id: string) => {
    setPreventivePlans((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "Plano preventivo removido" });
  }, []);

  // ─── CHECKLIST TEMPLATES (legacy, kept in-memory) ──────────

  const addChecklistTemplate = useCallback((t: Omit<ChecklistTemplate, "id">) => {
    setChecklistTemplates((prev) => [...prev, { ...t, id: genId("ct") }]);
    toast({ title: "Checklist criado" });
  }, []);
  const updateChecklistTemplate = useCallback((id: string, t: Partial<ChecklistTemplate>) => {
    setChecklistTemplates((prev) => prev.map((x) => (x.id === id ? { ...x, ...t } : x)));
  }, []);
  const removeChecklistTemplate = useCallback((id: string) => {
    setChecklistTemplates((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "Checklist removido" });
  }, []);

  // ─── MAINTENANCE PLANS ─────────────────────────────────────

  const addMaintenancePlan = useCallback(async (p: Omit<MaintenancePlan, "id">) => {
    const machineIds = p.machineIds ?? (p.machineId ? [p.machineId] : []);
    const targets = machineIds.length <= 1 ? [machineIds] : machineIds.map((mid) => [mid]);

    for (const mids of targets) {
      const { data: plan, error } = await supabase.from("maintenance_plans").insert({
        name: p.name, machine_type: p.machineType,
        machine_ids: mids, plan_type: p.planType, active: p.active,
      }).select().single();
      if (error) { toast({ title: "Erro ao criar plano", description: error.message, variant: "destructive" }); continue; }

      if (p.items?.length) {
        await supabase.from("maintenance_plan_items").insert(p.items.map((item) => ({
          plan_id: plan.id, description: item.description,
          inspection_type: item.inspectionType, attention_points: item.attentionPoints,
          frequency_days: item.frequencyDays, observation: item.observation,
          responsible: item.responsible,
        })));
      }
    }

    await loadMaintenancePlans();
    toast({ title: targets.length > 1 ? `${targets.length} planos criados (um por máquina)` : "Plano de manutenção criado" });
  }, [loadMaintenancePlans]);

  const updateMaintenancePlan = useCallback(async (id: string, p: Partial<MaintenancePlan>) => {
    const update: Record<string, unknown> = {};
    if (p.name !== undefined) update.name = p.name;
    if (p.machineType !== undefined) update.machine_type = p.machineType;
    if (p.machineIds !== undefined) update.machine_ids = p.machineIds;
    if (p.planType !== undefined) update.plan_type = p.planType;
    if (p.active !== undefined) update.active = p.active;
    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("maintenance_plans").update(update).eq("id", id);
      if (error) { toast({ title: "Erro ao atualizar plano", description: error.message, variant: "destructive" }); return; }
    }
    if (p.items !== undefined) {
      await supabase.from("maintenance_plan_items").delete().eq("plan_id", id);
      if (p.items.length > 0) {
        await supabase.from("maintenance_plan_items").insert(p.items.map((item) => ({
          plan_id: id, description: item.description,
          inspection_type: item.inspectionType, attention_points: item.attentionPoints,
          frequency_days: item.frequencyDays, observation: item.observation,
          responsible: item.responsible,
        })));
      }
    }
    await loadMaintenancePlans();
    toast({ title: "Plano atualizado" });
  }, [loadMaintenancePlans]);

  const removeMaintenancePlan = useCallback(async (id: string) => {
    await supabase.from("maintenance_plan_items").delete().eq("plan_id", id);
    const { error } = await supabase.from("maintenance_plans").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover plano", description: error.message, variant: "destructive" }); return; }
    await loadMaintenancePlans();
    toast({ title: "Plano removido" });
  }, [loadMaintenancePlans]);

  // ─── WORK ORDERS ───────────────────────────────────────────

  const addWorkOrder = useCallback(async (w: {
    assetId: string; assetKind: "machine" | "component"; type: WorkOrderType;
    title: string; description: string; plannedHours: number;
  }) => {
    const { error } = await supabase.from("work_orders").insert({
      asset_id: w.assetId, asset_kind: w.assetKind, type: w.type,
      title: w.title, description: w.description,
      planned_hours: Math.max(0, w.plannedHours),
    });
    if (error) { toast({ title: "Erro ao criar OS", description: error.message, variant: "destructive" }); return; }
    await loadWorkOrders();
    toast({ title: "OS criada" });
  }, [loadWorkOrders]);

  const updateWorkOrder = useCallback(async (id: string, w: Partial<WorkOrder>) => {
    const update: Record<string, unknown> = {};
    if (w.assetId !== undefined) update.asset_id = w.assetId;
    if (w.assetKind !== undefined) update.asset_kind = w.assetKind;
    if (w.type !== undefined) update.type = w.type;
    if (w.status !== undefined) update.status = w.status;
    if (w.reopened !== undefined) update.reopened = w.reopened;
    if (w.title !== undefined) update.title = w.title;
    if (w.description !== undefined) update.description = w.description;
    if (w.plannedHours !== undefined) update.planned_hours = w.plannedHours;
    if (w.actualHours !== undefined) update.actual_hours = w.actualHours;
    if (w.startedAt !== undefined) update.started_at = w.startedAt;
    if (w.finishedAt !== undefined) update.finished_at = w.finishedAt;
    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from("work_orders").update(update).eq("id", id);
      if (error) { toast({ title: "Erro ao atualizar OS", description: error.message, variant: "destructive" }); return; }
    }
    await loadWorkOrders();
    toast({ title: "OS atualizada" });
  }, [loadWorkOrders]);

  const removeWorkOrder = useCallback(async (id: string) => {
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao remover OS", description: error.message, variant: "destructive" }); return; }
    await loadWorkOrders();
    toast({ title: "OS removida" });
  }, [loadWorkOrders]);

  const startWorkOrder = useCallback(async (id: string) => {
    const wo = workOrders.find((w) => w.id === id);
    if (!wo || wo.status !== "open") return;
    await supabase.from("work_orders").update({
      status: "in_progress", started_at: wo.startedAt || new Date().toISOString(),
    }).eq("id", id);
    await loadWorkOrders();
    toast({ title: "OS iniciada" });
  }, [workOrders, loadWorkOrders]);

  const finishWorkOrder = useCallback(async (id: string, actualHours: number) => {
    const now = new Date().toISOString();
    const wo = workOrders.find((w) => w.id === id);
    await supabase.from("work_orders").update({
      status: "completed", started_at: wo?.startedAt || now,
      finished_at: now, actual_hours: Math.max(0, actualHours),
    }).eq("id", id);
    await loadWorkOrders();
    toast({ title: "OS concluída" });
  }, [workOrders, loadWorkOrders]);

  const reopenWorkOrder = useCallback(async (id: string) => {
    await supabase.from("work_orders").update({
      status: "open", reopened: true, started_at: null, finished_at: null, actual_hours: null,
    }).eq("id", id);
    await loadWorkOrders();
    toast({ title: "OS reaberta" });
  }, [loadWorkOrders]);

  // ─── STOP / RESUME ────────────────────────────────────────

  const stopMachine = useCallback(async (id: string, reason: StopReason, description: string, maintenanceType?: 'mechanical' | 'electrical') => {
    let newStatus: MachineStatus = 'stopped';
    if (reason === 'preventive' || reason === 'lubrication') newStatus = 'maintenance';

    await supabase.from("machines").update({ status: newStatus }).eq("id", id);
    await supabase.from("asset_stop_records").insert({
      asset_id: id, asset_kind: "machine", reason, description,
      maintenance_type: maintenanceType || null,
    });
    await loadMachines();
    await loadAssetStopRecords();
    toast({ title: "Máquina parada", description: `Motivo: ${reason}${maintenanceType ? ` (${maintenanceType})` : ''}` });
  }, [loadMachines, loadAssetStopRecords]);

  const resumeMachine = useCallback(async (id: string) => {
    await supabase.from("machines").update({ status: "operating" }).eq("id", id);
    // Find latest open stop record for this machine
    const { data: records } = await supabase.from("asset_stop_records")
      .select("id").eq("asset_id", id).eq("asset_kind", "machine")
      .is("resumed_at", null).order("stopped_at", { ascending: false }).limit(1);
    if (records?.length) {
      await supabase.from("asset_stop_records").update({ resumed_at: new Date().toISOString() }).eq("id", records[0].id);
    }
    await loadMachines();
    await loadAssetStopRecords();
    toast({ title: "Máquina operando novamente" });
  }, [loadMachines, loadAssetStopRecords]);

  const stopComponent = useCallback(async (id: string, reason: StopReason, description: string, maintenanceType?: 'mechanical' | 'electrical') => {
    let newStatus: MachineStatus = 'stopped';
    if (reason === 'preventive' || reason === 'lubrication') newStatus = 'maintenance';

    await supabase.from("components").update({ status: newStatus }).eq("id", id);
    await supabase.from("asset_stop_records").insert({
      asset_id: id, asset_kind: "component", reason, description,
      maintenance_type: maintenanceType || null,
    });
    await loadComponents();
    await loadAssetStopRecords();
    toast({ title: "Componente parado", description: `Motivo: ${reason}${maintenanceType ? ` (${maintenanceType})` : ''}` });
  }, [loadComponents, loadAssetStopRecords]);

  const resumeComponent = useCallback(async (id: string) => {
    await supabase.from("components").update({ status: "operating" }).eq("id", id);
    const { data: records } = await supabase.from("asset_stop_records")
      .select("id").eq("asset_id", id).eq("asset_kind", "component")
      .is("resumed_at", null).order("stopped_at", { ascending: false }).limit(1);
    if (records?.length) {
      await supabase.from("asset_stop_records").update({ resumed_at: new Date().toISOString() }).eq("id", records[0].id);
    }
    await loadComponents();
    await loadAssetStopRecords();
    toast({ title: "Componente operando novamente" });
  }, [loadComponents, loadAssetStopRecords]);

  // ─── PLAN EXECUTIONS ──────────────────────────────────────

  const startPlanExecution = useCallback(async (planId: string, machineId?: string): Promise<string> => {
    const plan = maintenancePlans.find((p) => p.id === planId);

    const { data, error } = await supabase.from("plan_executions").insert({
      plan_id: planId, machine_id: machineId || null,
    }).select().single();

    if (error || !data) {
      console.error("start execution:", error);
      toast({ title: "Erro ao iniciar execução", variant: "destructive" });
      return "";
    }

    // Insert initial item results
    if (plan?.items?.length) {
      await supabase.from("plan_item_results").insert(plan.items.map((item) => ({
        execution_id: data.id, item_id: item.id, completed: false,
      })));
    }

    toast({ title: "Execução iniciada" });
    return data.id;
  }, [maintenancePlans]);

  const updatePlanItemResult = useCallback(async (executionId: string, itemResult: PlanItemResult) => {
    // Check if result exists
    const { data: existing } = await supabase.from("plan_item_results")
      .select("id").eq("execution_id", executionId).eq("item_id", itemResult.itemId).maybeSingle();

    const resultData = {
      execution_id: executionId, item_id: itemResult.itemId,
      completed: itemResult.completed, result: itemResult.result || null,
      completed_at: itemResult.completedAt || null,
      mechanic_id: itemResult.mechanicId || null,
      comment: itemResult.comment || "", photo_url: itemResult.photoUrl || "",
    };

    let resultId: string | undefined;
    if (existing) {
      await supabase.from("plan_item_results").update(resultData).eq("id", existing.id);
      resultId = existing.id;
    } else {
      const { data: inserted } = await supabase.from("plan_item_results")
        .insert(resultData).select("id").maybeSingle();
      resultId = inserted?.id;
    }

    // Persist parts used
    if (resultId && itemResult.partsUsed) {
      await supabase.from("plan_item_parts_used").delete().eq("plan_item_result_id", resultId);
      if (itemResult.partsUsed.length > 0) {
        await supabase.from("plan_item_parts_used").insert(
          itemResult.partsUsed.map((pu) => ({
            plan_item_result_id: resultId,
            part_id: pu.partId,
            quantity: pu.quantity,
          }))
        );
      }
    }
  }, []);

  const completePlanExecution = useCallback(async (executionId: string) => {
    await supabase.from("plan_executions").update({
      status: "completed", completed_at: new Date().toISOString(),
    }).eq("id", executionId);

    await loadPlanExecutions();
    await loadParts();
    toast({ title: "Execução finalizada com sucesso" });
  }, [loadPlanExecutions, loadParts]);

  const stopMachineForExecution = useCallback(async (executionId: string) => {
    const exec = planExecutions.find((e) => e.id === executionId);
    if (!exec?.machineId) return;
    await supabase.from("machines").update({ status: "maintenance" }).eq("id", exec.machineId);
    await loadMachines();
    toast({ title: "Máquina parada registrada" });
  }, [planExecutions, loadMachines]);

  const resumeMachineForExecution = useCallback(async (executionId: string) => {
    const exec = planExecutions.find((e) => e.id === executionId);
    if (!exec?.machineId) return;
    await supabase.from("machines").update({ status: "operating" }).eq("id", exec.machineId);
    await loadMachines();
    toast({ title: "Máquina retomada" });
  }, [planExecutions, loadMachines]);

  return (
    <DataContext.Provider
      value={{
        machines, mechanics, parts, tickets, preventivePlans, failures, notifications,
        purchaseOrders, stockEntries, inventoryCounts, checklistTemplates,
        maintenancePlans, planExecutions, workOrders, assetStopRecords, suppliers,
        userAssignedMachineIds, userAssignedComponentIds,
        addMachine, updateMachine, removeMachine,
        addMechanic, updateMechanic, removeMechanic,
        addPart, addPartSync, updatePart, removePart,
        addTicket, updateTicket, removeTicket,
        addPreventivePlan, updatePreventivePlan, removePreventivePlan,
        addFailure, updateFailure, removeFailure,
        addPurchaseOrder, updatePurchaseOrder, removePurchaseOrder,
        addStockEntry,
        addInventoryCount,
        addChecklistTemplate, updateChecklistTemplate, removeChecklistTemplate,
        addMaintenancePlan, updateMaintenancePlan, removeMaintenancePlan,
        startPlanExecution, updatePlanItemResult, completePlanExecution,
        stopMachineForExecution, resumeMachineForExecution,
        addWorkOrder, updateWorkOrder, removeWorkOrder, startWorkOrder, finishWorkOrder, reopenWorkOrder,
        components, addComponent, updateComponent, removeComponent,
        stopMachine, resumeMachine, stopComponent, resumeComponent,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
