import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoUpload } from "@/components/forms/PhotoUpload";
import type { Machine, MachineStatus, MachineType } from "@/data/types";
import { MACHINE_STATUS_LABELS, MACHINE_TYPE_LABELS } from "@/data/types";

const schema = z.object({
  tag: z.string().min(1, "Tag obrigatória"),
  type: z.string().min(1, "Tipo obrigatório"),
  model: z.string().min(1, "Modelo obrigatório"),
  manufacturer: z.string().min(1, "Fabricante obrigatório"),
  year: z.coerce.number().min(1990, "Ano mínimo 1990").max(new Date().getFullYear(), "Ano inválido"),
  status: z.string().min(1, "Status obrigatório"),
  horimeter: z.coerce.number().min(0, "Valor inválido"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine?: Machine;
  onSave: (data: Omit<Machine, "id">) => void;
}

export function MachineFormDialog({ open, onOpenChange, machine, onSave }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: machine
      ? { tag: machine.tag, type: machine.type, model: machine.model, manufacturer: machine.manufacturer, year: machine.year, status: machine.status, horimeter: machine.horimeter }
      : { tag: "", type: "", model: "", manufacturer: "", year: new Date().getFullYear(), status: "operating", horimeter: 0 },
  });

  useEffect(() => {
    if (open) {
      setPhotoUrl(machine?.photoUrl);
      reset(machine
        ? { tag: machine.tag, type: machine.type, model: machine.model, manufacturer: machine.manufacturer, year: machine.year, status: machine.status, horimeter: machine.horimeter }
        : { tag: "", type: "", model: "", manufacturer: "", year: new Date().getFullYear(), status: "operating", horimeter: 0 }
      );
    }
  }, [machine, open, reset]);

  const onSubmit = (data: FormData) => {
    onSave({
      tag: data.tag,
      type: data.type as MachineType,
      model: data.model,
      manufacturer: data.manufacturer,
      year: data.year,
      sector: "",
      horimeter: data.horimeter,
      status: data.status as MachineStatus,
      photoUrl,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{machine ? "Editar Máquina" : "Nova Máquina"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tag *</Label>
              <Input {...register("tag")} placeholder="EXT-007" />
              {errors.tag && <p className="text-xs text-destructive">{errors.tag.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Tipo *</Label>
              <Select value={watch("type")} onValueChange={(v) => setValue("type", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MACHINE_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Modelo *</Label>
              <Input {...register("model")} placeholder="Mono-rosca 90mm" />
              {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Fabricante *</Label>
              <Input {...register("manufacturer")} />
              {errors.manufacturer && <p className="text-xs text-destructive">{errors.manufacturer.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Ano *</Label>
              <Input type="number" {...register("year")} />
              {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Horímetro</Label>
              <Input type="number" {...register("horimeter")} />
              {errors.horimeter && <p className="text-xs text-destructive">{errors.horimeter.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Status *</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MACHINE_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{machine ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
