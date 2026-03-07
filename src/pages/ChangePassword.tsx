import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      await supabase.rpc("clear_must_change_password");

      toast({ title: "Senha alterada com sucesso!" });
      // Force reload to re-evaluate auth state
      window.location.href = "/";
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={logo} alt="Logo" className="h-16 mx-auto mb-2" />
          <CardTitle>Trocar Senha</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Você precisa definir uma nova senha antes de continuar.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : "Definir nova senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
