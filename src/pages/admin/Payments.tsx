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
import { Search, Eye, Download, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Payment {
  id: string;
  reservation_id: string;
  amount: number;
  payment_method: string;
  status: string;
  payment_date: string;
  created_at: string;
  reservations?: {
    guest_name: string;
    guest_email: string;
  };
}

const Payments = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

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
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          reservations (
            guest_name,
            guest_email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
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
      // Get the payment details to find the reservation_id
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("reservation_id")
        .eq("id", paymentId)
        .single();

      if (paymentError) throw paymentError;

      // Update payment status
      const { error: updateError } = await supabase
        .from("payments")
        .update({ status: newStatus })
        .eq("id", paymentId);

      if (updateError) throw updateError;

      // SYNC WITH RESERVATIONS: Update payment_status in reservations table
      // Map payment status to reservation payment_status
      let reservationPaymentStatus = 'pending';
      if (newStatus === 'completed') {
        reservationPaymentStatus = 'paid';
      } else if (newStatus === 'pending') {
        reservationPaymentStatus = 'pending';
      } else if (newStatus === 'refunded') {
        reservationPaymentStatus = 'refunded';
      }

      const { error: reservationError } = await supabase
        .from("reservations")
        .update({ payment_status: reservationPaymentStatus })
        .eq("id", payment.reservation_id);

      if (reservationError) {
        console.error("Error updating reservation payment status:", reservationError);
        toast.error("Status do pagamento atualizado, mas erro ao sincronizar com reserva");
        return;
      }

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

      toast.success("Status do pagamento e reserva atualizados");
      fetchPayments();
      console.log("Payment and reservation status synced:", { 
        paymentId, 
        newStatus, 
        reservationId: payment.reservation_id,
        reservationPaymentStatus 
      });
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
      completed: { label: t("admin.completed"), className: "bg-green-100 text-green-800" },
      pending: { label: t("admin.pending"), className: "bg-yellow-100 text-yellow-800" },
      refunded: { label: "Reembolsado", className: "bg-blue-100 text-blue-800" },
      failed: { label: "Falhou", className: "bg-red-100 text-red-800" },
    };

    const variant = variants[status] || variants.pending;
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
                  R$ {totalCompleted.toLocaleString()}
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
                  R$ {totalPending.toLocaleString()}
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
                  <TableHead>Hóspede</TableHead>
                  <TableHead>Reserva ID</TableHead>
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
                    <TableCell className="font-medium">
                      {payment.reservations?.guest_name || "N/A"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{payment.reservation_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">R$ {Number(payment.amount).toLocaleString()}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>
                      <Select 
                        value={payment.status}
                        onValueChange={(value) => handleUpdateStatus(payment.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>{getStatusBadge(payment.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="failed">Falhou</SelectItem>
                          <SelectItem value="refunded">Reembolsado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
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
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Hóspede</p>
                <p className="font-medium">{selectedPayment.reservations?.guest_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{selectedPayment.reservations?.guest_email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID da Reserva</p>
                <p className="font-mono text-sm">{selectedPayment.reservation_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium text-lg">R$ {Number(selectedPayment.amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                <p className="font-medium">{selectedPayment.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="font-medium">{new Date(selectedPayment.created_at).toLocaleString()}</p>
              </div>
              <div className="pt-4 border-t text-sm text-muted-foreground">
                {/* Future payment gateway integration point */}
                <p className="italic">
                  Nota: Integração com gateway de pagamento (Stripe, MercadoPago) será implementada para processamento automático.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
