import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
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

  if (loading || checking) {
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

  // Check role permissions with proper hierarchy
  if (requiredRole) {
    const roleHierarchy = {
      'user': 1,
      'admin': 2,
      'super_admin': 3
    };

    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    // Allow access if user role level is equal or higher than required
    if (userRoleLevel < requiredRoleLevel) {
      toast.error("Acesso restrito. Você não tem permissão para acessar esta página.");
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};
