import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getDailyRate, calculateNights } from "@/lib/pricing";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarIcon, Loader2, ExternalLink, Trash2, Package, Pencil, Check, X, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseDateOnly, formatDateOnly } from "@/lib/dateOnly";
import type { CalendarReservation, Room } from "@/hooks/useCalendarReservations";
import { detectGuestLanguage } from "@/lib/guestLanguage";

interface PackageOption {
  id: string;
  name: string;
  price: number;
  duration: string;
  people: number;
}

const formSchema = z.object({
  guest_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  guest_email: z.string().email("Email inválido"),
  guest_phone: z.string().optional(),
  guests: z.number().min(1).max(10),
  check_in: z.date(),
  check_out: z.date(),
  room_id: z.string().uuid(),
  daily_rate: z.number().min(0),
  reservation_source: z.string(),
  operational_status: z.string(),
  payment_status: z.string(),
  operational_notes: z.string().optional(),
  special_requests: z.string().optional(),
  package_id: z.string().optional(),
  guest_language: z.enum(["pt", "en", "es", "fr", "de"]),
});

type FormData = z.infer<typeof formSchema>;

interface EditReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: CalendarReservation | null;
  rooms: Room[];
  checkConflict: (roomId: string, checkIn: Date, checkOut: Date, excludeId?: string) => boolean;
  onSuccess: () => void;
}

