import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Search, History, Calendar, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ActivityLog {
  id: string;
  user_email: string;
  action: string;
  description: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  metadata: any;
}

const ITEMS_PER_PAGE = 20;

const Audit = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<string>("7");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    checkUserRole();
  }, [user]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLogs();

      const channel = supabase
        .channel('activity-log-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_log'
          },
          () => fetchLogs()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isSuperAdmin, filterDateRange, currentPage]);

  const checkUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    setIsSuperAdmin(data?.role === 'super_admin');
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const daysAgo = parseInt(filterDateRange);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from("activity_log")
        .select("*", { count: 'exact' })
        .gte("created_at", dateThreshold.toISOString())
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      toast.error("Erro ao carregar histórico de atividades");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: { [key: string]: any } = {
      create: { label: "Criação", className: "bg-green-100 text-green-800" },
      update: { label: "Edição", className: "bg-blue-100 text-blue-800" },
      delete: { label: "Exclusão", className: "bg-red-100 text-red-800" },
      login: { label: "Login", className: "bg-purple-100 text-purple-800" },
    };

    const variant = variants[action] || { label: action, className: "bg-gray-100 text-gray-800" };
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getEntityBadge = (entityType: string) => {
    const entityMap: { [key: string]: string } = {
      'profiles': 'Perfil',
      'user_roles': 'Role de Usuário',
      'reservations': 'Reserva',
      'payments': 'Pagamento',
      'contact_messages': 'Mensagem',
      'packages': 'Pacote',
    };

    const label = entityMap[entityType] || entityType;
    const variants: { [key: string]: any } = {
      'profiles': { className: "bg-indigo-100 text-indigo-800" },
      'user_roles': { className: "bg-purple-100 text-purple-800" },
      'reservations': { className: "bg-amber-100 text-amber-800" },
      'payments': { className: "bg-emerald-100 text-emerald-800" },
      'contact_messages': { className: "bg-cyan-100 text-cyan-800" },
      'packages': { className: "bg-orange-100 text-orange-800" },
    };

    const variant = variants[entityType] || { className: "bg-gray-100 text-gray-800" };
    return <Badge className={variant.className}>{label}</Badge>;
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesEntity = filterEntity === "all" || log.entity_type === filterEntity;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (!isSuperAdmin && !loading) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas super administradores podem visualizar o histórico de auditoria.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-forest flex items-center justify-center">
          <History className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">
            Histórico de Atividades
          </h1>
          <p className="text-muted-foreground">Auditoria completa de ações administrativas</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterDateRange} onValueChange={(value) => { setFilterDateRange(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Últimas 24 horas</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Edição</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="profiles">Perfis</SelectItem>
                <SelectItem value="user_roles">Roles</SelectItem>
                <SelectItem value="reservations">Reservas</SelectItem>
                <SelectItem value="payments">Pagamentos</SelectItem>
                <SelectItem value="contact_messages">Mensagens</SelectItem>
                <SelectItem value="packages">Pacotes</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchLogs}
              title="Atualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <strong>Retenção:</strong> Registros são automaticamente excluídos após 15 dias.
              </p>
            </div>
            <div className="text-sm font-medium">
              {filteredLogs.length} registros (Total: {totalCount})
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{log.user_email}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{getEntityBadge(log.entity_type)}</TableCell>
                      <TableCell className="max-w-md truncate">{log.description}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Audit;
