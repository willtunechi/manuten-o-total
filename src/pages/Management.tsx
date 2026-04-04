import { useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, AlertTriangle, Clock, CheckCircle2, Wrench, Activity } from "lucide-react";
import { format, differenceInHours, differenceInMinutes, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const priorityLabel: Record<string, string> = { critical: "Crítica", high: "Alta", medium: "Média", low: "Baixa" };
const priorityColor: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  in_maintenance: "Em Manutenção",
  resolved: "Resolvido",
  open: "Aberto",
  in_progress: "Em Andamento",
  completed: "Concluído",
};

export default function Management() {
  const { mechanics, tickets, machines, workOrders, planExecutions, maintenancePlans } = useData();

  // Open tickets sorted by priority
  const openTickets = useMemo(() => {
    return tickets
      .filter((t) => t.status !== "resolved")
      .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));
  }, [tickets]);

  // Active work orders (open or in_progress)
  const activeWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => wo.status !== "completed");
  }, [workOrders]);

  // Recent resolved tickets (last 7 days)
  const recentResolved = useMemo(() => {
    const cutoff = subDays(new Date(), 7);
    return tickets
      .filter((t) => t.status === "resolved" && t.resolvedAt && new Date(t.resolvedAt) >= cutoff)
      .sort((a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime());
  }, [tickets]);

  // In-progress plan executions
  const activeExecutions = useMemo(() => {
    return planExecutions.filter((pe) => pe.status === "in_progress");
  }, [planExecutions]);

  // Mechanic activity map
  const mechanicActivity = useMemo(() => {
    const map = new Map<string, { name: string; activities: string[]; busy: boolean }>();
    mechanics.forEach((m) => {
      map.set(m.id, { name: m.name, activities: [], busy: false });
    });

    // Check tickets in_maintenance (these don't track mechanic directly, but show as team load)
    const inMaintenanceCount = tickets.filter((t) => t.status === "in_maintenance").length;

    // Check active work orders
    activeWorkOrders.forEach((wo) => {
      const machine = machines.find((m) => m.id === wo.assetId);
      const label = `OS: ${wo.title || "Sem título"} - ${machine?.tag || wo.assetId}`;
      // Work orders don't have mechanic_id, so we track them as general team activity
    });

    // Check active plan executions
    activeExecutions.forEach((pe) => {
      const plan = maintenancePlans.find((p) => p.id === pe.planId);
      const machine = machines.find((m) => m.id === pe.machineId);
      if (plan) {
        // Attribute to all mechanics as generic activity
      }
    });

    return map;
  }, [mechanics, tickets, activeWorkOrders, activeExecutions, machines, maintenancePlans]);

  const getMachineTag = (machineId: string) => {
    return machines.find((m) => m.id === machineId)?.tag || "—";
  };

  const formatElapsed = (dateStr: string) => {
    const hours = differenceInHours(new Date(), new Date(dateStr));
    if (hours < 1) {
      const mins = differenceInMinutes(new Date(), new Date(dateStr));
      return `${mins}min`;
    }
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  };

  // KPI stats
  const stats = useMemo(() => {
    const availableMechanics = mechanics.filter((m) => m.available).length;
    const criticalTickets = openTickets.filter((t) => t.priority === "critical" || t.priority === "high").length;
    const resolvedThisWeek = recentResolved.length;
    const activeOSCount = activeWorkOrders.length;
    return { availableMechanics, criticalTickets, resolvedThisWeek, activeOSCount };
  }, [mechanics, openTickets, recentResolved, activeWorkOrders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gerenciamento</h1>
        <p className="text-muted-foreground text-sm">Visão geral das atividades e prioridades da equipe de manutenção</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.availableMechanics}/{mechanics.length}</p>
              <p className="text-xs text-muted-foreground">Disponíveis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.criticalTickets}</p>
              <p className="text-xs text-muted-foreground">Chamados Urgentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.resolvedThisWeek}</p>
              <p className="text-xs text-muted-foreground">Resolvidos (7d)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Wrench className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeOSCount}</p>
              <p className="text-xs text-muted-foreground">OS Ativas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Open Tickets by Priority */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Chamados Abertos ({openTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Máquina</TableHead>
                    <TableHead>Sintoma</TableHead>
                    <TableHead className="w-24">Prioridade</TableHead>
                    <TableHead className="w-20">Tempo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum chamado aberto
                      </TableCell>
                    </TableRow>
                  ) : (
                    openTickets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.code}</TableCell>
                        <TableCell className="font-medium">{getMachineTag(t.machineId)}</TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]">{t.symptom}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priorityColor[t.priority]}>
                            {priorityLabel[t.priority] || t.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatElapsed(t.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Team / Collaborators Status */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipe de Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="w-20">Função</TableHead>
                    <TableHead className="w-16">Turno</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mechanics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum colaborador cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    mechanics.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="text-xs capitalize">
                          {m.role === "mechanic" ? "Mecânico" : m.role === "operator" ? "Operador" : m.role}
                        </TableCell>
                        <TableCell className="text-center">{m.shift}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={m.available
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                          }>
                            {m.available ? "Disponível" : "Ocupado"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Work Orders + Active Executions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Ordens de Serviço Ativas ({activeWorkOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[350px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-20">Aberta há</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeWorkOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhuma OS ativa
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeWorkOrders.map((wo) => (
                      <TableRow key={wo.id}>
                        <TableCell className="font-medium truncate max-w-[200px]">{wo.title || "Sem título"}</TableCell>
                        <TableCell>{getMachineTag(wo.assetId)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={wo.status === "in_progress"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }>
                            {statusLabel[wo.status] || wo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatElapsed(wo.openedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Execuções em Andamento ({activeExecutions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[350px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead>Máquina</TableHead>
                    <TableHead className="w-20">Início</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeExecutions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Nenhuma execução ativa
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeExecutions.map((pe) => {
                      const plan = maintenancePlans.find((p) => p.id === pe.planId);
                      return (
                        <TableRow key={pe.id}>
                          <TableCell className="font-medium truncate max-w-[200px]">{plan?.name || "—"}</TableCell>
                          <TableCell>{pe.machineId ? getMachineTag(pe.machineId) : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatElapsed(pe.startedAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico Recente (últimos 7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[350px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Máquina</TableHead>
                  <TableHead>Sintoma</TableHead>
                  <TableHead className="w-24">Prioridade</TableHead>
                  <TableHead className="w-36">Resolvido em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentResolved.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum chamado resolvido nos últimos 7 dias
                    </TableCell>
                  </TableRow>
                ) : (
                  recentResolved.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.code}</TableCell>
                      <TableCell className="font-medium">{getMachineTag(t.machineId)}</TableCell>
                      <TableCell className="text-sm truncate max-w-[250px]">{t.symptom}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityColor[t.priority]}>
                          {priorityLabel[t.priority] || t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.resolvedAt ? format(new Date(t.resolvedAt), "dd/MM HH:mm", { locale: ptBR }) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
