import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Factory,
  ClipboardList,
  Wrench,
  Settings,
  History,
  Package,
  MonitorStop,
  PlayCircle,
  Plus,
  Droplets,
  CalendarCheck2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COMPONENT_TYPE_LABELS, MACHINE_STATUS_LABELS, MACHINE_TYPE_LABELS, OS_TYPE_LABELS, PRIORITY_LABELS, TICKET_STATUS_LABELS } from "@/data/types";
import { useData } from "@/contexts/DataContext";
import type { MachineStatus, StopReason, MaintenancePlanItem, Priority, Ticket, LubricationPlan } from "@/data/types";
import { StopMachineDialog } from "@/components/dialogs/StopMachineDialog";
import { ResumeMachineDialog } from "@/components/dialogs/ResumeMachineDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConfig } from "@/contexts/ConfigContext";
import { useAuth } from "@/hooks/useAuth";

type ItemResultValue = "ok" | "nok";

type PlanItemRow = {
  planId: string;
  planName: string;
  item: MaintenancePlanItem;
};

type ItemDraft = {
  result?: ItemResultValue;
  comment?: string;
  photoUrl?: string;
  partsUsed?: Array<{ partId: string; quantity: number }>;
};

type ItemDraftMap = Record<string, Record<string, ItemDraft | undefined>>;

type EditorTarget = {
  kind: "checklist" | "preventive";
  row: PlanItemRow;
};

type TicketResolutionDraft = {
  status: Ticket["status"];
  comment: string;
  photoUrl: string;
  partsUsed: Array<{ partId: string; quantity: number }>;
};

type HistoryRow = {
  id: string;
  date: string;
  type: "Checklist" | "Preventiva" | "Corretiva" | "Inspeção";
  description: string;
  resultOrStatus: string;
  collaborator?: string;
  comment?: string;
  photoUrl?: string;
  partsUsed?: Array<{ partId: string; quantity: number }>;
};

const statusVariant: Record<MachineStatus, string> = {
  operating: "bg-status-operating text-white",
  stopped: "bg-status-stopped text-white",
  maintenance: "bg-status-maintenance text-white",
  waiting: "bg-status-waiting text-black",
  scheduled: "bg-status-scheduled text-white",
};

const ticketStatusColor: Record<Ticket["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_maintenance: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function resultBadgeClass(result?: ItemResultValue) {
  return result === "nok"
    ? "bg-destructive text-destructive-foreground"
    : "bg-[hsl(var(--status-operating))] text-white";
}

function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{message}</p>
      <p className="text-sm text-muted-foreground mt-2">Os dados serão cadastrados posteriormente</p>
    </div>
  );
}

