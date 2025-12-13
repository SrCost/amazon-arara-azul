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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Mail, Trash2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  created_at: string;
}

const Messages = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchMessages();

    // Setup realtime updates
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_messages'
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (message: Message) => {
    setSelectedMessage(message);
    setIsViewDialogOpen(true);
    
    // Mark as read when viewing
    if (message.status === 'new') {
      handleUpdateStatus(message.id, 'read');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      fetchMessages();
    } catch (error) {
      console.error("Error updating message status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return;

    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Mensagem excluída com sucesso!");
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Erro ao excluir mensagem");
    }
  };

  const handleContactEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleContactWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Olá ${name}! Nós da Pousada Arara Azul recebemos sua mensagem e gostaríamos de esclarecer suas dúvidas.`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      new: { label: "Nova", className: "bg-green-100 text-green-800" },
      read: { label: "Lida", className: "bg-blue-100 text-blue-800" },
      replied: { label: "Respondida", className: "bg-gray-100 text-gray-800" },
    };

    const variant = variants[status] || variants.new;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filteredMessages = messages.filter(
    (msg) =>
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
          {t("admin.messages")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">Gerencie todas as mensagens de contato</p>
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
                  <TableHead className="whitespace-nowrap hidden md:table-cell">{t("contact.phone")}</TableHead>
                  <TableHead className="whitespace-nowrap hidden lg:table-cell">{t("contact.message")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("admin.status")}</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">Data</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">{message.name}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{message.email}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">{message.phone || "N/A"}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs sm:text-sm hidden lg:table-cell">{message.message}</TableCell>
                    <TableCell>
                      <Select 
                        value={message.status} 
                        onValueChange={(value) => handleUpdateStatus(message.id, value)}
                      >
                        <SelectTrigger className="w-24 sm:w-32 text-xs sm:text-sm">
                          <SelectValue>{getStatusBadge(message.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Nova</SelectItem>
                          <SelectItem value="read">Lida</SelectItem>
                          <SelectItem value="replied">Respondida</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{new Date(message.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1 sm:space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleView(message)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleContactEmail(message.email)}
                          title="Responder por e-mail"
                          className="hidden sm:flex"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        {message.phone && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleContactWhatsApp(message.phone!, message.name)}
                            title="Responder por WhatsApp"
                            className="hidden sm:flex"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDelete(message.id)}
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Mensagem</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{selectedMessage.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{selectedMessage.email}</p>
              </div>
              {selectedMessage.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedMessage.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">{new Date(selectedMessage.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mensagem</p>
                <p className="font-medium whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
