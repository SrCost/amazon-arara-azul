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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Eye, Edit, X, Mail, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchReservationRoomsMap, formatRoomsSummary } from "@/lib/reservationRooms";

interface Reservation {
  id: string;
  room_name: string;
  package_id?: string;
  package_name?: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_reference?: string;
  mp_transaction_id?: string;
  mp_order_id?: string;
  special_requests?: string;
  created_at: string;
  updated_at?: string;
}

const Reservations = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Reservation>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    // Setup realtime updates for reservations table
    const reservationsChannel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        () => fetchReservations()
      )
      .subscribe();

    // Setup realtime updates for payments table
    const paymentsChannel = supabase
      .channel('payments-changes-reservations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments'
        },
        () => fetchReservations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  // Fetch when page changes
  useEffect(() => {
    fetchReservations();
  }, [currentPage]);

  const fetchReservations = async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await supabase
        .from("reservations")
        .select(`
          *,
          packages (
            name
          )
        `, { count: 'exact' })
        .or("is_test.is.null,is_test.eq.false")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setTotalCount(count || 0);
      
      const roomsMap = await fetchReservationRoomsMap((data || []).map((r) => r.id));

      // Map the data to include package_name e resumo das acomodações
      const mappedData = (data || []).map(reservation => ({
        ...reservation,
        package_name: reservation.packages?.name || null,
        rooms_summary: formatRoomsSummary(roomsMap[reservation.id], reservation.room_name),
      }));
      
      setReservations(mappedData as Reservation[]);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Erro ao carregar reservas");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const handleView = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditForm(reservation);
    setIsEditDialogOpen(true);
  };

  const handleUpdateReservation = async () => {
    if (!selectedReservation) return;

    try {
      // Validate required fields
      if (!editForm.guest_name || !editForm.guest_email) {
        toast.error("Nome e email do hóspede são obrigatórios");
        return;
      }

      if (!editForm.check_in || !editForm.check_out) {
        toast.error("Datas de check-in e check-out são obrigatórias");
        return;
      }

      // Validate dates
      const checkInDate = new Date(editForm.check_in);
      const checkOutDate = new Date(editForm.check_out);
      
      if (checkOutDate <= checkInDate) {
        toast.error("A data de check-out deve ser posterior ao check-in");
        return;
      }

      const { error } = await supabase
        .from("reservations")
        .update({
          guest_name: editForm.guest_name,
          guest_email: editForm.guest_email,
          guest_phone: editForm.guest_phone,
          check_in: editForm.check_in,
          check_out: editForm.check_out,
          guests: editForm.guests,
          status: editForm.status,
          operational_status: editForm.status,
          payment_method: editForm.payment_method,
          total_price: editForm.total_price,
          special_requests: editForm.special_requests,
        })
        .eq("id", selectedReservation.id);

      if (error) {
        console.error("❌ Erro ao atualizar reserva:", error);
        throw error;
      }

      // Send internal cancellation notification if status changed to cancelled
      if (editForm.status === "cancelled" && selectedReservation.status !== "cancelled") {
        supabase.functions.invoke("send-internal-notification", {
          body: {
            type: "cancellation",
            data: {
              guest_name: editForm.guest_name,
              guest_email: editForm.guest_email,
              room_name: selectedReservation.room_name,
              check_in: editForm.check_in,
              check_out: editForm.check_out,
              total_price: editForm.total_price,
            },
          },
        }).catch(() => {});
      }

      toast.success("✅ Reserva atualizada com sucesso!", {
        description: "Todas as alterações foram salvas e registradas no log de auditoria."
      });
      
      setIsEditDialogOpen(false);
      fetchReservations();
    } catch (error: any) {
      console.error("❌ Erro ao atualizar reserva:", error);
      toast.error("Erro ao atualizar reserva", {
        description: error.message || "Verifique as permissões e tente novamente."
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setReservationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reservationToDelete) return;

    try {
      const reservationToLog = reservations.find(r => r.id === reservationToDelete);
      
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservationToDelete);

      if (error) {
        console.error("❌ Erro ao excluir reserva:", error);
        throw error;
      }

      console.log("✅ Reserva excluída:", {
        id: reservationToDelete,
        guest: reservationToLog?.guest_name,
        lodge: reservationToLog?.room_name
      });

      toast.success("🗑️ Reserva excluída com sucesso!", {
        description: "A reserva foi permanentemente removida e a ação foi registrada no log de auditoria."
      });
      
      setDeleteDialogOpen(false);
      setReservationToDelete(null);
      fetchReservations();
    } catch (error: any) {
      console.error("❌ Erro ao excluir reserva:", error);
      toast.error("Erro ao excluir reserva", {
        description: error.message || "Verifique as permissões e tente novamente."
      });
    }
  };

  const handleContactEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleContactWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Olá ${name}, entramos em contato sobre sua reserva.`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confirmado", className: "bg-emerald-100 text-emerald-800" },
      hosted: { label: "Hospedado", className: "bg-blue-100 text-blue-800" },
      finished: { label: "Finalizado", className: "bg-slate-100 text-slate-800" },
      "no-show": { label: "No-show", className: "bg-orange-100 text-orange-800" },
      cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800" },
      
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      paid: { label: "Pago", className: "bg-green-100 text-green-800" },
      failed: { label: "Falhou", className: "bg-red-100 text-red-800" },
      refunded: { label: "Reembolsado", className: "bg-blue-100 text-blue-800" },
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  // Filter only when searching (search is client-side for displayed page)
  const filteredReservations = searchTerm
    ? reservations.filter(
        (res) =>
          res.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          res.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          res.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : reservations;

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
          {t("admin.reservations")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">Gerencie todas as reservas da plataforma</p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por hóspede, email ou ID..."
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
                  <TableHead className="whitespace-nowrap">Pousada</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">Pacote</TableHead>
                  <TableHead className="whitespace-nowrap">Hóspede</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">Check-in</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">Check-out</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap hidden lg:table-cell">Pagamento</TableHead>
                  <TableHead className="whitespace-nowrap hidden xl:table-cell">Método</TableHead>
                  <TableHead className="whitespace-nowrap hidden xl:table-cell">ID MP</TableHead>
                  <TableHead className="whitespace-nowrap">Valor</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">{reservation.room_name || "N/A"}</TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground hidden md:table-cell">
                      {reservation.package_name || "-"}
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm">{reservation.guest_name}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{new Date(reservation.check_in).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{new Date(reservation.check_out).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{getPaymentStatusBadge(reservation.payment_status)}</TableCell>
                    <TableCell className="text-xs hidden xl:table-cell">
                      {reservation.payment_method === 'pix' ? 'PIX' : 
                       reservation.payment_method === 'credit_card' ? 'Cartão' : 
                       reservation.payment_method || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs hidden xl:table-cell">
                      {reservation.mp_transaction_id || reservation.payment_reference 
                        ? (reservation.mp_transaction_id || reservation.payment_reference)?.slice(0, 10) + '...'
                        : '-'}
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">R$ {reservation.total_price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1 sm:space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleView(reservation)} title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(reservation)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteClick(reservation.id)}
                          title="Excluir"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-sm text-muted-foreground">
                Mostrando {startItem}-{endItem} de {totalCount} reservas
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm px-3">
                  Página {currentPage} de {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-muted-foreground">Pousada</Label>
                  <p className="font-medium">{selectedReservation.room_name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hóspede</Label>
                  <p className="font-medium">{selectedReservation.guest_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">E-mail</Label>
                  <p className="font-medium">{selectedReservation.guest_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Telefone</Label>
                  <p className="font-medium">{selectedReservation.guest_phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Número de hóspedes</Label>
                  <p className="font-medium">{selectedReservation.guests}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-in</Label>
                  <p className="font-medium">{new Date(selectedReservation.check_in).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-out</Label>
                  <p className="font-medium">{new Date(selectedReservation.check_out).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReservation.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status do Pagamento</Label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedReservation.payment_status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Método de Pagamento</Label>
                  <p className="font-medium">
                    {selectedReservation.payment_method === 'pix' ? 'PIX' : 
                     selectedReservation.payment_method === 'credit_card' ? 'Cartão de Crédito' : 
                     selectedReservation.payment_method || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="font-medium text-lg">R$ {selectedReservation.total_price.toLocaleString()}</p>
                </div>
              </div>
              
              {/* Payment Transaction Info */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Dados da Transação</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">ID Transação (MP)</Label>
                    <p className="font-mono text-sm">{selectedReservation.mp_transaction_id || selectedReservation.payment_reference || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data Criação</Label>
                    <p className="font-medium text-sm">{new Date(selectedReservation.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  {selectedReservation.updated_at && (
                    <div>
                      <Label className="text-muted-foreground">Última Atualização</Label>
                      <p className="font-medium text-sm">{new Date(selectedReservation.updated_at).toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedReservation.special_requests && (
                <div>
                  <Label className="text-muted-foreground">Solicitações Especiais</Label>
                  <p className="font-medium">{selectedReservation.special_requests}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Guest Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações do Hóspede
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome Completo</Label>
                  <Input 
                    value={editForm.guest_name || ""} 
                    onChange={(e) => setEditForm({...editForm, guest_name: e.target.value})}
                    placeholder="Nome do hóspede"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">E-mail</Label>
                  <Input 
                    type="email"
                    value={editForm.guest_email || ""} 
                    onChange={(e) => setEditForm({...editForm, guest_email: e.target.value})}
                    placeholder="email@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Telefone</Label>
                  <Input 
                    value={editForm.guest_phone || ""} 
                    onChange={(e) => setEditForm({...editForm, guest_phone: e.target.value})}
                    placeholder="+55 (92) 99999-9999"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Número de Hóspedes</Label>
                  <Select 
                    value={String(editForm.guests || 1)} 
                    onValueChange={(value) => setEditForm({...editForm, guests: parseInt(value)})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 pessoa</SelectItem>
                      <SelectItem value="2">2 pessoas</SelectItem>
                      <SelectItem value="3">3 pessoas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dates Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Datas da Reserva
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Check-in</Label>
                  <Input 
                    type="date"
                    value={editForm.check_in || ""} 
                    onChange={(e) => setEditForm({...editForm, check_in: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Check-out</Label>
                  <Input 
                    type="date"
                    value={editForm.check_out || ""} 
                    onChange={(e) => setEditForm({...editForm, check_out: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Status and Payment Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Status e Pagamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status da Reserva</Label>
                  <Select 
                    value={editForm.status} 
                    onValueChange={(value) => setEditForm({...editForm, status: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="hosted">Hospedado</SelectItem>
                      <SelectItem value="finished">Finalizado</SelectItem>
                      <SelectItem value="no-show">No-show</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Status do Pagamento 
                    <span className="text-xs text-muted-foreground ml-1">(Somente Leitura)</span>
                  </Label>
                  <div className="mt-2 p-3 bg-muted/50 rounded-md border border-border">
                    {getPaymentStatusBadge(editForm.payment_status || 'pending')}
                    <p className="text-xs text-muted-foreground mt-2">
                      ℹ️ Atualizado automaticamente via <strong>/admin/payments</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Financeiras
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Método de Pagamento</Label>
                  <Input 
                    value={editForm.payment_method || ""} 
                    onChange={(e) => setEditForm({...editForm, payment_method: e.target.value})}
                    placeholder="PIX, Cartão de Crédito, etc."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor Total (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={editForm.total_price || 0} 
                    onChange={(e) => setEditForm({...editForm, total_price: parseFloat(e.target.value)})}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Special Requests Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Solicitações Especiais</Label>
              <Input 
                value={editForm.special_requests || ""} 
                onChange={(e) => setEditForm({...editForm, special_requests: e.target.value})}
                placeholder="Observações ou solicitações do hóspede..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground">
                Campo opcional para notas adicionais sobre a reserva
              </p>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateReservation} className="bg-gradient-forest">
              💾 Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              🗑️ Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium text-foreground">
                Deseja realmente excluir esta reserva?
              </p>
              {reservationToDelete && (() => {
                const reservation = reservations.find(r => r.id === reservationToDelete);
                return reservation ? (
                  <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                    <p><strong>Hóspede:</strong> {reservation.guest_name}</p>
                    <p><strong>Pousada:</strong> {reservation.room_name}</p>
                    <p><strong>Check-in:</strong> {new Date(reservation.check_in).toLocaleDateString()}</p>
                  </div>
                ) : null;
              })()}
              <p className="text-destructive">
                ⚠️ Esta ação não poderá ser desfeita. Todos os dados relacionados serão permanentemente removidos do sistema.
              </p>
              <p className="text-xs text-muted-foreground">
                A exclusão será registrada no log de auditoria para rastreabilidade.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReservationToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reservations;
