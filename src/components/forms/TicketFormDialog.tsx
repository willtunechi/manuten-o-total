import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useData } from "@/contexts/DataContext";
import { MACHINE_TYPE_LABELS, PRIORITY_LABELS, OS_TYPE_LABELS } from "@/data/types";
import type { Ticket, Priority, OSType, MachineType } from "@/data/types";

const schema = z
  .object({
    machineType: z.string().min(1, "Selecione o tipo de máquina"),
    machineId: z.string().min(1, "Selecione uma máquina"),
    type: z.enum(["corrective", "inspection"]),
    maintenanceType: z.enum(["mechanical", "electrical"]).optional(),
    symptom: z.string().min(10, "Mínimo 10 caracteres"),
    priority: z.string().min(1, "Prioridade obrigatória"),
    createdBy: z.string().min(1, "Informe quem abriu"),
  })
  .refine((data) => data.type !== "corrective" || !!data.maintenanceType, {
    message: "Selecione o tipo de manutenção para chamado corretivo",
    path: ["maintenanceType"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket;
  onSave: (data: Omit<Ticket, "id">, stopMachine?: boolean) => void;
}

export function TicketFormDialog({ open, onOpenChange, ticket, onSave }: Props) {
  const { machines: allMachines, components: allComponents, userAssignedMachineIds, userAssignedComponentIds } = useData();
  const machines = useMemo(
    () => (userAssignedMachineIds !== null ? allMachines.filter((m) => userAssignedMachineIds.includes(m.id)) : allMachines),
    [allMachines, userAssignedMachineIds],
  );
  const components = useMemo(
    () => (userAssignedComponentIds !== null ? allComponents.filter((c) => userAssignedComponentIds.includes(c.id)) : allComponents),
    [allComponents, userAssignedComponentIds],
  );
  const [stopMachineOnCreate, setStopMachineOnCreate] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    shouldFocusError: false,
    defaultValues: {
      machineType: "",
      machineId: "",
      type: "corrective",
      maintenanceType: "mechanical",
      symptom: "",
      priority: "medium",
      createdBy: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setStopMachineOnCreate(false);

    const targetMachine = machines.find((m) => m.id === ticket?.machineId);
    const targetComponent = components.find((c) => c.id === ticket?.machineId);
    const defaultMachineType = targetMachine?.type || targetComponent?.machineType || "";

    reset(
      ticket
        ? {
            machineType: defaultMachineType,
            machineId: ticket.machineId,
            type: ticket.type,
            maintenanceType: ticket.maintenanceType,
            symptom: ticket.symptom,
            priority: ticket.priority,
            createdBy: ticket.createdBy,
          }
        : {
            machineType: "",
            machineId: "",
            type: "corrective",
            maintenanceType: "mechanical",
            symptom: "",
            priority: "medium",
            createdBy: "",
          },
    );
  }, [ticket, open, reset, machines, components]);

  const selectedMachineType = watch("machineType") as MachineType | "";
  const ticketType = watch("type");

  const machineOptions = useMemo(() => {
    if (!selectedMachineType) return [];

    const machineItems = machines
      .filter((m) => m.type === selectedMachineType)
      .map((m) => ({
        id: m.id,
        label: `${m.tag} - ${m.model}`,
      }));

    const componentItems = components
      .filter((c) => c.machineType === selectedMachineType)
      .map((c) => ({
        id: c.id,
        label: `${c.tag} - ${c.name}`,
      }));

    return [...machineItems, ...componentItems];
  }, [selectedMachineType, machines, components]);

  const isNewTicket = !ticket;

  const onSubmit = (data: FormData) => {
    onSave({
      machineId: data.machineId,
      symptom: data.symptom,
      createdBy: data.createdBy,
      type: data.type as OSType,
      maintenanceType: data.type === "corrective" ? data.maintenanceType : undefined,
      priority: data.priority as Priority,
      createdAt: ticket?.createdAt || new Date().toISOString(),
      status: ticket?.status || "pending",
      comment: ticket?.comment || "",
      photoUrl: ticket?.photoUrl || "",
      partsUsed: ticket?.partsUsed || [],
      resolvedAt: ticket?.resolvedAt,
    }, isNewTicket ? stopMachineOnCreate : false);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{ticket ? "Editar Chamado" : "Novo Chamado"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Tipo de Máquina *</Label>
            <Select
              value={watch("machineType")}
              onValueChange={(v: MachineType) => {
                setValue("machineType", v, { shouldValidate: true });
                setValue("machineId", "", { shouldValidate: true });
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(MACHINE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.machineType && <p className="text-xs text-destructive">{errors.machineType.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Máquina/Equipamento *</Label>
            <Select value={watch("machineId")} onValueChange={(v) => setValue("machineId", v)}>
              <SelectTrigger><SelectValue placeholder={selectedMachineType ? "Selecione" : "Selecione o tipo antes"} /></SelectTrigger>
              <SelectContent>
                {machineOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.machineId && <p className="text-xs text-destructive">{errors.machineId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tipo *</Label>
              <Select value={watch("type")} onValueChange={(v: "corrective" | "inspection") => setValue("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OS_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Prioridade *</Label>
              <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {ticketType === "corrective" && (
            <div className="space-y-1">
              <Label>Tipo de Manutenção *</Label>
              <Select
                value={watch("maintenanceType")}
                onValueChange={(v: "mechanical" | "electrical") => setValue("maintenanceType", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanical">Mecânica</SelectItem>
                  <SelectItem value="electrical">Elétrica</SelectItem>
                </SelectContent>
              </Select>
              {errors.maintenanceType && <p className="text-xs text-destructive">{errors.maintenanceType.message}</p>}
            </div>
          )}

          <div className="space-y-1">
            <Label>Sintoma *</Label>
            <Textarea {...register("symptom")} rows={3} placeholder="Descreva o problema observado..." />
            {errors.symptom && <p className="text-xs text-destructive">{errors.symptom.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Aberto por *</Label>
            <Input {...register("createdBy")} placeholder="Nome do operador" />
            {errors.createdBy && <p className="text-xs text-destructive">{errors.createdBy.message}</p>}
          </div>

          {isNewTicket && (
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Parar máquina?</Label>
                <p className="text-xs text-muted-foreground">Registrar parada imediatamente ao abrir o chamado</p>
              </div>
              <Switch checked={stopMachineOnCreate} onCheckedChange={setStopMachineOnCreate} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{ticket ? "Salvar" : "Abrir Chamado"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
