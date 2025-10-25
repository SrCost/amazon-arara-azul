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
import { Search, Eye, Mail, Trash2 } from "lucide-react";

const Messages = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const messages = [
    {
      id: "MSG-001",
      name: "Carlos Ferreira",
      email: "carlos@email.com",
      phone: "+55 11 98765-4321",
      message: "Gostaria de saber sobre disponibilidade para dezembro...",
      status: "new",
      date: "2025-10-25",
    },
    {
      id: "MSG-002",
      name: "Juliana Oliveira",
      email: "juliana@email.com",
      phone: "+55 21 98765-1234",
      message: "Preciso de informações sobre transfer do aeroporto...",
      status: "read",
      date: "2025-10-24",
    },
    {
      id: "MSG-003",
      name: "Roberto Alves",
      email: "roberto@email.com",
      phone: "+55 31 98765-5678",
      message: "Vocês aceitam grupos de 10 pessoas?",
      status: "replied",
      date: "2025-10-23",
    },
  ];

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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {t("admin.messages")}
        </h1>
        <p className="text-muted-foreground">Gerencie todas as mensagens de contato</p>
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
                  <TableHead>{t("contact.phone")}</TableHead>
                  <TableHead>{t("contact.message")}</TableHead>
                  <TableHead>{t("admin.status")}</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium">{message.id}</TableCell>
                    <TableCell>{message.name}</TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell>{message.phone}</TableCell>
                    <TableCell className="max-w-xs truncate">{message.message}</TableCell>
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell>{new Date(message.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Mail className="h-4 w-4" />
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

export default Messages;
