import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PreventivePlan, MachineType } from "@/data/types";
import { MACHINE_TYPE_LABELS } from "@/data/types";

const schema = z.object({
  machineType: z.string().min(1, "Selecione um tipo de máquina"),
  frequencyDays: z.coerce.number().min(0).optional(),
  frequencyHours: z.coerce.number().min(0).optional(),
  estimatedTime: z.coerce.number().min(0.5, "Tempo mínimo de 0.5h"),
  nextDue: z.string().min(1, "Data obrigatória"),
  active: z.boolean(),
}).refine((d) => (d.frequencyDays && d.frequencyDays > 0) || (d.frequencyHours && d.frequencyHours > 0), {
  message: "Informe frequência em dias ou horas",
  path: ["frequencyDays"],
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PreventivePlan;
  onSave: (data: Omit<PreventivePlan, "id">) => void;
}

export function PreventivePlanFormDialog({ open, onOpenChange, plan, onSave }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: plan
      ? { machineType: plan.machineType, frequencyDays: plan.frequencyDays || 0, frequencyHours: plan.frequencyHours || 0, estimatedTime: plan.estimatedTime, nextDue: plan.nextDue, active: plan.active }
      : { machineType: "", frequencyDays: 30, frequencyHours: 0, estimatedTime: 2, nextDue: "", active: true },
  });

  useEffect(() => {
    if (open) {
      reset(plan
        ? { machineType: plan.machineType, frequencyDays: plan.frequencyDays || 0, frequencyHours: plan.frequencyHours || 0, estimatedTime: plan.estimatedTime, nextDue: plan.nextDue, active: plan.active }
        : { machineType: "", frequencyDays: 30, frequencyHours: 0, estimatedTime: 2, nextDue: "", active: true }
      );
    }
  }, [plan, open, reset]);

  const onSubmit = (data: FormData) => {
    onSave({
      machineType: data.machineType as MachineType,
      estimatedTime: data.estimatedTime,
      nextDue: data.nextDue,
      active: data.active,
      frequencyDays: data.frequencyDays || undefined,
      frequencyHours: data.frequencyHours || undefined,
      checklist: plan?.checklist || [],
      recommendedParts: plan?.recommendedParts || [],
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar Plano Preventivo" : "Novo Plano Preventivo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Tipo de Máquina *</Label>
            <Select value={watch("machineType")} onValueChange={(v) => setValue("machineType", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(MACHINE_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.machineType && <p className="text-xs text-destructive">{errors.machineType.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Frequência (dias)</Label>
              <Input type="number" {...register("frequencyDays")} />
            </div>
            <div className="space-y-1">
              <Label>Frequência (horas)</Label>
              <Input type="number" {...register("frequencyHours")} />
            </div>
          </div>
          {errors.frequencyDays && <p className="text-xs text-destructive">{errors.frequencyDays.message}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tempo estimado (h) *</Label>
              <Input type="number" step="0.5" {...register("estimatedTime")} />
              {errors.estimatedTime && <p className="text-xs text-destructive">{errors.estimatedTime.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Próxima execução *</Label>
              <Input type="date" {...register("nextDue")} />
              {errors.nextDue && <p className="text-xs text-destructive">{errors.nextDue.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={watch("active")} onCheckedChange={(v) => setValue("active", v)} />
            <Label>Plano ativo</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{plan ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
