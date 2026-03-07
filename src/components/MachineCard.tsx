import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckSquare, Clock, MonitorStop, PlayCircle, CheckCircle2, XCircle, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MACHINE_STATUS_LABELS } from "@/data/types";
import type { Machine, MachineComponent, MachineStatus, StopReason } from "@/data/types";
import { cn } from "@/lib/utils";
import { StopMachineDialog } from "@/components/dialogs/StopMachineDialog";
import { ResumeMachineDialog } from "@/components/dialogs/ResumeMachineDialog";
import { useData } from "@/contexts/DataContext";

interface MachineCardProps {
    machine: Machine | MachineComponent;
    onClick?: () => void;
}

const statusTextVariant: Record<MachineStatus, string> = {
    operating: "text-green-600 dark:text-green-400",
    stopped: "text-red-600 dark:text-red-400",
    maintenance: "text-orange-600 dark:text-orange-400",
    waiting: "text-yellow-600 dark:text-yellow-400",
    scheduled: "text-blue-600 dark:text-blue-400",
};

const statusBgVariant: Record<MachineStatus, string> = {
    operating: "bg-green-500/15 border-green-500/30 dark:bg-green-500/10 dark:border-green-500/20",
    stopped: "bg-red-500/15 border-red-500/30 dark:bg-red-500/10 dark:border-red-500/20",
    maintenance: "bg-orange-500/15 border-orange-500/30 dark:bg-orange-500/10 dark:border-orange-500/20",
    waiting: "bg-yellow-500/15 border-yellow-500/30 dark:bg-yellow-500/10 dark:border-yellow-500/20",
    scheduled: "bg-blue-500/15 border-blue-500/30 dark:bg-blue-500/10 dark:border-blue-500/20",
};

export function MachineCard({ machine, onClick }: MachineCardProps) {
    const navigate = useNavigate();
    const { stopMachine, resumeMachine, stopComponent, resumeComponent } = useData();

    // Dialog States
    const [showStopDialog, setShowStopDialog] = useState(false);
    const [showResumeDialog, setShowResumeDialog] = useState(false);

    const isComponent = machine.hasOwnProperty('machineType');

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking on action buttons
        if ((e.target as HTMLElement).closest("button")) return;

        if (onClick) onClick();
        else navigate(isComponent ? `/components/${machine.id}` : `/machines/${machine.id}`);
    };

    const handleStopConfirm = (reason: StopReason, description: string, maintenanceType?: 'mechanical' | 'electrical') => {
        if (isComponent) {
            stopComponent(machine.id, reason, description, maintenanceType);
        } else {
            stopMachine(machine.id, reason, description, maintenanceType);
        }
    };

    const handleResumeConfirm = () => {
        if (isComponent) {
            resumeComponent(machine.id);
        } else {
            resumeMachine(machine.id);
        }
    };

    const checklistTotal = machine.dailyChecklistTotal || 0;
    const checklistOk = (machine as any).checklistOk || 0;
    const checklistNok = (machine as any).checklistNok || 0;
    const overdue = machine.preventiveOverdue || 0;
    const preventiveOk = (machine as any).preventiveOk || 0;
    const preventiveNok = (machine as any).preventiveNok || 0;
    const correctivePending = machine.correctivePending || 0;
    const lubricationPending = (machine as any).lubricationPending || 0;

    const { workOrders } = useData();
    const hasOpenOS = (machine.status === 'stopped' || machine.status === 'maintenance') &&
        workOrders.some((wo) => wo.assetId === machine.id && (wo.status === 'open' || wo.status === 'in_progress'));

    return (
        <>
            <Card
                className={cn("backdrop-blur-sm hover:border-primary/30 transition-all cursor-pointer group active:scale-[0.99] duration-200 shadow-sm hover:shadow-md rounded-[2px]", statusBgVariant[machine.status])}
                onClick={handleCardClick}
            >
                <CardContent className="p-4 space-y-3">
                    {/* Header: Tag, Status & Action */}
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-base tracking-tight text-foreground truncate block">
                                    {machine.tag}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium truncate block">
                                {machine.model}
                            </span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <div className={cn("text-sm font-semibold flex items-center justify-end gap-1.5", statusTextVariant[machine.status])}>
                                <div className={cn("w-1.5 h-1.5 rounded-full bg-current animate-pulse")} />
                                {MACHINE_STATUS_LABELS[machine.status]}
                            </div>

                            {/* Quick Action Button */}
                            <div className="mt-1">
                                {machine.status === 'operating' ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 px-2"
                                        onClick={(e) => { e.stopPropagation(); setShowStopDialog(true); }}
                                    >
                                        <MonitorStop className="h-3 w-3 mr-1" />
                                        Parar
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-900/20 px-2"
                                        onClick={(e) => { e.stopPropagation(); setShowResumeDialog(true); }}
                                    >
                                        <PlayCircle className="h-3 w-3 mr-1" />
                                        Retornar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        {/* Checklist */}
                        <div className="rounded-md border border-border bg-muted/30 p-2 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                <CheckSquare className="h-3.5 w-3.5" />
                                Checklist
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {checklistOk}
                                </span>
                                <span className="flex items-center gap-0.5 text-xs font-bold text-red-500 dark:text-red-400">
                                    <XCircle className="h-3.5 w-3.5" />
                                    {checklistNok}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-auto">/{checklistTotal}</span>
                            </div>
                        </div>

                        {/* Preventiva */}
                        <div className="rounded-md border border-border bg-muted/30 p-2 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                <Clock className="h-3.5 w-3.5" />
                                Preventiva
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {preventiveOk}
                                </span>
                                <span className="flex items-center gap-0.5 text-xs font-bold text-red-500 dark:text-red-400">
                                    <XCircle className="h-3.5 w-3.5" />
                                    {preventiveNok}
                                </span>
                                {overdue > 0 && (
                                    <span className="flex items-center gap-0.5 text-xs font-bold text-yellow-600 dark:text-yellow-400 ml-auto">
                                        <Clock className="h-3.5 w-3.5" />
                                        {overdue}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom row: Corrective + Lubrication */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-foreground/90">
                            <AlertCircle className={cn("h-4 w-4 shrink-0", correctivePending > 0 ? "text-red-500" : "text-muted-foreground")} />
                            <span className="font-medium text-xs">Corretiva:</span>
                            <span className={cn("font-mono px-1.5 rounded-[2px] text-xs py-0.5 border",
                                correctivePending > 0
                                    ? "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400"
                                    : "bg-muted text-foreground border-transparent"
                            )}>
                                {correctivePending}
                            </span>
                        </div>
                        {lubricationPending > 0 && (
                            <div className="flex items-center gap-1.5 text-sm">
                                <Droplets className="h-4 w-4 text-blue-500 shrink-0" />
                                <span className="font-mono px-1.5 rounded-[2px] text-xs py-0.5 border bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 font-bold">
                                    {lubricationPending}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <StopMachineDialog
                open={showStopDialog}
                onOpenChange={setShowStopDialog}
                onConfirm={handleStopConfirm}
                machineName={machine.tag}
                isComponent={isComponent}
            />

            <ResumeMachineDialog
                open={showResumeDialog}
                onOpenChange={setShowResumeDialog}
                onConfirm={handleResumeConfirm}
                machineName={machine.tag}
                isComponent={isComponent}
            />
        </>
    );
}
