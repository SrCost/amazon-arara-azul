import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { canAccessModule, type AdminRole } from "@/config/adminModules";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
  /** Module key from src/config/adminModules.ts */
  module?: string;
}

export const ProtectedRoute = ({ children, requiredRole, module }: ProtectedRouteProps) => {
  const { user, loading, modulePermissions, permissionsLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        setUserRole(data?.role || 'user');
      } catch (error) {
        console.error("Error checking user role:", error);
        toast.error("Erro ao verificar permissões");
      } finally {
        setChecking(false);
      }
    };

    checkRole();
  }, [user]);

  if (loading || checking || (user && permissionsLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    toast.error("Você precisa estar autenticado para acessar esta página");
    return <Navigate to="/auth" replace />;
  }

  const effectiveRole = (userRole as AdminRole) || 'user';

  // Check role permissions with proper hierarchy
  if (requiredRole) {
    const roleHierarchy = {
      'user': 1,
      'admin': 2,
      'super_admin': 3
    };

    const userRoleLevel = roleHierarchy[effectiveRole as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    // Allow access if user role level is equal or higher than required
    if (userRoleLevel < requiredRoleLevel) {
      toast.error("Acesso restrito. Você não tem permissão para acessar esta página.");
      return <Navigate to="/admin" replace />;
    }
  }

  // Check per-module permission (module "dashboard" is never blocked to avoid redirect loops)
  if (module && module !== "dashboard" && !canAccessModule(module, effectiveRole, modulePermissions)) {
    toast.error("Acesso restrito. Este módulo não está habilitado para o seu usuário.");
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
