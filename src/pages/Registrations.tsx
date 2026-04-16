import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, MapPin, Truck, Building2, Home } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/forms/DeleteConfirmDialog";

interface Item { id: string; name: string }
interface BuildingLocation extends Item { sector_id: string | null }

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

  const [formOpen, setFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formInitial, setFormInitial] = useState("");
  const [formSave, setFormSave] = useState<(name: string) => Promise<boolean>>(() => async () => true);

  const [bLocOpen, setBLocOpen] = useState(false);
  const [bLocInitial, setBLocInitial] = useState<{ name: string; sector_id: string | null }>({ name: "", sector_id: null });
  const [bLocSave, setBLocSave] = useState<(name: string, sid: string | null) => Promise<boolean>>(() => async () => true);

  const [deleting, setDeleting] = useState<{ id: string; name: string; type: "location" | "supplier" | "building_sector" | "building_location" } | null>(null);

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
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cadastros</h1>
        <p className="text-muted-foreground text-sm">Localizações, Fornecedores e Manutenção Predial</p>
      </div>

      <Tabs defaultValue="locations">
        <TabsList>
          <TabsTrigger value="locations" className="gap-2"><MapPin className="h-4 w-4" /> Localizações</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2"><Truck className="h-4 w-4" /> Fornecedores</TabsTrigger>
          <TabsTrigger value="building_sectors" className="gap-2"><Building2 className="h-4 w-4" /> Setor Predial</TabsTrigger>
          <TabsTrigger value="building_locations" className="gap-2"><Home className="h-4 w-4" /> Localização Predial</TabsTrigger>
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
      </Tabs>

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
