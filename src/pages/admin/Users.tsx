import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Trash2, UserPlus, Shield, SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  ADMIN_MODULES,
  DEFAULT_ENABLED_MODULES,
  ROLE_HIERARCHY,
  type AdminRole,
} from "@/config/adminModules";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  created_at: string;
}

const Users = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<(UserProfile & { role: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<(UserProfile & { role: string }) | null>(null);
  const [permissionsDraft, setPermissionsDraft] = useState<Record<string, boolean>>({});
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "user" as AdminRole,
  });
  const [newUserModules, setNewUserModules] = useState<Record<string, boolean>>(
    Object.fromEntries(ADMIN_MODULES.map((m) => [m.key, DEFAULT_ENABLED_MODULES.includes(m.key)])),
  );


  useEffect(() => {
    checkUserRole();
    fetchUsers();
  }, []);

  const checkUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const isSuper = data?.role === 'super_admin';
    setIsSuperAdmin(isSuper);

    console.log("User role checked:", { userId: user.id, role: data?.role, isSuperAdmin: isSuper });
  };

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'user'
        };
      }) || [];

      setUsers(usersWithRoles);

      // Setup realtime updates for both profiles and user_roles
      const profilesChannel = supabase
        .channel('profiles-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          () => fetchUsers()
        )
        .subscribe();

      const rolesChannel = supabase
        .channel('user-roles-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_roles'
          },
          () => {
            console.log('Role changed - refreshing users list');
            fetchUsers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profilesChannel);
        supabase.removeChannel(rolesChannel);
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!isSuperAdmin) {
      toast.error("Apenas super administradores podem criar usuários");
      return;
    }

    // Validate input
    if (!newUser.email || !newUser.password || !newUser.full_name || !newUser.role) {
      toast.error("Todos os campos são obrigatórios");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      // Call Edge Function to create user with service role
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          role: newUser.role,
          modules: Object.entries(newUserModules)
            .filter(([, enabled]) => enabled)
            .map(([key]) => key),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar usuário');
      }

      toast.success("Usuário criado com sucesso!");
      setIsAddDialogOpen(false);
      setNewUser({ email: "", password: "", full_name: "", role: "user" });
      setNewUserModules(
        Object.fromEntries(ADMIN_MODULES.map((m) => [m.key, DEFAULT_ENABLED_MODULES.includes(m.key)])),
      );
      fetchUsers();

      
      console.log("User created successfully:", result.user);
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Erro ao criar usuário");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'super_admin' | 'admin' | 'user') => {
    // SECURITY: Only super_admin can update roles
    if (!isSuperAdmin) {
      toast.error("Apenas Super Administradores podem alterar funções de usuários");
      return;
    }

    // Prevent changing own role
    if (userId === user?.id) {
      toast.error("Você não pode alterar sua própria função");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Função atualizada com sucesso. O usuário terá novas permissões na próxima ação.");
      
      // Force immediate refresh to show the change
      await fetchUsers();
      
      console.log("Role updated:", { userId, newRole, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erro ao atualizar função");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isSuperAdmin) {
      toast.error("Apenas super administradores podem excluir usuários");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      // Call Edge Function to delete user with service role
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao excluir usuário');
      }

      toast.success("Usuário excluído com sucesso!");
      fetchUsers();
      
      console.log("User deleted successfully:", { userId });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Erro ao excluir usuário");
    }
  };

  const openPermissions = async (target: UserProfile & { role: string }) => {
    setPermissionsUser(target);
    try {
      const { data, error } = await supabase
        .from("user_module_permissions")
        .select("module, enabled")
        .eq("user_id", target.id);

      if (error) throw error;

      const saved = new Map((data || []).map((r) => [r.module, r.enabled]));
      const draft: Record<string, boolean> = {};
      ADMIN_MODULES.forEach((m) => {
        draft[m.key] = saved.size === 0
          ? ROLE_HIERARCHY[target.role as AdminRole] >= ROLE_HIERARCHY[m.minRole]
          : saved.get(m.key) === true;
      });
      setPermissionsDraft(draft);
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast.error("Erro ao carregar permissões");
    }
  };

  const savePermissions = async () => {
    if (!permissionsUser) return;
    setSavingPermissions(true);
    try {
      const rows = ADMIN_MODULES.map((m) => ({
        user_id: permissionsUser.id,
        module: m.key,
        enabled: permissionsDraft[m.key] === true,
      }));

      const { error } = await supabase
        .from("user_module_permissions")
        .upsert(rows, { onConflict: "user_id,module" });

      if (error) throw error;

      toast.success("Permissões salvas com sucesso!");
      setPermissionsUser(null);
    } catch (error: any) {
      console.error("Error saving permissions:", error);
      toast.error(error.message || "Erro ao salvar permissões");
    } finally {
      setSavingPermissions(false);
    }
  };


  const getRoleBadge = (role: string) => {
    const variants: { [key: string]: any } = {
      super_admin: { label: t("admin.superAdmin"), className: "bg-purple-100 text-purple-800" },
      admin: { label: t("admin.admin"), className: "bg-blue-100 text-blue-800" },
      user: { label: t("admin.user"), className: "bg-gray-100 text-gray-800" },
    };

    const variant = variants[role] || variants.user;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas super administradores podem gerenciar usuários.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
            {t("admin.users")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">Gerencie usuários e permissões</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-forest w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              {t("admin.addUser")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("admin.addUser")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm">{t("contact.name")}</Label>
                <Input 
                  placeholder="Nome completo" 
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("contact.email")}</Label>
                <Input 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("admin.role")}</Label>
                <Select 
                  value={newUser.role}
                  onValueChange={(value: any) => setNewUser({...newUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t("admin.user")}</SelectItem>
                    <SelectItem value="admin">{t("admin.admin")}</SelectItem>
                    <SelectItem value="super_admin">{t("admin.superAdmin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("auth.password")}</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <Label className="text-sm">Módulos de acesso</Label>
                  <p className="text-xs text-muted-foreground">
                    Habilite os módulos que este usuário poderá acessar.
                  </p>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {ADMIN_MODULES.map((m) => {
                    const blockedByRole =
                      newUser.role !== "super_admin" &&
                      ROLE_HIERARCHY[newUser.role] < ROLE_HIERARCHY[m.minRole];
                    const forced = newUser.role === "super_admin";
                    return (
                      <div key={m.key} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm truncate">{m.label}</p>
                          {blockedByRole && (
                            <p className="text-[11px] text-muted-foreground">
                              Requer cargo {m.minRole === "admin" ? "Admin" : "Super Admin"}
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={forced ? true : newUserModules[m.key] && !blockedByRole}
                          disabled={forced || blockedByRole}
                          onCheckedChange={(checked) =>
                            setNewUserModules((prev) => ({ ...prev, [m.key]: checked }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
              <Button onClick={handleCreateUser} className="bg-gradient-forest w-full sm:w-auto">Criar Usuário</Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">{t("contact.name")}</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">{t("contact.email")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("admin.role")}</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">Data de Cadastro</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">{user.full_name || "N/A"}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <Select 
                        value={user.role}
                        onValueChange={(value: any) => handleUpdateRole(user.id, value)}
                      >
                        <SelectTrigger className="w-28 sm:w-40 text-xs sm:text-sm">
                          <SelectValue>{getRoleBadge(user.role)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openPermissions(user)}
                          title="Módulos de acesso"
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!permissionsUser} onOpenChange={(open) => !open && setPermissionsUser(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Módulos de acesso</DialogTitle>
            <DialogDescription>
              {permissionsUser?.full_name || permissionsUser?.email}
              {permissionsUser?.role === "super_admin" && " — super administradores têm acesso a tudo."}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 py-2 pr-1">
            {ADMIN_MODULES.map((m) => {
              const role = (permissionsUser?.role as AdminRole) || "user";
              const forced = role === "super_admin";
              const blockedByRole = !forced && ROLE_HIERARCHY[role] < ROLE_HIERARCHY[m.minRole];
              return (
                <div key={m.key} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{m.label}</p>
                    {blockedByRole && (
                      <p className="text-[11px] text-muted-foreground">
                        Requer cargo {m.minRole === "admin" ? "Admin" : "Super Admin"}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={forced ? true : permissionsDraft[m.key] === true && !blockedByRole}
                    disabled={forced || blockedByRole}
                    onCheckedChange={(checked) =>
                      setPermissionsDraft((prev) => ({ ...prev, [m.key]: checked }))
                    }
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPermissionsUser(null)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={savePermissions}
              disabled={savingPermissions || permissionsUser?.role === "super_admin"}
              className="bg-gradient-forest w-full sm:w-auto"
            >
              {savingPermissions ? "Salvando..." : "Salvar permissões"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
};

export default Users;
