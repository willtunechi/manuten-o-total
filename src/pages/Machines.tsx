import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MachineCard } from "@/components/MachineCard";
import { MACHINE_STATUS_LABELS, MACHINE_TYPE_LABELS } from "@/data/types";
import { useData } from "@/contexts/DataContext";
import { useConfig } from "@/contexts/ConfigContext";
import { useIsMobile } from "@/hooks/use-mobile";

type StatusFilter = "all" | keyof typeof MACHINE_STATUS_LABELS;

export default function Machines() {
  const isMobile = useIsMobile();
  const { machines: allMachines, components: allComponents, maintenancePlans, planExecutions, tickets, userAssignedMachineIds, userAssignedComponentIds } = useData();
  const { lubricationPlans: allLubricationPlans, componentTypes } = useConfig();

  const rawMachines = userAssignedMachineIds !== null
    ? allMachines.filter((m) => userAssignedMachineIds.includes(m.id))
    : allMachines;
  const rawComponents = userAssignedComponentIds !== null
    ? allComponents.filter((c) => userAssignedComponentIds.includes(c.id))
    : allComponents;

  const enrichedAssets = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    function getChecklistStats(assetId: string, assetType: string) {
      const checklistPlans = maintenancePlans.filter(
        (p) => p.planType === "checklist" && p.active && (
          p.machineIds?.includes(assetId) || p.machineId === assetId || 
          (!p.machineId && (!p.machineIds || p.machineIds.length === 0) && p.machineType === assetType)
        )
      );
      let total = 0;
      let completed = 0;
      checklistPlans.forEach((plan) => {
        (plan.items || []).forEach((item) => {
          total++;
          const exec = planExecutions.find(
            (ex) =>
              ex.planId === plan.id &&
              ex.status === "completed" &&
              ex.machineId === assetId &&
              ex.completedAt &&
              new Date(ex.completedAt).getTime() >= todayStart &&
              new Date(ex.completedAt).getTime() < todayEnd
          );
          if (exec) {
            const result = exec.itemResults?.find((r) => r.itemId === item.id);
            if (result?.completed) completed++;
          }
        });
      });
      return { dailyChecklistTotal: total, dailyChecklistCompleted: completed };
    }

    function getPreventiveStats(assetId: string, assetType: string) {
      const preventivePlans = maintenancePlans.filter(
        (p) => p.planType === "preventive" && p.active && (
          p.machineIds?.includes(assetId) || p.machineId === assetId ||
          (!p.machineId && (!p.machineIds || p.machineIds.length === 0) && p.machineType === assetType)
        )
      );
      let overdue = 0;
      let preventiveOk = 0;
      let preventiveNok = 0;

      preventivePlans.forEach((plan) => {
        const completedExecs = planExecutions.filter(
          (ex) => ex.planId === plan.id && ex.status === "completed" && ex.machineId === assetId
        );
        const recentCutoff = todayStart - 30 * 86400000;
        completedExecs.forEach((ex) => {
          if (ex.itemResults) {
            ex.itemResults.forEach((r) => {
              if (!r.completed || !r.completedAt) return;
              const completedTime = new Date(r.completedAt).getTime();
              if (completedTime < recentCutoff) return;
              if (r.result === "ok") preventiveOk++;
              else if (r.result === "nok") preventiveNok++;
            });
          }
        });

        (plan.items || []).forEach((item) => {
          const lastExec = completedExecs
            .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""))
            [0];
          const lastDate = lastExec?.completedAt ? new Date(lastExec.completedAt).getTime() : 0;
          const dueDate = lastDate + item.frequencyDays * 86400000;
          if (dueDate <= todayStart) overdue++;
        });
      });

      return { preventiveOverdue: overdue, preventiveOk, preventiveNok };
    }

    function getCorrectivePending(assetId: string) {
      return tickets.filter(
        (t) => t.machineId === assetId && (t.status === "pending" || t.status === "in_maintenance")
      ).length;
    }

    function getLubricationPending(assetId: string) {
      return allLubricationPlans.filter((p) => {
        if (!p.active || p.assetId !== assetId) return false;
        const dueDate = new Date(`${p.nextDueDate}T00:00:00`).getTime();
        return dueDate <= todayEnd;
      }).length;
    }

    const machines = rawMachines.map((m) => ({
      ...m,
      ...getChecklistStats(m.id, m.type),
      ...getPreventiveStats(m.id, m.type),
      correctivePending: getCorrectivePending(m.id),
      lubricationPending: getLubricationPending(m.id),
    }));

    const components = rawComponents.map((c) => ({
      ...c,
      ...getChecklistStats(c.id, c.machineType),
      ...getPreventiveStats(c.id, c.machineType),
      correctivePending: getCorrectivePending(c.id),
      lubricationPending: getLubricationPending(c.id),
    }));

    return { machines, components };
  }, [rawMachines, rawComponents, maintenancePlans, planExecutions, tickets, allLubricationPlans]);

  const { machines, components } = enrichedAssets;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [nameFilter, setNameFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const allAssetOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    machines.forEach((m) => opts.push({ value: m.id, label: m.tag }));
    components.forEach((c) => opts.push({ value: c.id, label: c.tag }));
    return opts.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { numeric: true }));
  }, [machines, components]);

  const getAssetType = (item: any) => item.type;

  const typeLabel = (type: string) =>
    (MACHINE_TYPE_LABELS as Record<string, string>)[type] ||
    componentTypes.find((ct) => ct.key === type)?.name ||
    type;

  const typeOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    Object.entries(MACHINE_TYPE_LABELS).forEach(([value, label]) => { seen.add(value); opts.push({ value, label }); });
    [...machines, ...components].forEach((a) => {
      if (seen.has(a.type)) return;
      seen.add(a.type);
      opts.push({ value: a.type, label: typeLabel(a.type) });
    });
    return opts;
  }, [machines, components, componentTypes]);

  const byFilters = <T extends { id: string; status: keyof typeof MACHINE_STATUS_LABELS; type: string }>(item: T) =>
    (statusFilter === "all" || item.status === statusFilter) &&
    (nameFilter === "all" || item.id === nameFilter) &&
    (typeFilter === "all" || item.type === typeFilter);

  const sortByTag = <T extends { tag: string }>(arr: T[]) => [...arr].sort((a, b) => a.tag.localeCompare(b.tag, 'pt-BR', { numeric: true }));

  // Agrupa máquinas E componentes pelo tipo, para nenhum ativo ficar de fora
  const { categorizedAssets, categories } = useMemo(() => {
    const grouped = new Map<string, Array<(typeof machines)[number] | (typeof components)[number]>>();
    [...machines, ...components].forEach((asset) => {
      if (!byFilters(asset as any)) return;
      const list = grouped.get(asset.type) || [];
      list.push(asset);
      grouped.set(asset.type, list);
    });

    const preferredOrder = ["misturador", "extrusora", "trocador_calor", "bomba_vacuo", "tanque_agua"];
    const keys = Array.from(grouped.keys()).sort((a, b) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return typeLabel(a).localeCompare(typeLabel(b), "pt-BR");
    });

    const result: Record<string, Array<(typeof machines)[number] | (typeof components)[number]>> = {};
    keys.forEach((key) => { result[key] = sortByTag(grouped.get(key) || []); });

    return { categorizedAssets: result, categories: keys.map((key) => ({ key, label: typeLabel(key) })) };
  }, [machines, components, statusFilter, nameFilter, typeFilter, componentTypes]);

  const renderAssetColumn = (items: Array<(typeof machines)[number] | (typeof components)[number]>) => {
    if (items.length === 0) return null;
    return (
      <div className={`grid gap-2 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
        {items.map((item) => (
          <MachineCard key={item.id} machine={item} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Máquinas</h1>
        <p className="text-muted-foreground text-sm">Máquinas e componentes por categoria</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:max-w-xs space-y-1">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(MACHINE_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:max-w-xs space-y-1">
          <Label>Ativo</Label>
          <Select value={nameFilter} onValueChange={setNameFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por ativo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {allAssetOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:max-w-xs space-y-1">
          <Label>Tipo de ativo</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {typeOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map(({ key, label }) => {
          const items = categorizedAssets[key];
          if (items.length === 0 && nameFilter !== "all") return null;
          return (
            <div key={key} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label} ({items.length})</h3>
              {items.length === 0 ? (
                <div className="h-16 rounded-md border border-dashed bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
                  Nenhum ativo encontrado
                </div>
              ) : (
                renderAssetColumn(items)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
