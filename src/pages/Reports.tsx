import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import { useConfig } from "@/contexts/ConfigContext";
import {
  MACHINE_TYPE_LABELS,
  MACHINE_STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/data/types";
import type { MachineType, Priority } from "@/data/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";



const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(45, 90%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 70%, 60%)",
  "hsl(190, 70%, 45%)",
];

function hoursBetween(start: string, end: string) {
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
}

function formatHours(h: number) {
  if (h < 1) return `${Math.round(h * 60)}min`;
  return `${h.toFixed(1)}h`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function Reports() {
  const {
    tickets,
    machines,
    components,
    parts,
    assetStopRecords,
    maintenancePlans,
    planExecutions,
    workOrders,
    purchaseOrders,
  } = useData();
  const { lubricationPlans } = useConfig();

  const now = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }, [now]);
  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(now);
  const [machineTypeFilter, setMachineTypeFilter] = useState<"all" | MachineType>("all");

  const windowStart = startDate;

  const allAssets = useMemo(
    () => [
      ...machines.map((m) => ({ id: m.id, tag: m.tag, type: m.type, sector: m.sector, kind: "machine" as const })),
      ...components.map((c) => ({ id: c.id, tag: c.tag, type: c.type as MachineType, sector: c.sector || "", kind: "component" as const })),
    ],
    [machines, components],
  );

  const assetMap = useMemo(() => {
    const map = new Map<string, (typeof allAssets)[number]>();
    allAssets.forEach((a) => map.set(a.id, a));
    return map;
  }, [allAssets]);

  // ─── 1. Ranking de Paradas por Ativo ───
  const downtimeByAsset = useMemo(() => {
    const map = new Map<string, number>();
    assetStopRecords.forEach((r) => {
      if (new Date(r.stoppedAt) < windowStart) return;
      if (r.reason === 'no_production') return; // Não conta nos indicadores
      const end = r.resumedAt ? r.resumedAt : now.toISOString();
      const hours = hoursBetween(r.stoppedAt, end);
      map.set(r.assetId, (map.get(r.assetId) || 0) + hours);
    });
    return Array.from(map.entries())
      .map(([id, hours]) => ({ asset: assetMap.get(id)?.tag || id, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);
  }, [assetStopRecords, windowStart, assetMap, now]);

  // ─── 2. Motivo das Paradas ───
  const downtimeByReason = useMemo(() => {
    const reasonLabels: Record<string, string> = {
      corrective: "Corretiva",
      preventive: "Preventiva",
      checklist: "Checklist",
      lubrication: "Lubrificação",
      no_production: "Sem Produção",
      other: "Outros",
    };
    const map = new Map<string, number>();
    assetStopRecords.forEach((r) => {
      if (new Date(r.stoppedAt) < windowStart) return;
      const label = reasonLabels[r.reason || "other"] || "Outros";
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [assetStopRecords, windowStart]);

  // ─── 3. MTTR por Ativo (Top 10) ───
  const mttrByAsset = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    tickets.forEach((t) => {
      if (t.status !== "resolved" || !t.resolvedAt) return;
      if (new Date(t.createdAt) < windowStart) return;
      const hours = hoursBetween(t.createdAt, t.resolvedAt);
      const prev = map.get(t.machineId) || { total: 0, count: 0 };
      map.set(t.machineId, { total: prev.total + hours, count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({
        asset: assetMap.get(id)?.tag || id,
        mttr: Math.round((v.total / v.count) * 10) / 10,
      }))
      .sort((a, b) => b.mttr - a.mttr)
      .slice(0, 10);
  }, [tickets, windowStart, assetMap]);

  // ─── 4. Custo de Peças por Ativo (Top 10) ───
  const costByAsset = useMemo(() => {
    const map = new Map<string, number>();
    const partMap = new Map(parts.map((p) => [p.id, p]));

    // From tickets
    tickets.forEach((t) => {
      if (new Date(t.createdAt) < windowStart) return;
      (t.partsUsed || []).forEach((pu) => {
        const part = partMap.get(pu.partId);
        if (part) map.set(t.machineId, (map.get(t.machineId) || 0) + pu.quantity * part.unitCost);
      });
    });

    // From plan executions
    planExecutions.forEach((ex) => {
      if (new Date(ex.startedAt) < windowStart || !ex.machineId) return;
      (ex.itemResults || []).forEach((ir) => {
        (ir.partsUsed || []).forEach((pu) => {
          const part = partMap.get(pu.partId);
          if (part) map.set(ex.machineId!, (map.get(ex.machineId!) || 0) + pu.quantity * part.unitCost);
        });
      });
    });

    return Array.from(map.entries())
      .map(([id, cost]) => ({ asset: assetMap.get(id)?.tag || id, cost: Math.round(cost * 100) / 100 }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
  }, [tickets, planExecutions, parts, windowStart, assetMap]);

  // ─── 5. Peças Mais Consumidas ───
  const topParts = useMemo(() => {
    const map = new Map<string, { qty: number; cost: number }>();
    const partMap = new Map(parts.map((p) => [p.id, p]));

    const addUsage = (partId: string, qty: number) => {
      const part = partMap.get(partId);
      if (!part) return;
      const prev = map.get(partId) || { qty: 0, cost: 0 };
      map.set(partId, { qty: prev.qty + qty, cost: prev.cost + qty * part.unitCost });
    };

    tickets.forEach((t) => {
      if (new Date(t.createdAt) < windowStart) return;
      (t.partsUsed || []).forEach((pu) => addUsage(pu.partId, pu.quantity));
    });

    planExecutions.forEach((ex) => {
      if (new Date(ex.startedAt) < windowStart) return;
      (ex.itemResults || []).forEach((ir) => {
        (ir.partsUsed || []).forEach((pu) => addUsage(pu.partId, pu.quantity));
      });
    });

    return Array.from(map.entries())
      .map(([id, v]) => ({
        name: partMap.get(id)?.description || partMap.get(id)?.sku || id,
        qty: v.qty,
        cost: Math.round(v.cost * 100) / 100,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [tickets, planExecutions, parts, windowStart]);

  // ─── 6. Chamados por Prioridade ───
  const ticketsByPriority = useMemo(() => {
    const map = new Map<string, number>();
    tickets.forEach((t) => {
      if (new Date(t.createdAt) < windowStart) return;
      const label = PRIORITY_LABELS[t.priority as Priority] || t.priority;
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [tickets, windowStart]);

  // ─── 7. Chamados ao Longo do Tempo ───
  const ticketsTrend = useMemo(() => {
    const totalDays = Math.max(differenceInDays(endDate, startDate), 1);
    const bucketSize = totalDays <= 30 ? 1 : totalDays <= 90 ? 7 : 30;
    const buckets: { date: string; abertos: number; resolvidos: number }[] = [];
    const start = windowStart.getTime();
    const end = now.getTime();

    for (let t = start; t < end; t += bucketSize * 86400000) {
      const bucketEnd = Math.min(t + bucketSize * 86400000, end);
      const abertos = tickets.filter((tk) => {
        const c = new Date(tk.createdAt).getTime();
        return c >= t && c < bucketEnd;
      }).length;
      const resolvidos = tickets.filter((tk) => {
        if (!tk.resolvedAt) return false;
        const r = new Date(tk.resolvedAt).getTime();
        return r >= t && r < bucketEnd;
      }).length;
      buckets.push({ date: formatDate(new Date(t)), abertos, resolvidos });
    }
    return buckets;
  }, [tickets, windowStart, now, startDate, endDate]);

  // ─── 8. Aderência Preventiva ───
  const preventiveCompliance = useMemo(() => {
    const preventivePlans = maintenancePlans.filter((p) => p.planType === "preventive" && p.active);
    if (preventivePlans.length === 0) return { done: 0, overdue: 0, total: 0, percent: 0 };

    let totalItems = 0;
    let overdueItems = 0;
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    preventivePlans.forEach((plan) => {
      const completedExecs = planExecutions.filter((ex) => ex.planId === plan.id && ex.status === "completed");
      (plan.items || []).forEach((item) => {
        totalItems++;
        const lastExec = completedExecs.sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""))[0];
        const lastDate = lastExec?.completedAt ? new Date(lastExec.completedAt).getTime() : 0;
        if (lastDate + item.frequencyDays * 86400000 <= todayMs) overdueItems++;
      });
    });

    const doneItems = totalItems - overdueItems;
    return {
      done: doneItems,
      overdue: overdueItems,
      total: totalItems,
      percent: totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0,
    };
  }, [maintenancePlans, planExecutions, now]);

  // ─── 9. Estoque Crítico ───
  const criticalStock = useMemo(() => {
    return parts
      .filter((p) => p.quantity <= p.minStock)
      .sort((a, b) => a.quantity / Math.max(a.minStock, 1) - b.quantity / Math.max(b.minStock, 1))
      .slice(0, 10);
  }, [parts]);

  // ─── 10. Status das Ordens de Serviço ───
  const workOrderStats = useMemo(() => {
    const filtered = workOrders.filter((wo) => new Date(wo.openedAt) >= windowStart);
    return {
      open: filtered.filter((wo) => wo.status === "open").length,
      inProgress: filtered.filter((wo) => wo.status === "in_progress").length,
      completed: filtered.filter((wo) => wo.status === "completed").length,
      reopened: filtered.filter((wo) => wo.reopened).length,
      total: filtered.length,
    };
  }, [workOrders, windowStart]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm">Análises e indicadores de manutenção</p>
        </div>
        <div className="flex flex-wrap gap-3 items-end sm:ml-auto">
          <div className="space-y-1">
            <Label>Tipo de ativo</Label>
            <Select value={machineTypeFilter} onValueChange={(v: "all" | MachineType) => setMachineTypeFilter(v)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(MACHINE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <Label>Data Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="operations">Operações</TabsTrigger>
          <TabsTrigger value="materials">Materiais</TabsTrigger>
          <TabsTrigger value="tickets">Chamados</TabsTrigger>
        </TabsList>

        {/* ─── TAB: Operações ─── */}
        <TabsContent value="operations" className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Aderência Preventiva" value={`${preventiveCompliance.percent}%`} subtitle={`${preventiveCompliance.done} em dia / ${preventiveCompliance.overdue} atrasados`} />
            <SummaryCard title="Ordens de Serviço" value={String(workOrderStats.total)} subtitle={`${workOrderStats.open} abertas · ${workOrderStats.completed} concluídas`} />
            <SummaryCard title="OS Abertas" value={String(workOrderStats.reopened)} subtitle="no período" />
            <SummaryCard title="Total Paradas" value={String(assetStopRecords.filter((r) => new Date(r.stoppedAt) >= windowStart).length)} subtitle="registros no período" />
          </div>

          {/* Downtime by asset */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Horas Paradas por Ativo (Top 10)</CardTitle></CardHeader>
              <CardContent>
                {downtimeByAsset.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sem dados no período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={downtimeByAsset} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis type="category" dataKey="asset" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} width={75} />
                      <Tooltip formatter={(v: number) => [`${v}h`, "Horas"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="hours" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Paradas por Motivo</CardTitle></CardHeader>
              <CardContent>
                {downtimeByReason.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sem dados no período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={downtimeByReason} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {downtimeByReason.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* MTTR */}
          <Card>
            <CardHeader><CardTitle className="text-base">MTTR por Ativo — Tempo Médio de Reparo (Top 10)</CardTitle></CardHeader>
            <CardContent>
              {mttrByAsset.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem chamados resolvidos no período</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mttrByAsset} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} unit="h" />
                    <YAxis type="category" dataKey="asset" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} width={75} />
                    <Tooltip formatter={(v: number) => [formatHours(v), "MTTR"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="mttr" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB: Materiais ─── */}
        <TabsContent value="materials" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Cost by asset */}
            <Card>
              <CardHeader><CardTitle className="text-base">Custo de Peças por Ativo (Top 10)</CardTitle></CardHeader>
              <CardContent>
                {costByAsset.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sem consumo no período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={costByAsset} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v}`} />
                      <YAxis type="category" dataKey="asset" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} width={75} />
                      <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Custo"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top parts consumed */}
            <Card>
              <CardHeader><CardTitle className="text-base">Peças Mais Consumidas</CardTitle></CardHeader>
              <CardContent>
                {topParts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sem consumo no período</p>
                ) : (
                  <div className="overflow-auto max-h-[350px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card">
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-muted-foreground">Peça</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Qtd</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Custo Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topParts.map((p, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2">{p.name}</td>
                            <td className="py-2 text-right font-medium">{p.qty}</td>
                            <td className="py-2 text-right">R$ {p.cost.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Critical stock */}
          <Card>
            <CardHeader><CardTitle className="text-base">Estoque Crítico</CardTitle></CardHeader>
            <CardContent>
              {criticalStock.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma peça em nível crítico 🎉</p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-muted-foreground">Peça</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Estoque</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Mínimo</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Deficit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criticalStock.map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-2">{p.description || p.sku || p.id}</td>
                          <td className="py-2 text-right font-medium">{p.quantity}</td>
                          <td className="py-2 text-right">{p.minStock}</td>
                          <td className="py-2 text-right">
                            <Badge variant={p.quantity === 0 ? "destructive" : "outline"}>
                              {p.quantity - p.minStock}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB: Chamados ─── */}
        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Abertos no Período"
              value={String(tickets.filter((t) => new Date(t.createdAt) >= windowStart).length)}
              subtitle="chamados"
            />
            <SummaryCard
              title="Resolvidos"
              value={String(tickets.filter((t) => t.resolvedAt && new Date(t.resolvedAt) >= windowStart).length)}
              subtitle="no período"
            />
            <SummaryCard
              title="Pendentes Agora"
              value={String(tickets.filter((t) => t.status === "pending" || t.status === "in_maintenance").length)}
              subtitle="aguardando resolução"
            />
            <SummaryCard
              title="Críticos Pendentes"
              value={String(tickets.filter((t) => t.priority === "critical" && t.status !== "resolved").length)}
              subtitle="prioridade crítica"
            />
          </div>

          {/* Trend */}
          <Card>
            <CardHeader><CardTitle className="text-base">Chamados ao Longo do Tempo</CardTitle></CardHeader>
            <CardContent>
              {ticketsTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ticketsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Line type="monotone" dataKey="abertos" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Abertos" />
                    <Line type="monotone" dataKey="resolvidos" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Resolvidos" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* By priority */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Chamados por Prioridade</CardTitle></CardHeader>
              <CardContent>
                {ticketsByPriority.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={ticketsByPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {ticketsByPriority.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top assets with most tickets */}
            <Card>
              <CardHeader><CardTitle className="text-base">Ativos com Mais Chamados</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const map = new Map<string, number>();
                  tickets.forEach((t) => {
                    if (new Date(t.createdAt) < windowStart) return;
                    map.set(t.machineId, (map.get(t.machineId) || 0) + 1);
                  });
                  const data = Array.from(map.entries())
                    .map(([id, count]) => ({ asset: assetMap.get(id)?.tag || id, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8);

                  if (data.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>;

                  return (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis type="category" dataKey="asset" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} width={75} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                        <Bar dataKey="count" fill="hsl(210, 70%, 55%)" radius={[0, 4, 4, 0]} name="Chamados" />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
