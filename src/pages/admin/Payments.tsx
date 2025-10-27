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
import { Search, Eye, Download, CreditCard } from "lucide-react";

const Payments = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const payments = [
    {
      id: "PAY-001",
      reservation: "RSV-001",
      guest: "João Silva",
      amount: "R$ 3.400",
      method: "Cartão de Crédito",
      status: "completed",
      date: "2025-10-20",
    },
    {
      id: "PAY-002",
      reservation: "RSV-002",
      guest: "Maria Santos",
      amount: "R$ 3.600",
      method: "PIX",
      status: "pending",
      date: "2025-10-22",
    },
    {
      id: "PAY-003",
      reservation: "RSV-003",
      guest: "Pedro Costa",
      amount: "R$ 4.750",
      method: "PayPal",
      status: "completed",
      date: "2025-10-18",
    },
    {
      id: "PAY-004",
      reservation: "RSV-004",
      guest: "Ana Lima",
      amount: "R$ 6.000",
      method: "Cartão de Crédito",
      status: "refunded",
      date: "2025-10-15",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      completed: { label: t("admin.completed"), className: "bg-green-100 text-green-800" },
      pending: { label: t("admin.pending"), className: "bg-yellow-100 text-yellow-800" },
      refunded: { label: "Reembolsado", className: "bg-blue-100 text-blue-800" },
      failed: { label: "Falhou", className: "bg-red-100 text-red-800" },
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCompleted = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + parseFloat(p.amount.replace(/[^\d,]/g, "").replace(",", ".")), 0);

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + parseFloat(p.amount.replace(/[^\d,]/g, "").replace(",", ".")), 0);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Pagamentos
        </h1>
        <p className="text-muted-foreground">Gerencie transações e pagamentos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Recebido</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {totalCompleted.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("admin.pendingPayments")}</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {totalPending.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Transações</p>
                <p className="text-2xl font-bold text-foreground">{payments.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por hóspede ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Reserva</TableHead>
                  <TableHead>Hóspede</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>{t("reservation.paymentMethod")}</TableHead>
                  <TableHead>{t("admin.status")}</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{payment.reservation}</TableCell>
                    <TableCell>{payment.guest}</TableCell>
                    <TableCell className="font-medium">{payment.amount}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
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

export default Payments;
