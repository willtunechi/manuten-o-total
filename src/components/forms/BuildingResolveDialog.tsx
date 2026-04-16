import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/forms/PhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  requestId: string | null;
  onSaved: () => void;
  assignedTo: string;
}

export function BuildingResolveDialog({ open, onOpenChange, requestId, onSaved, assignedTo }: Props) {
  const [notes, setNotes] = useState("");
  const [hours, setHours] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setNotes(""); setHours(""); setPhotoUrl(undefined); }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId) return;
    if (!notes.trim() || !hours) {
      toast({ title: "Informe as notas e horas trabalhadas", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("building_maintenance_requests").update({
      status: "resolved",
      resolution_notes: notes.trim(),
      resolution_photo_url: photoUrl,
      actual_hours: parseFloat(hours),
      assigned_to: assignedTo,
      resolved_at: new Date().toISOString(),
    }).eq("id", requestId);
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Solicitação resolvida" });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Resolver Solicitação</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Notas de Resolução *</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Descreva o que foi feito" />
          </div>
          <div className="space-y-1">
            <Label>Horas Trabalhadas *</Label>
            <Input type="number" step="0.1" min="0" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Foto da Resolução</Label>
            <PhotoUpload value={photoUrl} onChange={setPhotoUrl} folder="building-resolution" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Concluir"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
