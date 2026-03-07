import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { BarcodeScannerDialog, type DanfeScanResult } from "./BarcodeScannerDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  ScanBarcode, CheckCircle2, FileText, AlertCircle,
  Loader2, CloudDownload, PackagePlus, RefreshCw, X
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ── NF-e types ────────────────────────────────────────────────────────────────
interface NFeItem {
  nItem: string;
  cProd: string;
  xProd: string;
  qCom: number;
  uCom: string;
  vUnCom: number;
  vProd: number;
  vDesc: number;   // desconto por item
  vFrete: number;  // frete por item
}

interface NFeData {
  nNF: string;
  cnpjEmit: string;
  xNome: string;
  dhEmi: string;
  natOp: string;
  items: NFeItem[];
  vNF: number;
  chNFe?: string;
}

// ── XML parser ────────────────────────────────────────────────────────────────
function parseNFeXml(xmlText: string): NFeData | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");

    const getText = (parent: Element | Document, tag: string) =>
      parent.querySelector(tag)?.textContent?.trim() ?? "";
    const getNum = (parent: Element | Document, tag: string) =>
      parseFloat(getText(parent, tag).replace(",", ".") || "0");

    const nNF = getText(doc, "nNF");
    const cnpjEmit = getText(doc, "emit CNPJ");
    const xNome = getText(doc, "emit xNome");
    const dhEmi = getText(doc, "dhEmi") || getText(doc, "dEmi");
    const natOp = getText(doc, "natOp");
    const vNF = getNum(doc, "ICMSTot vNF") || getNum(doc, "vNF");
    const chNFe = getText(doc, "chNFe") || undefined;

    const detElements = doc.querySelectorAll("det");
    if (!nNF && detElements.length === 0) return null;

    const items: NFeItem[] = Array.from(detElements).map((det) => {
      const prod = det.querySelector("prod");
      if (!prod) return null;
      return {
        nItem: det.getAttribute("nItem") ?? "",
        cProd: getText(prod, "cProd"),
        xProd: getText(prod, "xProd"),
        qCom: getNum(prod, "qCom"),
        uCom: getText(prod, "uCom"),
        vUnCom: getNum(prod, "vUnCom"),
        vProd: getNum(prod, "vProd"),
        vDesc: getNum(prod, "vDesc"),
        vFrete: getNum(prod, "vFrete"),
      };
    }).filter(Boolean) as NFeItem[];

    return { nNF, cnpjEmit, xNome, dhEmi, natOp, items, vNF, chNFe };
  } catch {
    return null;
  }
}

function formatCnpj(cnpj: string) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(dhEmi: string) {
  if (!dhEmi) return "";
  const d = new Date(dhEmi);
  return isNaN(d.getTime()) ? dhEmi : d.toLocaleDateString("pt-BR");
}

// ── Item result type ──────────────────────────────────────────────────────────
interface ItemResult {
  item: NFeItem;
  partId: string;
  partSku: string;
  partDescription: string;
  isNew: boolean; // created automatically
}

