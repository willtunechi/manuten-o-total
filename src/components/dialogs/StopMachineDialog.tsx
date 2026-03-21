import { useEffect, useRef, useState } from "react";
import { MonitorStop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
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
    const [reason, setReason] = useState<StopReason>("other");
    const [description, setDescription] = useState("");
    const [maintenanceType, setMaintenanceType] = useState<'mechanical' | 'electrical' | undefined>(undefined);
    const [error, setError] = useState("");
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

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
                                <div className={cn("flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-colors", reason === 'checklist' ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}>
                                    <RadioGroupItem value="checklist" id="r-checklist" className={cn(reason === 'checklist' && "border-primary-foreground text-primary-foreground")} />
                                    <Label htmlFor="r-checklist" className="cursor-pointer flex-1">Checklist</Label>
                                </div>
                                <div className={cn("flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-colors", reason === 'preventive' ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}>
                                    <RadioGroupItem value="preventive" id="r-preventive" className={cn(reason === 'preventive' && "border-primary-foreground text-primary-foreground")} />
                                    <Label htmlFor="r-preventive" className="cursor-pointer flex-1">Preventiva</Label>
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
                        <p className="text-sm text-red-600 font-medium animate-pulse">{error}</p>
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
