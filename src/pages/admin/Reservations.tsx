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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Eye, Edit, X, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Reservation {
  id: string;
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
  special_requests?: string;
  created_at: string;
}

const Reservations = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Reservation>>({});

  useEffect(() => {
    fetchReservations();

    // Setup realtime updates
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Erro ao carregar reservas");
    } finally {
      setLoading(false);
    }
  };

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
      const { error } = await supabase
        .from("reservations")
        .update(editForm)
        .eq("id", selectedReservation.id);

      if (error) throw error;

      toast.success("Reserva atualizada com sucesso!");
      setIsEditDialogOpen(false);
      fetchReservations();
    } catch (error) {
      console.error("Error updating reservation:", error);
      toast.error("Erro ao atualizar reserva");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta reserva?")) return;

    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Reserva excluída com sucesso!");
      fetchReservations();
    } catch (error) {
      console.error("Error deleting reservation:", error);
      toast.error("Erro ao excluir reserva");
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
      confirmed: { label: t("admin.confirmed"), className: "bg-green-100 text-green-800" },
      pending: { label: t("admin.pending"), className: "bg-yellow-100 text-yellow-800" },
      completed: { label: t("admin.completed"), className: "bg-blue-100 text-blue-800" },
      cancelled: { label: t("admin.cancelled"), className: "bg-red-100 text-red-800" },
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Pago", className: "bg-green-100 text-green-800" },
      failed: { label: "Falhou", className: "bg-red-100 text-red-800" },
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filteredReservations = reservations.filter(
    (res) =>
      res.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {t("admin.reservations")}
        </h1>
        <p className="text-muted-foreground">Gerencie todas as reservas da plataforma</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hóspede</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">{reservation.guest_name}</TableCell>
                    <TableCell>{new Date(reservation.check_in).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(reservation.check_out).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(reservation.payment_status)}</TableCell>
                    <TableCell className="font-medium">R$ {reservation.total_price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleView(reservation)} title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleContactEmail(reservation.guest_email)}
                          title="Enviar e-mail"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        {reservation.guest_phone && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleContactWhatsApp(reservation.guest_phone, reservation.guest_name)}
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(reservation)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(reservation.id)}
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
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <p className="font-medium">{selectedReservation.payment_method}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="font-medium text-lg">R$ {selectedReservation.total_price.toLocaleString()}</p>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status da Reserva</Label>
                <Select 
                  value={editForm.status} 
                  onValueChange={(value) => setEditForm({...editForm, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status do Pagamento</Label>
                <Select 
                  value={editForm.payment_status} 
                  onValueChange={(value) => setEditForm({...editForm, payment_status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="completed">Pago</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Método de Pagamento</Label>
              <Input 
                value={editForm.payment_method || ""} 
                onChange={(e) => setEditForm({...editForm, payment_method: e.target.value})}
              />
            </div>
            <div>
              <Label>Valor Total (R$)</Label>
              <Input 
                type="number"
                value={editForm.total_price || 0} 
                onChange={(e) => setEditForm({...editForm, total_price: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateReservation} className="bg-gradient-forest">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reservations;
