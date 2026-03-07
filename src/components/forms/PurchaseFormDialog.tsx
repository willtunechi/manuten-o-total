import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import type { PurchaseOrder, PurchaseStatus } from "@/data/types";
import { PURCHASE_STATUS_LABELS } from "@/data/types";

interface PurchaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: PurchaseOrder | null;
}

export function PurchaseFormDialog({ open, onOpenChange, editData }: PurchaseFormDialogProps) {
  const { parts, addPurchaseOrder, updatePurchaseOrder } = useData();
  const [partId, setPartId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState<PurchaseStatus>("searching_suppliers");
  const [unitCost, setUnitCost] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editData) {
      setPartId(editData.partId);
      setQuantity(editData.quantity);
      setSupplier(editData.supplier);
      setStatus(editData.status);
      setUnitCost(editData.unitCost);
      setNotes(editData.notes);
    } else {
      setPartId("");
      setQuantity(1);
      setSupplier("");
      setStatus("searching_suppliers");
      setUnitCost(0);
      setNotes("");
    }
  }, [editData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const part = parts.find((p) => p.id === partId);
    const now = new Date().toISOString();
    const data = {
      partId,
      partDescription: part?.description || "",
      quantity,
      supplier,
      status,
      unitCost,
      totalCost: unitCost * quantity,
      notes,
      createdAt: editData?.createdAt || now,
      updatedAt: now,
    };
    if (editData) {
      updatePurchaseOrder(editData.id, data);
    } else {
      addPurchaseOrder(data as Omit<PurchaseOrder, "id">);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? "Editar Pedido" : "Novo Pedido de Compra"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Peça</Label>
            <Select value={partId} onValueChange={setPartId}>
              <SelectTrigger><SelectValue placeholder="Selecione a peça" /></SelectTrigger>
              <SelectContent>
                {parts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.sku} - {p.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min={1} value={quantity || ""} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label>Custo Unitário</Label>
              <Input type="number" min={0} step={0.01} value={unitCost || ""} onChange={(e) => setUnitCost(Number(e.target.value))} placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nome do fornecedor" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PurchaseStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PURCHASE_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!partId}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