const EditReservationModal = ({
  open,
  onOpenChange,
  reservation,
  rooms,
  checkConflict,
  onSuccess,
}: EditReservationModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | null>(null);
  const { isSuperAdmin, isAdmin } = useAuth();
  
  // Manual pricing overrides
  const [manualDailyRate, setManualDailyRate] = useState<number | null>(null);
  const [manualTotal, setManualTotal] = useState<number | null>(null);
  const [editingDailyRate, setEditingDailyRate] = useState(false);
  const [editingTotal, setEditingTotal] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guest_name: "",
      guest_email: "",
      guest_phone: "",
      guests: 2,
      check_in: new Date(),
      check_out: new Date(),
      room_id: "",
      daily_rate: 1500,
      reservation_source: "site",
      operational_status: "pending",
      payment_status: "pending",
      operational_notes: "",
      special_requests: "",
      package_id: "",
      guest_language: "pt",
    },
  });

  const [lastEmailEvent, setLastEmailEvent] = useState<{ status: string; last_event?: string | null; sent_at?: string | null } | null>(null);

  const watchedValues = form.watch();
  const nights = calculateNights(watchedValues.check_in, watchedValues.check_out);
  
  // Calculate price - use manual overrides if set, otherwise calculate
  const rawDailyRate = selectedPackage ? 0 : getDailyRate(watchedValues.guests, watchedValues.daily_rate);
  const calculatedDailyRate = isFinite(rawDailyRate) && !isNaN(rawDailyRate) ? Math.round(rawDailyRate * 100) / 100 : 0;
  const dailyRate = manualDailyRate ?? calculatedDailyRate;
  const rawTotal = selectedPackage ? selectedPackage.price : dailyRate * (nights || 1);
  const calculatedTotal = isFinite(rawTotal) && !isNaN(rawTotal) ? Math.round(rawTotal * 100) / 100 : 0;
  const totalPrice = manualTotal ?? calculatedTotal;

  // Fetch packages when modal opens
  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("id, name, price, duration, people")
        .eq("is_active", true)
        .order("price");

      if (!error && data) {
        setPackages(data);
      }
    };

    if (open) {
      fetchPackages();
    }
  }, [open]);

  // Load reservation data when modal opens
  useEffect(() => {
    if (open && reservation) {
      const room = rooms.find((r) => r.id === reservation.room_id);
      
      // Find the package if reservation has one
      const reservationPackage = reservation.package_id 
        ? packages.find(p => p.id === reservation.package_id) 
        : null;
      setSelectedPackage(reservationPackage || null);
      
      // Reset manual overrides when loading new reservation
      setManualDailyRate(reservation.daily_rate ?? null);
      setManualTotal(reservation.total_price ?? null);
      setEditingDailyRate(false);
      setEditingTotal(false);
      
      const resolvedLang = (reservation as any).guest_language
        || detectGuestLanguage({ email: reservation.guest_email, country: (reservation as any).country, nationality: (reservation as any).nationality });
      form.reset({
        guest_name: reservation.guest_name,
        guest_email: reservation.guest_email,
        guest_phone: reservation.guest_phone || "",
        guests: reservation.guests,
         check_in: parseDateOnly(reservation.check_in),
         check_out: parseDateOnly(reservation.check_out),
        room_id: reservation.room_id,
        daily_rate: room?.price_per_night || 1500,
        reservation_source: reservation.reservation_source || "site",
        operational_status: reservation.operational_status || reservation.status || "pending",
        payment_status: reservation.payment_status || "pending",
        operational_notes: reservation.operational_notes || "",
        special_requests: reservation.special_requests || "",
        package_id: reservation.package_id || "",
        guest_language: (["pt","en","es","fr","de"].includes(resolvedLang) ? resolvedLang : "pt") as any,
      });

      // Fetch last email status for this reservation
      supabase
        .from("email_logs")
        .select("status, last_event, sent_at")
        .eq("reservation_id", reservation.id)
        .eq("email_type", "reservation_confirmed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setLastEmailEvent(data ?? null));
    }
  }, [open, reservation, rooms, packages]);

  // Detect customizable package (Gavião Panema): free dates and guests
  const isCustomizablePkg = (pkg?: PackageOption | null) =>
    !!pkg && (
      Number(pkg.price) === 0 ||
      pkg.name?.toLowerCase().includes("gavião") ||
      pkg.name?.toLowerCase().includes("gaviao") ||
      pkg.name?.toLowerCase().includes("panema")
    );
  const lockedByPackage = !!selectedPackage && !isCustomizablePkg(selectedPackage);

  // Handle package selection
  const handlePackageChange = (packageId: string) => {
    if (packageId === "none") {
      setSelectedPackage(null);
      form.setValue("package_id", "");
      return;
    }

    const pkg = packages.find(p => p.id === packageId);
    if (pkg) {
      setSelectedPackage(pkg);
      form.setValue("package_id", packageId);

      // Skip auto date/guest adjust for customizable packages
      if (isCustomizablePkg(pkg)) return;

      form.setValue("guests", pkg.people);

      // Auto-adjust check-out based on package duration
      const checkIn = form.getValues("check_in");
      const durationNights = pkg.duration === "4 dias / 3 noites" ? 3 
        : pkg.duration === "5 dias / 4 noites" ? 4
        : pkg.duration === "6 dias / 5 noites" ? 5
        : pkg.duration === "7 dias / 6 noites" ? 6
        : 4;
      form.setValue("check_out", addDays(checkIn, durationNights));
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!reservation) return;

    // Validate dates before checking conflicts
    if (data.check_out <= data.check_in) {
      toast.error("A data de check-out deve ser posterior ao check-in.");
      return;
    }

    // Check for conflicts
    if (checkConflict(data.room_id, data.check_in, data.check_out, reservation.id)) {
      toast.error("Conflito de datas! O período selecionado já está ocupado.");
      return;
    }

    setIsSubmitting(true);
    try {
      const room = rooms.find((r) => r.id === data.room_id);

      const { error } = await supabase
        .from("reservations")
        .update({
          guest_name: data.guest_name,
          guest_email: data.guest_email,
          guest_phone: data.guest_phone || null,
          guests: data.guests,
          check_in: formatDateOnly(data.check_in),
          check_out: formatDateOnly(data.check_out),
          room_id: data.room_id,
          room_name: room?.name_pt || null,
          daily_rate: dailyRate,
          total_price: totalPrice,
          reservation_source: data.reservation_source,
          operational_status: data.operational_status,
          status: data.operational_status,
          payment_status: data.payment_status,
          operational_notes: data.operational_notes || null,
          special_requests: data.special_requests || null,
          package_id: data.package_id && data.package_id !== "" ? data.package_id : null,
          guest_language: data.guest_language,
        })
        .eq("id", reservation.id);

      if (error) throw error;

      // Send internal cancellation notification if status changed to cancelled
      if (data.operational_status === "cancelled" && reservation.operational_status !== "cancelled") {
        supabase.functions.invoke("send-internal-notification", {
          body: {
            type: "cancellation",
            data: {
              guest_name: data.guest_name,
              guest_email: data.guest_email,
              room_name: room?.name_pt || reservation.room_name,
              check_in: data.check_in,
              check_out: data.check_out,
              total_price: totalPrice,
            },
          },
        }).catch(() => {});
      }

      toast.success("Reserva atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating reservation:", error);
      toast.error(error.message || "Erro ao atualizar reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!reservation) return;

    // Verificação extra de permissão no frontend (RLS já protege no backend)
    if (!isAdmin && !isSuperAdmin) {
      toast.error("Apenas administradores podem excluir reservas.");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservation.id);

      if (error) {
        // Mensagem específica para erro de FK (código PostgreSQL 23503)
        if (error.code === "23503") {
          toast.error("Não foi possível excluir: existem registros vinculados a esta reserva.");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Reserva excluída com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting reservation:", error);
      toast.error(error.message || "Erro ao excluir reserva");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!reservation?.guest_email) return;
    setIsSendingEmail(true);
    setShowEmailPreview(false);
    try {
      const { error } = await supabase.functions.invoke("send-reservation-email", {
        body: {
          type: "reservation_confirmed",
          reservationId: reservation.id,
          email: reservation.guest_email,
          name: reservation.guest_name,
          force: true,
        },
      });
      if (error) throw error;
      toast.success("E-mail de confirmação enviado ao hóspede!");
    } catch (err: any) {
      console.error("Email send failed:", err);
      toast.error("Erro ao enviar e-mail de confirmação.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Reserva</span>
            <Link
              to={`/admin/reservations`}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              Ver detalhes completos
              <ExternalLink className="h-3 w-3" />
            </Link>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Guest Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="guest_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Hóspede *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guest_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guest_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone/WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="(92) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Pessoas *</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                      disabled={lockedByPackage}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} pessoa{n > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Package Selection */}
            <div className="p-4 bg-accent/20 rounded-lg border border-accent">
              <FormField
                control={form.control}
                name="package_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Pacote (opcional)
                    </FormLabel>
                    <Select 
                      value={field.value || "none"} 
                      onValueChange={handlePackageChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um pacote..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem pacote - tarifa manual</SelectItem>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} - R$ {pkg.price.toLocaleString("pt-BR")} ({pkg.duration})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPackage && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {isCustomizablePkg(selectedPackage)
                          ? "Pacote personalizado — datas e tarifas livres"
                          : `Pacote selecionado: ${selectedPackage.people} pessoa(s), ${selectedPackage.duration}`}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Room and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bangalô *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name_pt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="check_in"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Check-in *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            // Auto-adjust check-out if package is selected
                            if (lockedByPackage && selectedPackage && date) {
                              const durationNights = selectedPackage.duration === "4 dias / 3 noites" ? 3 
                                : selectedPackage.duration === "5 dias / 4 noites" ? 4
                                : selectedPackage.duration === "6 dias / 5 noites" ? 5
                                : selectedPackage.duration === "7 dias / 6 noites" ? 6
                                : 4;
                              form.setValue("check_out", addDays(date, durationNights));
                            }
                          }}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="check_out"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Check-out *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            disabled={lockedByPackage}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={ptBR}
                          disabled={(date) => date <= watchedValues.check_in}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">
                    {selectedPackage ? "Pacote" : "Diária Calculada"}
                  </p>
                  {!selectedPackage && !editingDailyRate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-50 hover:opacity-100"
                      onClick={() => {
                        setManualDailyRate(dailyRate);
                        setEditingDailyRate(true);
                      }}
                      title="Editar diária manualmente"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingDailyRate && !selectedPackage ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 w-32"
                      value={manualDailyRate ?? dailyRate}
                      onChange={(e) => setManualDailyRate(Number(e.target.value))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-600"
                      onClick={() => setEditingDailyRate(false)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600"
                      onClick={() => {
                        setManualDailyRate(reservation?.daily_rate ?? null);
                        setEditingDailyRate(false);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-primary">
                    {selectedPackage 
                      ? selectedPackage.name
                      : `R$ ${dailyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    }
                    {manualDailyRate !== null && !selectedPackage && (
                      <span className="ml-1 text-xs font-normal text-orange-500">(manual)</span>
                    )}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedPackage 
                    ? selectedPackage.duration
                    : `Para ${watchedValues.guests} pessoa(s)`
                  }
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">Total ({nights} noite{nights !== 1 ? "s" : ""})</p>
                  {!editingTotal && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-50 hover:opacity-100"
                      onClick={() => {
                        setManualTotal(totalPrice);
                        setEditingTotal(true);
                      }}
                      title="Editar total manualmente"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {editingTotal ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 w-32"
                      value={manualTotal ?? totalPrice}
                      onChange={(e) => setManualTotal(Number(e.target.value))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-600"
                      onClick={() => setEditingTotal(false)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600"
                      onClick={() => {
                        setManualTotal(reservation?.total_price ?? null);
                        setEditingTotal(false);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    {manualTotal !== null && (
                      <span className="ml-1 text-xs font-normal text-orange-500">(manual)</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="reservation_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem da Reserva *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="site">Site Oficial</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="booking">Booking.com</SelectItem>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="agency">Agência/Operadora</SelectItem>
                        <SelectItem value="manual">Reserva Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operational_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Operacional *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="hosted">Hospedado</SelectItem>
                        <SelectItem value="finished">Finalizado</SelectItem>
                        <SelectItem value="no-show">No-show</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Financeiro *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="failed">Falhou</SelectItem>
                        <SelectItem value="refunded">Reembolsado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="operational_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações Internas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas visíveis apenas para a equipe..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="special_requests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solicitações Especiais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Pedidos do hóspede..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Meta info */}
            <div className="text-xs text-muted-foreground border-t pt-2">
              Criado em: {reservation.created_at ? format(new Date(reservation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-4 border-t">
              <div>
                {isSuperAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                          {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <div className="flex gap-2">
                {reservation?.guest_email && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailPreview(true)}
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
                    Enviar Email
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || (!isAdmin && !isSuperAdmin)}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Email Preview Dialog */}
      <AlertDialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Preview do E-mail de Confirmação</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Confira os dados que serão enviados ao hóspede:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hóspede:</span>
                    <span className="font-medium">{watchedValues.guest_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{watchedValues.guest_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bangalô:</span>
                    <span className="font-medium">{rooms.find(r => r.id === watchedValues.room_id)?.name_pt || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in:</span>
                    <span className="font-medium">{format(watchedValues.check_in, "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out:</span>
                    <span className="font-medium">{format(watchedValues.check_out, "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hóspedes:</span>
                    <span className="font-medium">{watchedValues.guests} pessoa(s)</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Valor Total:</span>
                    <span className="font-bold text-primary">R$ {totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <p className="text-xs text-orange-600">
                  ⚠️ O e-mail usará os dados <strong>salvos no banco</strong>. Certifique-se de salvar alterações antes de enviar.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendEmail} disabled={isSendingEmail}>
              {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default EditReservationModal;
