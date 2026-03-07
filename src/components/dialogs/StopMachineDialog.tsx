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
        if (reason === 'corrective' && !maintenanceType) {
            setError("Selecione o tipo de manutenção (Mecânica ou Elétrica).");
            return;
        }
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
                                <div className={cn("flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-colors", reason === 'corrective' ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}>
                                    <RadioGroupItem value="corrective" id="r-corrective" className={cn(reason === 'corrective' && "border-primary-foreground text-primary-foreground")} />
                                    <Label htmlFor="r-corrective" className="cursor-pointer flex-1">Corretiva</Label>
                                </div>
                                <div className={cn("flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-colors", reason === 'lubrication' ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}>
                                    <RadioGroupItem value="lubrication" id="r-lubrication" className={cn(reason === 'lubrication' && "border-primary-foreground text-primary-foreground")} />
                                    <Label htmlFor="r-lubrication" className="cursor-pointer flex-1">Lubrificação</Label>
                                </div>
                                <div className={cn("flex items-center space-x-2 border p-2 rounded-md cursor-pointer col-span-2 transition-colors", reason === 'other' ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}>
                                    <RadioGroupItem value="other" id="r-other" className={cn(reason === 'other' && "border-primary-foreground text-primary-foreground")} />
                                    <Label htmlFor="r-other" className="cursor-pointer flex-1">Outros</Label>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    {reason === 'corrective' && (
                        <div className="space-y-2 bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-100 dark:border-red-900/20 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-red-600 dark:text-red-400">Tipo de Manutenção *</Label>
                            <RadioGroup value={maintenanceType} onValueChange={(v) => { setMaintenanceType(v as 'mechanical' | 'electrical'); setError(""); }}>
                                <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="mechanical" id="t-mech" />
                                        <Label htmlFor="t-mech">Mecânica</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="electrical" id="t-elec" />
                                        <Label htmlFor="t-elec">Elétrica</Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

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