// ── Main component ────────────────────────────────────────────────────────────
export function StockEntryFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { parts, addPartSync, addStockEntry } = useData();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceXml, setInvoiceXml] = useState("");
  const [nfeAccessKey, setNfeAccessKey] = useState("");
  const [scannedCnpj, setScannedCnpj] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [nfeData, setNfeData] = useState<NFeData | null>(null);
  const [fetchingXml, setFetchingXml] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);
  const [itemResults, setItemResults] = useState<ItemResult[]>([]);
  const [processed, setProcessed] = useState(false);

  const resetForm = () => {
    setInvoiceNumber("");
    setInvoiceXml("");
    setNfeAccessKey("");
    setScannedCnpj("");
    setNfeData(null);
    setFetchingXml(false);
    setFetchStatus(null);
    setItemResults([]);
    setProcessed(false);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  // ── Match or create a part for each NF-e item ─────────────────────────────
  const processItems = useCallback((nfe: NFeData, xmlText: string, chave?: string): ItemResult[] => {
    return nfe.items.map((item) => {
      // Try match by SKU (cProd) or description substring
      const match = parts.find(
        (p) =>
          p.sku?.toLowerCase() === item.cProd?.toLowerCase() ||
          p.description?.toLowerCase().includes(item.xProd?.toLowerCase().slice(0, 15))
      );

      if (match) {
        return {
          item,
          partId: match.id,
          partSku: match.sku || match.description,
          partDescription: match.description,
          isNew: false,
        };
      }

      // Create new part automatically
      const newPart = addPartSync({
        sku: item.cProd,
        description: item.xProd,
        unit: item.uCom || "un",
        quantity: 0,
        minStock: 0,
        unitCost: item.vUnCom,
        location: "",
        supplier: nfe.xNome || "",
      });

      return {
        item,
        partId: newPart.id,
        partSku: newPart.sku || item.cProd,
        partDescription: newPart.description,
        isNew: true,
      };
    });
  }, [parts, addPartSync]);

  const applyXml = useCallback((text: string, fromChave?: string) => {
    setInvoiceXml(text);
    const parsed = parseNFeXml(text);
    if (!parsed) {
      toast.warning("XML carregado, mas não foi possível extrair os itens.");
      return;
    }
    setNfeData(parsed);
    if (parsed.nNF) setInvoiceNumber(parsed.nNF);
    if (parsed.cnpjEmit) setScannedCnpj(parsed.cnpjEmit);
    if (fromChave || parsed.chNFe) setNfeAccessKey(fromChave ?? parsed.chNFe ?? "");

    const results = processItems(parsed, text, fromChave);
    setItemResults(results);
    setProcessed(false);

    const newCount = results.filter((r) => r.isNew).length;
    toast.success(
      `NF-e ${parsed.nNF} — ${parsed.items.length} item(s) carregado(s)${newCount > 0 ? `, ${newCount} peça(s) nova(s) criada(s)` : ""}`
    );
  }, [processItems]);

  // ── Fetch XML via API ──────────────────────────────────────────────────────
  const fetchXmlFromApi = useCallback(async (chave: string) => {
    setFetchingXml(true);
    setFetchStatus("Buscando XML na Receita Federal...");
    try {
      const { data, error } = await supabase.functions.invoke("nfe-fetch", {
        body: { chave, action: "fetch" },
      });
      if (error) throw new Error(error.message);
      console.log("[nfe-fetch] response:", { status: data?.status, httpStatus: data?.httpStatus, xml: data?.xml ? "[presente]" : null });

      if (data?.status === "OK" && data?.xml) {
        setFetchStatus(null);
        applyXml(data.xml, chave);
      } else if (data?.status === "NOT_FOUND") {
        setFetchStatus(null);
        toast.error("NF-e não encontrada na base da Receita Federal.");
      } else if (data?.status === "ERROR") {
        setFetchStatus(null);
        toast.error("Falha ao consultar a NF-e. Tente importar o XML manualmente.");
      } else {
        const label = data?.status ?? "AGUARDANDO";
        setFetchStatus(`Status: ${label}. Tente novamente em instantes.`);
        toast.warning("A NF-e ainda está sendo processada. Aguarde e tente novamente.");
      }
    } catch (err) {
      setFetchStatus(null);
      toast.error(`Erro ao buscar XML: ${String(err)}`);
    } finally {
      setFetchingXml(false);
    }
  }, [applyXml]);

  const handleXmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => applyXml(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleScan = (result: DanfeScanResult) => {
    setInvoiceNumber(result.invoiceNumber);
    setNfeAccessKey(result.accessKey);
    setScannedCnpj(result.cnpj);
    fetchXmlFromApi(result.accessKey);
  };

  // ── Submit: create one stock entry per item ───────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemResults.length === 0) return;

    itemResults.forEach((r) => {
      addStockEntry({
        partId: r.partId,
        quantity: Math.ceil(r.item.qCom),
        invoiceNumber: invoiceNumber || undefined,
        invoiceXml: invoiceXml || undefined,
        nfeAccessKey: nfeAccessKey || undefined,
        entryDate: new Date().toISOString(),
        notes: [
          r.item.xProd,
          r.item.vDesc > 0 ? `Desc: ${formatCurrency(r.item.vDesc)}` : "",
          r.item.vFrete > 0 ? `Frete: ${formatCurrency(r.item.vFrete)}` : "",
        ].filter(Boolean).join(" | "),
      });
    });
    setProcessed(true);
    toast.success(`${itemResults.length} entrada(s) registrada(s) com sucesso!`);
    onOpenChange(false);
  };

  const hasDanfeInfo = !!(nfeAccessKey || nfeData || fetchingXml);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Entrada de Estoque via NF-e</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Step 1: Identify NF-e ── */}
            {!hasDanfeInfo ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Identificar Nota Fiscal</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 border-dashed h-14 flex-col text-xs"
                    onClick={() => setScannerOpen(true)}
                  >
                    <ScanBarcode className="h-4 w-4 text-primary" />
                    Escanear / Digitar Chave
                  </Button>
                  <Label
                    htmlFor="xml-upload-btn"
                    className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border rounded-md h-14 cursor-pointer hover:bg-muted/50 transition-colors text-xs text-muted-foreground"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    Importar XML da NF-e
                    <input id="xml-upload-btn" type="file" accept=".xml" className="hidden" onChange={handleXmlUpload} />
                  </Label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Fetching */}
                {fetchingXml && (
                  <div className="rounded-lg border bg-muted/50 p-4 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Buscando XML na Receita Federal...</p>
                      <p className="text-xs text-muted-foreground">{fetchStatus ?? "Aguarde alguns segundos."}</p>
                    </div>
                  </div>
                )}

                {/* Key found, no XML yet */}
                {nfeAccessKey && !nfeData && !fetchingXml && (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        NF nº <Badge variant="secondary" className="font-mono">{invoiceNumber}</Badge>
                        {scannedCnpj && <span className="text-xs text-muted-foreground ml-1">CNPJ: {formatCnpj(scannedCnpj)}</span>}
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {fetchStatus && <p className="text-xs text-muted-foreground">{fetchStatus}</p>}
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => fetchXmlFromApi(nfeAccessKey)}>
                        <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
                      </Button>
                      <Label htmlFor="xml-after-scan" className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed cursor-pointer hover:bg-muted/50 transition-colors text-xs text-muted-foreground px-2 py-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        Importar XML
                        <input id="xml-after-scan" type="file" accept=".xml" className="hidden" onChange={handleXmlUpload} />
                      </Label>
                    </div>
                  </div>
                )}

                {/* ── Items table ── */}
                {nfeData && itemResults.length > 0 && (
                  <div className="space-y-2">
                    {/* NF header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <FileText className="h-4 w-4" />
                        NF-e {nfeData.nNF} — {nfeData.xNome || formatCnpj(nfeData.cnpjEmit)}
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={resetForm}>
                        <X className="h-3 w-3" /> Limpar
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4">
                      {nfeData.dhEmi && <span>Emissão: {formatDate(nfeData.dhEmi)}</span>}
                      {nfeData.natOp && <span>Natureza: {nfeData.natOp}</span>}
                      <span className="font-medium text-foreground">Total: {formatCurrency(nfeData.vNF)}</span>
                    </div>

                    {/* Items grid */}
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">Cód.</th>
                            <th className="text-left px-3 py-2 font-medium">Descrição</th>
                            <th className="text-center px-2 py-2 font-medium">UN</th>
                            <th className="text-right px-2 py-2 font-medium">Qtd</th>
                            <th className="text-right px-2 py-2 font-medium">Vl. Unit</th>
                            <th className="text-right px-2 py-2 font-medium">Total</th>
                            <th className="text-right px-2 py-2 font-medium">Desc.</th>
                            <th className="text-right px-2 py-2 font-medium">Frete</th>
                            <th className="text-center px-2 py-2 font-medium">Peça</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {itemResults.map((r) => (
                            <tr key={r.item.nItem} className="hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-2 font-mono text-muted-foreground">{r.item.cProd}</td>
                              <td className="px-3 py-2 max-w-[180px]">
                                <p className="truncate font-medium">{r.item.xProd}</p>
                                <p className="text-muted-foreground truncate">{r.partDescription !== r.item.xProd ? r.partDescription : ""}</p>
                              </td>
                              <td className="px-2 py-2 text-center text-muted-foreground">{r.item.uCom}</td>
                              <td className="px-2 py-2 text-right font-medium">{r.item.qCom}</td>
                              <td className="px-2 py-2 text-right">{formatCurrency(r.item.vUnCom)}</td>
                              <td className="px-2 py-2 text-right font-medium">{formatCurrency(r.item.vProd)}</td>
                              <td className="px-2 py-2 text-right text-muted-foreground">
                                {r.item.vDesc > 0 ? formatCurrency(r.item.vDesc) : "—"}
                              </td>
                              <td className="px-2 py-2 text-right text-muted-foreground">
                                {r.item.vFrete > 0 ? formatCurrency(r.item.vFrete) : "—"}
                              </td>
                              <td className="px-2 py-2 text-center">
                                {r.isNew ? (
                                  <Badge variant="secondary" className="gap-1 text-[10px]">
                                    <PackagePlus className="h-2.5 w-2.5" /> Nova
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-primary border-primary/40">
                                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> {r.partSku}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {itemResults.some((r) => r.isNew) && (
                      <div className="flex items-center gap-1.5 text-xs text-warning bg-muted rounded-md px-3 py-1.5 border border-border">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-warning" />
                        {itemResults.filter(r => r.isNew).length} peça(s) nova(s) serão criadas automaticamente no catálogo.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Manual NF number (always visible) ── */}
            <div className="space-y-1">
              <Label className="text-sm">Número da Nota</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Preenchido automaticamente" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button
                type="submit"
                disabled={itemResults.length === 0 || processed}
                className="gap-2"
              >
                <PackagePlus className="h-4 w-4" />
                Registrar {itemResults.length > 0 ? `${itemResults.length} item(s)` : "Entrada"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={handleScan} />
    </>
  );
}
