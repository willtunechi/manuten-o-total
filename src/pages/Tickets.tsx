import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PRIORITY_LABELS, OS_TYPE_LABELS, TICKET_STATUS_LABELS } from "@/data/types";
import type { Priority, TicketStatus, Ticket } from "@/data/types";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/hooks/useAuth";
import { TicketFormDialog } from "@/components/forms/TicketFormDialog";
import { DeleteConfirmDialog } from "@/components/forms/DeleteConfirmDialog";

const priorityColor: Record<Priority, string> = {
  critical: "bg-priority-critical text-white",
  high: "bg-priority-high text-white",
  medium: "bg-priority-medium text-black",
  low: "bg-priority-low text-white",
};

const ticketStatusColor: Record<TicketStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_maintenance: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function Tickets() {
  const { tickets, machines, components, addTicket, updateTicket, removeTicket, stopMachine, stopComponent } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | undefined>();
  const [deleting, setDeleting] = useState<Ticket | undefined>();
  const [statusFilter, setStatusFilter] = useState<"pending" | "resolved" | "all">("pending");

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return t.status === "pending" || t.status === "in_maintenance";
    return t.status === "resolved";
  });

  const filterButtons: { key: "pending" | "resolved" | "all"; label: string }[] = [
    { key: "pending", label: "Pendente" },
    { key: "resolved", label: "Resolvido" },
    { key: "all", label: "Todos" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chamados</h1>
          <p className="text-muted-foreground text-sm">Solicitações de manutenção</p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="h-5 w-5" /> Novo Chamado
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterButtons.map((f) => (
          <Button key={f.key} size="sm" variant={statusFilter === f.key ? "default" : "outline"} onClick={() => setStatusFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredTickets.map((t) => {
          const machine = machines.find((m) => m.id === t.machineId);
          const component = components.find((c) => c.id === t.machineId);
          const assetLabel = machine?.tag || component?.tag || "Sem vínculo";
          return (
            <Card key={t.id} className="bg-card border-border cursor-pointer hover:border-primary/40 transition-colors" onClick={() => { setEditing(t); setFormOpen(true); }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold">{assetLabel}</span>
                    <Badge className={priorityColor[t.priority]}>{PRIORITY_LABELS[t.priority]}</Badge>
                    <Badge variant="outline" className="text-[10px]">{OS_TYPE_LABELS[t.type]}</Badge>
                    {t.type === "corrective" && t.maintenanceType && (
                      <Badge variant="outline" className="text-[10px]">
                        {t.maintenanceType === "mechanical" ? "Mecânica" : "Elétrica"}
                      </Badge>
                    )}
                    <Badge variant="outline" className={ticketStatusColor[t.status]}>
                      {TICKET_STATUS_LABELS[t.status]}
                    </Badge>
                  </div>
                  <p className="text-sm">{t.symptom}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Por {t.createdBy} · {new Date(t.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1" onClick={(e) => { e.stopPropagation(); setEditing(t); setFormOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleting(t); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TicketFormDialog open={formOpen} onOpenChange={setFormOpen} ticket={editing} onSave={(data, shouldStop) => {
        if (editing) {
          updateTicket(editing.id, data);
        } else {
          addTicket(data);
          if (shouldStop && data.machineId) {
            const isMachine = machines.some(m => m.id === data.machineId);
            const reason = "corrective" as const;
            const description = data.symptom || "Parada via chamado";
            const maintType = data.maintenanceType as "mechanical" | "electrical" | undefined;
            if (isMachine) {
              stopMachine(data.machineId, reason, description, maintType);
            } else {
              stopComponent(data.machineId, reason, description, maintType);
            }
          }
        }
      }} />
      <DeleteConfirmDialog open={!!deleting} onOpenChange={() => setDeleting(undefined)} title={deleting?.symptom.slice(0, 40) || ""} onConfirm={() => { if (deleting) removeTicket(deleting.id); setDeleting(undefined); }} />
    </div>
  );
}