function ResultSelector({
  value,
  onChange,
}: {
  value?: ItemResultValue;
  onChange: (value: ItemResultValue) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        className={`h-7 px-3 text-xs ${
          value === "ok"
            ? "bg-[hsl(var(--status-operating))] text-white hover:bg-[hsl(var(--status-operating))]/90"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
        onClick={() => onChange("ok")}
      >
        OK
      </Button>
      <Button
        type="button"
        size="sm"
        className={`h-7 px-3 text-xs ${
          value === "nok" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
        onClick={() => onChange("nok")}
      >
        NOK
      </Button>
    </div>
  );
}

export default function MachineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "checklist";
  const isMobile = useIsMobile();
  const { role, loading: authLoading } = useAuth();
  const isOperator = role === "operator";
  const {
    machines,
    components,
    mechanics,
    stopMachine,
    resumeMachine,
    stopComponent,
    resumeComponent,
    maintenancePlans,
    planExecutions,
    startPlanExecution,
    updatePlanItemResult,
    completePlanExecution,
    parts,
    tickets,
    updateTicket,
  } = useData();

  const {
    lubricationPlans: allLubricationPlans,
    lubricationExecutions,
    executeLubricationPlan,
    adjustLubricationNextDueDate,
  } = useConfig();

  const [showStopDialog, setShowStopDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [checklistDrafts, setChecklistDrafts] = useState<ItemDraftMap>({});
  const [preventiveDrafts, setPreventiveDrafts] = useState<ItemDraftMap>({});
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [editorForm, setEditorForm] = useState<ItemDraft>({});
  const [partSelection, setPartSelection] = useState<{ partId: string; quantity: number }>({ partId: "", quantity: 1 });
  const [ticketTypeFilter, setTicketTypeFilter] = useState<"all" | Ticket["type"]>("all");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<"all" | Priority>("all");
  const [ticketModal, setTicketModal] = useState<Ticket | null>(null);
  const [historyModal, setHistoryModal] = useState<HistoryRow | null>(null);
  const [ticketDraft, setTicketDraft] = useState<TicketResolutionDraft>({
    status: "pending",
    comment: "",
    photoUrl: "",
    partsUsed: [],
  });
  const [ticketPartSelection, setTicketPartSelection] = useState<{ partId: string; quantity: number }>({ partId: "", quantity: 1 });

  // Lubrication state
  const [lubeExecuteDialogOpen, setLubeExecuteDialogOpen] = useState(false);
  const [lubeHistoryDialogOpen, setLubeHistoryDialogOpen] = useState(false);
  const [selectedLubePlanId, setSelectedLubePlanId] = useState<string | null>(null);
  const [lubeExecutedAt, setLubeExecutedAt] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [lubeExecutionNotes, setLubeExecutionNotes] = useState("");
  const [lubeOverrideDueDate, setLubeOverrideDueDate] = useState("");

  const machine = machines.find((m) => m.id === id);
  const component = components.find((c) => c.id === id);
  const isComponent = !machine && !!component;
  const asset = machine || component;
  const machineId = asset?.id || "";
  const machineType = machine ? machine.type : component?.machineType;

  const today = useMemo(() => new Date(), []);
  const todayStart = startOfDay(today);

  const handleStopMachine = (
    reason: StopReason,
    description: string,
    maintenanceType?: "mechanical" | "electrical",
  ) => {
    if (!machineId) return;
    if (machine) {
      stopMachine(machineId, reason, description, maintenanceType);
      return;
    }
    if (component) {
      stopComponent(machineId, reason, description, maintenanceType);
    }
  };

  const handleResumeMachine = () => {
    if (!machineId) return;
    if (machine) {
      resumeMachine(machineId);
      return;
    }
    if (component) {
      resumeComponent(machineId);
    }
  };

  const machineChecklists = maintenancePlans.filter(
    (plan) =>
      plan.active &&
      plan.planType === "checklist" &&
      (plan.machineId ? plan.machineId === machineId : plan.machineType === machineType),
  );
  const machinePreventives = maintenancePlans.filter(
    (plan) =>
      plan.active &&
      plan.planType === "preventive" &&
      (plan.machineId ? plan.machineId === machineId : plan.machineType === machineType),
  );

  // Filter items by responsible when operator
  const filterItemsByRole = (items: MaintenancePlanItem[]) => {
    if (authLoading) return []; // Don't show items while role is loading
    if (!isOperator) return items;
    return items.filter((item) => item.responsible === "operador");
  };

  const checklistRows = useMemo<PlanItemRow[]>(
    () =>
      machineChecklists.flatMap((plan) =>
        filterItemsByRole(plan.items).map((item) => ({ planId: plan.id, planName: plan.name, item })),
      ),
    [machineChecklists, isOperator, authLoading],
  );

  const preventiveRows = useMemo<PlanItemRow[]>(
    () =>
      machinePreventives.flatMap((plan) =>
        filterItemsByRole(plan.items).map((item) => ({ planId: plan.id, planName: plan.name, item })),
      ),
    [machinePreventives, isOperator, authLoading],
  );

  const machineTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        if (ticket.machineId !== machineId) return false;
        if (ticketTypeFilter !== "all" && ticket.type !== ticketTypeFilter) return false;
        if (ticketPriorityFilter !== "all" && ticket.priority !== ticketPriorityFilter) return false;
        return true;
      }),
    [tickets, machineId, ticketTypeFilter, ticketPriorityFilter],
  );

  const checklistTodayByItem = useMemo(() => {
    const checklistPlanIds = new Set(machineChecklists.map((plan) => plan.id));
    const map = new Map<string, { completedAt: string; result?: ItemResultValue }>();

    planExecutions.forEach((execution) => {
      if (execution.machineId !== machineId || !checklistPlanIds.has(execution.planId)) return;

      execution.itemResults.forEach((itemResult) => {
        if (!itemResult.completed || !itemResult.completedAt) return;
        const completedAtDate = new Date(itemResult.completedAt);
        if (!isSameDay(completedAtDate, today)) return;

        const key = `${execution.planId}:${itemResult.itemId}`;
        const current = map.get(key);
        if (!current || new Date(current.completedAt).getTime() < completedAtDate.getTime()) {
          map.set(key, {
            completedAt: itemResult.completedAt,
            result: itemResult.result,
          });
        }
      });
    });

    return map;
  }, [planExecutions, machineChecklists, machineId, today]);

  const checklistPendingRows = checklistRows.filter(
    (row) => !checklistTodayByItem.has(`${row.planId}:${row.item.id}`),
  );

  const checklistCompletedRows = checklistRows
    .map((row) => {
      const key = `${row.planId}:${row.item.id}`;
      const completed = checklistTodayByItem.get(key);
      if (!completed) return null;
      return {
        ...row,
        completedAt: completed.completedAt,
        result: completed.result,
      };
    })
    .filter((row): row is PlanItemRow & { completedAt: string; result: ItemResultValue | undefined } => row !== null)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const preventiveLatestByItem = useMemo(() => {
    const preventivePlanIds = new Set(machinePreventives.map((plan) => plan.id));
    const map = new Map<string, { completedAt: string; result?: ItemResultValue }>();

    planExecutions.forEach((execution) => {
      if (execution.machineId !== machineId || !preventivePlanIds.has(execution.planId)) return;
      execution.itemResults.forEach((itemResult) => {
        if (!itemResult.completed || !itemResult.completedAt) return;
        const key = `${execution.planId}:${itemResult.itemId}`;
        const current = map.get(key);
        if (!current || new Date(current.completedAt).getTime() < new Date(itemResult.completedAt).getTime()) {
          map.set(key, { completedAt: itemResult.completedAt, result: itemResult.result });
        }
      });
    });

    return map;
  }, [planExecutions, machinePreventives, machineId]);

  const preventiveRowsWithDue = useMemo(
    () =>
      preventiveRows
        .map((row) => {
          const key = `${row.planId}:${row.item.id}`;
          const latest = preventiveLatestByItem.get(key);
          const dueDate = latest ? addDays(new Date(latest.completedAt), row.item.frequencyDays) : todayStart;
          return {
            ...row,
            latestDone: latest?.completedAt,
            lastResult: latest?.result,
            dueDate,
          };
        })
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
    [preventiveRows, preventiveLatestByItem, todayStart],
  );

  const historyRows = useMemo<HistoryRow[]>(() => {
    const rows: HistoryRow[] = [];
    const planById = new Map(maintenancePlans.map((plan) => [plan.id, plan]));
    const mechanicById = new Map(mechanics.map((mechanic) => [mechanic.id, mechanic.name]));

    planExecutions
      .filter((execution) => execution.machineId === machineId)
      .forEach((execution) => {
        const plan = planById.get(execution.planId);
        if (!plan) return;

        execution.itemResults.forEach((itemResult) => {
          const item = plan.items.find((planItem) => planItem.id === itemResult.itemId);
          if (!item) return;
          const eventDate = itemResult.completedAt || execution.completedAt || execution.startedAt;

          rows.push({
            id: `plan-${execution.id}-${item.id}`,
            date: eventDate,
            type: plan.planType === "checklist" ? "Checklist" : "Preventiva",
            description: `${plan.name} - ${item.description}`,
            resultOrStatus: (itemResult.result || "ok").toUpperCase(),
            collaborator: itemResult.mechanicId ? mechanicById.get(itemResult.mechanicId) : undefined,
            comment: itemResult.comment || "",
            photoUrl: itemResult.photoUrl || "",
            partsUsed: itemResult.partsUsed || [],
          });
        });
      });

    tickets
      .filter(
        (ticket) =>
          ticket.machineId === machineId &&
          ticket.status === "resolved" &&
          (ticket.type === "corrective" || ticket.type === "inspection"),
      )
      .forEach((ticket) => {
        rows.push({
          id: `ticket-${ticket.id}`,
          date: ticket.resolvedAt || ticket.createdAt,
          type: ticket.type === "inspection" ? "Inspeção" : "Corretiva",
          description: ticket.symptom,
          resultOrStatus: "RESOLVIDO",
          collaborator: ticket.createdBy || ticket.reportedBy,
          comment: ticket.comment || "",
          photoUrl: ticket.photoUrl || "",
          partsUsed: ticket.partsUsed || [],
        });
      });

    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenancePlans, mechanics, machineId, planExecutions, tickets]);

  const updateDraft = (
    setter: (value: ((prev: ItemDraftMap) => ItemDraftMap)) => void,
    planId: string,
    itemId: string,
    patch: Partial<ItemDraft>,
  ) => {
    setter((prev) => ({
      ...prev,
      [planId]: {
        ...(prev[planId] || {}),
        [itemId]: {
          ...(prev[planId]?.[itemId] || {}),
          ...patch,
        },
      },
    }));
  };

  const getDraft = (drafts: ItemDraftMap, planId: string, itemId: string): ItemDraft =>
    drafts[planId]?.[itemId] || {};

  const openEditor = (kind: "checklist" | "preventive", row: PlanItemRow) => {
    const sourceDraft = (kind === "preventive" ? preventiveDrafts : checklistDrafts)[row.planId]?.[row.item.id] || {};
    setEditorForm({
      result: sourceDraft.result,
      comment: sourceDraft.comment || "",
      photoUrl: sourceDraft.photoUrl || "",
      partsUsed: sourceDraft.partsUsed ? [...sourceDraft.partsUsed] : [],
    });
    setEditorTarget({ kind, row });
    setPartSelection({ partId: "", quantity: 1 });
  };

  const openTicketResolution = (ticket: Ticket) => {
    setTicketModal(ticket);
    setTicketDraft({
      status: ticket.status,
      comment: ticket.comment || "",
      photoUrl: ticket.photoUrl || "",
      partsUsed: ticket.partsUsed || [],
    });
    setTicketPartSelection({ partId: "", quantity: 1 });
  };

  const checklistSelectedCount = checklistPendingRows.reduce((count, row) => {
    const result = checklistDrafts[row.planId]?.[row.item.id]?.result;
    return result ? count + 1 : count;
  }, 0);

  const preventiveSelectedCount = preventiveRowsWithDue.reduce((count, row) => {
    const result = preventiveDrafts[row.planId]?.[row.item.id]?.result;
    return result ? count + 1 : count;
  }, 0);

  const persistDrafts = async (drafts: ItemDraftMap, rows: PlanItemRow[]) => {
    const grouped: Record<string, Array<{ itemId: string; draft: ItemDraft }>> = {};

    rows.forEach((row) => {
      const draft = drafts[row.planId]?.[row.item.id];
      if (!draft?.result) return;
      grouped[row.planId] = grouped[row.planId] || [];
      grouped[row.planId].push({ itemId: row.item.id, draft });
    });

    for (const [planId, items] of Object.entries(grouped)) {
      if (items.length === 0) continue;
      if (!machineId) continue;
      const executionId = await startPlanExecution(planId, machineId);
      if (!executionId) continue;
      const nowIso = new Date().toISOString();
      for (const { itemId, draft } of items) {
        await updatePlanItemResult(executionId, {
          itemId,
          completed: true,
          result: draft.result,
          completedAt: nowIso,
          comment: draft.comment || "",
          photoUrl: draft.photoUrl || "",
          partsUsed: draft.partsUsed || [],
        });
      }
      // Deduct stock for parts used directly here since completePlanExecution
      // can't access draft data
      const allPartsUsed: { partId: string; quantity: number }[] = [];
      items.forEach(({ draft }) => {
        (draft.partsUsed || []).forEach((pu) => {
          const existing = allPartsUsed.find((p) => p.partId === pu.partId);
          if (existing) existing.quantity += pu.quantity;
          else allPartsUsed.push({ ...pu });
        });
      });
      // Import supabase for stock deduction
      for (const pu of allPartsUsed) {
        const part = parts.find((p) => p.id === pu.partId);
        if (part) {
          await supabase.from("parts").update({ quantity: Math.max(0, (part.quantity || 0) - pu.quantity) }).eq("id", pu.partId);
        }
      }
      await completePlanExecution(executionId);
    }
  };

  const handleSaveChecklist = async () => {
    await persistDrafts(checklistDrafts, checklistPendingRows);
    setChecklistDrafts({});
  };

  const handleSavePreventive = async () => {
    await persistDrafts(preventiveDrafts, preventiveRowsWithDue);
    setPreventiveDrafts({});
  };

    const editorDraft = editorTarget ? editorForm : {};

  const addPartToEditorDraft = () => {
    if (!editorTarget || !partSelection.partId || partSelection.quantity <= 0) return;
    const currentParts = editorForm.partsUsed || [];
    const existingIndex = currentParts.findIndex((p) => p.partId === partSelection.partId);
    const nextParts =
      existingIndex >= 0
        ? currentParts.map((p, idx) =>
            idx === existingIndex ? { ...p, quantity: p.quantity + partSelection.quantity } : p,
          )
        : [...currentParts, { partId: partSelection.partId, quantity: partSelection.quantity }];
    setEditorForm((prev) => ({ ...prev, partsUsed: nextParts }));
    setPartSelection({ partId: "", quantity: 1 });
  };

  const removePartFromEditorDraft = (partId: string) => {
    const nextParts = (editorForm.partsUsed || []).filter((p) => p.partId !== partId);
    setEditorForm((prev) => ({ ...prev, partsUsed: nextParts }));
  };

  const addPartToTicketDraft = () => {
    if (!ticketPartSelection.partId || ticketPartSelection.quantity <= 0) return;
    const existingIndex = ticketDraft.partsUsed.findIndex((p) => p.partId === ticketPartSelection.partId);
    const nextParts =
      existingIndex >= 0
        ? ticketDraft.partsUsed.map((p, idx) =>
            idx === existingIndex ? { ...p, quantity: p.quantity + ticketPartSelection.quantity } : p,
          )
        : [...ticketDraft.partsUsed, { partId: ticketPartSelection.partId, quantity: ticketPartSelection.quantity }];
    setTicketDraft((prev) => ({ ...prev, partsUsed: nextParts }));
    setTicketPartSelection({ partId: "", quantity: 1 });
  };

  const removePartFromTicketDraft = (partId: string) => {
    setTicketDraft((prev) => ({ ...prev, partsUsed: prev.partsUsed.filter((p) => p.partId !== partId) }));
  };

  const saveTicketResolution = () => {
    if (!ticketModal) return;
    updateTicket(ticketModal.id, {
      status: ticketDraft.status,
      resolvedAt: ticketDraft.status === "resolved" ? new Date().toISOString() : undefined,
      comment: ticketDraft.comment,
      photoUrl: ticketDraft.photoUrl,
      partsUsed: ticketDraft.partsUsed,
    });
    setTicketModal(null);
    setTicketPartSelection({ partId: "", quantity: 1 });
  };

  const closeEditorWithoutSaving = () => {
    setEditorTarget(null);
    setEditorForm({});
    setPartSelection({ partId: "", quantity: 1 });
  };

  const saveEditorAndClose = () => {
    if (!editorTarget) return;
    const setter = editorTarget.kind === "preventive" ? setPreventiveDrafts : setChecklistDrafts;
    updateDraft(setter, editorTarget.row.planId, editorTarget.row.item.id, {
      result: editorForm.result,
      comment: editorForm.comment || "",
      photoUrl: editorForm.photoUrl || "",
      partsUsed: editorForm.partsUsed || [],
    });
    closeEditorWithoutSaving();
  };

  // Lubrication data for this asset
  const assetLubePlans = useMemo(
    () => allLubricationPlans.filter((p) => p.active && p.assetId === machineId),
    [allLubricationPlans, machineId],
  );

  const selectedLubePlan = useMemo(
    () => assetLubePlans.find((p) => p.id === selectedLubePlanId) || null,
    [assetLubePlans, selectedLubePlanId],
  );

  const selectedLubeHistory = useMemo(() => {
    if (!selectedLubePlan) return [];
    return lubricationExecutions
      .filter((ex) => ex.planId === selectedLubePlan.id)
      .sort((a, b) => b.executedAt.localeCompare(a.executedAt));
  }, [selectedLubePlan, lubricationExecutions]);

  function getLubeStatus(nextDueDate: string) {
    const todayMs = startOfDay(new Date()).getTime();
    const dueMs = new Date(`${nextDueDate}T00:00:00`).getTime();
    if (dueMs < todayMs) return "overdue";
    if (dueMs === todayMs) return "today";
    return "upcoming";
  }

  const openLubeExecute = (planId: string) => {
    setSelectedLubePlanId(planId);
    setLubeExecutedAt(new Date().toISOString().slice(0, 10));
    setLubeExecutionNotes("");
    setLubeOverrideDueDate("");
    setLubeExecuteDialogOpen(true);
  };

  const confirmLubeExecution = () => {
    if (!selectedLubePlanId || !lubeExecutedAt) return;
    executeLubricationPlan(selectedLubePlanId, {
      executedAt: lubeExecutedAt,
      notes: lubeExecutionNotes.trim() || undefined,
      nextDueDate: lubeOverrideDueDate || undefined,
    });
    setLubeExecuteDialogOpen(false);
  };

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Máquina não encontrada.</p>
        <Button variant="outline" onClick={() => navigate("/machines")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/machines")} className="shrink-0 -ml-2 sm:ml-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex flex-1 items-center gap-3 w-full overflow-hidden">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Factory className="h-6 w-6 text-primary" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg sm:text-2xl font-bold truncate">{asset.tag}</h1>
              <Badge className={`${statusVariant[asset.status]} px-2 py-0.5 text-xs sm:px-3 sm:py-1 sm:text-sm shrink-0 whitespace-nowrap`}>
                {MACHINE_STATUS_LABELS[asset.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {machine ? MACHINE_TYPE_LABELS[machine.type] : COMPONENT_TYPE_LABELS[component!.type]} · {asset.model}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
          {asset.status === "operating" ? (
            <Button variant="destructive" size="sm" className="gap-2 w-full sm:w-auto" onClick={() => setShowStopDialog(true)}>
              <MonitorStop className="h-4 w-4" />
              Parar {isComponent ? "Componente" : "Máquina"}
            </Button>
          ) : (
            <Button className="bg-green-600 hover:bg-green-700 gap-2 w-full sm:w-auto" onClick={() => setShowResumeDialog(true)}>
              <PlayCircle className="h-4 w-4" />
              Retornar Operação
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-6 overflow-x-auto">
          <TabsTrigger value="checklist">
            <ClipboardList className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Checklist</span>
          </TabsTrigger>
          <TabsTrigger value="preventiva">
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Preventiva</span>
          </TabsTrigger>
          <TabsTrigger value="lubrificacao">
            <Droplets className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Lubrificação</span>
          </TabsTrigger>
          <TabsTrigger value="chamados">
            <Wrench className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Chamados</span>
          </TabsTrigger>
          <TabsTrigger value="historico">
            <History className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="pecas">
            <Package className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Peças</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="mt-4 space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Pendentes do Dia</h2>
                  <p className="text-xs text-muted-foreground">No mobile, toque na linha para preencher o item.</p>
                </div>
                <Button size="sm" onClick={handleSaveChecklist} disabled={checklistSelectedCount === 0}>
                  Salvar
                </Button>
              </div>

              {checklistPendingRows.length === 0 ? (
                <EmptyState icon={ClipboardList} message="Nenhum item pendente no checklist de hoje" />
              ) : (
                <div className={`${isMobile ? "overflow-hidden" : "overflow-x-auto"} border rounded-lg`}>
                  <table className={`w-full text-sm ${isMobile ? "table-fixed [&_th]:whitespace-normal [&_th]:break-words [&_td]:whitespace-normal [&_td]:break-words" : "min-w-[680px]"}`}>
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3">Item</th>
                        <th className="text-left p-3">Tipo inspeção</th>
                        {!isMobile && <th className="text-left p-3 w-[180px]">Resultado</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {checklistPendingRows.map((row) => {
                        const draft = getDraft(checklistDrafts, row.planId, row.item.id);
                        return (
                          <tr
                            key={`${row.planId}:${row.item.id}`}
                            className="border-b last:border-b-0 cursor-pointer hover:bg-muted/30"
                            onClick={() => openEditor("checklist", row)}
                          >
                            <td className="p-3 font-medium">
                              {row.item.description}
                              {isMobile && draft.result && (
                                <Badge className={`ml-2 ${resultBadgeClass(draft.result)}`} variant="outline">
                                  {draft.result.toUpperCase()}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-muted-foreground">{row.item.inspectionType}</td>
                            {!isMobile && (
                              <td className="p-3" onClick={(event) => event.stopPropagation()}>
                                <ResultSelector
                                  value={draft.result}
                                  onChange={(value) => updateDraft(setChecklistDrafts, row.planId, row.item.id, { result: value })}
                                />
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6 space-y-3">
              <div>
                <h2 className="font-semibold">Concluídos do Dia</h2>
                <p className="text-xs text-muted-foreground">Itens já registrados hoje.</p>
              </div>

              {checklistCompletedRows.length === 0 ? (
                <EmptyState icon={History} message="Nenhum item concluído hoje" />
              ) : (
                <div className={`${isMobile ? "overflow-hidden" : "overflow-x-auto"} border rounded-lg`}>
                  <table className={`w-full text-sm ${isMobile ? "table-fixed [&_th]:whitespace-normal [&_th]:break-words [&_td]:whitespace-normal [&_td]:break-words" : "min-w-[680px]"}`}>
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3 w-[165px]">Horário</th>
                        <th className="text-left p-3">Item</th>
                        {!isMobile && <th className="text-left p-3 w-[110px]">Resultado</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {checklistCompletedRows.map((row) => (
                        <tr key={`${row.planId}:${row.item.id}:done`} className="border-b last:border-b-0">
                          <td className="p-3">{new Date(row.completedAt).toLocaleString("pt-BR")}</td>
                          <td className="p-3 font-medium">
                            {row.item.description}
                            {isMobile && (
                              <Badge className={`ml-2 ${resultBadgeClass(row.result)}`} variant="outline">
                                {(row.result || "ok").toUpperCase()}
                              </Badge>
                            )}
                          </td>
                          {!isMobile && (
                            <td className="p-3">
                              <Badge className={resultBadgeClass(row.result)} variant="outline">
                                {(row.result || "ok").toUpperCase()}
                              </Badge>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preventiva" className="mt-4">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Preventivas</h2>
                  <p className="text-xs text-muted-foreground">Toque/clique na linha para preencher o item.</p>
                </div>
                <Button size="sm" onClick={handleSavePreventive} disabled={preventiveSelectedCount === 0}>
                  Salvar
                </Button>
              </div>

              {preventiveRowsWithDue.length === 0 ? (
                <EmptyState icon={Settings} message="Nenhum plano preventivo cadastrado para esta máquina" />
              ) : (
                <div className={`${isMobile ? "overflow-hidden" : "overflow-x-auto"} border rounded-lg`}>
                  <table className={`w-full text-sm ${isMobile ? "table-fixed [&_th]:whitespace-normal [&_th]:break-words [&_td]:whitespace-normal [&_td]:break-words" : "min-w-[680px]"}`}>
                     <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3">Item</th>
                        <th className="text-left p-3">Tipo inspeção</th>
                        {!isMobile && <th className="text-left p-3 w-[180px]">Resultado</th>}
                        <th className="text-left p-3 w-[150px]">Data limite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preventiveRowsWithDue.map((row) => {
                        const dueText = row.dueDate.toLocaleDateString("pt-BR");
                        const isOverdue = row.dueDate.getTime() < todayStart.getTime();
                        const draft = getDraft(preventiveDrafts, row.planId, row.item.id);
                        return (
                          <tr
                            key={`${row.planId}:${row.item.id}`}
                            className="border-b last:border-b-0 cursor-pointer hover:bg-muted/30"
                            onClick={() => openEditor("preventive", row)}
                          >
                            <td className="p-3">
                              <p className="font-medium">{row.item.description}</p>
                              <p className="text-xs text-muted-foreground">{isMobile ? row.item.inspectionType : row.planName}</p>
                              {isMobile && draft.result && (
                                <Badge className={`ml-2 mt-1 ${resultBadgeClass(draft.result)}`} variant="outline">
                                  {draft.result.toUpperCase()}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-muted-foreground">{row.item.inspectionType}</td>
                            {!isMobile && (
                              <td className="p-3" onClick={(event) => event.stopPropagation()}>
                                <ResultSelector
                                  value={draft.result}
                                  onChange={(value) => updateDraft(setPreventiveDrafts, row.planId, row.item.id, { result: value })}
                                />
                              </td>
                            )}
                            <td className={`p-3 font-medium ${isOverdue ? "text-destructive" : ""}`}>{dueText}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lubrificacao" className="mt-4">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="font-semibold">Lubrificação / Engraxamento</h2>
                <p className="text-xs text-muted-foreground">Itens de lubrificação programados para este ativo.</p>
              </div>

              {assetLubePlans.length === 0 ? (
                <EmptyState icon={Droplets} message="Nenhum item de lubrificação cadastrado para este ativo" />
              ) : (
                <div className={`${isMobile ? "overflow-hidden" : "overflow-x-auto"} border rounded-lg`}>
                  <table className={`w-full text-sm ${isMobile ? "table-fixed [&_th]:whitespace-normal [&_th]:break-words [&_td]:whitespace-normal [&_td]:break-words" : "min-w-[680px]"}`}>
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3">O que lubrificar</th>
                        {!isMobile && <th className="text-left p-3">Lubrificante</th>}
                        <th className="text-left p-3 w-[130px]">Próx. data</th>
                        <th className="text-left p-3 w-[100px]">Status</th>
                        <th className="text-right p-3 w-[180px]">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetLubePlans.map((plan) => {
                        const status = getLubeStatus(plan.nextDueDate);
                        return (
                          <tr key={plan.id} className="border-b last:border-b-0">
                            <td className="p-3">
                              <p className="font-medium">{plan.whatToLubricate}</p>
                              {isMobile && <p className="text-xs text-muted-foreground">{plan.lubricantType}</p>}
                              <p className="text-xs text-muted-foreground">{plan.attentionPoints}</p>
                            </td>
                            {!isMobile && <td className="p-3 text-muted-foreground">{plan.lubricantType}</td>}
                            <td className="p-3">{new Date(`${plan.nextDueDate}T00:00:00`).toLocaleDateString("pt-BR")}</td>
                            <td className="p-3">
                              <Badge
                                variant={status === "overdue" ? "destructive" : status === "today" ? "default" : "outline"}
                                className="whitespace-nowrap"
                              >
                                {status === "overdue" ? "Atrasado" : status === "today" ? "Hoje" : "Em dia"}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => openLubeExecute(plan.id)}>
                                  <CalendarCheck2 className="h-3.5 w-3.5 mr-1" />
                                  Executar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLubePlanId(plan.id);
                                    setLubeHistoryDialogOpen(true);
                                  }}
                                >
                                  <History className="h-3.5 w-3.5 mr-1" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chamados" className="mt-4">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Filtro por Tipo do Chamado</p>
                  <Select value={ticketTypeFilter} onValueChange={(value: "all" | Ticket["type"]) => setTicketTypeFilter(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="corrective">{OS_TYPE_LABELS.corrective}</SelectItem>
                      <SelectItem value="inspection">{OS_TYPE_LABELS.inspection}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Filtro por Prioridade</p>
                  <Select value={ticketPriorityFilter} onValueChange={(value: "all" | Priority) => setTicketPriorityFilter(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {machineTickets.length === 0 ? (
                <EmptyState icon={Wrench} message="Nenhum chamado encontrado para os filtros aplicados" />
              ) : (
                <div className={`${isMobile ? "overflow-hidden" : "overflow-x-auto"} border rounded-lg`}>
                  <table className={`w-full text-sm ${isMobile ? "table-fixed [&_th]:whitespace-normal [&_th]:break-words [&_td]:whitespace-normal [&_td]:break-words" : "min-w-[820px]"}`}>
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        {isMobile ? (
                          <>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Sintoma</th>
                          </>
                        ) : (
                          <>
                            <th className="text-left p-3">Tipo</th>
                            <th className="text-left p-3">Prioridade</th>
                            <th className="text-left p-3">Sintoma</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Abertura</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {machineTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="border-b last:border-b-0 cursor-pointer hover:bg-muted/30"
                          onClick={() => openTicketResolution(ticket)}
                        >
                          {isMobile ? (
                            <>
                              <td className="p-3">
                                <Badge variant="outline" className={ticketStatusColor[ticket.status]}>
                                  {TICKET_STATUS_LABELS[ticket.status]}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-2">{PRIORITY_LABELS[ticket.priority]}</p>
                                <p className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString("pt-BR")}</p>
                              </td>
                              <td className="p-3">
                                <p className="font-medium">{ticket.symptom}</p>
                                {ticket.type === "corrective" && ticket.maintenanceType && (
                                  <p className="text-xs text-muted-foreground">
                                    {ticket.maintenanceType === "mechanical" ? "Mecânica" : "Elétrica"}
                                  </p>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3">{OS_TYPE_LABELS[ticket.type]}</td>
                              <td className="p-3">{PRIORITY_LABELS[ticket.priority]}</td>
                              <td className="p-3">
                                <p className="font-medium">{ticket.symptom}</p>
                                {ticket.type === "corrective" && ticket.maintenanceType && (
                                  <p className="text-xs text-muted-foreground">
                                    {ticket.maintenanceType === "mechanical" ? "Mecânica" : "Elétrica"}
                                  </p>
                                )}
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className={ticketStatusColor[ticket.status]}>
                                  {TICKET_STATUS_LABELS[ticket.status]}
                                </Badge>
                              </td>
                              <td className="p-3">{new Date(ticket.createdAt).toLocaleDateString("pt-BR")}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardContent className="p-4 sm:p-6">
              {historyRows.length === 0 ? (
                <EmptyState icon={History} message="Nenhum histórico disponível" />
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className={`w-full text-sm ${isMobile ? "min-w-[420px]" : "min-w-[860px]"}`}>
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        {isMobile ? (
                          <>
                            <th className="text-left p-3 w-[120px]">Data</th>
                            <th className="text-left p-3 w-[100px]">Tipo</th>
                            <th className="text-left p-3">Correção</th>
                          </>
                        ) : (
                          <>
                            <th className="text-left p-3 w-[180px]">Data</th>
                            <th className="text-left p-3 w-[120px]">Tipo</th>
                            <th className="text-left p-3">Descrição</th>
                            <th className="text-left p-3 w-[150px]">Resultado/Status</th>
                            <th className="text-left p-3 w-[180px]">Colaborador</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b last:border-b-0 cursor-pointer hover:bg-muted/30"
                          onClick={() => setHistoryModal(row)}
                        >
                          {isMobile ? (
                            <>
                              <td className="p-3">{new Date(row.date).toLocaleDateString("pt-BR")}</td>
                              <td className="p-3">{row.type}</td>
                              <td className="p-3">{row.comment || row.description}</td>
                            </>
                          ) : (
                            <>
                              <td className="p-3">{new Date(row.date).toLocaleString("pt-BR")}</td>
                              <td className="p-3">{row.type}</td>
                              <td className="p-3">{row.description}</td>
                              <td className="p-3">
                                <Badge
                                  className={row.resultOrStatus === "NOK" ? "bg-destructive text-destructive-foreground" : "bg-muted"}
                                  variant="outline"
                                >
                                  {row.resultOrStatus}
                                </Badge>
                              </td>
                              <td className="p-3 text-muted-foreground">{row.collaborator || "-"}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pecas">
          <Card>
            <CardContent className="p-6">
              <EmptyState icon={Package} message="Nenhuma peça cadastrada" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!historyModal} onOpenChange={(open) => !open && setHistoryModal(null)}>
        <DialogContent className="max-w-lg">
          {historyModal && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Histórico</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium">{new Date(historyModal.date).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium">{historyModal.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="font-medium">{historyModal.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resultado/Status</p>
                  <Badge
                    className={historyModal.resultOrStatus === "NOK" ? "bg-destructive text-destructive-foreground" : "bg-muted"}
                    variant="outline"
                  >
                    {historyModal.resultOrStatus}
                  </Badge>
                </div>
                                <div>
                  <p className="text-xs text-muted-foreground">Colaborador</p>
                  <p className="font-medium">{historyModal.collaborator || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Comentário</p>
                  <p className="font-medium">{historyModal.comment || "Sem comentário"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Anexo</p>
                  {historyModal.photoUrl ? (
                    <a
                      href={historyModal.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      Ver anexo
                    </a>
                  ) : (
                    <p className="font-medium text-muted-foreground">Sem anexo</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peças utilizadas</p>
                  {historyModal.partsUsed && historyModal.partsUsed.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {historyModal.partsUsed.map((used) => {
                        const part = parts.find((p) => p.id === used.partId);
                        return (
                          <p key={used.partId} className="font-medium">
                            {part?.description || used.partId} - {used.quantity} {part?.unit || "un"}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="font-medium text-muted-foreground">Nenhuma peça informada</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setHistoryModal(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editorTarget} onOpenChange={(open) => !open && closeEditorWithoutSaving()}>
        <DialogContent className="max-w-lg">
          {editorTarget && (
            <>
              <DialogHeader>
                <DialogTitle>{editorTarget.row.item.description}</DialogTitle>
                <p className="text-xs text-muted-foreground">{editorTarget.row.planName}</p>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Resultado</p>
                  <ResultSelector
                    value={editorDraft.result}
                    onChange={(value) => {
                      setEditorForm((prev) => ({ ...prev, result: value }));
                    }}
                  />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Comentário</p>
                  <Textarea
                    rows={3}
                    placeholder="Observações do item"
                    value={editorDraft.comment || ""}
                    onChange={(e) => {
                      setEditorForm((prev) => ({ ...prev, comment: e.target.value }));
                    }}
                  />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Anexar foto</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const photoUrl = URL.createObjectURL(file);
                      setEditorForm((prev) => ({ ...prev, photoUrl }));
                    }}
                  />
                  {editorDraft.photoUrl && (
                    <img src={editorDraft.photoUrl} alt="Anexo" className="mt-2 h-20 w-20 rounded border object-cover" />
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Itens utilizados (estoque)</p>
                  {(editorDraft.partsUsed || []).length > 0 && (
                    <div className="space-y-2 mb-3">
                      {(editorDraft.partsUsed || []).map((used) => {
                        const part = parts.find((p) => p.id === used.partId);
                        return (
                          <div key={used.partId} className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1">
                            <span>{part?.description || used.partId} - {used.quantity} {part?.unit || "un"}</span>
                            <Button type="button" size="sm" variant="ghost" className="h-6 px-2" onClick={() => removePartFromEditorDraft(used.partId)}>
                              Remover
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="grid grid-cols-[1fr_90px_auto] gap-2 items-end">
                    <Select value={partSelection.partId} onValueChange={(value) => setPartSelection((prev) => ({ ...prev, partId: value }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecionar peça" />
                      </SelectTrigger>
                      <SelectContent>
                        {parts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.description} (estoque: {part.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      className="h-9"
                      value={partSelection.quantity}
                      onChange={(e) => setPartSelection((prev) => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 gap-1.5 border-dashed bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                      onClick={addPartToEditorDraft}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEditorWithoutSaving}>Cancelar</Button>
                <Button type="button" onClick={saveEditorAndClose}>Salvar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!ticketModal} onOpenChange={(open) => !open && setTicketModal(null)}>
        <DialogContent className="max-w-lg">
          {ticketModal && (
            <>
              <DialogHeader>
                <DialogTitle>Conclusão do Chamado</DialogTitle>
                <p className="text-xs text-muted-foreground">{ticketModal.symptom}</p>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Select
                    value={ticketDraft.status}
                    onValueChange={(value: Ticket["status"]) => setTicketDraft((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_maintenance">Em Manutenção</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Comentário</p>
                  <Textarea
                    rows={3}
                    placeholder="Descreva a conclusão/andamento"
                    value={ticketDraft.comment}
                    onChange={(e) => setTicketDraft((prev) => ({ ...prev, comment: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Anexo</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setTicketDraft((prev) => ({ ...prev, photoUrl: URL.createObjectURL(file) }));
                    }}
                  />
                  {ticketDraft.photoUrl && (
                    <img src={ticketDraft.photoUrl} alt="Anexo chamado" className="mt-2 h-20 w-20 rounded border object-cover" />
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Peças utilizadas</p>
                  {ticketDraft.partsUsed.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {ticketDraft.partsUsed.map((used) => {
                        const part = parts.find((p) => p.id === used.partId);
                        return (
                          <div key={used.partId} className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1">
                            <span>{part?.description || used.partId} - {used.quantity} {part?.unit || "un"}</span>
                            <Button type="button" size="sm" variant="ghost" className="h-6 px-2" onClick={() => removePartFromTicketDraft(used.partId)}>
                              Remover
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="grid grid-cols-[1fr_90px_auto] gap-2 items-end">
                    <Select value={ticketPartSelection.partId} onValueChange={(value) => setTicketPartSelection((prev) => ({ ...prev, partId: value }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar peça" /></SelectTrigger>
                      <SelectContent>
                        {parts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.description} (estoque: {part.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      className="h-9"
                      value={ticketPartSelection.quantity}
                      onChange={(e) => setTicketPartSelection((prev) => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
                    />
                    <Button type="button" variant="outline" className="h-9 gap-1.5" onClick={addPartToTicketDraft}>
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTicketModal(null)}>Cancelar</Button>
                <Button type="button" onClick={saveTicketResolution}>Salvar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lubrication Execute Dialog */}
      <Dialog open={lubeExecuteDialogOpen} onOpenChange={setLubeExecuteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Executar lubrificação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Data da execução</Label>
              <Input type="date" value={lubeExecutedAt} onChange={(e) => setLubeExecutedAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Ajuste manual da próxima data (opcional)</Label>
              <Input type="date" value={lubeOverrideDueDate} onChange={(e) => setLubeOverrideDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Observação</Label>
              <Textarea value={lubeExecutionNotes} onChange={(e) => setLubeExecutionNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLubeExecuteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmLubeExecution}>Confirmar execução</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lubrication History Dialog */}
      <Dialog open={lubeHistoryDialogOpen} onOpenChange={setLubeHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de lubrificação</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {selectedLubeHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem execuções registradas para este item.</p>
            ) : (
              selectedLubeHistory.map((item) => (
                <div key={item.id} className="border rounded-md p-3 text-sm">
                  <p><strong>Execução:</strong> {new Date(`${item.executedAt}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                  <p><strong>Vencimento anterior:</strong> {new Date(`${item.previousDueDate}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                  <p><strong>Nova programação:</strong> {new Date(`${item.nextDueDateAfterExecution}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                  {item.notes && <p className="mt-1"><strong>Obs:</strong> {item.notes}</p>}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLubeHistoryDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StopMachineDialog
        open={showStopDialog}
        onOpenChange={setShowStopDialog}
        onConfirm={handleStopMachine}
        machineName={asset.tag}
        isComponent={isComponent}
      />

      <ResumeMachineDialog
        open={showResumeDialog}
        onOpenChange={setShowResumeDialog}
        onConfirm={handleResumeMachine}
        machineName={asset.tag}
        isComponent={isComponent}
      />
    </div>
  );
}











