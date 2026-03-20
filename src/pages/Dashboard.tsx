import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { MACHINE_TYPE_LABELS } from "@/data/types";
import type { MachineType } from "@/data/types";

type PeriodDays = 7 | 30 | 90 | 180;

function hoursBetween(start: string, end: string) {
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function Dashboard() {
  const { tickets, maintenancePlans, planExecutions, machines, components, parts, assetStopRecords } = useData();
  const now = useMemo(() => new Date(), []);

  const [periodDays, setPeriodDays] = useState<PeriodDays>(30);
  const [lineFilter, setLineFilter] = useState<string>("all");
  const [machineTypeFilter, setMachineTypeFilter] = useState<"all" | MachineType>("all");

  const windowStart = useMemo(() => {
    const date = new Date(now);
    date.setDate(date.getDate() - periodDays);
    return date;
  }, [now, periodDays]);

  const assets = useMemo(
    () => [
      ...machines.map((machine) => ({
        id: machine.id,
        type: machine.type,
        tag: machine.tag,
      })),
      ...components.map((component) => ({
        id: component.id,
        type: component.machineType,
        tag: component.tag,
      })),
    ],
    [components, machines],
  );

  const typeOptions = useMemo(
    () =>
      [...new Set(assets.map((asset) => asset.type))]
        .sort((a, b) => MACHINE_TYPE_LABELS[a].localeCompare(MACHINE_TYPE_LABELS[b])),
    [assets],
  );

  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        if (machineTypeFilter !== "all" && asset.type !== machineTypeFilter) return false;
        return true;
      }),
    [assets, machineTypeFilter],
  );

  const assetIdSet = useMemo(
    () => new Set(filteredAssets.map((asset) => asset.id)),
    [filteredAssets],
  );

  const inPeriod = (date?: string) => !!date && new Date(date).getTime() >= windowStart.getTime();

  const planById = useMemo(
    () => new Map(maintenancePlans.map((plan) => [plan.id, plan])),
    [maintenancePlans],
  );

  const selectedTickets = useMemo(
    () => tickets.filter((ticket) => assetIdSet.has(ticket.machineId)),
    [assetIdSet, tickets],
  );

  const selectedExecutions = useMemo(
    () => planExecutions.filter((execution) => execution.machineId && assetIdSet.has(execution.machineId)),
    [assetIdSet, planExecutions],
  );

  const selectedStopRecords = useMemo(
    () => assetStopRecords.filter((record) => assetIdSet.has(record.assetId)),
    [assetIdSet, assetStopRecords],
  );

  const resolvedCorrective = useMemo(
    () =>
      selectedTickets.filter(
        (ticket) =>
          ticket.type === "corrective" &&
          ticket.status === "resolved" &&
          !!ticket.resolvedAt &&
          inPeriod(ticket.resolvedAt),
      ),
    [selectedTickets, windowStart],
  );

  const mttrHours = useMemo(() => {
    const durations = resolvedCorrective
      .map((ticket) => hoursBetween(ticket.createdAt, ticket.resolvedAt || ticket.createdAt))
      .filter((hours) => hours >= 0);
    return average(durations);
  }, [resolvedCorrective]);

  const correctiveCount = useMemo(
    () =>
      selectedTickets.filter(
        (ticket) => ticket.type === "corrective" && inPeriod(ticket.createdAt),
      ).length,
    [selectedTickets, windowStart],
  );

  const preventiveCount = useMemo(
    () =>
      selectedExecutions.filter((execution) => {
        const plan = planById.get(execution.planId);
        return (
          execution.status === "completed" &&
          plan?.planType === "preventive" &&
          inPeriod(execution.completedAt || execution.startedAt)
        );
      }).length,
    [selectedExecutions, planById, windowStart],
  );

  const correctivePreventiveTotal = correctiveCount + preventiveCount;
  const correctivePercent = correctivePreventiveTotal > 0 ? (correctiveCount / correctivePreventiveTotal) * 100 : 0;
  const preventivePercent = correctivePreventiveTotal > 0 ? (preventiveCount / correctivePreventiveTotal) * 100 : 0;

  const failuresInWindow = useMemo(
    () =>
      selectedTickets.filter(
        (ticket) => ticket.type === "corrective" && inPeriod(ticket.createdAt),
      ).length,
    [selectedTickets, windowStart],
  );

  const failureRatePerDay = failuresInWindow / periodDays;

  const mtbfHours = useMemo(() => {
    const ticketsByAsset = new Map<string, string[]>();
    selectedTickets.forEach((ticket) => {
      if (ticket.type !== "corrective" || !inPeriod(ticket.createdAt)) return;
      const list = ticketsByAsset.get(ticket.machineId) || [];
      list.push(ticket.createdAt);
      ticketsByAsset.set(ticket.machineId, list);
    });

    const intervals: number[] = [];
    ticketsByAsset.forEach((dates) => {
      const sorted = dates.map((date) => new Date(date).getTime()).sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i += 1) {
        intervals.push((sorted[i] - sorted[i - 1]) / (1000 * 60 * 60));
      }
    });

    return average(intervals);
  }, [selectedTickets, windowStart]);

  const availabilityPercent = useMemo(() => {
    const assetsCount = filteredAssets.length;
    if (assetsCount === 0) return 0;

    const windowStartMs = windowStart.getTime();
    const nowMs = now.getTime();
    const possibleHours = assetsCount * periodDays * 24;

    const downtimeHours = selectedStopRecords.reduce((sum, record) => {
      const startMs = Math.max(new Date(record.stoppedAt).getTime(), windowStartMs);
      const endMs = Math.min(new Date(record.resumedAt || now.toISOString()).getTime(), nowMs);
      if (endMs <= startMs) return sum;
      return sum + (endMs - startMs) / (1000 * 60 * 60);
    }, 0);

    const availability = ((possibleHours - downtimeHours) / possibleHours) * 100;
    return clamp(availability, 0, 100);
  }, [filteredAssets.length, now, periodDays, selectedStopRecords, windowStart]);

  const partCostById = useMemo(() => {
    const map = new Map<string, number>();
    parts.forEach((part) => {
      map.set(part.id, part.unitCost || part.cost || 0);
    });
    return map;
  }, [parts]);

  const costByAsset = useMemo(() => {
    const map = new Map<string, number>();

    selectedTickets
      .filter((ticket) => inPeriod(ticket.createdAt))
      .forEach((ticket) => {
        const partsCost = (ticket.partsUsed || []).reduce(
          (sum, used) => sum + (partCostById.get(used.partId) || 0) * used.quantity,
          0,
        );
        map.set(ticket.machineId, (map.get(ticket.machineId) || 0) + partsCost);
      });

    selectedExecutions
      .filter((execution) => inPeriod(execution.completedAt || execution.startedAt))
      .forEach((execution) => {
        if (!execution.machineId) return;
        const executionCost = execution.itemResults.reduce((sum, item) => {
          const itemCost = (item.partsUsed || []).reduce(
            (itemSum, used) => itemSum + (partCostById.get(used.partId) || 0) * used.quantity,
            0,
          );
          return sum + itemCost;
        }, 0);
        map.set(execution.machineId, (map.get(execution.machineId) || 0) + executionCost);
      });

    return [...map.entries()]
      .map(([assetId, cost]) => {
        const asset = filteredAssets.find((item) => item.id === assetId);
        return { assetId, assetName: asset?.tag || assetId, cost };
      })
      .sort((a, b) => b.cost - a.cost);
  }, [filteredAssets, partCostById, selectedExecutions, selectedTickets, windowStart]);

  const totalMaterialCost = costByAsset.reduce((sum, row) => sum + row.cost, 0);

  const preventiveCompliance = useMemo(() => {
    const preventivePlans = maintenancePlans.filter((plan) => plan.active && plan.planType === "preventive");
    let plannedItems = 0;
    let executedItems = 0;

    filteredAssets.forEach((asset) => {
      preventivePlans
        .filter((plan) => plan.machineType === asset.type)
        .forEach((plan) => {
          plan.items.forEach((item) => {
            plannedItems += Math.floor(periodDays / item.frequencyDays);
          });
        });
    });

    selectedExecutions.forEach((execution) => {
      const plan = planById.get(execution.planId);
      if (!plan || plan.planType !== "preventive") return;
      execution.itemResults.forEach((result) => {
        if (result.completed && inPeriod(result.completedAt)) executedItems += 1;
      });
    });

    const compliancePercent = plannedItems > 0 ? (executedItems / plannedItems) * 100 : 0;
    return {
      plannedItems,
      executedItems,
      compliancePercent: clamp(compliancePercent, 0, 100),
    };
  }, [filteredAssets, maintenancePlans, periodDays, planById, selectedExecutions, windowStart]);

  const calledOpen = selectedTickets.filter((ticket) => ticket.status === "pending" && inPeriod(ticket.createdAt)).length;
  const calledInProgress = selectedTickets.filter((ticket) => ticket.status === "in_maintenance" && inPeriod(ticket.createdAt)).length;
  const calledClosed = selectedTickets.filter((ticket) => ticket.status === "resolved" && inPeriod(ticket.resolvedAt)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">KPIs de manutenção com filtros por período, linha e tipo de máquina.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Período</p>
            <Select value={String(periodDays)} onValueChange={(value) => setPeriodDays(Number(value) as PeriodDays)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 180 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Linha</p>
            <Select value={lineFilter} onValueChange={setLineFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {lineOptions.map((line) => (
                  <SelectItem key={line} value={line}>{line}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tipo de máquina</p>
            <Select value={machineTypeFilter} onValueChange={(value: "all" | MachineType) => setMachineTypeFilter(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {typeOptions.map((type) => (
                  <SelectItem key={type} value={type}>{MACHINE_TYPE_LABELS[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="MTTR (aprox.)" value={`${mttrHours.toFixed(2)} h`} subtitle="Corretivas resolvidas no período filtrado" />
        <MetricCard title="MTBF estimado" value={`${mtbfHours.toFixed(2)} h`} subtitle="Intervalo médio entre falhas corretivas" />
        <MetricCard title="Taxa de falha" value={`${failureRatePerDay.toFixed(3)} / dia`} subtitle={`${failuresInWindow} falhas corretivas em ${periodDays} dias`} />
        <MetricCard title="Disponibilidade física (aprox.)" value={`${availabilityPercent.toFixed(2)}%`} subtitle="Baseada em parada/retorno dos ativos filtrados" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">% Corretiva vs Preventiva (quantidade)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Corretiva: <strong>{correctivePercent.toFixed(1)}%</strong> ({correctiveCount})</p>
            <p className="text-sm">Preventiva: <strong>{preventivePercent.toFixed(1)}%</strong> ({preventiveCount})</p>
            <p className="text-xs text-muted-foreground">
              Corretiva via chamados e preventiva via execuções de plano preventivo no período filtrado.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Índice de preventiva cumprida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Itens executados: <strong>{preventiveCompliance.executedItems}</strong> de <strong>{preventiveCompliance.plannedItems}</strong>
            </p>
            <p className="text-sm">
              Percentual: <strong>{preventiveCompliance.compliancePercent.toFixed(1)}%</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Planejado no período estimado por frequência (dias) e tipo de máquina filtrado.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custo de manutenção por ativo (parcial)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Custo total de material no período: <strong>R$ {totalMaterialCost.toFixed(2)}</strong>
            </p>
            <div className="space-y-2">
              {costByAsset.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem custo de peças registrado no filtro atual.</p>
              ) : (
                costByAsset.slice(0, 8).map((row) => (
                  <div key={row.assetId} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                    <span>{row.assetName}</span>
                    <Badge variant="outline">R$ {row.cost.toFixed(2)}</Badge>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">Inclui apenas peças usadas (tickets + execuções).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chamados (OS operacionais)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Abertos: <strong>{calledOpen}</strong></p>
            <p className="text-sm">Em andamento: <strong>{calledInProgress}</strong></p>
            <p className="text-sm">Concluídos: <strong>{calledClosed}</strong></p>
            <p className="text-xs text-muted-foreground">Contagem considerando os filtros aplicados.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
