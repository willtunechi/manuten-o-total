import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Package, Pencil, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { PartFormDialog } from "@/components/forms/PartFormDialog";
import { DeleteConfirmDialog } from "@/components/forms/DeleteConfirmDialog";
import type { Part } from "@/data/types";

export default function Inventory() {
  const { parts, addPart, updatePart, removePart } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Part | undefined>();
  const [deleting, setDeleting] = useState<Part | undefined>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estoque de Peças</h1>
          <p className="text-muted-foreground text-sm">Almoxarifado e controle de peças</p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="h-5 w-5" /> Nova Peça
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {parts.map((p) => {
          const qty = p.quantity ?? p.stock ?? 0;
          const unitCost = p.unitCost ?? p.cost ?? 0;
          const sku = p.sku || p.code || p.id;
          const description = p.description || p.name || "-";
          const unit = p.unit || "un";
          const isLow = qty <= p.minStock;
          return (
            <Card key={p.id} className={`bg-card border-border cursor-pointer hover:border-primary/40 transition-colors ${isLow ? "border-destructive/50" : ""}`} onClick={() => { setEditing(p); setFormOpen(true); }}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="font-mono text-sm font-bold">{sku}</span>
                  </div>
                  {isLow && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" /> Baixo
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Qtd: <strong className="text-foreground">{qty} {unit}</strong></span>
                  <span className="text-muted-foreground">Mín: {p.minStock}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>{p.location}</span>
                  <span>R$ {unitCost.toFixed(2)}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="gap-1" onClick={(e) => { e.stopPropagation(); setEditing(p); setFormOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleting(p); }}>
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PartFormDialog open={formOpen} onOpenChange={setFormOpen} part={editing} onSave={(data) => editing ? updatePart(editing.id, data) : addPart(data)} />
      <DeleteConfirmDialog open={!!deleting} onOpenChange={() => setDeleting(undefined)} title={deleting?.sku || ""} onConfirm={() => { if (deleting) removePart(deleting.id); setDeleting(undefined); }} />
    </div>
  );
}
