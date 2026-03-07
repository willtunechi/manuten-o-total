import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, PackagePlus, ScanBarcode } from "lucide-react";
import { StockEntryFormDialog } from "@/components/forms/StockEntryFormDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function StockEntries() {
  const { stockEntries, parts, purchaseOrders } = useData();
  const [formOpen, setFormOpen] = useState(false);

  const getPartInfo = (partId: string) => {
    const p = parts.find((x) => x.id === partId);
    return p ? `${p.sku} - ${p.description}` : partId;
  };

  const getPOInfo = (poId?: string) => {
    if (!poId) return "—";
    const po = purchaseOrders.find((x) => x.id === poId);
    return po ? `${po.supplier} (${po.quantity}un)` : poId;
  };

  const sorted = [...stockEntries].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-primary" /> Entrada de Peças
          </h1>
          <p className="text-muted-foreground text-sm">Registre entradas de peças no estoque</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Entrada
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Peça</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Pedido Vinculado</TableHead>
                <TableHead>Nota Fiscal</TableHead>
                <TableHead>NF-e</TableHead>
                <TableHead>Obs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma entrada registrada</TableCell>
                </TableRow>
              ) : (
                sorted.map((se) => (
                  <TableRow key={se.id}>
                    <TableCell className="text-sm">{new Date(se.entryDate).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{getPartInfo(se.partId)}</TableCell>
                    <TableCell className="text-center font-medium">{se.quantity}</TableCell>
                    <TableCell className="text-sm">{getPOInfo(se.purchaseOrderId)}</TableCell>
                    <TableCell className="text-sm">{se.invoiceNumber || "—"}</TableCell>
                    <TableCell>
                      {se.nfeAccessKey ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="gap-1 cursor-default">
                                <ScanBarcode className="h-3 w-3" />
                                {se.nfeAccessKey.slice(-8)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs font-mono text-xs break-all">
                              {se.nfeAccessKey}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{se.notes || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StockEntryFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
