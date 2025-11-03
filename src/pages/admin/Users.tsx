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
import { Search, Edit, Trash2, UserPlus, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'user';
}

const Users = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<(UserProfile & { role: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile & { role: string } | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "user" as 'super_admin' | 'admin' | 'user',
  });

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
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar usuário');
      }

      // Log activity
      await supabase.from("activity_log").insert([{
        user_id: user?.id || null,
        user_email: user?.email || "unknown",
        action: "create",
        description: `Usuário ${newUser.full_name} (${newUser.email}) criado com função ${newUser.role}`,
        entity_type: "user",
        metadata: { role: newUser.role, email: newUser.email }
      }]);

      toast.success("Usuário criado com sucesso!");
      setIsAddDialogOpen(false);
      setNewUser({ email: "", password: "", full_name: "", role: "user" });
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

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      // Log activity
      const targetUser = users.find(u => u.id === userId);
      await supabase.from("activity_log").insert([{
        user_id: user?.id || null,
        user_email: user?.email || "unknown",
        action: "update",
        description: `Função de ${targetUser?.full_name || "usuário"} alterada para ${newRole}`,
        entity_type: "user",
        entity_id: userId,
        metadata: { new_role: newRole }
      }]);

      toast.success("Função atualizada com sucesso");
      fetchUsers();
      console.log("Role updated:", { userId, newRole });
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

      // Log activity
      const targetUser = users.find(u => u.id === userId);
      await supabase.from("activity_log").insert([{
        user_id: user?.id || null,
        user_email: user?.email || "unknown",
        action: "delete",
        description: `Usuário ${targetUser?.full_name || "N/A"} (${targetUser?.email || "N/A"}) excluído`,
        entity_type: "user",
        entity_id: userId,
        metadata: { deleted_email: targetUser?.email }
      }]);

      toast.success("Usuário excluído com sucesso!");
      fetchUsers();
      
      console.log("User deleted successfully:", { userId });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Erro ao excluir usuário");
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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t("admin.users")}
          </h1>
          <p className="text-muted-foreground">Gerencie usuários e permissões</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-forest">
              <UserPlus className="h-4 w-4 mr-2" />
              {t("admin.addUser")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.addUser")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("contact.name")}</Label>
                <Input 
                  placeholder="Nome completo" 
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("contact.email")}</Label>
                <Input 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.role")}</Label>
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
                <Label>{t("auth.password")}</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} className="bg-gradient-forest">Criar Usuário</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("contact.name")}</TableHead>
                  <TableHead>{t("contact.email")}</TableHead>
                  <TableHead>{t("admin.role")}</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select 
                        value={user.role}
                        onValueChange={(value: any) => handleUpdateRole(user.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue>{getRoleBadge(user.role)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
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
    </div>
  );
};

export default Users;
