import { useEffect, useMemo, useRef, useState } from "react";
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
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { MACHINE_TYPE_LABELS, PRIORITY_LABELS, OS_TYPE_LABELS } from "@/data/types";
import type { Ticket, Priority, OSType, MachineType } from "@/data/types";
import { toast } from "@/hooks/use-toast";

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
  const { machines: allMachines, components: allComponents, mechanics, userAssignedMachineIds, userAssignedComponentIds } = useData();
  const machines = useMemo(
    () => (userAssignedMachineIds !== null ? allMachines.filter((m) => userAssignedMachineIds.includes(m.id)) : allMachines),
    [allMachines, userAssignedMachineIds],
  );
  const components = useMemo(
    () => (userAssignedComponentIds !== null ? allComponents.filter((c) => userAssignedComponentIds.includes(c.id)) : allComponents),
    [allComponents, userAssignedComponentIds],
  );
  const [stopMachineOnCreate, setStopMachineOnCreate] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setUploadedUrl(ticket?.photoUrl || "");

    const targetMachine = machines.find((m) => m.id === ticket?.machineId);
    const targetComponent = components.find((c) => c.id === ticket?.machineId);
    const defaultMachineType = targetMachine?.type || targetComponent?.machineType || "";

    supabase.auth.getSession().then(({ data: { session } }) => {
      const userEmail = session?.user?.email || "";
      const mechanic = mechanics.find((m) => m.email === userEmail);
      const userName = mechanic?.name || userEmail;
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
              createdBy: userName,
            },
      );
    });
  }, [ticket, open, reset, machines, components, mechanics]);

  const selectedMachineType = watch("machineType") as MachineType | "";
  const selectedMachineId = watch("machineId");
  const ticketType = watch("type");

  const selectedAssetAlreadyStopped = useMemo(() => {
    if (!selectedMachineId) return false;
    const machine = allMachines.find((m) => m.id === selectedMachineId);
    if (machine) return machine.status === "stopped" || machine.status === "maintenance";
    const component = allComponents.find((c) => c.id === selectedMachineId);
    if (component) return component.status === "stopped" || component.status === "maintenance";
    return false;
  }, [selectedMachineId, allMachines, allComponents]);

  const machineOptions = useMemo(() => {
    if (!selectedMachineType) return [];

    const machineItems = machines
      .filter((m) => m.type === selectedMachineType)
      .map((m) => ({
        id: m.id,
        label: `${m.tag} - ${m.model}`,
      }));

    const componentItems = components
      .filter((c) => c.type === selectedMachineType)
      .map((c) => ({
        id: c.id,
        label: `${c.tag} - ${c.name}`,
      }));

    return [...machineItems, ...componentItems].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { numeric: true }));
  }, [selectedMachineType, machines, components]);

  const isNewTicket = !ticket;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Formato não suportado", description: "Use imagens (JPG, PNG, WebP) ou vídeos (MP4, WebM)", variant: "destructive" });
      return;
    }

    // Validate size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Tamanho máximo: 20MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `tickets/${fileName}`;

      const { error } = await supabase.storage.from('ticket-attachments').upload(filePath, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
      setUploadedUrl(publicUrl);
      toast({ title: "Arquivo enviado" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: FormData) => {
    onSave({
      code: ticket?.code || 0,
      machineId: data.machineId,
      symptom: data.symptom,
      createdBy: data.createdBy,
      type: data.type as OSType,
      maintenanceType: data.type === "corrective" ? data.maintenanceType : undefined,
      priority: data.priority as Priority,
      createdAt: ticket?.createdAt || new Date().toISOString(),
      status: ticket?.status || "pending",
      comment: ticket?.comment || "",
      photoUrl: uploadedUrl || "",
      partsUsed: ticket?.partsUsed || [],
      resolvedAt: ticket?.resolvedAt,
    }, isNewTicket ? stopMachineOnCreate : false);
    reset();
    setUploadedUrl("");
    onOpenChange(false);
  };

  const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
            <Select value={watch("machineId")} onValueChange={(v) => setValue("machineId", v, { shouldValidate: true })}>
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

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Foto / Vídeo</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleFileUpload}
            />
            {uploadedUrl ? (
              <div className="relative rounded-md border border-border overflow-hidden bg-muted/30">
                {isVideo(uploadedUrl) ? (
                  <video src={uploadedUrl} controls className="w-full max-h-48 object-contain" />
                ) : (
                  <img src={uploadedUrl} alt="Anexo" className="w-full max-h-48 object-contain" />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-7 w-7 p-0"
                  onClick={() => setUploadedUrl("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-20 border-dashed gap-2"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Enviando...</>
                ) : (
                  <><ImagePlus className="h-5 w-5" /> Adicionar foto ou vídeo</>
                )}
              </Button>
            )}
          </div>

          <div className="space-y-1">
            <Label>Aberto por</Label>
            <Input value={watch("createdBy")} readOnly disabled className="bg-muted" />
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
            <Button type="submit" disabled={uploading}>{ticket ? "Salvar" : "Abrir Chamado"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
