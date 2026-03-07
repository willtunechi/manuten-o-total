import { LayoutDashboard, ClipboardList, Factory, Package, Droplets } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

const allPrimaryItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Máquinas", url: "/machines", icon: Factory },
  { title: "Chamados", url: "/tickets", icon: ClipboardList },
  { title: "Lubrificação", url: "/lubrication", icon: Droplets },
  { title: "Estoque", url: "/inventory", icon: Package },
];

export function MobileNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { canAccessRoute } = useAuth();

  if (!isMobile) return null;

  const primaryItems = allPrimaryItems.filter((item) => canAccessRoute(item.url));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {primaryItems.map((item) => {
          const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium min-w-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              activeClassName=""
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
