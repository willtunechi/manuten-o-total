import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { useTheme } from "@/contexts/ThemeContext";
import { useData } from "@/contexts/DataContext";
import { useConfig } from "@/contexts/ConfigContext";
import { COMPONENT_TYPE_LABELS, MACHINE_STATUS_LABELS, MACHINE_TYPE_LABELS } from "@/data/types";
import type { ComponentType, MachineStatus, MachineType } from "@/data/types";
import { toast } from "@/hooks/use-toast";

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
    componentTypes,
    addComponentType,
    updateComponentType,
    removeComponentType,
  } = useConfig();

  const [machineForm, setMachineForm] = useState(emptyMachineForm);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [machineDialogOpen, setMachineDialogOpen] = useState(false);

  const [componentForm, setComponentForm] = useState(emptyComponentForm);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);

  // Component types state
  const [newTypeName, setNewTypeName] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState("");

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

  const handleAddComponentType = () => {
    if (!newTypeName.trim()) return;
    const autoKey = newTypeName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    addComponentType(autoKey, newTypeName);
    setNewTypeName("");
  };

  const handleSaveEditType = () => {
    if (!editingTypeId || !editingTypeName.trim()) return;
    updateComponentType(editingTypeId, editingTypeName);
    setEditingTypeId(null);
    setEditingTypeName("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro de máquinas, componentes e tipos.
        </p>
      </div>

      <Tabs defaultValue="machines" className="space-y-4">
        <TabsList className="grid w-full md:w-[720px] grid-cols-3">
          <TabsTrigger value="machines">Máquinas</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="component_types">Tipos de Componentes</TabsTrigger>
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
                    setMachineDialogOpen(false);
                    resetMachineForm();
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
                    {componentTypes.length > 0
                      ? componentTypes.map((ct) => (
                          <SelectItem key={ct.key} value={ct.key}>{ct.name}</SelectItem>
                        ))
                      : Object.entries(COMPONENT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))
                    }
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

        <TabsContent value="component_types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adicionar tipo de componente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="space-y-1 flex-1">
                  <Label>Nome do tipo</Label>
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="ex: Motor Elétrico"
                    onKeyDown={(e) => e.key === "Enter" && handleAddComponentType()}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddComponentType} disabled={!newTypeName.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipos cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {componentTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum tipo cadastrado.</p>
              ) : (
                componentTypes.map((ct) => (
                  <div key={ct.id} className="border rounded-md p-3 flex items-center gap-3">
                    {editingTypeId === ct.id ? (
                      <>
                        <Input
                          className="flex-1 max-w-xs"
                          value={editingTypeName}
                          onChange={(e) => setEditingTypeName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEditType()}
                        />
                        <Button size="sm" onClick={handleSaveEditType}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingTypeId(null)}>Cancelar</Button>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{ct.name}</span>
                        <div className="ml-auto flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingTypeId(ct.id); setEditingTypeName(ct.name); }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => removeComponentType(ct.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
