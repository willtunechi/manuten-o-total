import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Failure } from "@/data/types";

const schema = z.object({
  symptom: z.string().min(1, "Sintoma obrigatório"),
  probableCause: z.string().min(1, "Causa obrigatória"),
  recommendedAction: z.string().min(1, "Ação obrigatória"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  failure?: Failure;
  onSave: (data: Omit<Failure, "id">) => void;
}

export function FailureFormDialog({ open, onOpenChange, failure, onSave }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: failure
      ? {
          symptom: failure.symptom || failure.title || failure.description || "",
          probableCause: failure.probableCause || failure.rootCause || "",
          recommendedAction: failure.recommendedAction || failure.solution || "",
        }
      : { symptom: "", probableCause: "", recommendedAction: "" },
  });

  useEffect(() => {
    if (open) {
      reset(failure
        ? {
            symptom: failure.symptom || failure.title || failure.description || "",
            probableCause: failure.probableCause || failure.rootCause || "",
            recommendedAction: failure.recommendedAction || failure.solution || "",
          }
        : { symptom: "", probableCause: "", recommendedAction: "" }
      );
    }
  }, [failure, open, reset]);

  const onSubmit = (data: FormData) => {
    onSave({ symptom: data.symptom!, probableCause: data.probableCause!, recommendedAction: data.recommendedAction!, commonParts: failure?.commonParts || [] });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{failure ? "Editar Falha" : "Nova Falha"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Sintoma *</Label>
            <Input {...register("symptom")} />
            {errors.symptom && <p className="text-xs text-destructive">{errors.symptom.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Causa Provável *</Label>
            <Textarea {...register("probableCause")} rows={2} />
            {errors.probableCause && <p className="text-xs text-destructive">{errors.probableCause.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Ação Recomendada *</Label>
            <Textarea {...register("recommendedAction")} rows={2} />
            {errors.recommendedAction && <p className="text-xs text-destructive">{errors.recommendedAction.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{failure ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
