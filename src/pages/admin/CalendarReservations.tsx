import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCalendarReservations } from "@/hooks/useCalendarReservations";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Ban,
  Search,
  RefreshCw,
} from "lucide-react";
import CalendarGrid from "@/components/admin/calendar/CalendarGrid";
import NewReservationModal from "@/components/admin/calendar/NewReservationModal";
import EditReservationModal from "@/components/admin/calendar/EditReservationModal";
import BlockDatesModal from "@/components/admin/calendar/BlockDatesModal";
import type { CalendarReservation, BlockedDate } from "@/hooks/useCalendarReservations";

const CalendarReservations = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const canEdit = isAdmin || isSuperAdmin;

  const {
    currentDate,
    monthStart,
    monthEnd,
    rooms,
    reservations,
    blockedDates,
    reservationsByRoom,
    blockedByRoom,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    roomFilter,
    setRoomFilter,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    checkConflict,
    refresh,
  } = useCalendarReservations();

  // Modal states
  const [newReservationModal, setNewReservationModal] = useState(false);
  const [editReservationModal, setEditReservationModal] = useState(false);
  const [blockDatesModal, setBlockDatesModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<CalendarReservation | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockedDate | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Handlers
  const handleCellClick = (roomId: string, date: Date) => {
    if (!canEdit) return;
    setSelectedRoomId(roomId);
    setSelectedDate(date);
    setNewReservationModal(true);
  };

  const handleReservationClick = (reservation: CalendarReservation) => {
    setSelectedReservation(reservation);
    setEditReservationModal(true);
  };

  const handleBlockClick = (block: BlockedDate) => {
    if (!canEdit) return;
    setSelectedBlock(block);
    setBlockDatesModal(true);
  };

  const handleNewBlockClick = () => {
    setSelectedBlock(null);
    setBlockDatesModal(true);
  };

  const handleModalSuccess = () => {
    refresh();
  };

  // Stats
  const totalReservations = reservations.length;
  const confirmedReservations = reservations.filter(
    (r) => r.operational_status === "confirmed" || r.status === "confirmed"
  ).length;
  const pendingPayments = reservations.filter((r) => r.payment_status === "pending").length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Calendário de Reservas
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualize e gerencie todas as reservas e bloqueios
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button onClick={handleNewBlockClick} variant="outline" size="sm">
              <Ban className="h-4 w-4 mr-2" />
              Bloquear Datas
            </Button>
            <Button onClick={() => {
              setSelectedRoomId(undefined);
              setSelectedDate(undefined);
              setNewReservationModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reserva
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Reservas no mês</p>
          <p className="text-2xl font-bold">{totalReservations}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Confirmadas</p>
          <p className="text-2xl font-bold text-emerald-600">{confirmedReservations}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pagamento Pendente</p>
          <p className="text-2xl font-bold text-amber-600">{pendingPayments}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Bloqueios</p>
          <p className="text-2xl font-bold text-slate-600">{blockedDates.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-card border rounded-lg p-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold min-w-[180px] text-center">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </div>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarDays className="h-4 w-4 mr-2" />
            Hoje
          </Button>
          <Button variant="ghost" size="icon" onClick={refresh} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar hóspede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="hosted">Hospedado</SelectItem>
              <SelectItem value="finished">Finalizado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roomFilter} onValueChange={setRoomFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Bangalô" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Bangalôs</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name_pt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="text-muted-foreground">Legenda:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Confirmado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Hospedado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-400" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Pgto Pendente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-500" />
          <span>Finalizado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-400" />
          <span>Cancelado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span>Bloqueado</span>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum bangalô cadastrado.</p>
        </div>
      ) : (
        <CalendarGrid
          monthStart={monthStart}
          monthEnd={monthEnd}
          rooms={rooms}
          reservationsByRoom={reservationsByRoom}
          blockedByRoom={blockedByRoom}
          onCellClick={handleCellClick}
          onReservationClick={handleReservationClick}
          onBlockClick={handleBlockClick}
        />
      )}

      {/* Modals */}
      <NewReservationModal
        open={newReservationModal}
        onOpenChange={setNewReservationModal}
        rooms={rooms}
        initialRoomId={selectedRoomId}
        initialDate={selectedDate}
        checkConflict={checkConflict}
        onSuccess={handleModalSuccess}
      />

      <EditReservationModal
        open={editReservationModal}
        onOpenChange={setEditReservationModal}
        reservation={selectedReservation}
        rooms={rooms}
        checkConflict={checkConflict}
        onSuccess={handleModalSuccess}
      />

      <BlockDatesModal
        open={blockDatesModal}
        onOpenChange={setBlockDatesModal}
        rooms={rooms}
        initialRoomId={selectedRoomId}
        initialDate={selectedDate}
        existingBlock={selectedBlock}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default CalendarReservations;
