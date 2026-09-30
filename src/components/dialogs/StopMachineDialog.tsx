import { useEffect, useMemo, useRef, useState } from "react";
import { MonitorStop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import type { StopReason } from "@/data/types";
import { cn } from "@/lib/utils";

interface StopMachineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: StopReason, description: string, maintenanceType?: 'mechanical' | 'electrical') => void;
    machineName: string;
    isComponent?: boolean;
}

export function StopMachineDialog({ open, onOpenChange, onConfirm, machineName, isComponent = false }: StopMachineDialogProps) {
    const { stopReasons } = useData();
    const [reason, setReason] = useState<StopReason>("other");
    const [description, setDescription] = useState("");
    const [maintenanceType, setMaintenanceType] = useState<'mechanical' | 'electrical' | undefined>(undefined);
    const [error, setError] = useState("");
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    // Motivos cadastrados (Cadastros → Motivos de Parada), exceto Corretiva (gerada por chamados)
    const options = useMemo(() => {
        const list = stopReasons.filter((r) => r.key !== "corrective");
        if (list.length > 0) return list.map((r) => ({ key: r.key, name: r.name }));
        return [
            { key: "checklist", name: "Checklist" },
            { key: "preventive", name: "Preventiva" },
            { key: "lubrication", name: "Lubrificação" },
            { key: "no_production", name: "Sem Produção" },
            { key: "other", name: "Outros" },
        ];
    }, [stopReasons]);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setReason("other");
            setDescription("");
            setMaintenanceType(undefined);
            setError("");
        }
    }, [open]);

    const handleConfirm = () => {
        onConfirm(reason, description, maintenanceType);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-md"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    cancelButtonRef.current?.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <MonitorStop className="h-5 w-5" />
                        Parar {isComponent ? "Componente" : "Máquina"}
                    </DialogTitle>
                    <DialogDescription>
                        Informe o motivo da parada de <strong>{machineName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Motivo</Label>
                        <RadioGroup value={reason} onValueChange={(v) => { setReason(v as StopReason); setError(""); }}>
                            <div className="grid grid-cols-2 gap-2">
                                {options.map((opt) => (
                                    <div
                                        key={opt.key}
                                        className={cn(
                                            "flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-colors",
                                            reason === opt.key ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
                                        )}
                                    >
                                        <RadioGroupItem
                                            value={opt.key}
                                            id={`r-${opt.key}`}
                                            className={cn(reason === opt.key && "border-primary-foreground text-primary-foreground")}
                                        />
                                        <Label htmlFor={`r-${opt.key}`} className="cursor-pointer flex-1">{opt.name}</Label>
                                    </div>
                                ))}
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>Observação</Label>
                        <Textarea
                            placeholder="Descreva detalhes sobre a parada..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive font-medium animate-pulse">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button ref={cancelButtonRef} variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleConfirm}>Confirmar Parada</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
