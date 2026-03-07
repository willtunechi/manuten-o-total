import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingCart } from "lucide-react";
import { PurchaseFormDialog } from "@/components/forms/PurchaseFormDialog";
import { DeleteConfirmDialog } from "@/components/forms/DeleteConfirmDialog";
import { PURCHASE_STATUS_LABELS, type PurchaseOrder, type PurchaseStatus } from "@/data/types";

const statusColors: Record<PurchaseStatus, string> = {
  searching_suppliers: "bg-muted text-muted-foreground",
  quoting: "bg-chart-5/20 text-[hsl(var(--chart-5))]",
  ordered: "bg-primary/20 text-primary",
  awaiting_delivery: "bg-chart-3/20 text-[hsl(var(--chart-3))]",
  received: "bg-chart-2/20 text-[hsl(var(--chart-2))]",
};

export default function Purchases() {
  const { purchaseOrders, removePurchaseOrder, parts } = useData();
  const [filter, setFilter] = useState<string>("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<PurchaseOrder | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = purchaseOrders.filter((po) => {
    if (filter === "active") return po.status !== "received";
    if (filter === "all") return true;
    return po.status === filter;
  });

  const getPartSku = (partId: string) => parts.find((p) => p.id === partId)?.sku || "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" /> Compras
          </h1>
          <p className="text-muted-foreground text-sm">Gerencie pedidos de compra de peças</p>
        </div>
        <Button onClick={() => { setEditData(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Pedido
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Em andamento</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(PURCHASE_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Peça</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</TableCell>
                </TableRow>
              ) : (
                filtered.map((po) => (
                  <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setEditData(po); setFormOpen(true); }}>
                    <TableCell className="font-mono text-xs">{getPartSku(po.partId)}</TableCell>
                    <TableCell>{po.partDescription}</TableCell>
                    <TableCell>{po.supplier || "—"}</TableCell>
                    <TableCell className="text-center">{po.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[po.status]}>
                        {PURCHASE_STATUS_LABELS[po.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">R$ {po.totalCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(po.id); }}>
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PurchaseFormDialog open={formOpen} onOpenChange={setFormOpen} editData={editData} />
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) removePurchaseOrder(deleteId); setDeleteId(null); }}
        title="Excluir pedido de compra?"
      />
    </div>
  );
}
