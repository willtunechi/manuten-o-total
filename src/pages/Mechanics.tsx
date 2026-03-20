import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, Pencil, Trash2, KeyRound } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { MechanicFormDialog } from "@/components/forms/MechanicFormDialog";
import { DeleteConfirmDialog } from "@/components/forms/DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Mechanic } from "@/data/types";

const roleLabels: Record<Mechanic["role"], string> = {
  mechanic: "Mecânico",
  operator: "Operador",
  planejador: "Planejador",
  supervisor_manutencao: "Supervisor Manutenção",
  supervisor_operacoes: "Supervisor Operações",
};

const levelLabels: Record<Mechanic["level"], string> = {
  junior: "Júnior",
  mid: "Pleno",
  senior: "Sênior",
};

export default function Mechanics() {
  const { mechanics, machines, components, addMechanic, updateMechanic, removeMechanic } = useData();
  const { role, isAdmin } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Mechanic | undefined>();
  const [deleting, setDeleting] = useState<Mechanic | undefined>();
  const [resettingPassword, setResettingPassword] = useState<Mechanic | undefined>();

  // Filter mechanics based on role hierarchy
  const visibleMechanics = useMemo(() => {
    if (isAdmin) return mechanics;
    const subordinateMap: Record<string, string[]> = {
      supervisor_manutencao: ["mechanic"],
      supervisor_operacoes: ["operator"],
    };
    const allowed = role ? subordinateMap[role] : undefined;
    if (!allowed) return mechanics;
    return mechanics.filter((m) => allowed.includes(m.role));
  }, [mechanics, role, isAdmin]);

  const machineMap = useMemo(() => new Map(machines.map((m) => [m.id, m.tag])), [machines]);
  const componentMap = useMemo(() => new Map(components.map((c) => [c.id, c.tag])), [components]);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Colaboradores</h1>
          <p className="text-muted-foreground text-sm">Cadastro de mecânicos e operadores por máquina</p>
        </div>
        <Button size="lg" className="gap-2" onClick={openCreate}>
          <Plus className="h-5 w-5" /> Novo Colaborador
        </Button>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 text-sm">
          <p className="font-medium">Regra atual</p>
          <p className="text-muted-foreground">
            Checklists e preventivas já cadastrados continuam sob responsabilidade da equipe de manutenção.
          </p>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleMechanics.map((m) => {
          const allowedTags = (m.machineIds || []).map((machineId) => machineMap.get(machineId)).filter(Boolean);
          const allowedComponentTags = (m.componentIds || []).map((componentId) => componentMap.get(componentId)).filter(Boolean);
          const isMaintenance = m.role !== "operator";
          return (
            <Card
              key={m.id}
              className="bg-card border-border cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => {
                setEditing(m);
                setFormOpen(true);
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{roleLabels[m.role]}</p>
                  </div>
                  <Badge variant={m.available ? "default" : "secondary"} className="ml-auto">
                    {m.available ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{levelLabels[m.level]}</Badge>
                  <Badge variant={isMaintenance ? "default" : "secondary"}>
                    {isMaintenance ? "Manutenção" : "Operação"}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Máquinas permitidas: {allowedTags.length}
                  </p>
                  {allowedTags.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">{allowedTags.join(", ")}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Componentes permitidos: {allowedComponentTags.length}
                  </p>
                  {allowedComponentTags.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">{allowedComponentTags.join(", ")}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(m);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  {m.email && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResettingPassword(m);
                      }}
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Reset Senha
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleting(m);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <MechanicFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mechanic={editing}
        onSave={async (data) => {
          if (editing) {
            await updateMechanic(editing.id, data);
          } else {
            // Create collaborator
            await addMechanic(data);
            // Auto-create user account if email provided
            if (data.email) {
              try {
                const { error } = await supabase.functions.invoke("create-user", {
                  body: { action: "create", email: data.email, role: data.role },
                });
                if (error) throw error;
                toast({ title: "Acesso criado", description: `${data.email} — senha: watbrazil123` });
              } catch (err: any) {
                toast({ title: "Colaborador salvo, mas erro ao criar acesso", description: err.message, variant: "destructive" });
              }
            }
          }
        }}
      />
      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(undefined)}
        title={deleting?.name || ""}
        onConfirm={() => {
          if (deleting) removeMechanic(deleting.id);
          setDeleting(undefined);
        }}
      />
      <AlertDialog open={!!resettingPassword} onOpenChange={() => setResettingPassword(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha?</AlertDialogTitle>
            <AlertDialogDescription>
              A senha de <span className="font-medium">{resettingPassword?.email}</span> será alterada para <span className="font-mono font-medium">watbrazil123</span>. O usuário precisará trocar a senha no próximo login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!resettingPassword?.email) return;
              try {
                const { data, error } = await supabase.functions.invoke("create-user", {
                  body: { action: "list" },
                });
                if (error) throw error;
                const user = data?.users?.find((u: any) => u.email === resettingPassword.email);
                if (!user) {
                  toast({ title: "Usuário não encontrado", description: "Este colaborador não possui acesso ao sistema.", variant: "destructive" });
                  return;
                }
                const { error: resetError } = await supabase.functions.invoke("create-user", {
                  body: { action: "reset-password", userId: user.id },
                });
                if (resetError) throw resetError;
                toast({ title: "Senha resetada", description: `${resettingPassword.email} — nova senha: watbrazil123` });
              } catch (err: any) {
                toast({ title: "Erro ao resetar senha", description: err.message, variant: "destructive" });
              }
              setResettingPassword(undefined);
            }}>
              Sim, resetar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
