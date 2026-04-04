import { useMemo, useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useConfig } from "@/contexts/ConfigContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MACHINE_TYPE_LABELS, MACHINE_STATUS_LABELS } from "@/data/types";
import { format } from "date-fns";
import { Search, History } from "lucide-react";

type HistoryEventType = "ticket" | "preventive" | "checklist" | "lubrication" | "stop" | "work_order";

const EVENT_TYPE_LABELS: Record<HistoryEventType, string> = {
  ticket: "Chamado",
  preventive: "Preventiva",
  checklist: "Checklist",
  lubrication: "Lubrificação",
  stop: "Parada",
  work_order: "Ordem de Serviço",
};

const EVENT_TYPE_COLORS: Record<HistoryEventType, string> = {
  ticket: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  preventive: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  checklist: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  lubrication: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  stop: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  work_order: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

interface HistoryEvent {
  id: string;
  date: string;
  type: HistoryEventType;
  assetTag: string;
  assetId: string;
  description: string;
  status: string;
  details?: string;
}

export default function MachineHistory() {
  const { machines, components, tickets, planExecutions, maintenancePlans, workOrders, assetStopRecords } = useData();
  const { lubricationPlans, lubricationExecutions } = useConfig();

  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [assetFilter, setAssetFilter] = useState<string>("all");

  const allAssets = useMemo(() => {
    const items = [
      ...machines.map((m) => ({ id: m.id, tag: m.tag, type: m.type })),
      ...components.map((c) => ({ id: c.id, tag: c.tag, type: c.type })),
    ];
    return items.sort((a, b) => a.tag.localeCompare(b.tag, "pt-BR", { numeric: true }));
  }, [machines, components]);

  const assetMap = useMemo(() => {
    const map: Record<string, string> = {};
    machines.forEach((m) => (map[m.id] = m.tag));
    components.forEach((c) => (map[c.id] = c.tag));
    return map;
  }, [machines, components]);

  const events = useMemo<HistoryEvent[]>(() => {
    const result: HistoryEvent[] = [];

    // Tickets
    tickets.forEach((t) => {
      result.push({
        id: `ticket-${t.id}`,
        date: t.resolvedAt || t.createdAt,
        type: "ticket",
        assetTag: assetMap[t.machineId] || t.machineId,
        assetId: t.machineId,
        description: t.symptom || "Chamado",
        status: t.status === "resolved" ? "Resolvido" : t.status === "in_maintenance" ? "Em Manutenção" : "Pendente",
        details: t.comment || undefined,
      });
    });

    // Plan Executions
    planExecutions.forEach((ex) => {
      const plan = maintenancePlans.find((p) => p.id === ex.planId);
      if (!plan || !ex.machineId) return;
      const eventType: HistoryEventType = plan.planType === "checklist" ? "checklist" : "preventive";
      result.push({
        id: `exec-${ex.id}`,
        date: ex.completedAt || ex.startedAt,
        type: eventType,
        assetTag: assetMap[ex.machineId] || ex.machineId,
        assetId: ex.machineId,
        description: plan.name,
        status: ex.status === "completed" ? "Concluída" : "Em Andamento",
        details: ex.actualHours ? `${ex.actualHours}h trabalhadas` : undefined,
      });
    });

    // Lubrication Executions
    lubricationExecutions.forEach((le) => {
      const plan = lubricationPlans.find((p) => p.id === le.planId);
      if (!plan) return;
      result.push({
        id: `lub-${le.id}`,
        date: le.executedAt,
        type: "lubrication",
        assetTag: plan.assetTag,
        assetId: plan.assetId,
        description: plan.whatToLubricate || "Lubrificação",
        status: "Executada",
        details: le.notes || undefined,
      });
    });

    // Stop Records
    assetStopRecords.forEach((sr) => {
      result.push({
        id: `stop-${sr.id}`,
        date: sr.stoppedAt,
        type: "stop",
        assetTag: assetMap[sr.assetId] || sr.assetId,
        assetId: sr.assetId,
        description: sr.description || sr.reason || "Parada",
        status: sr.resumedAt ? "Retomada" : "Em Parada",
        details: sr.resumedAt ? `Retomada em ${format(new Date(sr.resumedAt), "dd/MM/yyyy HH:mm")}` : undefined,
      });
    });

    // Work Orders
    workOrders.forEach((wo) => {
      result.push({
        id: `wo-${wo.id}`,
        date: wo.finishedAt || wo.startedAt || wo.openedAt,
        type: "work_order",
        assetTag: assetMap[wo.assetId] || wo.assetId,
        assetId: wo.assetId,
        description: wo.title || wo.description || "Ordem de Serviço",
        status: wo.status === "completed" ? "Concluída" : wo.status === "in_progress" ? "Em Andamento" : "Aberta",
        details: wo.actualHours ? `${wo.actualHours}h trabalhadas` : undefined,
      });
    });

    // Sort by date descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [tickets, planExecutions, maintenancePlans, lubricationExecutions, lubricationPlans, assetStopRecords, workOrders, assetMap]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (assetFilter !== "all" && e.assetId !== assetFilter) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        return (
          e.description.toLowerCase().includes(q) ||
          e.assetTag.toLowerCase().includes(q) ||
          e.status.toLowerCase().includes(q) ||
          (e.details || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, typeFilter, assetFilter, searchText]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" /> Histórico de Máquinas
        </h1>
        <p className="text-muted-foreground text-sm">Consulte o histórico completo de atividades por ativo</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:max-w-xs space-y-1">
          <Label>Buscar (Descrição)</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por descrição..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-full sm:max-w-xs space-y-1">
          <Label>Item (Ativo)</Label>
          <Select value={assetFilter} onValueChange={setAssetFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por ativo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {allAssets.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:max-w-xs space-y-1">
          <Label>Tipo</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">{filtered.length} registro(s) encontrado(s)</p>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, 200).map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {format(new Date(event.date), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={EVENT_TYPE_COLORS[event.type]}>
                      {EVENT_TYPE_LABELS[event.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{event.assetTag}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{event.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{event.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {event.details || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
