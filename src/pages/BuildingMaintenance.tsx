import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, MapPin, Clock, CheckCircle2, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { BuildingRequestDialog } from "@/components/forms/BuildingRequestDialog";
import { BuildingResolveDialog } from "@/components/forms/BuildingResolveDialog";

interface Request {
  id: string;
  code: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  requested_by: string | null;
  assigned_to: string | null;
  photo_url: string | null;
  resolution_notes: string | null;
  resolution_photo_url: string | null;
  actual_hours: number | null;
  created_at: string;
  started_at: string | null;
  resolved_at: string | null;
  sector_id: string | null;
  location_id: string | null;
  building_sectors?: { name: string } | null;
  building_locations?: { name: string } | null;
}

const PRIORITY_LABELS: Record<string, { label: string; cls: string }> = {
  low: { label: "Baixa", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  medium: { label: "Média", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  high: { label: "Alta", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  critical: { label: "Crítica", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendente", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  in_progress: { label: "Em Andamento", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  resolved: { label: "Resolvida", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

export default function BuildingMaintenance() {
  const { role, session } = useAuth();
  const canResolve = ["admin", "supervisor_manutencao", "supervisor_operacoes", "planejador", "mechanic"].includes(role || "");
  const userName = session?.user?.email?.split("@")[0] || "usuário";

  const [requests, setRequests] = useState<Request[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Request | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("building_maintenance_requests")
      .select("*, building_sectors(name), building_locations(name)")
      .order("created_at", { ascending: false });
    setRequests((data as Request[]) || []);
  };

  useEffect(() => { load(); }, []);

  const startWork = async (id: string) => {
    const { error } = await supabase.from("building_maintenance_requests").update({
      status: "in_progress",
      started_at: new Date().toISOString(),
      assigned_to: userName,
    }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Iniciado" });
    load();
  };

  const renderList = (items: Request[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((r) => {
        const prio = PRIORITY_LABELS[r.priority] || PRIORITY_LABELS.medium;
        const stat = STATUS_LABELS[r.status] || STATUS_LABELS.pending;
        return (
          <Card key={r.id} className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer group" onClick={() => setDetail(r)}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">MP-{String(r.code).padStart(4, "0")}</p>
                  <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{r.title}</h3>
                </div>
                <Badge variant="outline" className={prio.cls}>{prio.label}</Badge>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{r.building_sectors?.name || "-"}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.building_locations?.name || "-"}</span>
              </div>

              {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}

              {r.photo_url && (
                <img src={r.photo_url} alt="Foto" className="w-full h-32 object-cover rounded-md border border-border" />
              )}

              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className={stat.cls}>{stat.label}</Badge>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>

              {r.requested_by && <p className="text-xs text-muted-foreground">Solicitado por: <span className="text-foreground">{r.requested_by}</span></p>}
              {r.assigned_to && <p className="text-xs text-muted-foreground">Responsável: <span className="text-foreground">{r.assigned_to}</span></p>}

              {canResolve && r.status === "pending" && (
                <Button size="sm" className="w-full gap-1" onClick={(e) => { e.stopPropagation(); startWork(r.id); }}>
                  <PlayCircle className="h-4 w-4" /> Iniciar Atendimento
                </Button>
              )}
              {canResolve && r.status === "in_progress" && (
                <Button size="sm" variant="default" className="w-full gap-1" onClick={(e) => { e.stopPropagation(); setResolveId(r.id); }}>
                  <CheckCircle2 className="h-4 w-4" /> Resolver
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
      {items.length === 0 && (
        <p className="col-span-full text-center text-sm text-muted-foreground py-12">Nenhuma solicitação encontrada.</p>
      )}
    </div>
  );

  const pending = requests.filter((r) => r.status === "pending");
  const inProgress = requests.filter((r) => r.status === "in_progress");
  const resolved = requests.filter((r) => r.status === "resolved");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Manutenção Predial
          </h1>
          <p className="text-muted-foreground text-sm">Solicitações de manutenção das instalações</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Nova Solicitação
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pending.length})</TabsTrigger>
          <TabsTrigger value="in_progress">Em Andamento ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidas ({resolved.length})</TabsTrigger>
          <TabsTrigger value="all">Todas ({requests.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">{renderList(pending)}</TabsContent>
        <TabsContent value="in_progress" className="mt-4">{renderList(inProgress)}</TabsContent>
        <TabsContent value="resolved" className="mt-4">{renderList(resolved)}</TabsContent>
        <TabsContent value="all" className="mt-4">{renderList(requests)}</TabsContent>
      </Tabs>

      <BuildingRequestDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={load}
        reportedBy={userName}
      />
      <BuildingResolveDialog
        open={!!resolveId}
        onOpenChange={(o) => !o && setResolveId(null)}
        requestId={resolveId}
        onSaved={load}
        assignedTo={userName}
      />
    </div>
  );
}
