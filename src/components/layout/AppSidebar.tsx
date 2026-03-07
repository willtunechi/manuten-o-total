import {
  LayoutDashboard,
  Cog,
  ClipboardList,
  Package,
  Users,
  ShieldCheck,
  ChevronLeft,
  Factory,
  ShoppingCart,
  PackagePlus,
  ClipboardCheck,
  ListChecks,
  X,
  Droplets,
  FileBarChart,
} from "lucide-react";
import watLogo from "@/assets/logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

const allMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Relatórios", url: "/reports", icon: FileBarChart },
  { title: "Máquinas", url: "/machines", icon: Factory },
  { title: "Chamados", url: "/tickets", icon: ClipboardList },
  { title: "Preventivas", url: "/preventive-plans", icon: ShieldCheck },
  { title: "Checklists", url: "/checklists", icon: ListChecks },
  { title: "Lubrificação", url: "/lubrication", icon: Droplets },
  { title: "Colaboradores", url: "/collaborators", icon: Users },
  { title: "Estoque", url: "/inventory", icon: Package },
  { title: "Compras", url: "/purchases", icon: ShoppingCart },
  { title: "Entrada de Peças", url: "/stock-entries", icon: PackagePlus },
  { title: "Inventário", url: "/stock-count", icon: ClipboardCheck },
  { title: "Configurações", url: "/settings", icon: Cog },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { canAccessRoute } = useAuth();

  const menuItems = allMenuItems.filter((item) => canAccessRoute(item.url));

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
        )}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border flex flex-col transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center gap-2 px-3 h-14 border-b border-border">
            <img src={watLogo} alt="WAT" className="h-8 w-8 shrink-0 object-contain" />
            <span className="font-bold text-lg text-primary tracking-tight truncate">WAT</span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 text-muted-foreground"
              onClick={onMobileClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
              return (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.url === "/"}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-sidebar-foreground"
                  )}
                  activeClassName=""
                  onClick={onMobileClose}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                  <span className="truncate">{item.title}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar h-screen sticky top-0 transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center gap-2 px-3 h-14 border-b border-border">
        <img src={watLogo} alt="WAT" className="h-8 w-8 shrink-0 object-contain" />
        {!collapsed && (
          <span className="font-bold text-lg text-primary tracking-tight truncate">WAT</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onToggle}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-sidebar-foreground"
              )}
              activeClassName=""
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
