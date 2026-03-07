import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ResumeMachineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    machineName: string;
    isComponent?: boolean;
}

export function ResumeMachineDialog({ open, onOpenChange, onConfirm, machineName, isComponent = false }: ResumeMachineDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <PlayCircle className="h-5 w-5" />
                        Retornar Operação
                    </DialogTitle>
                    <DialogDescription>
                        Confirma que {isComponent ? "o componente" : "a máquina"} <strong>{machineName}</strong> está pronta para operar novamente?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { onConfirm(); onOpenChange(false); }}>
                        Confirmar Retorno
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
