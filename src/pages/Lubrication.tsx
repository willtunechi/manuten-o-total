import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, Plus, Pencil, Eye, Tag, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { useConfig } from "@/contexts/ConfigContext";
import type { LubricationPlan } from "@/data/types";

export default function Lubrication() {
  const { machines, components } = useData();
  const { lubricationPlans, addLubricationPlan, updateLubricationPlan, removeLubricationPlan } = useConfig();

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [viewPlan, setViewPlan] = useState<LubricationPlan | undefined>();
  const [editPlan, setEditPlan] = useState<LubricationPlan | undefined>();

  // Form state for new/edit
  const [formAssetKind, setFormAssetKind] = useState<"machine" | "component">("machine");
  const [formAssetId, setFormAssetId] = useState("");
  const [formWhat, setFormWhat] = useState("");
  const [formLubricant, setFormLubricant] = useState("");
  const [formAttention, setFormAttention] = useState("RUIDOS - VAZAMENTOS");
  const [formFrequency, setFormFrequency] = useState("90");
  const [formDueDate, setFormDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  const machineOptions = machines.map((m) => ({ id: m.id, label: `${m.tag} - ${m.model}` })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { numeric: true }));
  const componentOptions = components.map((c) => ({ id: c.id, label: `${c.tag} - ${c.name}` })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { numeric: true }));
  const assetOptions = formAssetKind === "machine" ? machineOptions : componentOptions;

  // Group plans by asset (machine)
  const grouped = machines
    .map((machine) => ({
      machine,
      plans: lubricationPlans.filter((p) => p.assetKind === "machine" && p.assetId === machine.id),
    }))
    .filter((g) => g.plans.length > 0);

  // Component plans (grouped under a generic section)
  const componentPlans = lubricationPlans.filter((p) => p.assetKind === "component");

  const resetForm = () => {
    setFormAssetKind("machine");
    setFormAssetId("");
    setFormWhat("");
    setFormLubricant("");
    setFormAttention("RUIDOS - VAZAMENTOS");
    setFormFrequency("90");
    setFormDueDate(new Date().toISOString().slice(0, 10));
  };

  const openNew = () => {
    resetForm();
    setNewDialogOpen(true);
  };

  const openEdit = (plan: LubricationPlan) => {
    setFormAssetKind(plan.assetKind as "machine" | "component");
    setFormAssetId(plan.assetId);
    setFormWhat(plan.whatToLubricate);
    setFormLubricant(plan.lubricantType);
    setFormAttention(plan.attentionPoints);
    setFormFrequency(String(plan.frequencyDays));
    setFormDueDate(plan.nextDueDate);
    setEditPlan(plan);
  };

  const saveNew = () => {
    if (!formAssetId || !formWhat.trim() || !formLubricant.trim()) return;
    addLubricationPlan({
      assetId: formAssetId,
      assetKind: formAssetKind,
      whatToLubricate: formWhat.trim(),
      lubricantType: formLubricant.trim(),
      attentionPoints: formAttention.trim() || "RUIDOS - VAZAMENTOS",
      frequencyDays: Math.max(1, Number(formFrequency) || 90),
      nextDueDate: formDueDate,
    });
    setNewDialogOpen(false);
  };

  const saveEdit = () => {
    if (!editPlan) return;
    updateLubricationPlan(editPlan.id, {
      whatToLubricate: formWhat.trim(),
      lubricantType: formLubricant.trim(),
      attentionPoints: formAttention.trim(),
      frequencyDays: Math.max(1, Number(formFrequency) || 90),
      nextDueDate: formDueDate,
      active: editPlan.active,
    });
    setEditPlan(undefined);
  };

  const PlanCard = ({ plan }: { plan: LubricationPlan }) => (
    <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="font-medium text-sm">{plan.whatToLubricate}</span>
        </div>
        <Badge variant={plan.active ? "default" : "secondary"} className="text-xs shrink-0">
          {plan.active ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        Lubrificante: {plan.lubricantType} · Frequência: {plan.frequencyDays} dias · Atenção: {plan.attentionPoints}
      </p>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>Próxima: {new Date(`${plan.nextDueDate}T00:00:00`).toLocaleDateString("pt-BR")}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => setViewPlan(plan)}>
          <Eye className="h-3 w-3" /> Consultar
        </Button>
        <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => openEdit(plan)}>
          <Pencil className="h-3 w-3" /> Editar
        </Button>
        <Button size="sm" variant="outline" className="gap-1 h-7 text-xs text-destructive" onClick={() => removeLubricationPlan(plan.id)}>
          <Trash2 className="h-3 w-3" /> Excluir
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Planos de Lubrificação</h1>
          <p className="text-muted-foreground text-sm">Gerencie os planos de lubrificação/engraxamento por ativo.</p>
        </div>
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo Plano
        </Button>
      </div>

      <div className="space-y-4">
        {grouped.map(({ machine, plans }) => (
          <Card key={machine.id} className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold">{machine.tag}</span>
                <span className="text-muted-foreground text-sm">— {machine.model}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {plans.length} plano{plans.length > 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="space-y-2">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {componentPlans.length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold">Componentes</span>
              </div>
              <div className="space-y-2">
                {componentPlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {grouped.length === 0 && componentPlans.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Droplets className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum plano de lubrificação cadastrado.</p>
          </div>
        )}
      </div>

      {/* New plan dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Plano de Lubrificação</DialogTitle></DialogHeader>
          <LubricationFormFields
            formAssetKind={formAssetKind} setFormAssetKind={setFormAssetKind}
            formAssetId={formAssetId} setFormAssetId={setFormAssetId}
            assetOptions={assetOptions}
            formWhat={formWhat} setFormWhat={setFormWhat}
            formLubricant={formLubricant} setFormLubricant={setFormLubricant}
            formAttention={formAttention} setFormAttention={setFormAttention}
            formFrequency={formFrequency} setFormFrequency={setFormFrequency}
            formDueDate={formDueDate} setFormDueDate={setFormDueDate}
            disableAsset={false}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveNew}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit plan dialog */}
      <Dialog open={!!editPlan} onOpenChange={(open) => !open && setEditPlan(undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Plano de Lubrificação</DialogTitle></DialogHeader>
          <LubricationFormFields
            formAssetKind={formAssetKind} setFormAssetKind={setFormAssetKind}
            formAssetId={formAssetId} setFormAssetId={setFormAssetId}
            assetOptions={assetOptions}
            formWhat={formWhat} setFormWhat={setFormWhat}
            formLubricant={formLubricant} setFormLubricant={setFormLubricant}
            formAttention={formAttention} setFormAttention={setFormAttention}
            formFrequency={formFrequency} setFormFrequency={setFormFrequency}
            formDueDate={formDueDate} setFormDueDate={setFormDueDate}
            disableAsset
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlan(undefined)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View plan dialog */}
      <Dialog open={!!viewPlan} onOpenChange={(open) => { if (!open) { setViewPlan(undefined); } else if (viewPlan) { setFormAssetKind(viewPlan.assetKind as "machine" | "component"); setFormAssetId(viewPlan.assetId); setFormWhat(viewPlan.whatToLubricate); setFormLubricant(viewPlan.lubricantType); setFormAttention(viewPlan.attentionPoints); setFormFrequency(String(viewPlan.frequencyDays)); setFormDueDate(viewPlan.nextDueDate); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Consultar Plano de Lubrificação</DialogTitle></DialogHeader>
          <LubricationFormFields
            formAssetKind={formAssetKind} setFormAssetKind={setFormAssetKind}
            formAssetId={formAssetId} setFormAssetId={setFormAssetId}
            assetOptions={assetOptions}
            formWhat={formWhat} setFormWhat={setFormWhat}
            formLubricant={formLubricant} setFormLubricant={setFormLubricant}
            formAttention={formAttention} setFormAttention={setFormAttention}
            formFrequency={formFrequency} setFormFrequency={setFormFrequency}
            formDueDate={formDueDate} setFormDueDate={setFormDueDate}
            disableAsset
            readOnly
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPlan(undefined)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
