import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { PhotoUpload } from "@/components/forms/PhotoUpload";
import type { Part } from "@/data/types";

const schema = z.object({
  sku: z.string().min(1, "SKU obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  unit: z.string().min(1, "Unidade obrigatória"),
  location: z.string().min(1, "Localização obrigatória"),
  quantity: z.coerce.number().min(0, "Valor inválido"),
  minStock: z.coerce.number().min(0, "Valor inválido"),
  supplier: z.string().min(1, "Fornecedor obrigatório"),
  unitCost: z.coerce.number().min(0, "Valor inválido"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part?: Part;
  onSave: (data: Omit<Part, "id">) => void;
}

const units = ["un", "kg", "m", "L", "balde"];

export function PartFormDialog({ open, onOpenChange, part, onSave }: Props) {
  const [locations, setLocations] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [suppliers, setSuppliers] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from("locations").select("name").order("name").then(({ data }) => {
        if (data) setLocations(data.map((d) => d.name));
      });
      supabase.from("suppliers").select("name").order("name").then(({ data }) => {
        if (data) setSuppliers(data.map((d) => d.name));
      });
    }
  }, [open]);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: part
      ? { sku: part.sku, description: part.description, unit: part.unit, location: part.location, quantity: part.quantity, minStock: part.minStock, supplier: part.supplier, unitCost: part.unitCost }
      : { sku: "", description: "", unit: "un", location: "", quantity: 0, minStock: 0, supplier: "", unitCost: 0 },
  });

  useEffect(() => {
    if (open) {
      setPhotoUrl(part?.photoUrl);
      reset(part
        ? { sku: part.sku, description: part.description, unit: part.unit, location: part.location, quantity: part.quantity, minStock: part.minStock, supplier: part.supplier, unitCost: part.unitCost }
        : { sku: "", description: "", unit: "un", location: "", quantity: 0, minStock: 0, supplier: "", unitCost: 0 }
      );
    }
  }, [part, open, reset]);

  const onSubmit = (data: FormData) => {
    onSave({ sku: data.sku!, description: data.description!, unit: data.unit!, location: data.location!, quantity: data.quantity!, minStock: data.minStock!, supplier: data.supplier!, unitCost: data.unitCost!, photoUrl });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{part ? "Editar Peça" : "Nova Peça"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>SKU *</Label>
              <Input {...register("sku")} />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Unidade *</Label>
              <Select value={watch("unit")} onValueChange={(v) => setValue("unit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descrição *</Label>
            <Input {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Localização *</Label>
              <Select value={watch("location")} onValueChange={(v) => setValue("location", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Fornecedor *</Label>
              <Select value={watch("supplier")} onValueChange={(v) => setValue("supplier", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.supplier && <p className="text-xs text-destructive">{errors.supplier.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Quantidade</Label>
              <Input type="number" {...register("quantity")} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Estoque Mín.</Label>
              <Input type="number" {...register("minStock")} />
              {errors.minStock && <p className="text-xs text-destructive">{errors.minStock.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Custo Unit. (R$)</Label>
              <Input type="number" step="0.01" {...register("unitCost")} />
              {errors.unitCost && <p className="text-xs text-destructive">{errors.unitCost.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{part ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
