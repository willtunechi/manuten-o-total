import { Fragment, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MachineCard } from "@/components/MachineCard";
import { MACHINE_STATUS_LABELS, MACHINE_TYPE_LABELS } from "@/data/types";
import { useData } from "@/contexts/DataContext";
import { useConfig } from "@/contexts/ConfigContext";
import { useIsMobile } from "@/hooks/use-mobile";

type LineStatusFilter = "all" | keyof typeof MACHINE_STATUS_LABELS;

function sortLineNames(a: string, b: string): number {
  const aNumber = a.match(/\d+/)?.[0];
  const bNumber = b.match(/\d+/)?.[0];

  if (aNumber && bNumber) {
    const diff = Number(aNumber) - Number(bNumber);
    if (diff !== 0) return diff;
  }

  return a.localeCompare(b);
}

export default function Machines() {
  const isMobile = useIsMobile();
  const { machines: allMachines, components: allComponents, maintenancePlans, planExecutions, tickets, userAssignedMachineIds, userAssignedComponentIds } = useData();
  const { lubricationPlans: allLubricationPlans } = useConfig();

  // Filter by user assignments (null = no restriction)
  const rawMachines = userAssignedMachineIds !== null
    ? allMachines.filter((m) => userAssignedMachineIds.includes(m.id))
    : allMachines;
  const rawComponents = userAssignedComponentIds !== null
    ? allComponents.filter((c) => userAssignedComponentIds.includes(c.id))
    : allComponents;

  // Enrich machines/components with dynamic checklist stats
  const enrichedAssets = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    function getChecklistStats(assetId: string) {
      const checklistPlans = maintenancePlans.filter(
        (p) => p.planType === "checklist" && (p.machineIds?.includes(assetId) || p.machineId === assetId)
      );
      const totalItems = checklistPlans.reduce((acc, plan) => acc + (plan.items?.length || 0), 0);

      const planIds = new Set(checklistPlans.map((p) => p.id));
      const todayExecutions = planExecutions.filter((ex) => {
        if (!planIds.has(ex.planId)) return false;
        const started = new Date(ex.startedAt).getTime();
        return started >= todayStart && started < todayEnd;
      });

      let okCount = 0;
      let nokCount = 0;
      todayExecutions.forEach((ex) => {
        if (ex.itemResults) {
          ex.itemResults.forEach((r) => {
            if (r.result === "ok") okCount++;
            else if (r.result === "nok") nokCount++;
          });
        }
      });

      return { dailyChecklistTotal: totalItems, dailyChecklistCompleted: okCount + nokCount, checklistOk: okCount, checklistNok: nokCount };
    }

    function getPreventiveStats(assetId: string) {
      const preventivePlans = maintenancePlans.filter(
        (p) => p.planType === "preventive" && (p.machineIds?.includes(assetId) || p.machineId === assetId)
      );

      let overdue = 0;
      let preventiveOk = 0;
      let preventiveNok = 0;

      preventivePlans.forEach((plan) => {
        const completedExecs = planExecutions.filter((ex) => ex.planId === plan.id && ex.status === "completed");
        completedExecs.forEach((ex) => {
          if (ex.itemResults) {
            ex.itemResults.forEach((r) => {
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
      ...getChecklistStats(m.id),
      ...getPreventiveStats(m.id),
      correctivePending: getCorrectivePending(m.id),
      lubricationPending: getLubricationPending(m.id),
    }));

    const components = rawComponents.map((c) => ({
      ...c,
      ...getChecklistStats(c.id),
      ...getPreventiveStats(c.id),
      correctivePending: getCorrectivePending(c.id),
      lubricationPending: getLubricationPending(c.id),
    }));

    return { machines, components };
  }, [rawMachines, rawComponents, maintenancePlans, planExecutions, tickets, allLubricationPlans]);

  const { machines, components } = enrichedAssets;
  const { lines } = useConfig();

  const [statusFilter, setStatusFilter] = useState<LineStatusFilter>("all");
  const [nameFilter, setNameFilter] = useState<string>("all");

  const allAssetOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    machines.forEach((m) => opts.push({ value: m.id, label: m.tag }));
    components.forEach((c) => opts.push({ value: c.id, label: c.tag }));
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [machines, components]);

  const byFilters = <T extends { id: string; status: keyof typeof MACHINE_STATUS_LABELS }>(item: T) =>
    (statusFilter === "all" || item.status === statusFilter) &&
    (nameFilter === "all" || item.id === nameFilter);

  const configuredLines = useMemo(
    () => lines.filter((line) => line.active && !line.isSystem).map((line) => line.name),
    [lines],
  );

  const assetLines = useMemo(() => {
    const names = new Set<string>();
    machines.forEach((machine) => {
      if (machine.sector && machine.sector !== "Sem linha") names.add(machine.sector);
    });
    components.forEach((component) => {
      if (component.sector && component.sector !== "Sem linha") names.add(component.sector);
    });
    return Array.from(names);
  }, [machines, components]);

  const displayLines = useMemo(() => {
    return Array.from(assetLines).sort(sortLineNames);
  }, [assetLines]);

  const lineTabs = useMemo(
    () => displayLines.map((lineName, index) => ({ id: `line-${index + 1}`, name: lineName })),
    [displayLines],
  );

  const lineAssetMap = useMemo(() => {
    const map = new Map<
      string,
      {
        misturador: typeof machines;
        extrusora: typeof machines;
        trocador_calor: typeof components;
        bomba_vacuo: typeof components;
        tanque_agua: typeof components;
      }
    >();

    lineTabs.forEach((lineTab) => {
      const lineName = lineTab.name;
      map.set(lineName, {
        misturador: machines.filter((machine) => machine.type === "misturador" && machine.sector === lineName && byFilters(machine)),
        extrusora: machines.filter((machine) => machine.type === "extrusora" && machine.sector === lineName && byFilters(machine)),
        trocador_calor: components.filter((component) => component.type === "trocador_calor" && component.sector === lineName && byFilters(component)),
        bomba_vacuo: components.filter((component) => component.type === "bomba_vacuo" && component.sector === lineName && byFilters(component)),
        tanque_agua: components.filter((component) => component.type === "tanque_agua" && component.sector === lineName && byFilters(component)),
      });
    });

    return map;
  }, [lineTabs, machines, components, statusFilter, nameFilter]);

  const mobileLineColumns = Math.min(Math.max(lineTabs.length, 1), 4);

  const renderAssetColumn = (items: Array<(typeof machines)[number] | (typeof components)[number]>) => {
    if (items.length === 0) {
      return <div className="h-full min-h-[90px] rounded-md border border-dashed bg-muted/20" />;
    }

    return (
      <div className="space-y-2">
        {items.map((item) => (
          <MachineCard key={item.id} machine={item} />
        ))}
      </div>
    );
  };

  const renderMobileLineContent = (lineName: string) => {
    const lineAssets = lineAssetMap.get(lineName);
    if (!lineAssets) return null;

    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{MACHINE_TYPE_LABELS.misturador}</h3>
          {renderAssetColumn(lineAssets.misturador)}
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">{MACHINE_TYPE_LABELS.extrusora}</h3>
          {renderAssetColumn(lineAssets.extrusora)}
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Trocador de Calor</h3>
          {renderAssetColumn(lineAssets.trocador_calor)}
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bomba de Vácuo</h3>
          {renderAssetColumn(lineAssets.bomba_vacuo)}
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Gala</h3>
          {renderAssetColumn(lineAssets.tanque_agua)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Máquinas</h1>
        <p className="text-muted-foreground text-sm">Máquinas e componentes principais</p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:max-w-xs space-y-1">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={(value: LineStatusFilter) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(MACHINE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:max-w-xs space-y-1">
            <Label>Ativo</Label>
            <Select value={nameFilter} onValueChange={setNameFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por ativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {allAssetOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {lineTabs.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            Nenhuma linha encontrada. Cadastre linhas em Configurações e vincule máquinas/componentes.
          </div>
        ) : isMobile ? (
          <Tabs defaultValue={lineTabs[0].id} className="w-full">
            <TabsList
              className="grid h-auto w-full gap-1"
              style={{ gridTemplateColumns: `repeat(${mobileLineColumns}, minmax(0, 1fr))` }}
            >
              {lineTabs.map((lineTab) => (
                <TabsTrigger
                  key={lineTab.id}
                  value={lineTab.id}
                  className="h-8 px-2 text-xs whitespace-normal text-center"
                >
                  {lineTab.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {lineTabs.map((lineTab) => (
              <TabsContent key={lineTab.id} value={lineTab.id} className="mt-4">
                {renderMobileLineContent(lineTab.name)}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(120px, 160px) repeat(5, minmax(0, 1fr))" }}>
            <div />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">{MACHINE_TYPE_LABELS.misturador}</h3>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">{MACHINE_TYPE_LABELS.extrusora}</h3>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Trocador de Calor</h3>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Bomba de Vácuo</h3>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Gala</h3>

            {lineTabs.map((lineTab) => {
              const lineAssets = lineAssetMap.get(lineTab.name);
              if (!lineAssets) return null;

              return (
                <Fragment key={lineTab.id}>
                  <div className="text-sm font-semibold text-muted-foreground pt-2">
                    {lineTab.name}
                  </div>
                  <div>{renderAssetColumn(lineAssets.misturador)}</div>
                  <div>{renderAssetColumn(lineAssets.extrusora)}</div>
                  <div>{renderAssetColumn(lineAssets.trocador_calor)}</div>
                  <div>{renderAssetColumn(lineAssets.bomba_vacuo)}</div>
                  <div>{renderAssetColumn(lineAssets.tanque_agua)}</div>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
