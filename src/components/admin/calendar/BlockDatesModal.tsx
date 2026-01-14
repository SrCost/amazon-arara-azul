import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockedDate, Room } from "@/hooks/useCalendarReservations";

const formSchema = z.object({
  room_id: z.string().uuid(),
  start_date: z.date(),
  end_date: z.date(),
  block_type: z.string(),
  reason: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BlockDatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: Room[];
  initialRoomId?: string;
  initialDate?: Date;
  existingBlock?: BlockedDate | null;
  onSuccess: () => void;
}

const BlockDatesModal = ({
  open,
  onOpenChange,
  rooms,
  initialRoomId,
  initialDate,
  existingBlock,
  onSuccess,
}: BlockDatesModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isSuperAdmin } = useAuth();

  const isEditing = !!existingBlock;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      room_id: initialRoomId || rooms[0]?.id || "",
      start_date: initialDate || new Date(),
      end_date: addDays(initialDate || new Date(), 1),
      block_type: "maintenance",
      reason: "",
    },
  });

  const watchedValues = form.watch();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (existingBlock) {
        form.reset({
          room_id: existingBlock.room_id,
          start_date: new Date(existingBlock.start_date),
          end_date: new Date(existingBlock.end_date),
          block_type: existingBlock.block_type || "maintenance",
          reason: existingBlock.reason || "",
        });
      } else {
        form.reset({
          room_id: initialRoomId || rooms[0]?.id || "",
          start_date: initialDate || new Date(),
          end_date: addDays(initialDate || new Date(), 1),
          block_type: "maintenance",
          reason: "",
        });
      }
    }
  }, [open, existingBlock, initialRoomId, initialDate, rooms]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && existingBlock) {
        const { error } = await supabase
          .from("blocked_dates")
          .update({
            room_id: data.room_id,
            start_date: format(data.start_date, "yyyy-MM-dd"),
            end_date: format(data.end_date, "yyyy-MM-dd"),
            block_type: data.block_type,
            reason: data.reason || null,
          })
          .eq("id", existingBlock.id);

        if (error) throw error;
        toast.success("Bloqueio atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("blocked_dates").insert({
          room_id: data.room_id,
          start_date: format(data.start_date, "yyyy-MM-dd"),
          end_date: format(data.end_date, "yyyy-MM-dd"),
          block_type: data.block_type,
          reason: data.reason || null,
          created_by: user?.id || null,
        });

        if (error) throw error;
        toast.success("Bloqueio criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving block:", error);
      toast.error(error.message || "Erro ao salvar bloqueio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingBlock) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("blocked_dates")
        .delete()
        .eq("id", existingBlock.id);

      if (error) throw error;

      toast.success("Bloqueio removido com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting block:", error);
      toast.error(error.message || "Erro ao remover bloqueio");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Bloqueio" : "Bloquear Datas"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Início *</FormLabel>
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
                          onSelect={field.onChange}
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
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Fim *</FormLabel>
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
                          onSelect={field.onChange}
                          locale={ptBR}
                          disabled={(date) => date < watchedValues.start_date}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="block_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Bloqueio *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="owner_use">Uso da Família</SelectItem>
                      <SelectItem value="exclusive">Reserva Exclusiva</SelectItem>
                      <SelectItem value="event">Evento</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo do bloqueio..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-4 border-t">
              <div>
                {isEditing && isSuperAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover este bloqueio? As datas ficarão disponíveis novamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                          {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Salvar" : "Bloquear"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BlockDatesModal;
