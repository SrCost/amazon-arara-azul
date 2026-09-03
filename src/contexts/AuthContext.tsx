import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { canAccessModule, type AdminRole } from '@/config/adminModules';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AdminRole;
  modulePermissions: Record<string, boolean> | null;
  permissionsLoading: boolean;
  hasModule: (moduleKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [role, setRole] = useState<AdminRole>('user');
  const navigate = useNavigate();
  const { permissions: modulePermissions, loading: permissionsLoading } = useModulePermissions(user?.id);


  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer role checking
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime listener for user_roles changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Re-check roles when changes are detected
          checkUserRole(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;

      const roles = data?.map((r) => r.role) || [];
      const superAdmin = roles.includes('super_admin');
      const admin = roles.includes('admin');
      setIsSuperAdmin(superAdmin);
      setIsAdmin(admin || superAdmin);
      setRole(superAdmin ? 'super_admin' : admin ? 'admin' : 'user');

    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      toast.success('Cadastro realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Check if user has a role in the system
      // All registered users should have at least 'user' role
      if (data.user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);
        
        // If no roles found, user may not be properly set up but allow login
        // The profile was created by the trigger, so user exists
        if (!roles || roles.length === 0) {
          console.warn('User has no role assigned, but allowing login');
        }
      }
      
      toast.success('Login realizado com sucesso!');
      
      // Wait for user role to be checked before redirecting
      setTimeout(() => {
        navigate('/admin');
      }, 500);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Primeiro tenta logout global
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        // Se falhar (ex: "Auth session missing"), faz logout local
        console.warn('Logout global falhou, usando local:', error.message);
        await supabase.auth.signOut({ scope: 'local' });
      }
      
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no logout:', error);
      // Fallback: limpar manualmente com scope local
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (e) {
        // Ignorar erro do fallback
      }
      toast.success('Logout realizado!');
    } finally {
      // SEMPRE limpar estado local e redirecionar
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setRole('user');
      navigate('/');


    }
  };

  const hasModule = (moduleKey: string) => canAccessModule(moduleKey, role, modulePermissions);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        isAdmin,
        isSuperAdmin,
        role,
        modulePermissions,
        permissionsLoading,
        hasModule,
      }}
    >

      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
