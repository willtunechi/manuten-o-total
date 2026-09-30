import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, MapPin, Truck, Building2, Home, MonitorStop, Clock, BadgeCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/forms/DeleteConfirmDialog";
import { useData } from "@/contexts/DataContext";
import type { StopReasonConfig, Shift, JobRole } from "@/data/types";

interface Item { id: string; name: string }
interface BuildingLocation extends Item { sector_id: string | null }

const BASE_ROLE_OPTIONS = [
  { value: "mechanic", label: "Mecânico" },
  { value: "operator", label: "Operador" },
  { value: "logistica", label: "Logística" },
  { value: "planejador", label: "Planejador" },
  { value: "supervisor_manutencao", label: "Supervisor de Manutenção" },
  { value: "supervisor_operacoes", label: "Supervisor de Operações" },
  { value: "supervisor_logistica", label: "Supervisor de Logística" },
  { value: "admin", label: "Administrador" },
] as const;

const slugify = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function StopReasonDialog({ open, onOpenChange, initial, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  initial: { name: string; countsInIndicators: boolean };
  onSave: (name: string, counts: boolean) => Promise<boolean>;
}) {
  const [name, setName] = useState(initial.name);
  const [counts, setCounts] = useState(initial.countsInIndicators);
  useEffect(() => { if (open) { setName(initial.name); setCounts(initial.countsInIndicators); } }, [open, initial]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (await onSave(name.trim(), counts)) onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Motivo de Parada</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="cursor-pointer">Contar nos indicadores</Label>
              <p className="text-xs text-muted-foreground">Desligue para paradas que não afetam a disponibilidade.</p>
            </div>
            <Switch checked={counts} onCheckedChange={setCounts} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShiftDialog({ open, onOpenChange, initial, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  initial: { name: string; startTime: string; endTime: string };
  onSave: (name: string, start: string, end: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(initial.name);
  const [start, setStart] = useState(initial.startTime);
  const [end, setEnd] = useState(initial.endTime);
  useEffect(() => { if (open) { setName(initial.name); setStart(initial.startTime); setEnd(initial.endTime); } }, [open, initial]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !start || !end) return;
    if (await onSave(name.trim(), start, end)) onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Turno</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex.: Manhã" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Início *</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Fim *</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JobRoleDialog({ open, onOpenChange, initial, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  initial: { name: string; baseRole: string };
  onSave: (name: string, baseRole: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(initial.name);
  const [baseRole, setBaseRole] = useState(initial.baseRole);
  useEffect(() => { if (open) { setName(initial.name); setBaseRole(initial.baseRole); } }, [open, initial]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !baseRole) return;
    if (await onSave(name.trim(), baseRole)) onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Cargo</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome do cargo *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex.: Mecânico Eletricista" />
          </div>
          <div className="space-y-1">
            <Label>Nível de acesso *</Label>
            <Select value={baseRole} onValueChange={setBaseRole}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {BASE_ROLE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Define as permissões de quem tiver este cargo.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function useSimpleTable(table: "locations" | "suppliers" | "building_sectors") {
  const [items, setItems] = useState<Item[]>([]);
  const load = async () => {
    const { data } = await supabase.from(table).select("id, name").order("name");
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);
  const add = async (name: string) => {
    const { error } = await supabase.from(table).insert({ name });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await load(); return true;
  };
  const update = async (id: string, name: string) => {
    const { error } = await supabase.from(table).update({ name }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await load(); return true;
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    await load();
  };
  return { items, add, update, remove, reload: load };
}

function useBuildingLocations() {
  const [items, setItems] = useState<BuildingLocation[]>([]);
  const load = async () => {
    const { data } = await supabase.from("building_locations").select("id, name, sector_id").order("name");
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);
  const add = async (name: string, sector_id: string | null) => {
    const { error } = await supabase.from("building_locations").insert({ name, sector_id });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await load(); return true;
  };
  const update = async (id: string, name: string, sector_id: string | null) => {
    const { error } = await supabase.from("building_locations").update({ name, sector_id }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await load(); return true;
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("building_locations").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    await load();
  };
  return { items, add, update, remove };
}

function NameFormDialog({ open, onOpenChange, title, initialName, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; initialName: string; onSave: (name: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(initialName);
  useEffect(() => { if (open) setName(initialName); }, [open, initialName]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ok = await onSave(name.trim());
    if (ok) onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BuildingLocationDialog({ open, onOpenChange, sectors, initial, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; sectors: Item[];
  initial: { name: string; sector_id: string | null };
  onSave: (name: string, sector_id: string | null) => Promise<boolean>;
}) {
  const [name, setName] = useState(initial.name);
  const [sectorId, setSectorId] = useState(initial.sector_id || "");
  useEffect(() => { if (open) { setName(initial.name); setSectorId(initial.sector_id || ""); } }, [open, initial]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ok = await onSave(name.trim(), sectorId || null);
    if (ok) onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Localização Predial</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1">
            <Label>Setor</Label>
            <Select value={sectorId} onValueChange={setSectorId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ItemList({ items, icon: Icon, onEdit, onDelete, sub }: {
  items: { id: string; name: string }[];
  icon: React.ElementType;
  onEdit: (item: { id: string; name: string }) => void;
  onDelete: (item: { id: string; name: string }) => void;
  sub?: (item: any) => string | null;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <Card key={item.id} className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <div>
                <span className="text-sm font-medium block">{item.name}</span>
                {sub && sub(item) && <span className="text-xs text-muted-foreground">{sub(item)}</span>}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(item)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground col-span-full py-8 text-center">Nenhum registro cadastrado.</p>
      )}
    </div>
  );
}

export default function Registrations() {
  const locations = useSimpleTable("locations");
  const suppliers = useSimpleTable("suppliers");
  const buildingSectors = useSimpleTable("building_sectors");
  const buildingLocations = useBuildingLocations();
  const { stopReasons, shifts, jobRoles, reloadRegistrations } = useData();

  const dbError = (error: { message: string } | null) => {
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return true; }
    return false;
  };

  // ── Motivos de parada ──
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonInitial, setReasonInitial] = useState({ name: "", countsInIndicators: true });
  const [reasonSave, setReasonSave] = useState<(n: string, c: boolean) => Promise<boolean>>(() => async () => true);

  const addStopReason = async (name: string, counts: boolean) => {
    const { error } = await supabase.from("stop_reasons").insert({ name, key: slugify(name), counts_in_indicators: counts });
    if (dbError(error)) return false;
    await reloadRegistrations(); return true;
  };
  const updateStopReason = async (id: string, name: string, counts: boolean) => {
    const { error } = await supabase.from("stop_reasons").update({ name, counts_in_indicators: counts }).eq("id", id);
    if (dbError(error)) return false;
    await reloadRegistrations(); return true;
  };
  const openReasonAdd = () => { setReasonInitial({ name: "", countsInIndicators: true }); setReasonSave(() => addStopReason); setReasonOpen(true); };
  const openReasonEdit = (r: StopReasonConfig) => {
    setReasonInitial({ name: r.name, countsInIndicators: r.countsInIndicators });
    setReasonSave(() => (n: string, c: boolean) => updateStopReason(r.id, n, c));
    setReasonOpen(true);
  };

  // ── Turnos ──
  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftInitial, setShiftInitial] = useState({ name: "", startTime: "06:00", endTime: "14:00" });
  const [shiftSave, setShiftSave] = useState<(n: string, s: string, e: string) => Promise<boolean>>(() => async () => true);

  const addShift = async (name: string, start: string, end: string) => {
    const { error } = await supabase.from("shifts").insert({ name, start_time: start, end_time: end });
    if (dbError(error)) return false;
    await reloadRegistrations(); return true;
  };
  const updateShift = async (id: string, name: string, start: string, end: string) => {
    const { error } = await supabase.from("shifts").update({ name, start_time: start, end_time: end }).eq("id", id);
    if (dbError(error)) return false;
    await reloadRegistrations(); return true;
  };
  const openShiftAdd = () => { setShiftInitial({ name: "", startTime: "06:00", endTime: "14:00" }); setShiftSave(() => addShift); setShiftOpen(true); };
  const openShiftEdit = (s: Shift) => {
    setShiftInitial({ name: s.name, startTime: s.startTime, endTime: s.endTime });
    setShiftSave(() => (n: string, st: string, en: string) => updateShift(s.id, n, st, en));
    setShiftOpen(true);
  };

  // ── Cargos ──
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleInitial, setRoleInitial] = useState({ name: "", baseRole: "mechanic" });
  const [roleSave, setRoleSave] = useState<(n: string, b: string) => Promise<boolean>>(() => async () => true);

  const addJobRole = async (name: string, baseRole: string) => {
    const { error } = await supabase.from("job_roles").insert({ name, base_role: baseRole as JobRole["baseRole"] });
    if (dbError(error)) return false;
    await reloadRegistrations(); return true;
  };
  const updateJobRole = async (id: string, name: string, baseRole: string) => {
    const { error } = await supabase.from("job_roles").update({ name, base_role: baseRole as JobRole["baseRole"] }).eq("id", id);
    if (dbError(error)) return false;
    await reloadRegistrations(); return true;
  };
  const openRoleAdd = () => { setRoleInitial({ name: "", baseRole: "mechanic" }); setRoleSave(() => addJobRole); setRoleOpen(true); };
  const openRoleEdit = (r: JobRole) => {
    setRoleInitial({ name: r.name, baseRole: r.baseRole });
    setRoleSave(() => (n: string, b: string) => updateJobRole(r.id, n, b));
    setRoleOpen(true);
  };

  const removeFrom = async (table: "stop_reasons" | "shifts" | "job_roles", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (dbError(error)) return;
    await reloadRegistrations();
  };

  const [formOpen, setFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formInitial, setFormInitial] = useState("");
  const [formSave, setFormSave] = useState<(name: string) => Promise<boolean>>(() => async () => true);

  const [bLocOpen, setBLocOpen] = useState(false);
  const [bLocInitial, setBLocInitial] = useState<{ name: string; sector_id: string | null }>({ name: "", sector_id: null });
  const [bLocSave, setBLocSave] = useState<(name: string, sid: string | null) => Promise<boolean>>(() => async () => true);

  const [deleting, setDeleting] = useState<{ id: string; name: string; type: "location" | "supplier" | "building_sector" | "building_location" | "stop_reason" | "shift" | "job_role" } | null>(null);

  const openSimpleAdd = (type: "location" | "supplier" | "building_sector") => {
    const map = { location: ["Nova Localização", locations.add], supplier: ["Novo Fornecedor", suppliers.add], building_sector: ["Novo Setor Predial", buildingSectors.add] } as const;
    const [t, fn] = map[type];
    setFormTitle(t); setFormInitial(""); setFormSave(() => fn); setFormOpen(true);
  };
  const openSimpleEdit = (type: "location" | "supplier" | "building_sector", item: { id: string; name: string }) => {
    const map = { location: ["Editar Localização", locations.update], supplier: ["Editar Fornecedor", suppliers.update], building_sector: ["Editar Setor Predial", buildingSectors.update] } as const;
    const [t, fn] = map[type];
    setFormTitle(t); setFormInitial(item.name); setFormSave(() => (n: string) => fn(item.id, n)); setFormOpen(true);
  };

  const openBLocAdd = () => { setBLocInitial({ name: "", sector_id: null }); setBLocSave(() => buildingLocations.add); setBLocOpen(true); };
  const openBLocEdit = (item: BuildingLocation) => { setBLocInitial({ name: item.name, sector_id: item.sector_id }); setBLocSave(() => (n: string, s: string | null) => buildingLocations.update(item.id, n, s)); setBLocOpen(true); };

  const sectorMap = Object.fromEntries(buildingSectors.items.map((s) => [s.id, s.name]));

  const confirmDelete = () => {
    if (!deleting) return;
    if (deleting.type === "location") locations.remove(deleting.id);
    else if (deleting.type === "supplier") suppliers.remove(deleting.id);
    else if (deleting.type === "building_sector") buildingSectors.remove(deleting.id);
    else if (deleting.type === "building_location") buildingLocations.remove(deleting.id);
    else if (deleting.type === "stop_reason") removeFrom("stop_reasons", deleting.id);
    else if (deleting.type === "shift") removeFrom("shifts", deleting.id);
    else if (deleting.type === "job_role") removeFrom("job_roles", deleting.id);
    setDeleting(null);
  };

  const baseRoleLabel = (value: string) => BASE_ROLE_OPTIONS.find((o) => o.value === value)?.label || value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cadastros</h1>
        <p className="text-muted-foreground text-sm">Localizações, Fornecedores, Manutenção Predial, Motivos de Parada, Turnos e Cargos</p>
      </div>

      <Tabs defaultValue="locations">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="locations" className="gap-2"><MapPin className="h-4 w-4" /> Localizações</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2"><Truck className="h-4 w-4" /> Fornecedores</TabsTrigger>
          <TabsTrigger value="building_sectors" className="gap-2"><Building2 className="h-4 w-4" /> Setor Predial</TabsTrigger>
          <TabsTrigger value="building_locations" className="gap-2"><Home className="h-4 w-4" /> Localização Predial</TabsTrigger>
          <TabsTrigger value="stop_reasons" className="gap-2"><MonitorStop className="h-4 w-4" /> Motivos de Parada</TabsTrigger>
          <TabsTrigger value="shifts" className="gap-2"><Clock className="h-4 w-4" /> Turnos</TabsTrigger>
          <TabsTrigger value="job_roles" className="gap-2"><BadgeCheck className="h-4 w-4" /> Cargos</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4">
          <div className="flex justify-end"><Button className="gap-2" onClick={() => openSimpleAdd("location")}><Plus className="h-4 w-4" /> Nova Localização</Button></div>
          <ItemList items={locations.items} icon={MapPin} onEdit={(i) => openSimpleEdit("location", i)} onDelete={(i) => setDeleting({ ...i, type: "location" })} />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end"><Button className="gap-2" onClick={() => openSimpleAdd("supplier")}><Plus className="h-4 w-4" /> Novo Fornecedor</Button></div>
          <ItemList items={suppliers.items} icon={Truck} onEdit={(i) => openSimpleEdit("supplier", i)} onDelete={(i) => setDeleting({ ...i, type: "supplier" })} />
        </TabsContent>

        <TabsContent value="building_sectors" className="space-y-4">
          <div className="flex justify-end"><Button className="gap-2" onClick={() => openSimpleAdd("building_sector")}><Plus className="h-4 w-4" /> Novo Setor Predial</Button></div>
          <ItemList items={buildingSectors.items} icon={Building2} onEdit={(i) => openSimpleEdit("building_sector", i)} onDelete={(i) => setDeleting({ ...i, type: "building_sector" })} />
        </TabsContent>

        <TabsContent value="building_locations" className="space-y-4">
          <div className="flex justify-end"><Button className="gap-2" onClick={openBLocAdd}><Plus className="h-4 w-4" /> Nova Localização Predial</Button></div>
          <ItemList
            items={buildingLocations.items}
            icon={Home}
            onEdit={(i) => openBLocEdit(i as BuildingLocation)}
            onDelete={(i) => setDeleting({ ...i, type: "building_location" })}
            sub={(it: BuildingLocation) => it.sector_id ? `Setor: ${sectorMap[it.sector_id] || "-"}` : null}
          />
        </TabsContent>

        <TabsContent value="stop_reasons" className="space-y-4">
          <div className="flex justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground">Motivos usados ao parar máquinas. Desmarque "contar nos indicadores" para paradas que não devem afetar a disponibilidade.</p>
            <Button className="gap-2 shrink-0" onClick={openReasonAdd}><Plus className="h-4 w-4" /> Novo Motivo</Button>
          </div>
          <ItemList
            items={stopReasons}
            icon={MonitorStop}
            onEdit={(i) => openReasonEdit(i as unknown as StopReasonConfig)}
            onDelete={(i) => setDeleting({ id: i.id, name: i.name, type: "stop_reason" })}
            sub={(it: StopReasonConfig) => it.countsInIndicators ? "Conta nos indicadores" : "Não conta nos indicadores"}
          />
        </TabsContent>

        <TabsContent value="shifts" className="space-y-4">
          <div className="flex justify-end"><Button className="gap-2" onClick={openShiftAdd}><Plus className="h-4 w-4" /> Novo Turno</Button></div>
          <ItemList
            items={shifts}
            icon={Clock}
            onEdit={(i) => openShiftEdit(i as unknown as Shift)}
            onDelete={(i) => setDeleting({ id: i.id, name: i.name, type: "shift" })}
            sub={(it: Shift) => `${it.startTime} às ${it.endTime}`}
          />
        </TabsContent>

        <TabsContent value="job_roles" className="space-y-4">
          <div className="flex justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground">Cargos disponíveis para os colaboradores, com o nível de acesso de cada um.</p>
            <Button className="gap-2 shrink-0" onClick={openRoleAdd}><Plus className="h-4 w-4" /> Novo Cargo</Button>
          </div>
          <ItemList
            items={jobRoles}
            icon={BadgeCheck}
            onEdit={(i) => openRoleEdit(i as unknown as JobRole)}
            onDelete={(i) => setDeleting({ id: i.id, name: i.name, type: "job_role" })}
            sub={(it: JobRole) => `Acesso: ${baseRoleLabel(it.baseRole)}`}
          />
        </TabsContent>
      </Tabs>

      <StopReasonDialog open={reasonOpen} onOpenChange={setReasonOpen} initial={reasonInitial} onSave={reasonSave} />
      <ShiftDialog open={shiftOpen} onOpenChange={setShiftOpen} initial={shiftInitial} onSave={shiftSave} />
      <JobRoleDialog open={roleOpen} onOpenChange={setRoleOpen} initial={roleInitial} onSave={roleSave} />

      <NameFormDialog open={formOpen} onOpenChange={setFormOpen} title={formTitle} initialName={formInitial} onSave={formSave} />
      <BuildingLocationDialog open={bLocOpen} onOpenChange={setBLocOpen} sectors={buildingSectors.items} initial={bLocInitial} onSave={bLocSave} />
      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title={deleting?.name || ""}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
