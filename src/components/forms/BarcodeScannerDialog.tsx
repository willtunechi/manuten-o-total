import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScanBarcode, X, CheckCircle2, ImageIcon, Keyboard } from "lucide-react";

export interface DanfeScanResult {
  accessKey: string;
  invoiceNumber: string;
  cnpj: string;
}

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: DanfeScanResult) => void;
}

/** Parses a 44-digit NF-e access key */
function parseAccessKey(raw: string): DanfeScanResult | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 44) return null;
  const cnpj = digits.slice(6, 20);
  const nNF = String(parseInt(digits.slice(25, 34), 10));
  return { accessKey: digits, invoiceNumber: nNF, cnpj };
}

function formatCnpj(cnpj: string) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function ResultCard({ scanned, onConfirm, onBack }: { scanned: DanfeScanResult; onConfirm: () => void; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-semibold text-sm">DANFE lido com sucesso!</span>
      </div>
      <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Número da NF</span>
          <Badge variant="secondary" className="font-mono text-base px-3">{scanned.invoiceNumber}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">CNPJ Emitente</span>
          <span className="font-mono font-medium">{formatCnpj(scanned.cnpj)}</span>
        </div>
        <div className="pt-1 border-t">
          <span className="text-muted-foreground text-xs">Chave de acesso</span>
          <p className="font-mono text-xs break-all text-foreground/70 mt-0.5">{scanned.accessKey}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <X className="h-4 w-4" /> Voltar
        </Button>
        <Button type="button" onClick={onConfirm}>
          <CheckCircle2 className="h-4 w-4" /> Usar estes dados
        </Button>
      </div>
    </div>
  );
}

// ── Tab 1: Camera ─────────────────────────────────────────────────────────────
function CameraTab({ onResult }: { onResult: (r: DanfeScanResult) => void }) {
  const scannerRef = useRef<InstanceType<typeof import("html5-qrcode")["Html5Qrcode"]> | null>(null);
  const startedRef = useRef(false);
  const [status, setStatus] = useState<"scanning" | "error">("scanning");
  const [errorMsg, setErrorMsg] = useState("");

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch (_) { /* ignore */ }
      scannerRef.current = null;
    }
  };

  const startScanner = async () => {
    setStatus("scanning");
    setErrorMsg("");
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("danfe-camera-scanner");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 340, height: 120 } },
        async (decodedText) => {
          const result = parseAccessKey(decodedText);
          if (result) {
            await stopScanner();
            onResult(result);
          }
        },
        () => { }
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Não foi possível acessar a câmera.");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      setTimeout(() => startScanner(), 300);
    }
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        Aponte a câmera para o código de barras do DANFE
      </p>
      <div id="danfe-camera-scanner" className="w-full rounded-lg overflow-hidden bg-muted min-h-[200px]" />
      {status === "error" && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          {errorMsg || "Erro ao acessar a câmera. Verifique as permissões."}
          <Button type="button" size="sm" className="mt-2 w-full" onClick={() => { startedRef.current = false; startScanner(); }}>
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Image upload ───────────────────────────────────────────────────────
function ImageTab({ onResult, onError }: { onResult: (r: DanfeScanResult) => void; onError: (msg: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setLocalError("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("danfe-image-scanner-tmp");
      const result = await scanner.scanFile(file, false);
      scanner.clear();
      const parsed = parseAccessKey(result);
      if (parsed) {
        onResult(parsed);
      } else {
        setLocalError("Código lido, mas não é uma chave NF-e válida (44 dígitos). Verifique a imagem.");
      }
    } catch {
      setLocalError("Não foi possível ler o código de barras da imagem. Tente uma foto mais nítida ou use outra opção.");
    } finally {
      setLoading(false);
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden scanner div required by html5-qrcode */}
      <div id="danfe-image-scanner-tmp" className="hidden" />

      <p className="text-sm text-muted-foreground text-center">
        Anexe uma foto do código de barras do DANFE
      </p>

      <label
        htmlFor="danfe-image-upload"
        className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/70 transition-colors"
      >
        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="text-sm font-medium text-muted-foreground">
          {loading ? "Processando…" : "Clique para selecionar a foto"}
        </span>
        <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP</span>
        <input
          id="danfe-image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
          disabled={loading}
        />
      </label>

      {localError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          {localError}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Manual typing ──────────────────────────────────────────────────────
function ManualTab({ onResult }: { onResult: (r: DanfeScanResult) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const parsed = parseAccessKey(value);
  const digits = value.replace(/\D/g, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed) {
      setError("A chave de acesso deve ter exatamente 44 dígitos numéricos.");
      return;
    }
    onResult(parsed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Digite ou cole a chave de acesso de 44 dígitos da NF-e
      </p>
      <div className="space-y-2">
        <Label htmlFor="danfe-manual-input">Chave de acesso (44 dígitos)</Label>
        <Input
          id="danfe-manual-input"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          placeholder="00000000000000000000000000000000000000000000"
          className="font-mono text-xs"
          maxLength={50}
          autoFocus
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{error && <span className="text-destructive">{error}</span>}</span>
          <span className={digits.length === 44 ? "text-primary font-medium" : ""}>{digits.length}/44</span>
        </div>
      </div>

      {parsed && (
        <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">NF nº</span>
            <Badge variant="secondary" className="font-mono">{parsed.invoiceNumber}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">CNPJ</span>
            <span className="font-mono text-xs">{formatCnpj(parsed.cnpj)}</span>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={digits.length !== 44}>
        <CheckCircle2 className="h-4 w-4" /> Confirmar chave
      </Button>
    </form>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────
export function BarcodeScannerDialog({ open, onOpenChange, onScan }: BarcodeScannerDialogProps) {
  const [scanned, setScanned] = useState<DanfeScanResult | null>(null);
  const [activeTab, setActiveTab] = useState("camera");

  useEffect(() => {
    if (!open) {
      setScanned(null);
      setActiveTab("camera");
    }
  }, [open]);

  const handleResult = (result: DanfeScanResult) => setScanned(result);

  const handleConfirm = () => {
    if (scanned) { onScan(scanned); onOpenChange(false); }
  };

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5 text-primary" />
            Identificar DANFE
          </DialogTitle>
        </DialogHeader>

        {scanned ? (
          <ResultCard
            scanned={scanned}
            onConfirm={handleConfirm}
            onBack={() => setScanned(null)}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="camera" className="gap-1.5 text-xs">
                <ScanBarcode className="h-3.5 w-3.5" /> Câmera
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-1.5 text-xs">
                <ImageIcon className="h-3.5 w-3.5" /> Imagem
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-1.5 text-xs">
                <Keyboard className="h-3.5 w-3.5" /> Digitar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="mt-4">
              {activeTab === "camera" && open && !scanned && (
                <CameraTab onResult={handleResult} />
              )}
            </TabsContent>

            <TabsContent value="image" className="mt-4">
              <ImageTab onResult={handleResult} onError={() => {}} />
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <ManualTab onResult={handleResult} />
            </TabsContent>
          </Tabs>
        )}

        {!scanned && (
          <div className="flex justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" /> Cancelar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
