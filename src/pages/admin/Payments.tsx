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
import { Search, Eye, Download, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Payment {
  id: string;
  reservation_id: string;
  amount: number;
  total_amount?: number;
  paid_amount?: number;
  payment_method: string;
  status: string;
  status_detail?: string;
  transaction_id?: string;
  mercado_pago_payment_id?: string;
  payer_email?: string;
  payer_cpf?: string;
  payment_date: string;
  created_at: string;
  updated_at?: string;
  reservations?: {
    guest_name: string;
    guest_email: string;
    room_name?: string;
    check_in?: string;
    check_out?: string;
  };
}

const Payments = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPayments();

    // Setup realtime updates
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        () => fetchPayments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage]);

  const fetchPayments = async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await supabase
        .from("payments")
        .select(`
          *,
          reservations (
            guest_name,
            guest_email,
            room_name,
            check_in,
            check_out
          )
        `, { count: 'exact' })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setPayments(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Erro ao carregar pagamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      // Update payment status - trigger will automatically sync with reservations
      const { error: updateError } = await supabase
        .from("payments")
        .update({ status: newStatus })
        .eq("id", paymentId);

      if (updateError) throw updateError;

      // FUTURE INTEGRATION POINT - BANCO CAIXA:
      // When integrating with Banco Caixa API, add the following call here:
      // await fetch('/api/banco-caixa/update-payment', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     payment_id: paymentId,
      //     reservation_id: payment.reservation_id,
      //     status: newStatus,
      //     amount: payment.amount,
      //     date: new Date().toISOString()
      //   })
      // });
      //
      // Expected API Response Format:
      // {
      //   success: boolean,
      //   transaction_id: string,
      //   bank_reference: string,
      //   status: 'paid' | 'pending' | 'failed' | 'refunded',
      //   updated_at: string
      // }

      toast.success("Status de pagamento atualizado com sucesso.");
      fetchPayments();
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Erro ao atualizar status do pagamento");
    }
  };

  const handleDownloadReceipt = (payment: Payment) => {
    // FUTURE IMPLEMENTATION: Generate PDF receipt
    // This will require a PDF generation library like jsPDF or pdfmake
    // Example implementation:
    // import jsPDF from 'jspdf';
    // const doc = new jsPDF();
    // doc.text(`Comprovante de Pagamento - Pousada Arara Azul`, 20, 20);
    // doc.text(`Reserva: ${payment.reservations?.guest_name}`, 20, 30);
    // doc.text(`Valor: R$ ${payment.amount}`, 20, 40);
    // doc.text(`Data: ${new Date(payment.created_at).toLocaleString()}`, 20, 50);
    // doc.save(`comprovante-${payment.id}.pdf`);
    
    toast.info("Funcionalidade de download em desenvolvimento");
    console.log("Receipt download requested for payment:", payment.id);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      completed: { label: "Concluído", className: "bg-green-500 text-white" },
      approved: { label: "Aprovado", className: "bg-green-500 text-white" },
      aprovado: { label: "Aprovado", className: "bg-green-500 text-white" },
      paid: { label: "Pago", className: "bg-green-500 text-white" },
      pending: { label: "Pendente", className: "bg-yellow-500 text-white" },
      pendente: { label: "Pendente", className: "bg-yellow-500 text-white" },
      in_process: { label: "Processando", className: "bg-blue-500 text-white" },
      refunded: { label: "Reembolsado", className: "bg-blue-100 text-blue-800" },
      failed: { label: "Falhou", className: "bg-red-500 text-white" },
      rejected: { label: "Rejeitado", className: "bg-red-500 text-white" },
      rejeitado: { label: "Rejeitado", className: "bg-red-500 text-white" },
    };

    const variant = variants[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filteredPayments = payments.filter(
    (payment) => {
      const guestName = payment.reservations?.guest_name || "";
      const guestEmail = payment.reservations?.guest_email || "";
      return (
        guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  );

  const totalCompleted = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
          Pagamentos
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">Gerencie transações e pagamentos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Recebido</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  R$ {totalCompleted.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t("admin.pendingPayments")}</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  R$ {totalPending.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total de Transações</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{payments.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por hóspede ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Hóspede</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">Bangalô</TableHead>
                  <TableHead className="whitespace-nowrap">Valor</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">{t("reservation.paymentMethod")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("admin.status")}</TableHead>
                  <TableHead className="whitespace-nowrap hidden lg:table-cell">ID Transação</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">Data</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {payment.reservations?.guest_name || "N/A"}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">{payment.reservations?.room_name || "N/A"}</TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">R$ {Number(payment.amount || payment.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs hidden sm:table-cell">
                      {payment.payment_method === 'pix' ? 'PIX' : 
                       payment.payment_method === 'credit_card' ? 'Cartão' : 
                       payment.payment_method || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={payment.status}
                        onValueChange={(value) => handleUpdateStatus(payment.id, value)}
                      >
                        <SelectTrigger className="w-24 sm:w-32 text-xs sm:text-sm">
                          <SelectValue>{getStatusBadge(payment.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="approved">Aprovado</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="failed">Falhou</SelectItem>
                          <SelectItem value="refunded">Reembolsado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="font-mono text-xs hidden lg:table-cell">
                      {payment.transaction_id || payment.mercado_pago_payment_id 
                        ? (payment.transaction_id || payment.mercado_pago_payment_id)?.slice(0, 10) + '...'
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1 sm:space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleView(payment)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDownloadReceipt(payment)}
                          title="Baixar comprovante"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalCount > itemsPerPage && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-{Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} pagamentos
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm px-2">
                  Página {currentPage} de {Math.ceil(totalCount / itemsPerPage)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / itemsPerPage), p + 1))} 
                  disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hóspede</p>
                  <p className="font-medium">{selectedPayment.reservations?.guest_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium text-sm">{selectedPayment.reservations?.guest_email || selectedPayment.payer_email || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bangalô</p>
                  <p className="font-medium">{selectedPayment.reservations?.room_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-medium text-sm">
                    {selectedPayment.reservations?.check_in && selectedPayment.reservations?.check_out
                      ? `${new Date(selectedPayment.reservations.check_in).toLocaleDateString('pt-BR')} - ${new Date(selectedPayment.reservations.check_out).toLocaleDateString('pt-BR')}`
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-medium text-lg">R$ {Number(selectedPayment.total_amount || selectedPayment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Pago</p>
                    <p className="font-medium text-lg text-green-600">R$ {Number(selectedPayment.paid_amount || selectedPayment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Método</p>
                  <p className="font-medium">
                    {selectedPayment.payment_method === 'pix' ? 'PIX' : 
                     selectedPayment.payment_method === 'credit_card' ? 'Cartão de Crédito' : 
                     selectedPayment.payment_method || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>

              {selectedPayment.status_detail && (
                <div>
                  <p className="text-sm text-muted-foreground">Status Técnico</p>
                  <p className="font-mono text-xs bg-muted p-2 rounded">{selectedPayment.status_detail}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID Transação (MP)</p>
                  <p className="font-mono text-xs">{selectedPayment.transaction_id || selectedPayment.mercado_pago_payment_id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID Reserva</p>
                  <p className="font-mono text-xs">{selectedPayment.reservation_id?.slice(0, 8)}...</p>
                </div>
              </div>

              {selectedPayment.payer_cpf && (
                <div>
                  <p className="text-sm text-muted-foreground">CPF Pagador</p>
                  <p className="font-mono text-sm">***.***.***-{selectedPayment.payer_cpf.slice(-2)}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium text-sm">{new Date(selectedPayment.created_at).toLocaleString('pt-BR')}</p>
                </div>
                {selectedPayment.updated_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Atualizado em</p>
                    <p className="font-medium text-sm">{new Date(selectedPayment.updated_at).toLocaleString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
