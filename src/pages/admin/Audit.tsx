import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const Audit = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    // Setup realtime updates
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
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
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
    const variants: { [key: string]: any } = {
      user: { label: "Usuário", className: "bg-indigo-100 text-indigo-800" },
      reservation: { label: "Reserva", className: "bg-amber-100 text-amber-800" },
      payment: { label: "Pagamento", className: "bg-emerald-100 text-emerald-800" },
      message: { label: "Mensagem", className: "bg-cyan-100 text-cyan-800" },
    };

    const variant = variants[entityType] || { label: entityType, className: "bg-gray-100 text-gray-800" };
    return <Badge className={variant.className}>{variant.label}</Badge>;
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
                <SelectItem value="user">Usuários</SelectItem>
                <SelectItem value="reservation">Reservas</SelectItem>
                <SelectItem value="payment">Pagamentos</SelectItem>
                <SelectItem value="message">Mensagens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Retenção de dados:</strong> Os registros são automaticamente excluídos após 15 dias para otimização de armazenamento. 
              Total de registros atuais: <strong>{logs.length}</strong>
            </p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Audit;
