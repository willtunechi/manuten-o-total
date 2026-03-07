import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdjustDueDateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: string;
  itemLabel: string;
  onConfirm: (newDate: string) => void;
};

function addDays(baseIsoDate: string, days: number): string {
  const base = new Date(`${baseIsoDate}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

export function AdjustDueDateDialog({
  open,
  onOpenChange,
  currentDate,
  itemLabel,
  onConfirm,
}: AdjustDueDateDialogProps) {
  const [newDate, setNewDate] = useState(currentDate);

  useEffect(() => {
    if (open) {
      setNewDate(currentDate);
    }
  }, [open, currentDate]);

  const quickDates = useMemo(
    () => [
      { label: "Hoje", value: new Date().toISOString().slice(0, 10) },
      { label: "+7 dias", value: addDays(currentDate, 7) },
      { label: "+30 dias", value: addDays(currentDate, 30) },
      { label: "+90 dias", value: addDays(currentDate, 90) },
    ],
    [currentDate],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar data de lubrificacao</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">{itemLabel}</p>
            <p className="text-muted-foreground">Data atual: {formatDate(currentDate)}</p>
          </div>

          <div className="space-y-1">
            <Label>Nova data programada</Label>
            <Input type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickDates.map((quickDate) => (
              <Button
                key={quickDate.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewDate(quickDate.value)}
              >
                {quickDate.label}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!newDate) return;
              onConfirm(newDate);
              onOpenChange(false);
            }}
            disabled={!newDate}
          >
            Salvar ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
