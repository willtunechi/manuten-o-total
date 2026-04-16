import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoUpload } from "@/components/forms/PhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Sector { id: string; name: string }
interface Location { id: string; name: string; sector_id: string | null }

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
  reportedBy: string;
}

export function BuildingRequestDialog({ open, onOpenChange, onSaved, reportedBy }: Props) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sectorId, setSectorId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSectorId(""); setLocationId(""); setTitle(""); setDescription(""); setPriority("medium"); setPhotoUrl(undefined);
    supabase.from("building_sectors").select("id, name").order("name").then(({ data }) => setSectors(data || []));
    supabase.from("building_locations").select("id, name, sector_id").order("name").then(({ data }) => setLocations(data || []));
  }, [open]);

  const filteredLocations = sectorId ? locations.filter((l) => l.sector_id === sectorId) : locations;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !sectorId || !locationId) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("building_maintenance_requests").insert({
      sector_id: sectorId,
      location_id: locationId,
      title: title.trim(),
      description: description.trim(),
      priority,
      photo_url: photoUrl,
      requested_by: reportedBy,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Solicitação criada com sucesso" });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova Solicitação Predial</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Setor *</Label>
              <Select value={sectorId} onValueChange={(v) => { setSectorId(v); setLocationId(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Localização *</Label>
              <Select value={locationId} onValueChange={setLocationId} disabled={!sectorId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {filteredLocations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resumo do problema" />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Detalhes da solicitação" />
          </div>
          <div className="space-y-1">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Foto</Label>
            <PhotoUpload value={photoUrl} onChange={setPhotoUrl} folder="building" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar Solicitação"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
