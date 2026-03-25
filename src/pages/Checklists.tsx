import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle2, Calendar, Plus, Pencil, Eye, Tag, Copy } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import type { MaintenancePlan } from "@/data/types";
import { MaintenancePlanEditorDialog } from "@/components/forms/MaintenancePlanEditorDialog";
import { CopyPlanDialog } from "@/components/forms/CopyPlanDialog";
import { toast } from "@/hooks/use-toast";

export default function Checklists() {
  const { maintenancePlans, planExecutions, mechanics, machines, addMaintenancePlan, updateMaintenancePlan } = useData();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewPlan, setViewPlan] = useState<MaintenancePlan | undefined>();
  const [editPlan, setEditPlan] = useState<MaintenancePlan | undefined>();
  const [copyPlan, setCopyPlan] = useState<MaintenancePlan | undefined>();

  const checklists = maintenancePlans.filter((plan) => plan.planType === "checklist");

  // Agrupar por máquina — suporta machineIds (múltiplas) ou machineId (legado)
  const grouped = machines.map((machine) => ({
    machine,
    plans: checklists.filter((p) => {
      const ids = p.machineIds ?? (p.machineId ? [p.machineId] : []);
      return ids.includes(machine.id);
    }),
  })).filter((g) => g.plans.length > 0);

  // Planos sem máquina vinculada (genéricos)
  const genericPlans = checklists.filter((p) => {
    const ids = p.machineIds ?? (p.machineId ? [p.machineId] : []);
    return ids.length === 0;
  });

  const getCompletedExecutions = (planId: string) =>
    planExecutions.filter((execution) => execution.planId === planId && execution.status === "completed");

  const PlanCard = ({ plan }: { plan: MaintenancePlan }) => {
    const completedExecs = getCompletedExecutions(plan.id);
    return (
      <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-sm">{plan.name}</span>
          </div>
          <Badge variant={plan.active ? "default" : "secondary"} className="text-xs shrink-0">
            {plan.active ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">{plan.items.length} itens para verificar</p>

        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => setViewPlan(plan)}>
            <Eye className="h-3 w-3" /> Consultar
          </Button>
          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => setEditPlan(plan)}>
            <Pencil className="h-3 w-3" /> Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs"
            onClick={() =>
              setEditPlan({
                ...plan,
                items: [
                  ...plan.items,
                  {
                    id: `item-${Date.now()}`,
                    description: "",
                    inspectionType: "",
                    attentionPoints: "",
                    frequencyDays: 1,
                    observation: "",
                    responsible: "manutencao",
                  },
                ],
              })
            }
          >
            <Plus className="h-3 w-3" /> Adicionar item
          </Button>
        </div>

        {completedExecs.length > 0 ? (
          <div className="space-y-1 pt-1 border-t border-border">
            <h4 className="text-xs font-medium text-muted-foreground">Últimas execuções</h4>
            {completedExecs.slice(0, 3).map((execution) => {
              const itemsDone = execution.itemResults.filter((result) => result.completed).length;
              const mechanicIds = [...new Set(execution.itemResults.map((result) => result.mechanicId).filter(Boolean))];
              const mechanicNames = mechanicIds.map((id) => mechanics.find((m) => m.id === id)?.name).filter(Boolean);
              return (
                <div key={execution.id} className="flex items-center gap-2 text-xs bg-muted/30 rounded p-1.5">
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                  <span>{execution.completedAt ? new Date(execution.completedAt).toLocaleDateString("pt-BR") : "-"}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{itemsDone}/{plan.items.length} itens</span>
                  {mechanicNames.length > 0 && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground truncate">{mechanicNames.join(", ")}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Nenhuma execução registrada</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Checklists Diários</h1>
          <p className="text-muted-foreground text-sm">Checklists individuais por máquina.</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Criar outro
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
                <Badge variant="outline" className="text-xs ml-auto">{plans.length} checklist{plans.length > 1 ? "s" : ""}</Badge>
              </div>
              <div className="space-y-2">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {genericPlans.length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold">Genéricos (sem máquina vinculada)</span>
              </div>
              <div className="space-y-2">
                {genericPlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {grouped.length === 0 && genericPlans.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum checklist cadastrado.</p>
          </div>
        )}
      </div>

      <MaintenancePlanEditorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        planType="checklist"
        title="Novo Checklist"
        onSave={(data) => addMaintenancePlan(data)}
      />

      <MaintenancePlanEditorDialog
        open={!!editPlan}
        onOpenChange={(open) => !open && setEditPlan(undefined)}
        planType="checklist"
        plan={editPlan}
        title="Editar Checklist"
        onSave={(data) => {
          if (!editPlan) return;
          updateMaintenancePlan(editPlan.id, data);
          setEditPlan(undefined);
        }}
      />

      <MaintenancePlanEditorDialog
        open={!!viewPlan}
        onOpenChange={(open) => !open && setViewPlan(undefined)}
        planType="checklist"
        plan={viewPlan}
        readOnly
        title="Consultar Checklist"
        onSave={() => {}}
      />
    </div>
  );
}
