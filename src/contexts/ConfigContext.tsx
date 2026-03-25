import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/integrations/supabase/client";
import type {
  AssetKind,
  ComponentApplyMode,
  ComponentRule,
  ComponentType,
  Line,
  LubricationExecution,
  LubricationPlan,
  Machine,
  MachineComponent,
  MachineStatus,
  MachineType,
} from "@/data/types";

const SYSTEM_LINE_NAME = "Sem linha";
const DEFAULT_FREQUENCY_DAYS = 90;

type NewMachinePayload = {
  baseTag: string;
  type: MachineType;
  model: string;
  manufacturer: string;
  year: number;
  horimeter: number;
  status: MachineStatus;
  lineMode: "single" | "all";
  line?: string;
};

type NewComponentPayload = {
  name: string;
  tag: string;
  type: ComponentType;
  machineType: MachineType;
  model?: string;
  scope: "single_machine" | "all_of_type";
  machineId?: string;
  applyMode?: ComponentApplyMode;
};

type NewManualLubricationPlan = {
  assetId: string;
  assetKind: AssetKind;
  whatToLubricate: string;
  lubricantType: string;
  attentionPoints: string;
  frequencyDays: number;
  nextDueDate: string;
};

export type ComponentTypeConfig = {
  id: string;
  key: string;
  name: string;
};

type ConfigContextType = {
  lines: Line[];
  componentRules: ComponentRule[];
  componentTypes: ComponentTypeConfig[];
  lubricationPlans: LubricationPlan[];
  lubricationExecutions: LubricationExecution[];
  createMachineWithScope: (payload: NewMachinePayload) => void;
  createComponentWithScope: (payload: NewComponentPayload) => void;
  addLine: (name: string) => void;
  updateLine: (id: string, name: string) => void;
  removeLine: (id: string) => void;
  addComponentType: (key: string, name: string) => void;
  updateComponentType: (id: string, name: string) => void;
  removeComponentType: (id: string) => void;
  addLubricationPlan: (payload: NewManualLubricationPlan) => void;
  updateLubricationPlan: (id: string, payload: Partial<Omit<LubricationPlan, "id" | "assetId" | "assetKind">>) => void;
  removeLubricationPlan: (id: string) => void;
  executeLubricationPlan: (id: string, payload: { executedAt: string; notes?: string; nextDueDate?: string }) => void;
  adjustLubricationNextDueDate: (id: string, nextDueDate: string) => void;
};

