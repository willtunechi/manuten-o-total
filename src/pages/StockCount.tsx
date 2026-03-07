import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StockCount() {
  const { parts, inventoryCounts, addInventoryCount } = useData();
  const [counts, setCounts] = useState<Record<string, string>>({});

  const sortedParts = [...parts].sort((a, b) => {
    const aQty = a.quantity ?? a.stock ?? 0;
    const bQty = b.quantity ?? b.stock ?? 0;
    if (aQty > 0 && bQty === 0) return -1;
    if (aQty === 0 && bQty > 0) return 1;
    const aDescription = a.description || a.name || "";
    const bDescription = b.description || b.name || "";
    return aDescription.localeCompare(bDescription);
  });

  const handleCount = (partId: string, value: string) => {
    setCounts((prev) => ({ ...prev, [partId]: value }));
  };

  const registerCount = (partId: string) => {
    const counted = Number(counts[partId]);
    if (isNaN(counted) || counted < 0) return;
    const part = parts.find((p) => p.id === partId);
    if (!part) return;
    const expectedQty = part.quantity ?? part.stock ?? 0;
    addInventoryCount({
      partId,
      expectedQuantity: expectedQty,
      countedQuantity: counted,
      difference: counted - expectedQty,
      registeredAt: new Date().toISOString(),
      countedBy: "Operador",
      notes: "",
    });
    setCounts((prev) => { const n = { ...prev }; delete n[partId]; return n; });
  };

  const registerAll = () => {
    Object.entries(counts).forEach(([partId, val]) => {
      const counted = Number(val);
      if (isNaN(counted) || counted < 0) return;
      const part = parts.find((p) => p.id === partId);
      if (!part) return;
      const expectedQty = part.quantity ?? part.stock ?? 0;
      addInventoryCount({
        partId,
        expectedQuantity: expectedQty,
        countedQuantity: counted,
        difference: counted - expectedQty,
        registeredAt: new Date().toISOString(),
        countedBy: "Operador",
        notes: "",
      });
    });
    setCounts({});
  };

  const hasAnyCounts = Object.keys(counts).length > 0;
  const recentCounts = [...inventoryCounts].sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()).slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Inventário
          </h1>
          <p className="text-muted-foreground text-sm">Contagem física e ajuste de estoque</p>
        </div>
        {hasAnyCounts && (
          <Button onClick={registerAll}>
            <CheckCircle className="h-4 w-4 mr-2" /> Registrar Todas
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Estoque Sistema</TableHead>
                <TableHead className="text-center">Contagem Real</TableHead>
                <TableHead className="text-center">Diferença</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedParts.map((part) => {
                const partQty = part.quantity ?? part.stock ?? 0;
                const partSku = part.sku || part.code || part.id;
                const partDescription = part.description || part.name || "-";
                const val = counts[part.id];
                const counted = val !== undefined && val !== "" ? Number(val) : null;
                const diff = counted !== null ? counted - partQty : null;
                return (
                  <TableRow key={part.id}>
                    <TableCell className="font-mono text-xs">{partSku}</TableCell>
                    <TableCell>{partDescription}</TableCell>
                    <TableCell className="text-center">{partQty}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={0}
                        className="w-20 mx-auto text-center h-8"
                        value={val ?? ""}
                        onChange={(e) => handleCount(part.id, e.target.value)}
                        placeholder="—"
                      />
                    </TableCell>
                    <TableCell className={cn("text-center font-medium", diff !== null && diff < 0 && "text-destructive", diff !== null && diff > 0 && "text-[hsl(var(--chart-2))]")}>
                      {diff !== null ? (diff > 0 ? `+${diff}` : diff) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" disabled={counted === null} onClick={() => registerCount(part.id)}>
                        Registrar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {recentCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Contagens</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Peça</TableHead>
                  <TableHead className="text-center">Esperado</TableHead>
                  <TableHead className="text-center">Contado</TableHead>
                  <TableHead className="text-center">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCounts.map((c) => {
                  const part = parts.find((p) => p.id === c.partId);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{new Date(c.registeredAt).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{part?.description || c.partId}</TableCell>
                      <TableCell className="text-center">{c.expectedQuantity}</TableCell>
                      <TableCell className="text-center">{c.countedQuantity}</TableCell>
                      <TableCell className={cn("text-center font-medium", c.difference < 0 && "text-destructive", c.difference > 0 && "text-[hsl(var(--chart-2))]")}>
                        {c.difference > 0 ? `+${c.difference}` : c.difference}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
