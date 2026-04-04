import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Plus, X, XCircle, StopCircle, PlayCircle, Timer } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import type { MaintenancePlan, PlanExecution, PlanItemResult, MachineStatus } from "@/data/types";
import { MACHINE_STATUS_LABELS } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: MaintenancePlan;
  execution: PlanExecution | null;
  onStartExecution: (planId: string, machineId?: string) => void;
  onUpdateItem: (executionId: string, itemResult: PlanItemResult) => void;
  onComplete: (executionId: string, actualHours?: number) => void;
  machineId?: string;
  machineStatus?: MachineStatus;
  onStopMachine?: (executionId: string) => void;
  onResumeMachine?: (executionId: string) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function PlanExecutionDialog({ open, onOpenChange, plan, execution, onStartExecution, onUpdateItem, onComplete, machineId, machineStatus, onStopMachine, onResumeMachine }: Props) {
  const { parts } = useData();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [addingPart, setAddingPart] = useState<{ itemId: string; partId: string; quantity: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [completionHours, setCompletionHours] = useState("");

  const currentExecution = execution;

  useEffect(() => {
    if (!currentExecution) return;
    const hasOpenStop = (currentExecution.machineStops || []).some((s) => !s.resumedAt);
    if (!hasOpenStop) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [currentExecution]);

  const isMachineStopped = useMemo(() => {
    if (!currentExecution) return false;
    const stops = currentExecution.machineStops || [];
    return stops.length > 0 && !stops[stops.length - 1].resumedAt;
  }, [currentExecution]);

  const totalDowntimeMs = useMemo(() => {
    if (!currentExecution) return 0;
    return (currentExecution.machineStops || []).reduce((sum, s) => {
      const start = new Date(s.stoppedAt).getTime();
      const end = s.resumedAt ? new Date(s.resumedAt).getTime() : now;
      return sum + (end - start);
    }, 0);
  }, [currentExecution, now]);

  const getItemResult = (itemId: string): PlanItemResult | undefined => {
    return currentExecution?.itemResults.find((r) => r.itemId === itemId);
  };

  const completedCount = useMemo(() => {
    if (!currentExecution) return 0;
    return currentExecution.itemResults.filter((r) => r.completed).length;
  }, [currentExecution]);

  const progress = plan.items.length > 0 ? (completedCount / plan.items.length) * 100 : 0;
  const allDone = completedCount === plan.items.length;

  const handleStart = () => {
    onStartExecution(plan.id, machineId);
  };

  const handleSetItemResult = (itemId: string, result: "ok" | "nok") => {
    if (!currentExecution) return;
    const existing = getItemResult(itemId);
    onUpdateItem(currentExecution.id, {
      itemId,
      completed: true,
      result,
      completedAt: new Date().toISOString(),
      mechanicId: existing?.mechanicId,
      comment: existing?.comment || "",
      photoUrl: existing?.photoUrl || "",
      partsUsed: existing?.partsUsed || [],
    });
  };

  const handleUpdateField = (itemId: string, field: keyof PlanItemResult, value: string) => {
    if (!currentExecution) return;
    const existing = getItemResult(itemId);
    onUpdateItem(currentExecution.id, {
      itemId,
      completed: existing?.completed || false,
      result: existing?.result,
      completedAt: existing?.completedAt,
      mechanicId: existing?.mechanicId,
      comment: existing?.comment || "",
      photoUrl: existing?.photoUrl || "",
      partsUsed: existing?.partsUsed || [],
      [field]: value,
    });
  };

  const handleAddPart = (itemId: string) => {
    if (!currentExecution || !addingPart || addingPart.itemId !== itemId || !addingPart.partId || addingPart.quantity <= 0) return;
    const existing = getItemResult(itemId);
    const currentParts = existing?.partsUsed || [];
    const existingPartIdx = currentParts.findIndex((p) => p.partId === addingPart.partId);
    let newParts;
    if (existingPartIdx >= 0) {
      newParts = currentParts.map((p, i) => i === existingPartIdx ? { ...p, quantity: p.quantity + addingPart.quantity } : p);
    } else {
      newParts = [...currentParts, { partId: addingPart.partId, quantity: addingPart.quantity }];
    }
    onUpdateItem(currentExecution.id, {
      itemId,
      completed: existing?.completed || false,
      result: existing?.result,
      completedAt: existing?.completedAt,
      mechanicId: existing?.mechanicId,
      comment: existing?.comment || "",
      photoUrl: existing?.photoUrl || "",
      partsUsed: newParts,
    });
    setAddingPart(null);
  };

  const handleRemovePart = (itemId: string, partId: string) => {
    if (!currentExecution) return;
    const existing = getItemResult(itemId);
    const newParts = (existing?.partsUsed || []).filter((p) => p.partId !== partId);
    onUpdateItem(currentExecution.id, {
      itemId,
      completed: existing?.completed || false,
      result: existing?.result,
      completedAt: existing?.completedAt,
      mechanicId: existing?.mechanicId,
      comment: existing?.comment || "",
      photoUrl: existing?.photoUrl || "",
      partsUsed: newParts,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{plan.items.length} itens • {plan.planType === "preventive" ? "Preventiva" : "Checklist Diário"}</p>
        </DialogHeader>

        {!currentExecution ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">Nenhuma execução em andamento.</p>
            <Button size="lg" onClick={handleStart}>Iniciar Execução</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {machineId && onStopMachine && onResumeMachine && (() => {
              const stoppedByThis = isMachineStopped;
              const stoppedByOther = machineStatus === "maintenance" && !isMachineStopped;
              const isOperating = !stoppedByThis && !stoppedByOther;

              return (
                <div className={`rounded-lg p-3 flex items-center justify-between gap-3 ${
                  stoppedByThis ? "bg-destructive/10 border border-destructive/30" :
                  stoppedByOther ? "bg-[hsl(var(--status-waiting))]/15 border border-[hsl(var(--status-waiting))]/40" :
                  "bg-primary/10 border border-primary/30"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      stoppedByThis ? "bg-destructive animate-pulse" :
                      stoppedByOther ? "bg-[hsl(var(--status-waiting))]" :
                      "bg-primary"
                    }`} />
                    <div>
                      <p className="text-sm font-medium">
                        {stoppedByOther ? "Máquina parada (por outra execução)" :
                         machineStatus ? `Máquina: ${MACHINE_STATUS_LABELS[machineStatus]}` :
                         (stoppedByThis ? "Máquina: Parada" : "Máquina: Operando")}
                      </p>
                      {(totalDowntimeMs > 0 || stoppedByOther) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          <span>Tempo parado: <span className="font-mono font-medium">{totalDowntimeMs > 0 ? formatDuration(totalDowntimeMs) : "—"}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                  {stoppedByThis && (
                    <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90" onClick={() => onResumeMachine(currentExecution.id)}>
                      <PlayCircle className="h-4 w-4" /> Retomar Máquina
                    </Button>
                  )}
                  {isOperating && (
                    <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => onStopMachine(currentExecution.id)}>
                      <StopCircle className="h-4 w-4" /> Parar Máquina
                    </Button>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center gap-4">
              <Progress value={progress} className="flex-1" />
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{completedCount}/{plan.items.length}</span>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-3 text-left w-[140px]">Resultado</th>
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-left hidden md:table-cell">Tipo Inspeção</th>
                    <th className="p-3 text-left hidden lg:table-cell">Pontos de Atenção</th>
                    <th className="p-3 text-left w-20">Freq.</th>
                    <th className="p-3 text-left w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.items.map((item) => {
                    const result = getItemResult(item.id);
                    const isExpanded = expandedItem === item.id;
                    const isOk = result?.result === "ok" || (!!result?.completed && !result?.result);
                    const isNok = result?.result === "nok";

                    return (
                      <>
                        <tr
                          key={item.id}
                          className={`border-b border-border cursor-pointer transition-colors ${
                            isNok
                              ? "bg-destructive/10 hover:bg-destructive/15"
                              : isOk
                                ? "bg-[hsl(var(--status-operating))]/10 hover:bg-[hsl(var(--status-operating))]/15"
                                : "hover:bg-muted/30"
                          }`}
                          onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        >
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className={`h-7 px-2 text-xs ${
                                  isOk ? "bg-[hsl(var(--status-operating))] text-white hover:bg-[hsl(var(--status-operating))]/90" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                                onClick={() => handleSetItemResult(item.id, "ok")}
                              >
                                OK
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className={`h-7 px-2 text-xs ${
                                  isNok ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                                onClick={() => handleSetItemResult(item.id, "nok")}
                              >
                                NOK
                              </Button>
                            </div>
                          </td>
                          <td className="p-3 font-medium">{item.description}</td>
                          <td className="p-3 hidden md:table-cell text-muted-foreground">{item.inspectionType}</td>
                          <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs">{item.attentionPoints}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">
                              {item.frequencyDays === 1 ? "Diário" : `${item.frequencyDays}d`}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {isOk ? (
                              <div className="flex items-center gap-1 text-[hsl(var(--status-operating))]">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs">OK</span>
                              </div>
                            ) : isNok ? (
                              <div className="flex items-center gap-1 text-destructive">
                                <XCircle className="h-4 w-4" />
                                <span className="text-xs">NOK</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs">Pendente</span>
                              </div>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${item.id}-detail`} className="bg-muted/20 border-b border-border">
                            <td colSpan={6} className="p-4">
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-xs font-medium">Foto</label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      className="text-xs"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const url = URL.createObjectURL(file);
                                          handleUpdateField(item.id, "photoUrl", url);
                                        }
                                      }}
                                    />
                                    {result?.photoUrl && (
                                      <img src={result.photoUrl} alt="Foto" className="h-10 w-10 rounded object-cover border" />
                                    )}
                                  </div>
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                  <label className="text-xs font-medium">Comentário</label>
                                  <Textarea
                                    placeholder="Observações sobre este item..."
                                    value={result?.comment || ""}
                                    onChange={(e) => handleUpdateField(item.id, "comment", e.target.value)}
                                    rows={2}
                                  />
                                </div>

                                <div className="sm:col-span-2 space-y-2">
                                  <label className="text-xs font-medium">Peças utilizadas</label>
                                  {(result?.partsUsed || []).length > 0 && (
                                    <div className="space-y-1">
                                      {result!.partsUsed.map((pu) => {
                                        const part = parts.find((p) => p.id === pu.partId);
                                        return (
                                          <div key={pu.partId} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                                            <span className="flex-1">{part?.description || pu.partId} - {pu.quantity} {part?.unit || "un"}</span>
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleRemovePart(item.id, pu.partId)}>
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {addingPart?.itemId === item.id ? (
                                    <div className="flex items-end gap-2">
                                      <div className="flex-1">
                                        <Select value={addingPart.partId} onValueChange={(v) => setAddingPart({ ...addingPart, partId: v })}>
                                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Peça" /></SelectTrigger>
                                          <SelectContent>
                                            {parts.map((p) => (
                                              <SelectItem key={p.id} value={p.id}>{p.description} (estoque: {p.quantity})</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <Input
                                        type="number"
                                        min={1}
                                        className="w-20 h-8 text-xs"
                                        placeholder="Qtd"
                                        value={addingPart.quantity || ""}
                                        onChange={(e) => setAddingPart({ ...addingPart, quantity: Number(e.target.value) })}
                                      />
                                      <Button size="sm" className="h-8 text-xs" onClick={() => handleAddPart(item.id)}>OK</Button>
                                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setAddingPart(null)}>x</Button>
                                    </div>
                                  ) : (
                                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setAddingPart({ itemId: item.id, partId: "", quantity: 1 })}>
                                      <Plus className="h-3 w-3" /> Adicionar peça
                                    </Button>
                                  )}
                                </div>

                                {result?.completed && result.completedAt && (
                                  <div className="sm:col-span-2 text-xs text-muted-foreground">
                                    Concluído em {new Date(result.completedAt).toLocaleString("pt-BR")}
                                  </div>
                                )}

                                <div className="md:hidden space-y-1">
                                  <p className="text-xs"><strong>Tipo:</strong> {item.inspectionType}</p>
                                  <p className="text-xs"><strong>Atenção:</strong> {item.attentionPoints}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {currentExecution.machineStops && currentExecution.machineStops.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico de Paradas</h4>
                <div className="space-y-1">
                  {currentExecution.machineStops.map((stop) => (
                    <div key={stop.id} className="flex items-center gap-3 text-xs bg-muted/30 rounded px-3 py-1.5">
                      <span className="font-mono">{new Date(stop.stoppedAt).toLocaleTimeString("pt-BR")}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono">{stop.resumedAt ? new Date(stop.resumedAt).toLocaleTimeString("pt-BR") : "—"}</span>
                      <span className="text-muted-foreground ml-auto">
                        {formatDuration((stop.resumedAt ? new Date(stop.resumedAt).getTime() : Date.now()) - new Date(stop.stoppedAt).getTime())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar (progresso salvo)</Button>
              {allDone && (
                <Button onClick={() => { onComplete(currentExecution.id); onOpenChange(false); }}>
                  Finalizar Execução
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
