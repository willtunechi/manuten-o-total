import { useState } from "react";
import { Menu, Building2, LogOut, User, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { ChangePasswordDialog } from "@/components/dialogs/ChangePasswordDialog";
import watLogo from "@/assets/logo.png";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  mechanic: "Mecânico",
  operator: "Operador",
  planejador: "Planejador",
  supervisor_manutencao: "Supervisor Manutenção",
  supervisor_operacoes: "Supervisor Operações",
};

interface AppHeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const { session, userRole, signOut } = useAuth();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <img src={watLogo} alt="WAT" className="h-7 w-7 object-contain md:hidden" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4 hidden md:block" />
          <span className="font-medium text-foreground">Aplicativo de Manutenção</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium truncate">{session?.user?.email}</p>
                {userRole && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {ROLE_LABELS[userRole.role] || userRole.role}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
              <KeyRound className="h-4 w-4 mr-2" />
              Mudar Senha
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      </div>
    </header>
  );
}
