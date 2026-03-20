import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const { tickets, machines, components, mechanics, parts, addTicket, updateTicket, removeTicket, stopMachine, stopComponent, userAssignedMachineIds, userAssignedComponentIds } = useData();
  const { role, session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | undefined>();
  const [deleting, setDeleting] = useState<Ticket | undefined>();
  const [viewing, setViewing] = useState<Ticket | undefined>();
  const [statusFilter, setStatusFilter] = useState<"pending" | "resolved" | "all">("pending");

  // Handle ?os= query param to open detail
  useEffect(() => {
    const osId = searchParams.get("os");
    if (osId) {
      const ticket = tickets.find((t) => t.id === osId);
      if (ticket) {
        setViewing(ticket);
        setStatusFilter(ticket.status === "resolved" ? "resolved" : "pending");
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, tickets, setSearchParams]);

  const currentUserName = useMemo(() => {
    const email = session?.user?.email || "";
    const mechanic = mechanics.find((m) => m.email === email);
    return mechanic?.name || email;
  }, [session, mechanics]);

  const isOperator = role === "operator";

  const canEditTicket = (ticket: Ticket) => {
    if (!isOperator) return true;
    const ticketAuthor = ticket.reportedBy || ticket.createdBy || "";
    return ticketAuthor === currentUserName;
  };

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

  const getAssetLabel = (machineId: string) => {
    const machine = machines.find((m) => m.id === machineId);
    const component = components.find((c) => c.id === machineId);
    return machine?.tag || component?.tag || "Sem vínculo";
  };

  const getPartsUsedLabels = (ticket: Ticket) => {
    if (!ticket.partsUsed?.length) return [];
    return ticket.partsUsed.map((pu) => {
      const part = parts.find((p) => p.id === pu.partId);
      return { name: part?.description || part?.sku || pu.partId, quantity: pu.quantity };
    });
  };

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
          const assetLabel = getAssetLabel(t.machineId);
          const editable = canEditTicket(t);
          return (
            <Card key={t.id} className={`bg-card border-border transition-colors ${editable ? "cursor-pointer hover:border-primary/40" : "opacity-80"}`} onClick={() => setViewing(t)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold">{t.code ? `OS-${String(t.code).padStart(4, '0')}` : assetLabel}</span>
                    <span className="text-xs text-muted-foreground">({assetLabel})</span>
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
                    <span>Por {t.reportedBy || t.createdBy} · {new Date(t.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="ghost" className="gap-1" onClick={(e) => { e.stopPropagation(); setViewing(t); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {editable && (
                    <>
                      <Button size="sm" variant="outline" className="gap-1" onClick={(e) => { e.stopPropagation(); setEditing(t); setFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleting(t); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(undefined); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {viewing?.code ? `OS-${String(viewing.code).padStart(4, '0')}` : 'Detalhes do Chamado'}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">Equipamento</span>
                  <p className="font-mono font-bold">{getAssetLabel(viewing.machineId)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <div className="mt-0.5">
                    <Badge variant="outline" className={ticketStatusColor[viewing.status]}>
                      {TICKET_STATUS_LABELS[viewing.status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Prioridade</span>
                  <div className="mt-0.5">
                    <Badge className={priorityColor[viewing.priority]}>{PRIORITY_LABELS[viewing.priority]}</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Tipo</span>
                  <p className="text-sm font-medium">
                    {OS_TYPE_LABELS[viewing.type]}
                    {viewing.type === "corrective" && viewing.maintenanceType && (
                      <span className="text-muted-foreground"> · {viewing.maintenanceType === "mechanical" ? "Mecânica" : "Elétrica"}</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Aberto por</span>
                  <p className="text-sm font-medium">{viewing.reportedBy || viewing.createdBy || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Data de abertura</span>
                  <p className="text-sm font-medium">{new Date(viewing.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                {viewing.resolvedAt && (
                  <div>
                    <span className="text-xs text-muted-foreground">Resolvido em</span>
                    <p className="text-sm font-medium">{new Date(viewing.resolvedAt).toLocaleString("pt-BR")}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Descrição / Sintoma</span>
                <p className="text-sm mt-1 bg-muted/30 rounded-md p-3 border border-border">{viewing.symptom}</p>
              </div>

              {viewing.comment && (
                <div>
                  <span className="text-xs text-muted-foreground">Comentário</span>
                  <p className="text-sm mt-1 bg-muted/30 rounded-md p-3 border border-border">{viewing.comment}</p>
                </div>
              )}

              {viewing.photoUrl && (
                <div>
                  <span className="text-xs text-muted-foreground">Foto / Vídeo</span>
                  {/\.(mp4|webm|mov)$/i.test(viewing.photoUrl) ? (
                    <video src={viewing.photoUrl} controls className="mt-1 rounded-md border border-border max-h-64 w-full object-contain" />
                  ) : (
                    <img src={viewing.photoUrl} alt="Anexo do chamado" className="mt-1 rounded-md border border-border max-h-48 object-contain" />
                  )}
                </div>
              )}

              {getPartsUsedLabels(viewing).length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Peças utilizadas</span>
                  <ul className="mt-1 space-y-1">
                    {getPartsUsedLabels(viewing).map((p, i) => (
                      <li key={i} className="text-sm flex justify-between bg-muted/30 rounded-md px-3 py-1.5 border border-border">
                        <span>{p.name}</span>
                        <span className="font-mono text-muted-foreground">x{p.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {canEditTicket(viewing) && (
                  <Button variant="outline" size="sm" onClick={() => { setEditing(viewing); setViewing(undefined); setFormOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setViewing(undefined)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
