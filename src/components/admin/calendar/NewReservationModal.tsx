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
import { CalendarIcon, Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Room } from "@/hooks/useCalendarReservations";
import {
  MAX_RESERVATION_ROOMS,
  saveReservationRooms,
  type ReservationRoomItem,
} from "@/lib/reservationRooms";
import { detectGuestLanguage, type GuestLang } from "@/lib/guestLanguage";

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
  guest_language: z.enum(["pt", "en", "es", "fr", "de"]),
  send_confirmation_email: z.boolean(),
  extra_rooms: z
    .array(
      z.object({
        room_id: z.string().uuid("Selecione um bangalô"),
        guests: z.number().min(1).max(4),
      })
    )
    .max(MAX_RESERVATION_ROOMS - 1, `Máximo de ${MAX_RESERVATION_ROOMS} acomodações por reserva`),
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
      guest_language: "pt",
      send_confirmation_email: true,
      extra_rooms: [],
    },
  });

  const watchedValues = form.watch();

  // Auto-detect language from email TLD (only if user hasn't manually changed it)
  const [langTouched, setLangTouched] = useState(false);
  useEffect(() => {
    if (langTouched) return;
    const email = watchedValues.guest_email;
    if (email && email.includes("@") && email.split("@")[1]?.includes(".")) {
      const detected = detectGuestLanguage({ email });
      if (detected !== form.getValues("guest_language")) {
        form.setValue("guest_language", detected);
      }
    }
  }, [watchedValues.guest_email, langTouched]);

  // Acomodações extras (reserva com múltiplos bangalôs)
  const extraRooms = watchedValues.extra_rooms || [];
  const totalGuests = (watchedValues.guests || 0) + extraRooms.reduce((sum, r) => sum + (r.guests || 0), 0);

  // Calculate pricing based on package or manual
  const nights = calculateNights(watchedValues.check_in, watchedValues.check_out);
  const calculatedDailyRate = Math.round(
    (selectedPackage 
      ? selectedPackage.price / nights 
      : getDailyRate(watchedValues.guests, watchedValues.daily_rate)) * 100
  ) / 100;

  // Diária de cada acomodação extra, conforme a tarifa do bangalô e nº de hóspedes
  const extraRoomsDaily = extraRooms.map((extra) => {
    const room = rooms.find((r) => r.id === extra.room_id);
    if (!room) return 0;
    return Math.round(getDailyRate(extra.guests || 1, room.price_per_night) * 100) / 100;
  });
  const extrasDailyTotal = Math.round(extraRoomsDaily.reduce((a, b) => a + b, 0) * 100) / 100;

  const calculatedTotalPrice = Math.round(
    ((selectedPackage 
      ? selectedPackage.price 
      : calculatedDailyRate * nights) + extrasDailyTotal * nights) * 100
  ) / 100;
  
  const dailyRate = isManualDailyRate
    ? manualDailyRateValue
    : Math.round((calculatedDailyRate + extrasDailyTotal) * 100) / 100;
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
    form.setValue("package_id", packageId);
    
    setIsManualDailyRate(false);
    setIsManualTotalPrice(false);
    if (packageId && packageId !== "none") {
      const pkg = packages.find((p) => p.id === packageId);
      if (pkg) {
        setSelectedPackage(pkg);
        // Skip auto date/guest adjust for customizable packages
        if (isCustomizablePkg(pkg)) return;

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
      setLangTouched(false);
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
        guest_language: "pt",
        send_confirmation_email: true,
        extra_rooms: [],
      });
    }
  }, [open, initialRoomId, initialDate, rooms]);

  const onSubmit = async (data: FormData) => {
    // Validate dates before checking conflicts
    if (data.check_out <= data.check_in) {
      toast.error("A data de check-out deve ser posterior ao check-in.");
      return;
    }

    // Acomodações da reserva (primeiro item + extras)
    const selectedRoomIds = [data.room_id, ...(data.extra_rooms || []).map((r) => r.room_id)];

    if (new Set(selectedRoomIds).size !== selectedRoomIds.length) {
      toast.error("O mesmo bangalô foi selecionado mais de uma vez.");
      return;
    }

    if (selectedRoomIds.length > MAX_RESERVATION_ROOMS) {
      toast.error(`Máximo de ${MAX_RESERVATION_ROOMS} acomodações por reserva.`);
      return;
    }

    // Check for conflicts (todas as acomodações)
    for (const roomId of selectedRoomIds) {
      if (checkConflict(roomId, data.check_in, data.check_out)) {
        const conflictRoom = rooms.find((r) => r.id === roomId);
        toast.error(
          `Conflito de datas! O período selecionado já está ocupado${conflictRoom ? ` em ${conflictRoom.name_pt}` : ""}.`
        );
        return;
      }
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
        guests: totalGuests,
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
        guest_language: data.guest_language,
      }).select("id").single();

      if (error) throw error;

      // Persiste as acomodações da reserva (1..N bangalôs)
      if (insertedReservation?.id) {
        const items: ReservationRoomItem[] = [
          {
            room_id: data.room_id,
            room_name: room?.name_pt || null,
            guests: data.guests,
            daily_rate: calculatedDailyRate,
            subtotal: Math.round(calculatedDailyRate * nights * 100) / 100,
          },
          ...(data.extra_rooms || []).map((extra, index) => {
            const extraRoom = rooms.find((r) => r.id === extra.room_id);
            const extraDaily = extraRoomsDaily[index] ?? 0;
            return {
              room_id: extra.room_id,
              room_name: extraRoom?.name_pt || null,
              guests: extra.guests,
              daily_rate: extraDaily,
              subtotal: Math.round(extraDaily * nights * 100) / 100,
            };
          }),
        ];

        try {
          await saveReservationRooms(insertedReservation.id, items);
        } catch (itemsError) {
          console.error("Erro ao salvar acomodações:", itemsError);
          toast.warning("Reserva criada, mas houve falha ao registrar as acomodações extras.");
        }
      }

      // Send confirmation email in the guest's language (best-effort, non-blocking)
      if (data.send_confirmation_email && insertedReservation?.id) {
        // E-mail de Pré Check-in (FNRH) — adição pontual, best-effort
        supabase.functions
          .invoke("send-pre-checkin-email", { body: { reservationId: insertedReservation.id } })
          .then(({ error: preErr }) => {
            if (preErr) console.error("Pre check-in email failed:", preErr);
          });

        supabase.functions.invoke("send-reservation-email", {
          body: {
            type: "reservation_confirmed",
            reservationId: insertedReservation.id,
            email: data.guest_email,
            name: data.guest_name,
            lang: data.guest_language,
            force: true,
          },
        })
          .then(({ error: mailErr }) => {
            if (mailErr) {
              console.error("Confirmation email failed:", mailErr);
              toast.warning("Reserva criada, mas o email de confirmação falhou. Tente reenviar pelo botão de email.");
            } else {
              toast.success(`Email de confirmação enviado em ${data.guest_language.toUpperCase()}.`);
            }
          });
      }

      // Sincroniza a ficha na FNRH — UMA ÚNICA chamada por reserva,
      // após a reserva e todas as suas acomodações estarem gravadas.
      if (insertedReservation?.id) {
        supabase.functions
          .invoke("fnrh-criar-reserva", { body: { reservation_id: insertedReservation.id } })
          .then(({ data: fnrhData, error: fnrhErr }) => {
            if (fnrhErr || fnrhData?.error) {
              console.error("FNRH sync failed:", fnrhErr ?? fnrhData?.error);
              toast.warning("Reserva criada, mas a ficha FNRH ficou pendente. Verifique em Admin > FNRH.");
            }
          });
      }


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

            {/* Dados FNRH (opcionais, evitam ficha incompleta) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de nascimento (FNRH)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nacionalidade (FNRH)</FormLabel>
                    <FormControl>
                      <Input placeholder="Brasil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero (FNRH)</FormLabel>
                    <Select value={field.value || "NAO_INFORMADO"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Não informado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NAO_INFORMADO">Não informado</SelectItem>
                        <SelectItem value="MASCULINO">Masculino</SelectItem>
                        <SelectItem value="FEMININO">Feminino</SelectItem>
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
                            // If non-customizable package selected, adjust checkout
                            if (lockedByPackage && selectedPackage && date) {
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
                            disabled={lockedByPackage}
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

            {/* Acomodações adicionais (reserva com múltiplos bangalôs) */}
            <div className="p-4 rounded-lg border border-border space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Acomodações adicionais</p>
                  <p className="text-xs text-muted-foreground">
                    Uma única reserva pode incluir vários bangalôs. Total de hóspedes: {totalGuests}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={extraRooms.length >= MAX_RESERVATION_ROOMS - 1}
                  onClick={() => {
                    const used = new Set([watchedValues.room_id, ...extraRooms.map((r) => r.room_id)]);
                    const nextRoom = rooms.find((r) => !used.has(r.id));
                    if (!nextRoom) {
                      toast.error("Não há outros bangalôs disponíveis para adicionar.");
                      return;
                    }
                    form.setValue("extra_rooms", [
                      ...extraRooms,
                      { room_id: nextRoom.id, guests: 2 },
                    ]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar bangalô
                </Button>
              </div>

              {extraRooms.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma acomodação adicional. A reserva possui apenas o bangalô selecionado acima.
                </p>
              )}

              {extraRooms.map((extra, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Bangalô</label>
                    <Select
                      value={extra.room_id}
                      onValueChange={(v) => {
                        const updated = [...extraRooms];
                        updated[index] = { ...updated[index], room_id: v };
                        form.setValue("extra_rooms", updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name_pt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Hóspedes</label>
                    <Select
                      value={String(extra.guests)}
                      onValueChange={(v) => {
                        const updated = [...extraRooms];
                        updated[index] = { ...updated[index], guests: Number(v) };
                        form.setValue("extra_rooms", updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} pessoa{n > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      form.setValue(
                        "extra_rooms",
                        extraRooms.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
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

            {/* Guest language + auto-send email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
              <FormField
                control={form.control}
                name="guest_language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma do Hóspede *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => { setLangTouched(true); field.onChange(v); }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pt">🇧🇷 Português</SelectItem>
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Detectado automaticamente pelo email. Ajuste se necessário.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="send_confirmation_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Confirmação</FormLabel>
                    <label className="flex items-center gap-2 h-10 px-3 rounded-md border bg-background cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Enviar automaticamente ao hóspede</span>
                    </label>
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
