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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import type { Mechanic } from "@/data/types";

const shiftOptions = ["Manhã", "Tarde", "Noite"] as const;

const schema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  role: z.enum(["mechanic", "operator", "planejador", "supervisor_manutencao", "supervisor_operacoes"]),
  shift: z.enum(shiftOptions).optional().default("Manhã"),
  level: z.enum(["junior", "mid", "senior"]),
  available: z.boolean(),
  machineIds: z.array(z.string()).default([]),
  componentIds: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mechanic?: Mechanic;
  onSave: (data: Omit<Mechanic, "id">) => void;
}

const roleLabels: Record<FormData["role"], string> = {
  mechanic: "Mecânico",
  operator: "Operador",
  planejador: "Planejador",
  supervisor_manutencao: "Supervisor Manutenção",
  supervisor_operacoes: "Supervisor Operações",
};

const levelLabels: Record<FormData["level"], string> = {
  junior: "Júnior",
  mid: "Pleno",
  senior: "Sênior",
};

export function MechanicFormDialog({ open, onOpenChange, mechanic, onSave }: Props) {
  const { machines, components } = useData();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: mechanic
      ? {
          name: mechanic.name,
          email: mechanic.email || "",
          role: mechanic.role,
          shift: (mechanic.shift as FormData["shift"]) || "Manhã",
          level: mechanic.level,
          available: mechanic.available,
          machineIds: mechanic.machineIds || [],
          componentIds: mechanic.componentIds || [],
        }
      : {
          name: "",
          email: "",
          role: "mechanic",
          shift: "Manhã",
          level: "junior",
          available: true,
          machineIds: [],
          componentIds: [],
        },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      mechanic
        ? {
            name: mechanic.name,
            email: mechanic.email || "",
            role: mechanic.role,
            shift: (mechanic.shift as FormData["shift"]) || "Manhã",
            level: mechanic.level,
            available: mechanic.available,
            machineIds: mechanic.machineIds || [],
            componentIds: mechanic.componentIds || [],
          }
        : {
            name: "",
            email: "",
            role: "mechanic",
            shift: "Manhã",
            level: "junior",
            available: true,
            machineIds: [],
            componentIds: [],
          },
    );
  }, [mechanic, open, reset]);

  const selectedMachineIds = watch("machineIds") || [];
  const selectedComponentIds = watch("componentIds") || [];
  const selectedRole = watch("role");

  const isSupervisorRole = selectedRole?.startsWith("supervisor_") || selectedRole === "planejador";

  const extrusoras = machines.filter((m) => m.type === "extrusora");
  const misturadores = machines.filter((m) => m.type === "misturador");
  const trocadoresCalor = components.filter((c) => c.type === "trocador_calor");
  const bombasVacuo = components.filter((c) => c.type === "bomba_vacuo");
  const tanquesAgua = components.filter((c) => c.type === "tanque_agua");

  const toggleMachine = (machineId: string, checked: boolean) => {
    const current = watch("machineIds") || [];
    const next = checked ? [...current, machineId] : current.filter((id) => id !== machineId);
    setValue("machineIds", next, { shouldValidate: true });
  };

  const toggleComponent = (componentId: string, checked: boolean) => {
    const current = watch("componentIds") || [];
    const next = checked ? [...current, componentId] : current.filter((id) => id !== componentId);
    setValue("componentIds", next, { shouldValidate: true });
  };

  const setAllByTab = (tab: "extrusoras" | "misturadores" | "trocador" | "bomba" | "tanque", checked: boolean) => {
    if (tab === "extrusoras") {
      const ids = extrusoras.map((m) => m.id);
      const current = watch("machineIds") || [];
      const next = checked ? Array.from(new Set([...current, ...ids])) : current.filter((id) => !ids.includes(id));
      setValue("machineIds", next, { shouldValidate: true });
      return;
    }
    if (tab === "misturadores") {
      const ids = misturadores.map((m) => m.id);
      const current = watch("machineIds") || [];
      const next = checked ? Array.from(new Set([...current, ...ids])) : current.filter((id) => !ids.includes(id));
      setValue("machineIds", next, { shouldValidate: true });
      return;
    }

    const groupIds =
      tab === "trocador"
        ? trocadoresCalor.map((c) => c.id)
        : tab === "bomba"
          ? bombasVacuo.map((c) => c.id)
          : tanquesAgua.map((c) => c.id);

    const current = watch("componentIds") || [];
    const next = checked
      ? Array.from(new Set([...current, ...groupIds]))
      : current.filter((id) => !groupIds.includes(id));

    setValue("componentIds", next, { shouldValidate: true });
  };

  const setAllEverywhere = (checked: boolean) => {
    if (!checked) {
      setValue("machineIds", [], { shouldValidate: true });
      setValue("componentIds", [], { shouldValidate: true });
      return;
    }
    setValue("machineIds", machines.map((m) => m.id), { shouldValidate: true });
    setValue("componentIds", components.map((c) => c.id), { shouldValidate: true });
  };

  const onSubmit = (data: FormData) => {
    const isMaintenance = data.role !== "operator";
    onSave({
      name: data.name,
      email: data.email || undefined,
      role: data.role,
      shift: data.shift,
      level: data.level,
      available: data.available,
      machineIds: data.machineIds,
      componentIds: data.componentIds,
      canExecuteChecklist: isMaintenance,
      canExecutePreventive: isMaintenance,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mechanic ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email {!mechanic && "(cria acesso ao sistema)"}</Label>
              <Input {...register("email")} type="email" placeholder="usuario@empresa.com" disabled={!!mechanic} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              {!mechanic && <p className="text-xs text-muted-foreground">Senha gerada: watbrazil123</p>}
            </div>
          </div>

          <div className={`grid gap-4 ${isSupervisorRole ? "grid-cols-1" : "grid-cols-2"}`}>
            <div className="space-y-1">
              <Label>Perfil *</Label>
              <Select value={selectedRole} onValueChange={(value: FormData["role"]) => setValue("role", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isSupervisorRole && (
              <div className="space-y-1">
                <Label>Nível *</Label>
                <Select value={watch("level")} onValueChange={(value: FormData["level"]) => setValue("level", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(levelLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {isSupervisorRole ? (
            <div className="rounded-md border p-3 bg-muted/30 text-xs text-muted-foreground">
              Supervisores e Logística têm acesso a todas as máquinas e componentes automaticamente.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Máquinas e componentes permitidos</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setAllEverywhere(true)}>
                    Marcar todas (todas abas)
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAllEverywhere(false)}>
                    Limpar tudo
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="extrusoras" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="extrusoras">Extrusoras</TabsTrigger>
                  <TabsTrigger value="misturadores">Misturadores</TabsTrigger>
                  <TabsTrigger value="trocador">Trocador de Calor</TabsTrigger>
                  <TabsTrigger value="bomba">Bomba de Vácuo</TabsTrigger>
                  <TabsTrigger value="tanque">Tanque de Água</TabsTrigger>
                </TabsList>

                <TabsContent value="extrusoras" className="mt-2">
                  <div className="flex justify-end pb-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setAllByTab("extrusoras", true)}>
                      Marcar todas da aba
                    </Button>
                  </div>
                  <ScrollArea className="h-32 rounded-md border p-2">
                    <div className="space-y-2">
                      {extrusoras.map((machine) => (
                        <label key={machine.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedMachineIds.includes(machine.id)}
                            onCheckedChange={(state) => toggleMachine(machine.id, state === true)}
                          />
                          <span>{machine.tag} - {machine.model}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="misturadores" className="mt-2">
                  <div className="flex justify-end pb-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setAllByTab("misturadores", true)}>
                      Marcar todas da aba
                    </Button>
                  </div>
                  <ScrollArea className="h-32 rounded-md border p-2">
                    <div className="space-y-2">
                      {misturadores.map((machine) => (
                        <label key={machine.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedMachineIds.includes(machine.id)}
                            onCheckedChange={(state) => toggleMachine(machine.id, state === true)}
                          />
                          <span>{machine.tag} - {machine.model}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="trocador" className="mt-2">
                  <div className="flex justify-end pb-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setAllByTab("trocador", true)}>
                      Marcar todas da aba
                    </Button>
                  </div>
                  <ScrollArea className="h-32 rounded-md border p-2">
                    <div className="space-y-2">
                      {trocadoresCalor.map((component) => (
                        <label key={component.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedComponentIds.includes(component.id)}
                            onCheckedChange={(state) => toggleComponent(component.id, state === true)}
                          />
                          <span>{component.tag} - {component.name}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="bomba" className="mt-2">
                  <div className="flex justify-end pb-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setAllByTab("bomba", true)}>
                      Marcar todas da aba
                    </Button>
                  </div>
                  <ScrollArea className="h-32 rounded-md border p-2">
                    <div className="space-y-2">
                      {bombasVacuo.map((component) => (
                        <label key={component.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedComponentIds.includes(component.id)}
                            onCheckedChange={(state) => toggleComponent(component.id, state === true)}
                          />
                          <span>{component.tag} - {component.name}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="tanque" className="mt-2">
                  <div className="flex justify-end pb-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setAllByTab("tanque", true)}>
                      Marcar todas da aba
                    </Button>
                  </div>
                  <ScrollArea className="h-32 rounded-md border p-2">
                    <div className="space-y-2">
                      {tanquesAgua.map((component) => (
                        <label key={component.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedComponentIds.includes(component.id)}
                            onCheckedChange={(state) => toggleComponent(component.id, state === true)}
                          />
                          <span>{component.tag} - {component.name}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <p className="text-xs text-muted-foreground">
                Por padrão, nenhuma máquina/componente fica visível até ser selecionado.
              </p>
            </div>
          )}

          <div className="rounded-md border p-3 bg-muted/30 text-xs text-muted-foreground">
            {selectedRole === "operator"
              ? "Operadores não executam checklist/preventiva neste momento."
              : "Perfil de manutenção: checklist e preventiva habilitados."}
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={watch("available")} onCheckedChange={(value) => setValue("available", value)} />
            <Label>Disponível</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{mechanic ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
