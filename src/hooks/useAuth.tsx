import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type AppRole =
  | "admin"
  | "mechanic"
  | "operator"
  | "planejador"
  | "supervisor_manutencao"
  | "supervisor_operacoes";

const SUPERVISOR_ROLES: AppRole[] = [
  "supervisor_manutencao",
  "supervisor_operacoes",
];

interface UserRole {
  role: AppRole;
  must_change_password: boolean;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setUserRole(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    supabase
      .from("user_roles")
      .select("role, must_change_password")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setUserRole({
            role: data.role as AppRole,
            must_change_password: data.must_change_password,
          });
        } else {
          setUserRole(null);
        }
        setRoleLoading(false);
      });
  }, [session?.user?.id]);

  const signOut = () => supabase.auth.signOut();

  const role = userRole?.role;
  const isAdmin = role === "admin";
  const isSupervisor = SUPERVISOR_ROLES.includes(role as AppRole);
  const canManageUsers = isAdmin || isSupervisor;
  const mustChangePassword = userRole?.must_change_password ?? false;

  // Supervisors can create users below them (operator, mechanic)
  const creatableRoles: { value: string; label: string }[] = (() => {
    if (isAdmin) {
      return [
        { value: "operator", label: "Operador" },
        { value: "mechanic", label: "Mecânico" },
        { value: "planejador", label: "Planejador" },
        { value: "supervisor_manutencao", label: "Supervisor Manutenção" },
        { value: "supervisor_operacoes", label: "Supervisor Operações" },
      ];
    }
    if (isSupervisor) {
      return [
        { value: "operator", label: "Operador" },
        { value: "mechanic", label: "Mecânico" },
      ];
    }
    return [];
  })();

  // Route access control
  const canAccessRoute = (path: string): boolean => {
    if (isAdmin || isSupervisor) return true;

    const match = (routes: string[]) =>
      routes.some((r) => path === r || (r !== "/" && path.startsWith(r)));

    if (role === "logistica") {
      return match(["/", "/inventory", "/purchases", "/stock-entries", "/stock-count", "/registrations"]);
    }

    if (role === "mechanic") {
      return match(["/", "/machines", "/components", "/tickets", "/preventive-plans", "/checklists", "/lubrication", "/inventory"]);
    }

    if (role === "operator") {
      return match(["/machines", "/components", "/tickets"]);
    }

    return false;
  };

  return {
    session,
    loading: loading || roleLoading,
    userRole,
    role,
    isAdmin,
    isSupervisor,
    canManageUsers,
    mustChangePassword,
    creatableRoles,
    canAccessRoute,
    signOut,
  };
}
