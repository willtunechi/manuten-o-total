import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Machine } from "@/data/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Machines of the same type to copy to */
  availableMachines: Machine[];
  /** Machine IDs already assigned (to exclude from selection) */
  excludeMachineIds: string[];
  onConfirm: (selectedMachineIds: string[]) => void;
}

export function CopyPlanDialog({ open, onOpenChange, title, availableMachines, excludeMachineIds, onConfirm }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const filteredMachines = useMemo(
    () => availableMachines.filter((m) => !excludeMachineIds.includes(m.id)).sort((a, b) => a.tag.localeCompare(b.tag, "pt-BR", { numeric: true })),
    [availableMachines, excludeMachineIds],
  );

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onConfirm(selected);
    setSelected([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setSelected([]); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Selecione as máquinas destino:</Label>
          {filteredMachines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma outra máquina do mesmo tipo disponível.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto rounded-md border p-3 space-y-2">
              {filteredMachines.map((m) => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={selected.includes(m.id)} onCheckedChange={() => toggle(m.id)} />
                  <span className="text-sm font-medium">{m.tag}</span>
                  <span className="text-xs text-muted-foreground">{m.model}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={selected.length === 0}>
            Copiar para {selected.length > 0 ? `${selected.length} máquina${selected.length > 1 ? "s" : ""}` : "..."}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
