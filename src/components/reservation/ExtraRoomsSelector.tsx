import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Loader2, BedDouble } from "lucide-react";
import { getDailyRate, calculateNights } from "@/lib/pricing";

export interface ExtraRoomEntry {
  roomId: string;
  roomName: string;
  pricePerNight: number;
  maxGuests: number;
  guests: number;
}

interface RoomOption {
  id: string;
  name: string;
  pricePerNight: number;
  maxGuests: number;
}

interface ExtraRoomsSelectorProps {
  mainRoomId: string;
  checkIn?: Date;
  checkOut?: Date;
  value: ExtraRoomEntry[];
  onChange: (rooms: ExtraRoomEntry[]) => void;
  disabled?: boolean;
}

const MAX_ACCOMMODATIONS = 10; // limite total por reserva (inclui o bangalô principal)

const toDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && aEnd > bStart;

export const ExtraRoomsSelector = ({
  mainRoomId,
  checkIn,
  checkOut,
  value,
  onChange,
  disabled,
}: ExtraRoomsSelectorProps) => {
  const { t, i18n } = useTranslation();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [unavailableRooms, setUnavailableRooms] = useState<Set<string>>(new Set());
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    const lang = (i18n.language || "pt").split("-")[0];
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name_pt, name_en, name_es, name_fr, name_de, price_per_night, max_guests")
        .eq("is_active", true)
        .order("name_pt");

      if (!error && data) {
        setRooms(
          data
            .filter((r) => r.id !== mainRoomId)
            .map((r) => ({
              id: r.id,
              name:
                (r as unknown as Record<string, string>)[`name_${lang}`] || r.name_pt,
              pricePerNight: Number(r.price_per_night) || 0,
              maxGuests: Number(r.max_guests) || 2,
            }))
        );
      }
      setLoadingRooms(false);
    };

    fetchRooms();
  }, [mainRoomId, i18n.language]);

  // Disponibilidade por bangalô nas datas selecionadas
  useEffect(() => {
    if (!checkIn || !checkOut || rooms.length === 0) {
      setUnavailableRooms(new Set());
      return;
    }

    let cancelled = false;

    const check = async () => {
      setCheckingAvailability(true);
      const busy = new Set<string>();

      await Promise.all(
        rooms.map(async (room) => {
          const { data, error } = await supabase.rpc(
            "get_room_availability_with_blocks",
            { p_room_id: room.id }
          );
          if (error || !data) return;

          const conflict = (data as any[]).some((entry) => {
            const start = toDate(entry.check_in);
            const end = toDate(entry.check_out);
            // Bloqueios têm data final inclusiva
            if (entry.is_blocked) end.setDate(end.getDate() + 1);
            return overlaps(checkIn, checkOut, start, end);
          });

          if (conflict) busy.add(room.id);
        })
      );

      if (!cancelled) {
        setUnavailableRooms(busy);
        setCheckingAvailability(false);
        // Remove automaticamente acomodações que ficaram indisponíveis
        const stillValid = value.filter((entry) => !busy.has(entry.roomId));
        if (stillValid.length !== value.length) onChange(stillValid);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn?.getTime(), checkOut?.getTime(), rooms]);

  const nights = useMemo(
    () => (checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0),
    [checkIn, checkOut]
  );

  const availableToAdd = rooms.filter(
    (room) =>
      !unavailableRooms.has(room.id) &&
      !value.some((entry) => entry.roomId === room.id)
  );

  const canAddMore = value.length + 1 < MAX_ACCOMMODATIONS;

  const handleAdd = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    onChange([
      ...value,
      {
        roomId: room.id,
        roomName: room.name,
        pricePerNight: room.pricePerNight,
        maxGuests: room.maxGuests,
        guests: Math.min(2, room.maxGuests),
      },
    ]);
  };

  const handleGuestsChange = (roomId: string, guests: number) => {
    onChange(
      value.map((entry) =>
        entry.roomId === roomId ? { ...entry, guests } : entry
      )
    );
  };

  const handleRemove = (roomId: string) => {
    onChange(value.filter((entry) => entry.roomId !== roomId));
  };

  if (loadingRooms) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("reservation.extraRooms.loading")}
      </div>
    );
  }

  if (rooms.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label className="text-base">{t("reservation.extraRooms.title")}</Label>
          <p className="text-sm text-muted-foreground">
            {t("reservation.extraRooms.subtitle")}
          </p>
        </div>
        {checkingAvailability && (
          <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        )}
      </div>

      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((entry) => {
            const subtotal =
              nights > 0
                ? getDailyRate(entry.guests, entry.pricePerNight) * nights
                : 0;

            return (
              <Card key={entry.roomId} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{entry.roomName}</p>
                      {subtotal > 0 && (
                        <p className="text-sm text-muted-foreground">
                          R$ {subtotal.toLocaleString("pt-BR")} ({t("reservation.extraRooms.night", { count: nights })})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="w-32">
                      <Label className="text-xs">{t("reservation.extraRooms.guests")}</Label>
                      <Select
                        value={String(entry.guests)}
                        onValueChange={(v) =>
                          handleGuestsChange(entry.roomId, parseInt(v))
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: entry.maxGuests },
                            (_, i) => i + 1
                          ).map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {t("reservation.extraRooms.guest", { count: n })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(entry.roomId)}
                      disabled={disabled}
                      aria-label={t("reservation.extraRooms.remove", { name: entry.roomName })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!checkIn || !checkOut ? (
        <p className="text-sm text-muted-foreground">
          {t("reservation.extraRooms.selectDates")}
        </p>
      ) : !canAddMore ? (
        <p className="text-sm text-muted-foreground">
          {t("reservation.extraRooms.limitReached", { count: MAX_ACCOMMODATIONS })}
        </p>
      ) : (
        <div className="space-y-2">
          <Select value="" onValueChange={handleAdd} disabled={disabled}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder={t("reservation.extraRooms.addPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => {
                const already = value.some((e) => e.roomId === room.id);
                const busy = unavailableRooms.has(room.id);
                return (
                  <SelectItem
                    key={room.id}
                    value={room.id}
                    disabled={already || busy}
                  >
                    {room.name}
                    {busy
                      ? ` — ${t("reservation.extraRooms.unavailable")}`
                      : already
                      ? ` — ${t("reservation.extraRooms.alreadyAdded")}`
                      : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {availableToAdd.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("reservation.extraRooms.noneAvailable")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
