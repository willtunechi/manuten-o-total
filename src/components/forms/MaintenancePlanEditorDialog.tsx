import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { MachineType, MaintenancePlan, Machine } from "@/data/types";
import { MACHINE_TYPE_LABELS } from "@/data/types";
import { useData } from "@/contexts/DataContext";

const itemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Descrição obrigatória"),
  inspectionType: z.string().min(1, "Tipo de inspeção obrigatório"),
  attentionPoints: z.string().optional().default(""),
  frequencyDays: z.coerce.number().min(1, "Frequência mínima de 1 dia"),
  observation: z.string().optional().default(""),
  responsible: z.enum(["operador", "manutencao"]),
});

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  machineType: z.enum(["extrusora", "misturador", "bomba_vacuo", "trocador_calor", "tanque_agua"]),
  machineIds: z.array(z.string()).min(1, "Selecione pelo menos uma máquina"),
  active: z.boolean(),
  items: z.array(itemSchema).min(1, "Adicione pelo menos 1 item"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: "checklist" | "preventive";
  plan?: MaintenancePlan;
  readOnly?: boolean;
  title?: string;
  onSave: (data: Omit<MaintenancePlan, "id">) => void;
}

function newItem(index: number) {
  return {
    id: `item-${Date.now()}-${index}`,
    description: "",
    inspectionType: "",
    attentionPoints: "",
    frequencyDays: 1,
    observation: "",
    responsible: "manutencao" as const,
  };
}

function buildDefaultValues(plan?: MaintenancePlan) {
  if (plan) {
    return {
      name: plan.name,
      machineType: plan.machineType,
      machineIds: plan.machineIds ?? (plan.machineId ? [plan.machineId] : []),
      active: plan.active,
      items: plan.items.map((item) => ({ ...item, responsible: item.responsible || "manutencao" })),
    };
  }
  return {
    name: "",
    machineType: "extrusora" as const,
    machineIds: [] as string[],
    active: true,
    items: [newItem(0)],
  };
}

export function MaintenancePlanEditorDialog({
  open,
  onOpenChange,
  planType,
  plan,
  readOnly = false,
  title,
  onSave,
}: Props) {
  const { machines } = useData();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(plan),
  });

  useEffect(() => {
    if (!open) return;
    reset(buildDefaultValues(plan));
  }, [open, plan, reset]);

  const items = watch("items") || [];
  const selectedMachineType = watch("machineType");
  const selectedMachineIds = watch("machineIds") || [];

  // Filter machines by selected type
  const filteredMachines: Machine[] = machines.filter((m) => m.type === selectedMachineType).sort((a, b) => a.tag.localeCompare(b.tag, 'pt-BR', { numeric: true }));

  const toggleMachine = (machineId: string) => {
    if (readOnly) return;
    const next = selectedMachineIds.includes(machineId)
      ? selectedMachineIds.filter((id) => id !== machineId)
      : [...selectedMachineIds, machineId];
    setValue("machineIds", next, { shouldValidate: true });
  };

  const addItem = () => {
    if (readOnly) return;
    setValue("items", [...items, newItem(items.length)], { shouldValidate: true });
  };

  const removeItem = (index: number) => {
    if (readOnly) return;
    setValue("items", items.filter((_, i) => i !== index), { shouldValidate: true });
  };

  const onSubmit = (data: FormData) => {
    if (readOnly) return;
    onSave({
      name: data.name,
      machineType: data.machineType as MachineType,
      machineIds: data.machineIds,
      machineId: data.machineIds[0], // legado: usa a primeira
      planType,
      active: data.active,
      items: data.items.map((item) => ({
        id: item.id ?? `item-${Date.now()}`,
        description: item.description ?? "",
        inspectionType: item.inspectionType ?? "",
        attentionPoints: item.attentionPoints ?? "",
        frequencyDays: item.frequencyDays ?? 1,
        observation: item.observation ?? "",
        responsible: item.responsible ?? "manutencao",
      })),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title || (plan ? "Editar Plano" : "Novo Plano")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome + Tipo Máquina */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <Label>Nome do Plano *</Label>
              <Input {...register("name")} disabled={readOnly} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Tipo de Máquina *</Label>
              <Select
                value={watch("machineType")}
                onValueChange={(value: MachineType) => {
                  if (readOnly) return;
                  setValue("machineType", value);
                  setValue("machineIds", []); // reset selection when type changes
                }}
              >
                <SelectTrigger disabled={readOnly}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MACHINE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seleção de Máquinas */}
          <div className="space-y-2">
            <Label>
              Máquinas vinculadas *{" "}
              <span className="text-xs text-muted-foreground font-normal">(selecione uma ou mais)</span>
            </Label>
            {filteredMachines.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma máquina cadastrada para o tipo selecionado.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-md border border-border p-3 bg-muted/10">
                {filteredMachines.map((machine) => {
                  const checked = selectedMachineIds.includes(machine.id);
                  return (
                    <label
                      key={machine.id}
                      className={`flex items-center gap-2 rounded p-2 cursor-pointer transition-colors ${
                        checked ? "bg-primary/10 border border-primary/30" : "border border-transparent hover:bg-muted/40"
                      } ${readOnly ? "cursor-default" : ""}`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleMachine(machine.id)}
                        disabled={readOnly}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none">{machine.tag}</p>
                        <p className="text-xs text-muted-foreground truncate">{machine.sector}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            {errors.machineIds && (
              <p className="text-xs text-destructive">{errors.machineIds.message}</p>
            )}
          </div>

          {/* Ativo */}
          <div className="flex items-center gap-3">
            <Switch checked={watch("active")} onCheckedChange={(value) => !readOnly && setValue("active", value)} />
            <Label>Plano ativo</Label>
          </div>

          {/* Itens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Itens do Plano</Label>
              {!readOnly && (
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  Adicionar item
                </Button>
              )}
            </div>

            {items.map((item, index) => (
              <div key={item.id} className="rounded-md border p-3 space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label>Item de Verificação *</Label>
                    <Input {...register(`items.${index}.description`)} disabled={readOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label>Periodicidade (dias) *</Label>
                    <Input type="number" min={1} {...register(`items.${index}.frequencyDays`)} disabled={readOnly} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Tipo de Inspeção *</Label>
                  <Input {...register(`items.${index}.inspectionType`)} disabled={readOnly} />
                </div>

                <div className="space-y-1">
                  <Label>Observação</Label>
                  <Input {...register(`items.${index}.observation`)} disabled={readOnly} />
                </div>

                <div className="space-y-1">
                  <Label>Responsável *</Label>
                  <Select
                    value={watch(`items.${index}.responsible`) || "manutencao"}
                    onValueChange={(value: "operador" | "manutencao") =>
                      !readOnly && setValue(`items.${index}.responsible`, value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger disabled={readOnly}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!readOnly && (
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                      Remover item
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? "Fechar" : "Cancelar"}
            </Button>
            {!readOnly && <Button type="submit">Salvar</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
