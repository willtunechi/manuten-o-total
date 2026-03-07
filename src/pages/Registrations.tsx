import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, MapPin, Truck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DeleteConfirmDialog } from "@/components/forms/DeleteConfirmDialog";

interface Location {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

function useLocations() {
  const [items, setItems] = useState<Location[]>([]);
  const load = async () => {
    const { data } = await supabase.from("locations").select("id, name").order("name");
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);
  const add = async (name: string) => {
    const { error } = await supabase.from("locations").insert({ name });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await load(); return true;
  };
  const update = async (id: string, name: string) => {
    const { error } = await supabase.from("locations").update({ name }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await load(); return true;
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    await load();
  };
  return { items, add, update, remove };
}

function useSuppliers() {
  const [items, setItems] = useState<Supplier[]>([]);
  const load = async () => {
    const { data } = await supabase.from("suppliers").select("id, name").order("name");
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);
  const add = async (name: string) => {
    const { error } = await supabase.from("suppliers").insert({ name });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await load(); return true;
  };
  const update = async (id: string, name: string) => {
    const { error } = await supabase.from("suppliers").update({ name }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await load(); return true;
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
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

function ItemList({ items, icon: Icon, onEdit, onDelete }: {
  items: { id: string; name: string }[];
  icon: React.ElementType;
  onEdit: (item: { id: string; name: string }) => void;
  onDelete: (item: { id: string; name: string }) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <Card key={item.id} className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{item.name}</span>
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
  const locations = useLocations();
  const suppliers = useSuppliers();

  const [formOpen, setFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formInitial, setFormInitial] = useState("");
  const [formSave, setFormSave] = useState<(name: string) => Promise<boolean>>(() => async () => true);

  const [deleting, setDeleting] = useState<{ id: string; name: string; type: "location" | "supplier" } | null>(null);

  const openAdd = (type: "location" | "supplier") => {
    setFormTitle(type === "location" ? "Nova Localização" : "Novo Fornecedor");
    setFormInitial("");
    setFormSave(() => (name: string) => type === "location" ? locations.add(name) : suppliers.add(name));
    setFormOpen(true);
  };

  const openEdit = (type: "location" | "supplier", item: { id: string; name: string }) => {
    setFormTitle(type === "location" ? "Editar Localização" : "Editar Fornecedor");
    setFormInitial(item.name);
    setFormSave(() => (name: string) => type === "location" ? locations.update(item.id, name) : suppliers.update(item.id, name));
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cadastros</h1>
        <p className="text-muted-foreground text-sm">Localizações e Fornecedores</p>
      </div>

      <Tabs defaultValue="locations">
        <TabsList>
          <TabsTrigger value="locations" className="gap-2"><MapPin className="h-4 w-4" /> Localizações</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2"><Truck className="h-4 w-4" /> Fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2" onClick={() => openAdd("location")}><Plus className="h-4 w-4" /> Nova Localização</Button>
          </div>
          <ItemList items={locations.items} icon={MapPin} onEdit={(i) => openEdit("location", i)} onDelete={(i) => setDeleting({ ...i, type: "location" })} />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2" onClick={() => openAdd("supplier")}><Plus className="h-4 w-4" /> Novo Fornecedor</Button>
          </div>
          <ItemList items={suppliers.items} icon={Truck} onEdit={(i) => openEdit("supplier", i)} onDelete={(i) => setDeleting({ ...i, type: "supplier" })} />
        </TabsContent>
      </Tabs>

      <NameFormDialog open={formOpen} onOpenChange={setFormOpen} title={formTitle} initialName={formInitial} onSave={formSave} />
      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title={deleting?.name || ""}
        onConfirm={() => {
          if (deleting) {
            if (deleting.type === "location") locations.remove(deleting.id);
            else suppliers.remove(deleting.id);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
