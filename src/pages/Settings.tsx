import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useConfig } from "@/contexts/ConfigContext";
import { COMPONENT_TYPE_LABELS, MACHINE_STATUS_LABELS, MACHINE_TYPE_LABELS } from "@/data/types";
import type { ComponentType, MachineStatus, MachineType } from "@/data/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  mechanic: "Mecânico",
  operator: "Operador",
  planejador: "Planejador",
  supervisor_manutencao: "Supervisor Manutenção",
  supervisor_operacoes: "Supervisor Operações",
};

interface ManagedUser {
  id: string;
  email: string;
  role: string;
  must_change_password: boolean;
}

const emptyMachineForm = {
  baseTag: "",
  type: "extrusora" as MachineType,
  model: "",
  manufacturer: "",
  year: String(new Date().getFullYear()),
  horimeter: "0",
  status: "operating" as MachineStatus,
};

const emptyComponentForm = {
  name: "",
  tag: "",
  type: "trocador_calor" as ComponentType,
  machineType: "extrusora" as MachineType,
  model: "",
  scope: "single_machine" as "single_machine" | "all_of_type",
  machineId: "",
  applyMode: "current" as "current" | "current_and_future",
};

export default function Settings() {
  const { isAdmin, canManageUsers, creatableRoles } = useAuth();
  const {
    machines,
    components,
    updateMachine,
    removeMachine,
    updateComponent,
    removeComponent,
  } = useData();
  const {
    createMachineWithScope,
    createComponentWithScope,
    componentRules,
  } = useConfig();

  const [machineForm, setMachineForm] = useState(emptyMachineForm);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [machineDialogOpen, setMachineDialogOpen] = useState(false);

  const [componentForm, setComponentForm] = useState(emptyComponentForm);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);

  // User management state
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("operator");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { action: "list" },
      });
      if (error) throw error;
      setManagedUsers(data.users || []);
    } catch {
      // silently fail if not admin
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageUsers) loadUsers();
  }, [canManageUsers, loadUsers]);

  const handleCreateUser = async () => {
    if (!newUserEmail) return;
    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { action: "create", email: newUserEmail, role: newUserRole },
      });
      if (error) throw error;
      toast({ title: "Usuário criado", description: `${newUserEmail} com senha watbrazil123` });
      setNewUserEmail("");
      setNewUserRole("operator");
      setUserDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    try {
      const { error } = await supabase.functions.invoke("create-user", {
        body: { action: "reset-password", userId },
      });
      if (error) throw error;
      toast({ title: "Senha resetada", description: `${email} → watbrazil123` });
      loadUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const allMachines = useMemo(
    () => [...machines].sort((left, right) => left.tag.localeCompare(right.tag)),
    [machines],
  );
  
  const machinesByType = useMemo(
    () => machines.filter((machine) => machine.type === componentForm.machineType).sort((a, b) => a.tag.localeCompare(b.tag, 'pt-BR', { numeric: true })),
    [machines, componentForm.machineType],
  );

  const resetMachineForm = () => {
    setMachineForm(emptyMachineForm);
    setEditingMachineId(null);
  };

  const openCreateMachineDialog = () => {
    resetMachineForm();
    setMachineDialogOpen(true);
  };

  const resetComponentForm = () => {
    setComponentForm(emptyComponentForm);
    setEditingComponentId(null);
  };

  const handleCreateOrUpdateMachine = () => {
    if (editingMachineId) {
      updateMachine(editingMachineId, {
        tag: machineForm.baseTag.trim(),
        type: machineForm.type,
        model: machineForm.model.trim(),
        manufacturer: machineForm.manufacturer.trim(),
        year: Number(machineForm.year) || new Date().getFullYear(),
        horimeter: Number(machineForm.horimeter) || 0,
        status: machineForm.status,
        sector: "",
      });
      setMachineDialogOpen(false);
      resetMachineForm();
      return;
    }

    createMachineWithScope({
      baseTag: machineForm.baseTag.trim(),
      type: machineForm.type,
      model: machineForm.model.trim(),
      manufacturer: machineForm.manufacturer.trim(),
      year: Number(machineForm.year) || new Date().getFullYear(),
      horimeter: Number(machineForm.horimeter) || 0,
      status: machineForm.status,
      lineMode: "single",
      line: "",
    });
    setMachineDialogOpen(false);
    resetMachineForm();
  };

  const handleEditMachine = (machineId: string) => {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    setEditingMachineId(machine.id);
    setMachineForm({
      baseTag: machine.tag,
      type: machine.type,
      model: machine.model,
      manufacturer: machine.manufacturer,
      year: String(machine.year),
      horimeter: String(machine.horimeter),
      status: machine.status,
    });
    setMachineDialogOpen(true);
  };

  const handleCreateOrUpdateComponent = () => {
    if (editingComponentId) {
      updateComponent(editingComponentId, {
        name: componentForm.name.trim(),
        tag: componentForm.tag.trim(),
        type: componentForm.type,
        machineType: componentForm.machineType,
        model: componentForm.model.trim() || undefined,
      });
      resetComponentForm();
      return;
    }

    createComponentWithScope({
      name: componentForm.name.trim(),
      tag: componentForm.tag.trim(),
      type: componentForm.type,
      machineType: componentForm.machineType,
      model: componentForm.model.trim() || undefined,
      scope: componentForm.scope,
      machineId: componentForm.machineId || undefined,
      applyMode: componentForm.scope === "all_of_type" ? componentForm.applyMode : undefined,
    });
    resetComponentForm();
  };

  const handleEditComponent = (componentId: string) => {
    const component = components.find((item) => item.id === componentId);
    if (!component) return;
    setEditingComponentId(component.id);
    setComponentForm({
      name: component.name,
      tag: component.tag,
      type: component.type,
      machineType: component.machineType,
      model: component.model || "",
      scope: "single_machine",
      machineId: component.machineId || "",
      applyMode: "current",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro de máquinas e componentes.
        </p>
      </div>

      <Tabs defaultValue="machines" className="space-y-4">
        <TabsList className={`grid w-full md:w-[720px] ${canManageUsers ? "grid-cols-3" : "grid-cols-2"}`}>
          <TabsTrigger value="machines">Máquinas</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          {canManageUsers && <TabsTrigger value="users">Usuários</TabsTrigger>}
        </TabsList>

        <TabsContent value="machines" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Máquinas cadastradas</CardTitle>
              <Button size="sm" className="gap-1" onClick={openCreateMachineDialog}>
                <Plus className="h-4 w-4" />
                Adicionar máquina
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {allMachines.map((machine) => (
                <div key={machine.id} className="border rounded-md p-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono font-semibold">{machine.tag}</span>
                  <Badge variant="outline">{MACHINE_TYPE_LABELS[machine.type]}</Badge>
                  <span className="text-sm text-muted-foreground">{machine.model}</span>
                  <span className="text-sm text-muted-foreground">- {MACHINE_STATUS_LABELS[machine.status]}</span>
                  <span className="text-sm text-muted-foreground">- {MACHINE_STATUS_LABELS[machine.status]}</span>
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditMachine(machine.id)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => removeMachine(machine.id)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Dialog open={machineDialogOpen} onOpenChange={setMachineDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editingMachineId ? "Editar máquina" : "Cadastrar máquina"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Código</Label>
                  <Input value={machineForm.baseTag} onChange={(event) => setMachineForm((prev) => ({ ...prev, baseTag: event.target.value }))} placeholder="EXT-001" />
                </div>
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={machineForm.type} onValueChange={(value: MachineType) => setMachineForm((prev) => ({ ...prev, type: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(MACHINE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={machineForm.status} onValueChange={(value: MachineStatus) => setMachineForm((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(MACHINE_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Modelo</Label>
                  <Input value={machineForm.model} onChange={(event) => setMachineForm((prev) => ({ ...prev, model: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Fabricante</Label>
                  <Input value={machineForm.manufacturer} onChange={(event) => setMachineForm((prev) => ({ ...prev, manufacturer: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Ano</Label>
                  <Input type="number" value={machineForm.year} onChange={(event) => setMachineForm((prev) => ({ ...prev, year: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Horímetro</Label>
                  <Input type="number" value={machineForm.horimeter} onChange={(event) => setMachineForm((prev) => ({ ...prev, horimeter: event.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMachineDialogOpen(false)
                    resetMachineForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateOrUpdateMachine}>
                  {editingMachineId ? "Salvar alterações" : "Cadastrar máquina"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{editingComponentId ? "Editar componente" : "Cadastrar componente"}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={componentForm.name} onChange={(event) => setComponentForm((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Código</Label>
                <Input value={componentForm.tag} onChange={(event) => setComponentForm((prev) => ({ ...prev, tag: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Tipo de componente</Label>
                <Select value={componentForm.type} onValueChange={(value: ComponentType) => setComponentForm((prev) => ({ ...prev, type: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMPONENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tipo de máquina</Label>
                <Select value={componentForm.machineType} onValueChange={(value: MachineType) => setComponentForm((prev) => ({ ...prev, machineType: value, machineId: "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MACHINE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Modelo (opcional)</Label>
                <Input value={componentForm.model} onChange={(event) => setComponentForm((prev) => ({ ...prev, model: event.target.value }))} />
              </div>

              {!editingComponentId && (
                <>
                  <div className="space-y-1">
                    <Label>Escopo</Label>
                    <Select value={componentForm.scope} onValueChange={(value: "single_machine" | "all_of_type") => setComponentForm((prev) => ({ ...prev, scope: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_machine">Uma máquina</SelectItem>
                        <SelectItem value="all_of_type">Todas do tipo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {componentForm.scope === "single_machine" ? (
                    <div className="space-y-1 md:col-span-2">
                      <Label>Máquina específica</Label>
                      <Select value={componentForm.machineId} onValueChange={(value) => setComponentForm((prev) => ({ ...prev, machineId: value }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione uma máquina ativa" /></SelectTrigger>
                        <SelectContent>
                          {machinesByType.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id}>
                              {machine.tag} - {machine.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1 md:col-span-2">
                      <Label>Aplicar em</Label>
                      <Select value={componentForm.applyMode} onValueChange={(value: "current" | "current_and_future") => setComponentForm((prev) => ({ ...prev, applyMode: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current">Máquinas atuais</SelectItem>
                          <SelectItem value="current_and_future">Atuais + futuras</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              <div className="md:col-span-3 flex gap-2">
                <Button onClick={handleCreateOrUpdateComponent}>
                  {editingComponentId ? "Salvar alterações" : "Cadastrar componente"}
                </Button>
                {(editingComponentId || componentForm.name || componentForm.tag) && (
                  <Button variant="outline" onClick={resetComponentForm}>
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Componentes ativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {components.map((component) => (
                <div key={component.id} className="border rounded-md p-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono font-semibold">{component.tag}</span>
                  <Badge variant="outline">{component.name}</Badge>
                  <span className="text-sm text-muted-foreground">{MACHINE_TYPE_LABELS[component.machineType]}</span>
                  <span className="text-sm text-muted-foreground">{MACHINE_TYPE_LABELS[component.machineType]}</span>
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditComponent(component.id)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => removeComponent(component.id)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {componentRules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Regras atuais + futuras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {componentRules.map((rule) => (
                  <div key={rule.id} className="border rounded-md p-2 flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{rule.name}</Badge>
                    <span className="text-muted-foreground">{MACHINE_TYPE_LABELS[rule.machineType]}</span>
                    <span className="text-muted-foreground">• código base {rule.tag}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {canManageUsers && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">Usuários do sistema</CardTitle>
                <Button size="sm" className="gap-1" onClick={() => setUserDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Adicionar usuário
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {usersLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : managedUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
                ) : (
                  managedUsers.map((user) => (
                    <div key={user.id} className="border rounded-md p-3 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">{user.email}</span>
                      <Badge variant="secondary">{ROLE_LABELS[user.role] || user.role}</Badge>
                      {user.must_change_password && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Senha pendente
                        </Badge>
                      )}
                      <div className="ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleResetPassword(user.id, user.email)}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Resetar senha
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Cargo</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {creatableRoles.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Senha padrão: <code className="font-mono bg-muted px-1 rounded">watbrazil123</code>
                    <br />O usuário será obrigado a trocar no primeiro acesso.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateUser} disabled={creatingUser || !newUserEmail}>
                    {creatingUser ? "Criando..." : "Criar usuário"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