const ConfigContext = createContext<ConfigContextType | null>(null);

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysIso(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T00:00:00`);
  base.setDate(base.getDate() + Math.max(1, days));
  return toIsoDate(base);
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const {
    machines,
    components,
    addMachine,
    updateMachine,
    addComponent,
    updateComponent,
    removeComponent: removeComponentFromData,
  } = useData();

  const [lines, setLines] = useState<Line[]>([]);
  const [componentRules, setComponentRules] = useState<ComponentRule[]>([]);
  const [lubricationPlans, setLubricationPlans] = useState<LubricationPlan[]>([]);
  const [lubricationExecutions, setLubricationExecutions] = useState<LubricationExecution[]>([]);
  const [componentTypes, setComponentTypes] = useState<ComponentTypeConfig[]>([]);

  const allTags = useMemo(
    () => new Set<string>([...machines.map((machine) => machine.tag.toLowerCase()), ...components.map((component) => component.tag.toLowerCase())]),
    [machines, components],
  );

  const nextUniqueTag = useCallback((baseTag: string, reserved: Set<string>) => {
    const normalized = baseTag.trim();
    if (!reserved.has(normalized.toLowerCase())) return normalized;

    const match = normalized.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const size = match[2].length;
      let value = parseInt(match[2], 10) + 1;
      let candidate = `${prefix}${String(value).padStart(size, "0")}`;
      while (reserved.has(candidate.toLowerCase())) {
        value += 1;
        candidate = `${prefix}${String(value).padStart(size, "0")}`;
      }
      return candidate;
    }

    let index = 1;
    let candidate = `${normalized}-${index}`;
    while (reserved.has(candidate.toLowerCase())) {
      index += 1;
      candidate = `${normalized}-${index}`;
    }
    return candidate;
  }, []);

  // ---- Load lines from DB ----
  const loadLines = useCallback(async () => {
    const { data, error } = await supabase.from("lines").select("*");
    if (error) {
      console.error("Error loading lines:", error);
      return;
    }
    setLines(
      (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        active: row.active,
        isSystem: row.is_system,
      })),
    );
  }, []);

  // ---- Load component rules from DB ----
  const loadComponentRules = useCallback(async () => {
    const { data, error } = await supabase.from("component_rules").select("*");
    if (error) {
      console.error("Error loading component rules:", error);
      return;
    }
    setComponentRules(
      (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        tag: row.tag,
        type: row.type as ComponentType,
        machineType: row.machine_type as MachineType,
        model: row.model || "",
        applyMode: row.apply_mode as ComponentApplyMode,
        createdAt: row.created_at,
      })),
    );
  }, []);

  // ---- Load lubrication plans from DB ----
  const loadLubricationPlans = useCallback(async () => {
    const { data, error } = await supabase.from("lubrication_plans").select("*");
    if (error) {
      console.error("Error loading lubrication plans:", error);
      return;
    }
    setLubricationPlans(
      (data || []).map((row) => ({
        id: row.id,
        assetId: row.asset_id,
        assetKind: row.asset_kind as AssetKind,
        assetTag: row.asset_tag,
        assetName: row.asset_name,
        machineType: row.machine_type as MachineType,
        line: row.line,
        whatToLubricate: row.what_to_lubricate,
        lubricantType: row.lubricant_type,
        attentionPoints: row.attention_points,
        frequencyDays: row.frequency_days,
        nextDueDate: row.next_due_date ? row.next_due_date.slice(0, 10) : undefined,
        lastExecutionAt: row.last_execution_at ? row.last_execution_at.slice(0, 10) : undefined,
        active: row.active,
      })),
    );
  }, []);

  // ---- Load lubrication executions from DB ----
  const loadLubricationExecutions = useCallback(async () => {
    const { data, error } = await supabase.from("lubrication_executions").select("*");
    if (error) {
      console.error("Error loading lubrication executions:", error);
      return;
    }
    setLubricationExecutions(
      (data || []).map((row) => ({
        id: row.id,
        planId: row.plan_id,
        executedAt: row.executed_at,
        notes: row.notes || undefined,
        previousDueDate: row.previous_due_date || undefined,
        nextDueDateAfterExecution: row.next_due_date_after || undefined,
        manuallyAdjusted: row.manually_adjusted,
      })),
    );
  }, []);

  // ---- Initial load ----
  useEffect(() => {
    loadLines();
    loadComponentRules();
    loadLubricationPlans();
    loadLubricationExecutions();
  }, [loadLines, loadComponentRules, loadLubricationPlans, loadLubricationExecutions]);

  // ---- Auto-apply current_and_future component rules ----
  useEffect(() => {
    if (componentRules.length === 0) return;
    const reserved = new Set(allTags);

    componentRules
      .filter((rule) => rule.applyMode === "current_and_future")
      .forEach((rule) => {
        machines
          .filter((machine) => machine.type === rule.machineType)
          .forEach((machine) => {
            const alreadyExists = components.some((component) => component.machineId === machine.id && component.ruleId === rule.id);
            if (alreadyExists) return;

            const tag = nextUniqueTag(rule.tag, reserved);
            reserved.add(tag.toLowerCase());

            addComponent({
              name: rule.name,
              tag,
              type: rule.type,
              machineType: rule.machineType,
              machineId: machine.id,
              ruleId: rule.id,
              status: "operating",
              model: rule.model,
              sector: machine.sector || SYSTEM_LINE_NAME,
              dailyChecklistTotal: 0,
              dailyChecklistCompleted: 0,
              preventiveOverdue: 0,
              preventiveUpcoming: 0,
              correctivePending: 0,
            });
          });
      });
  }, [componentRules, machines, components, addComponent, allTags, nextUniqueTag]);

  // ---- Lines CRUD ----
  const addLine = useCallback(async (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    const { error } = await supabase.from("lines").insert({ name: normalized, active: true, is_system: false });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Linha já existe" });
      } else {
        console.error("Error adding line:", error);
      }
      return;
    }
    await loadLines();
    toast({ title: "Linha cadastrada" });
  }, [loadLines]);

  const updateLine = useCallback(
    async (id: string, name: string) => {
      const normalized = name.trim();
      if (!normalized) return;

      const line = lines.find((item) => item.id === id);
      if (!line || line.isSystem) return;

      const { error } = await supabase.from("lines").update({ name: normalized }).eq("id", id);
      if (error) {
        console.error("Error updating line:", error);
        return;
      }

      machines.filter((machine) => machine.sector === line.name).forEach((machine) => updateMachine(machine.id, { sector: normalized }));
      components.filter((component) => component.sector === line.name).forEach((component) => updateComponent(component.id, { sector: normalized }));

      // Update lubrication plans line reference
      await supabase.from("lubrication_plans").update({ line: normalized }).eq("line", line.name);

      await loadLines();
      await loadLubricationPlans();
      toast({ title: "Linha atualizada" });
    },
    [lines, machines, components, updateMachine, updateComponent, loadLines, loadLubricationPlans],
  );

  const removeLine = useCallback(
    async (id: string) => {
      const line = lines.find((item) => item.id === id);
      if (!line || line.isSystem) return;

      const { error } = await supabase.from("lines").delete().eq("id", id);
      if (error) {
        console.error("Error removing line:", error);
        return;
      }

      machines.filter((machine) => machine.sector === line.name).forEach((machine) => updateMachine(machine.id, { sector: SYSTEM_LINE_NAME }));
      components.filter((component) => component.sector === line.name).forEach((component) => updateComponent(component.id, { sector: SYSTEM_LINE_NAME }));

      await supabase.from("lubrication_plans").update({ line: SYSTEM_LINE_NAME }).eq("line", line.name);

      await loadLines();
      await loadLubricationPlans();
      toast({ title: "Linha removida", description: `Itens movidos para ${SYSTEM_LINE_NAME}` });
    },
    [lines, machines, components, updateMachine, updateComponent, loadLines, loadLubricationPlans],
  );

  // ---- Machine / Component creation with scope ----
  const createMachineWithScope = useCallback(
    (payload: NewMachinePayload) => {
      const targetLines =
        payload.lineMode === "all"
          ? lines.filter((line) => line.active && !line.isSystem).map((line) => line.name)
          : [payload.line || SYSTEM_LINE_NAME];
      const safeTargetLines = targetLines.length > 0 ? targetLines : [SYSTEM_LINE_NAME];

      const reserved = new Set(allTags);
      safeTargetLines.forEach((lineName) => {
        const tag = nextUniqueTag(payload.baseTag, reserved);
        reserved.add(tag.toLowerCase());
        addMachine({
          tag,
          type: payload.type,
          model: payload.model,
          manufacturer: payload.manufacturer,
          year: payload.year,
          sector: lineName,
          status: payload.status,
          horimeter: payload.horimeter,
          dailyChecklistTotal: 0,
          dailyChecklistCompleted: 0,
          preventiveOverdue: 0,
          preventiveUpcoming: 0,
          correctivePending: 0,
        });
      });
    },
    [lines, addMachine, nextUniqueTag, allTags],
  );

  const createComponentWithScope = useCallback(
    async (payload: NewComponentPayload) => {
      const reserved = new Set(allTags);

      if (payload.scope === "single_machine") {
        const machine = machines.find((item) => item.id === payload.machineId);
        if (!machine) return;

        const tag = nextUniqueTag(payload.tag, reserved);
        addComponent({
          name: payload.name,
          tag,
          type: payload.type,
          machineType: machine.type,
          machineId: machine.id,
          status: "operating",
          model: payload.model,
          sector: machine.sector || SYSTEM_LINE_NAME,
          dailyChecklistTotal: 0,
          dailyChecklistCompleted: 0,
          preventiveOverdue: 0,
          preventiveUpcoming: 0,
          correctivePending: 0,
        });
        return;
      }

      // Insert component rule to DB if current_and_future
      let ruleId: string | undefined;
      if (payload.applyMode === "current_and_future") {
        const { data: ruleData, error: ruleError } = await supabase
          .from("component_rules")
          .insert({
            name: payload.name,
            tag: payload.tag,
            type: payload.type,
            machine_type: payload.machineType,
            model: payload.model || "",
            apply_mode: "current_and_future",
          })
          .select("id")
          .single();
        if (ruleError) {
          console.error("Error creating component rule:", ruleError);
          return;
        }
        ruleId = ruleData.id;
        await loadComponentRules();
      }

      const targetMachines = machines.filter((machine) => machine.type === payload.machineType);

      targetMachines.forEach((machine) => {
        const tag = nextUniqueTag(payload.tag, reserved);
        reserved.add(tag.toLowerCase());
        addComponent({
          name: payload.name,
          tag,
          type: payload.type,
          machineType: payload.machineType,
          machineId: machine.id,
          ruleId,
          status: "operating",
          model: payload.model,
          sector: machine.sector || SYSTEM_LINE_NAME,
          dailyChecklistTotal: 0,
          dailyChecklistCompleted: 0,
          preventiveOverdue: 0,
          preventiveUpcoming: 0,
          correctivePending: 0,
        });
      });
    },
    [allTags, machines, addComponent, nextUniqueTag, loadComponentRules],
  );

  // ---- Lubrication CRUD ----
  const addLubricationPlan = useCallback(
    async (payload: NewManualLubricationPlan) => {
      const machine = machines.find((item) => item.id === payload.assetId);
      const component = components.find((item) => item.id === payload.assetId);
      if (!machine && !component) return;

      const { error } = await supabase.from("lubrication_plans").insert({
        asset_id: payload.assetId,
        asset_kind: payload.assetKind,
        asset_tag: machine?.tag || component?.tag || "",
        asset_name: machine?.model || component?.name || "",
        machine_type: machine?.type || component?.machineType || "extrusora",
        line: machine?.sector || component?.sector || SYSTEM_LINE_NAME,
        what_to_lubricate: payload.whatToLubricate,
        lubricant_type: payload.lubricantType,
        attention_points: payload.attentionPoints,
        frequency_days: Math.max(1, payload.frequencyDays),
        next_due_date: payload.nextDueDate,
        active: true,
      });
      if (error) {
        console.error("Error adding lubrication plan:", error);
        return;
      }
      await loadLubricationPlans();
    },
    [machines, components, loadLubricationPlans],
  );

  const updateLubricationPlan = useCallback(
    async (id: string, payload: Partial<Omit<LubricationPlan, "id" | "assetId" | "assetKind">>) => {
      const updateData: Record<string, unknown> = {};
      if (payload.whatToLubricate !== undefined) updateData.what_to_lubricate = payload.whatToLubricate;
      if (payload.lubricantType !== undefined) updateData.lubricant_type = payload.lubricantType;
      if (payload.attentionPoints !== undefined) updateData.attention_points = payload.attentionPoints;
      if (payload.frequencyDays !== undefined) updateData.frequency_days = payload.frequencyDays;
      if (payload.nextDueDate !== undefined) updateData.next_due_date = payload.nextDueDate;
      if (payload.active !== undefined) updateData.active = payload.active;
      if (payload.line !== undefined) updateData.line = payload.line;

      const { error } = await supabase.from("lubrication_plans").update(updateData).eq("id", id);
      if (error) {
        console.error("Error updating lubrication plan:", error);
        return;
      }
      await loadLubricationPlans();
    },
    [loadLubricationPlans],
  );

  const removeLubricationPlan = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("lubrication_plans").update({ active: false }).eq("id", id);
      if (error) {
        console.error("Error removing lubrication plan:", error);
        return;
      }
      await loadLubricationPlans();
    },
    [loadLubricationPlans],
  );

  const executeLubricationPlan = useCallback(
    async (id: string, payload: { executedAt: string; notes?: string; nextDueDate?: string }) => {
      const plan = lubricationPlans.find((p) => p.id === id);
      if (!plan) return;

      const nextDueDate = payload.nextDueDate || addDaysIso(payload.executedAt, plan.frequencyDays);

      const { error: execError } = await supabase.from("lubrication_executions").insert({
        plan_id: id,
        executed_at: payload.executedAt,
        notes: payload.notes || "",
        previous_due_date: plan.nextDueDate || null,
        next_due_date_after: nextDueDate,
        manually_adjusted: !!payload.nextDueDate,
      });
      if (execError) {
        console.error("Error inserting lubrication execution:", execError);
        return;
      }

      await supabase
        .from("lubrication_plans")
        .update({ last_execution_at: payload.executedAt, next_due_date: nextDueDate })
        .eq("id", id);

      await loadLubricationPlans();
      await loadLubricationExecutions();
    },
    [lubricationPlans, loadLubricationPlans, loadLubricationExecutions],
  );

  const adjustLubricationNextDueDate = useCallback(
    async (id: string, nextDueDate: string) => {
      const { error } = await supabase.from("lubrication_plans").update({ next_due_date: nextDueDate }).eq("id", id);
      if (error) {
        console.error("Error adjusting due date:", error);
        return;
      }
      await loadLubricationPlans();
    },
    [loadLubricationPlans],
  );

  return (
    <ConfigContext.Provider
      value={{
        lines,
        componentRules,
        lubricationPlans,
        lubricationExecutions,
        createMachineWithScope,
        createComponentWithScope,
        addLine,
        updateLine,
        removeLine,
        addLubricationPlan,
        updateLubricationPlan,
        removeLubricationPlan,
        executeLubricationPlan,
        adjustLubricationNextDueDate,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within ConfigProvider");
  }
  return context;
}
