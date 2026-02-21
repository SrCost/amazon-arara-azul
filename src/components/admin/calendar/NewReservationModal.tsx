import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getDailyRate, calculateNights } from "@/lib/pricing";
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
import { CalendarIcon, Loader2, Package, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Room } from "@/hooks/useCalendarReservations";

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
  package_id: z.string().optional(),
  cpf: z.string().optional(),
  passport: z.string().optional(),
  daily_rate: z.number().min(0),
  reservation_source: z.string(),
  operational_status: z.string(),
  payment_status: z.string(),
  operational_notes: z.string().optional(),
  special_requests: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NewReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: Room[];
  initialRoomId?: string;
  initialDate?: Date;
  checkConflict: (roomId: string, checkIn: Date, checkOut: Date) => boolean;
  onSuccess: () => void;
}

const NewReservationModal = ({
  open,
  onOpenChange,
  rooms,
  initialRoomId,
  initialDate,
  checkConflict,
  onSuccess,
}: NewReservationModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | null>(null);
  const [isManualDailyRate, setIsManualDailyRate] = useState(false);
  const [manualDailyRateValue, setManualDailyRateValue] = useState(0);
  const [isManualTotalPrice, setIsManualTotalPrice] = useState(false);
  const [manualTotalPriceValue, setManualTotalPriceValue] = useState(0);

  const defaultRoom = rooms.find((r) => r.id === initialRoomId) || rooms[0];
  const defaultCheckIn = initialDate || new Date();
  const defaultCheckOut = addDays(defaultCheckIn, 2);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guest_name: "",
      guest_email: "",
      guest_phone: "",
      guests: 2,
      check_in: defaultCheckIn,
      check_out: defaultCheckOut,
      room_id: defaultRoom?.id || "",
      package_id: "",
      cpf: "",
      passport: "",
      daily_rate: defaultRoom?.price_per_night || 1500,
      reservation_source: "manual",
      operational_status: "pending",
      payment_status: "pending",
      operational_notes: "",
      special_requests: "",
    },
  });

  const watchedValues = form.watch();
  
  // Calculate pricing based on package or manual
  const nights = calculateNights(watchedValues.check_in, watchedValues.check_out);
  const calculatedDailyRate = Math.round(
    (selectedPackage 
      ? selectedPackage.price / nights 
      : getDailyRate(watchedValues.guests, watchedValues.daily_rate)) * 100
  ) / 100;
  const calculatedTotalPrice = Math.round(
    (selectedPackage 
      ? selectedPackage.price 
      : calculatedDailyRate * nights) * 100
  ) / 100;
  
  const dailyRate = isManualDailyRate ? manualDailyRateValue : calculatedDailyRate;
  const totalPrice = isManualTotalPrice ? manualTotalPriceValue : calculatedTotalPrice;

  // Fetch packages
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
    fetchPackages();
  }, []);

  // Handle package selection
  const handlePackageChange = (packageId: string) => {
    form.setValue("package_id", packageId);
    
    setIsManualDailyRate(false);
    setIsManualTotalPrice(false);
    if (packageId && packageId !== "none") {
      const pkg = packages.find((p) => p.id === packageId);
      if (pkg) {
        setSelectedPackage(pkg);
        form.setValue("guests", Math.min(pkg.people, 4));
        
        // Parse duration to get nights (e.g., "4 noites / 5 dias" -> 4)
        const durationMatch = pkg.duration.match(/(\d+)\s*noite/i);
        const pkgNights = durationMatch ? parseInt(durationMatch[1]) : 4;
        
        const checkIn = watchedValues.check_in;
        form.setValue("check_out", addDays(checkIn, pkgNights));
      }
    } else {
      setSelectedPackage(null);
    }
  };

  // Update daily rate when room changes (only if no package selected)
  useEffect(() => {
    if (!selectedPackage) {
      const room = rooms.find((r) => r.id === watchedValues.room_id);
      if (room) {
        form.setValue("daily_rate", room.price_per_night);
      }
    }
  }, [watchedValues.room_id, rooms, selectedPackage]);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open) {
      const room = rooms.find((r) => r.id === initialRoomId) || rooms[0];
      const checkIn = initialDate || new Date();
      setSelectedPackage(null);
      setIsManualDailyRate(false);
      setIsManualTotalPrice(false);
      form.reset({
        guest_name: "",
        guest_email: "",
        guest_phone: "",
        guests: 2,
        check_in: checkIn,
        check_out: addDays(checkIn, 2),
        room_id: room?.id || "",
        package_id: "",
        cpf: "",
        passport: "",
        daily_rate: room?.price_per_night || 1500,
        reservation_source: "manual",
        operational_status: "pending",
        payment_status: "pending",
        operational_notes: "",
        special_requests: "",
      });
    }
  }, [open, initialRoomId, initialDate, rooms]);

  const onSubmit = async (data: FormData) => {
    // Validate dates before checking conflicts
    if (data.check_out <= data.check_in) {
      toast.error("A data de check-out deve ser posterior ao check-in.");
      return;
    }

    // Check for conflicts
    if (checkConflict(data.room_id, data.check_in, data.check_out)) {
      toast.error("Conflito de datas! O período selecionado já está ocupado.");
      return;
    }

    setIsSubmitting(true);
    try {
      const room = rooms.find((r) => r.id === data.room_id);
      
      // Validate pricing values
      const safeDailyRate = isFinite(dailyRate) && !isNaN(dailyRate) ? dailyRate : 0;
      const safeTotalPrice = isFinite(totalPrice) && !isNaN(totalPrice) ? totalPrice : 0;

      if (safeDailyRate <= 0 || safeTotalPrice <= 0) {
        toast.error("Valores de diária e total devem ser maiores que zero.");
        setIsSubmitting(false);
        return;
      }

      const { data: insertedReservation, error } = await supabase.from("reservations").insert({
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone || null,
        guests: data.guests,
        check_in: format(data.check_in, "yyyy-MM-dd"),
        check_out: format(data.check_out, "yyyy-MM-dd"),
        room_id: data.room_id,
        room_name: room?.name_pt || null,
        package_id: data.package_id && data.package_id !== "none" ? data.package_id : null,
        cpf: data.cpf || null,
        passport: data.passport || null,
        daily_rate: safeDailyRate,
        total_price: safeTotalPrice,
        reservation_source: data.reservation_source,
        operational_status: data.operational_status,
        status: data.operational_status,
        payment_status: data.payment_status,
        operational_notes: data.operational_notes || null,
        special_requests: data.special_requests || null,
      }).select("id").single();

      if (error) throw error;

      toast.success("Reserva criada com sucesso!");

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      toast.error(error.message || "Erro ao criar reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Reserva Manual</DialogTitle>
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
                      disabled={!!selectedPackage}
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

            {/* Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passaporte (estrangeiros)</FormLabel>
                    <FormControl>
                      <Input placeholder="Número do passaporte" {...field} />
                    </FormControl>
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
                          <SelectValue placeholder="Sem pacote - tarifa manual" />
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
                        Pacote para {selectedPackage.people} pessoa(s). Datas ajustadas automaticamente.
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
                            // If package selected, adjust checkout
                            if (selectedPackage && date) {
                              const durationMatch = selectedPackage.duration.match(/(\d+)\s*noite/i);
                              const pkgNights = durationMatch ? parseInt(durationMatch[1]) : 4;
                              form.setValue("check_out", addDays(date, pkgNights));
                            }
                          }}
                          locale={ptBR}
                          className="pointer-events-auto"
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
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!!selectedPackage}
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
                          className="pointer-events-auto"
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
                  <p className="text-sm font-medium">Diária Calculada</p>
                  {isManualDailyRate && <span className="text-xs text-amber-600 font-medium">(manual)</span>}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      if (!isManualDailyRate) {
                        setManualDailyRateValue(calculatedDailyRate);
                      }
                      setIsManualDailyRate(!isManualDailyRate);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                {isManualDailyRate ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={manualDailyRateValue}
                    onChange={(e) => setManualDailyRateValue(Number(e.target.value))}
                    className="h-8"
                  />
                ) : (
                  <p className="text-lg font-bold text-primary">
                    R$ {calculatedDailyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedPackage ? `Pacote: ${selectedPackage.name}` : `Para ${watchedValues.guests} pessoa(s)`}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">Total ({nights} noite{nights !== 1 ? "s" : ""})</p>
                  {isManualTotalPrice && <span className="text-xs text-amber-600 font-medium">(manual)</span>}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      if (!isManualTotalPrice) {
                        setManualTotalPriceValue(calculatedTotalPrice);
                      }
                      setIsManualTotalPrice(!isManualTotalPrice);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                {isManualTotalPrice ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={manualTotalPriceValue}
                    onChange={(e) => setManualTotalPriceValue(Number(e.target.value))}
                    className="h-8"
                  />
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    R$ {calculatedTotalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                        <SelectItem value="no-show">No-show</SelectItem>
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
                    <FormLabel>Status Pagamento *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="partial">Parcial</SelectItem>
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
                    <FormLabel>Notas Operacionais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas internas para a equipe..."
                        className="resize-none"
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
                    <FormLabel>Pedidos Especiais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Solicitações do hóspede..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Reserva
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewReservationModal;
