import { useTranslation } from "react-i18next";
import { useState } from "react";
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
import { Search, Edit, Trash2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Users = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const users = [
    {
      id: "USR-001",
      name: "João Silva",
      email: "joao@email.com",
      role: "user",
      status: "active",
      created: "2025-01-15",
    },
    {
      id: "USR-002",
      name: "Maria Santos",
      email: "maria@email.com",
      role: "admin",
      status: "active",
      created: "2025-02-10",
    },
    {
      id: "USR-003",
      name: "Pedro Costa",
      email: "pedro@email.com",
      role: "user",
      status: "inactive",
      created: "2025-03-05",
    },
  ];

  const getRoleBadge = (role: string) => {
    const variants: { [key: string]: any } = {
      super_admin: { label: t("admin.superAdmin"), className: "bg-purple-100 text-purple-800" },
      admin: { label: t("admin.admin"), className: "bg-blue-100 text-blue-800" },
      user: { label: t("admin.user"), className: "bg-gray-100 text-gray-800" },
    };

    const variant = variants[role] || variants.user;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t("admin.users")}
          </h1>
          <p className="text-muted-foreground">Gerencie usuários e permissões</p>
        </div>
        <Dialog>
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
                <Input placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>{t("contact.email")}</Label>
                <Input type="email" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.role")}</Label>
                <Select>
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
                <Input type="password" placeholder="••••••••" />
              </div>
              <Button className="w-full bg-gradient-forest">Criar Usuário</Button>
            </div>
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
                  <TableHead>ID</TableHead>
                  <TableHead>{t("contact.name")}</TableHead>
                  <TableHead>{t("contact.email")}</TableHead>
                  <TableHead>{t("admin.role")}</TableHead>
                  <TableHead>{t("admin.status")}</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{new Date(user.created).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
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
