import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateOnly } from "@/lib/dateOnly";

interface DashboardStats {
  totalReservations: number;
  occupancyRate: number;
  pendingPayments: number;
  newMessages: number;
}

interface Trends {
  reservations: string;
  occupancy: string;
  payments: string;
  messages: string;
}

interface MonthlyData {
  month: string;
  reservations: number;
  revenue: number;
}

interface RecentActivity {
  action: string;
  user: string;
  time: string;
}

interface DashboardData {
  stats: DashboardStats;
  trends: Trends;
  monthlyData: MonthlyData[];
  recentActivity: RecentActivity[];
  loading: boolean;
}

// Calculate trend percentage comparing current to previous value
const calculateTrend = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? "+100%" : "0%";
  }
  const trend = ((current - previous) / previous) * 100;
  return `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`;
};

// Calculate occupied nights from reservations within a given month
const calculateOccupiedNights = (
  reservations: Array<{ check_in: string; check_out: string }>,
  monthStart: Date,
  monthEnd: Date
): number => {
  let totalNights = 0;

  reservations.forEach((res) => {
    const checkIn = parseDateOnly(res.check_in);
    const checkOut = parseDateOnly(res.check_out);

    // Calculate overlap with the month
    const overlapStart = checkIn < monthStart ? monthStart : checkIn;
    const overlapEnd = checkOut > monthEnd ? monthEnd : checkOut;

    if (overlapStart < overlapEnd) {
      totalNights += differenceInDays(overlapEnd, overlapStart);
    }
  });

  return totalNights;
};

// Get stats for a specific month offset (0 = current, -1 = previous, etc.)
const getMonthStats = async (
  monthOffset: number
): Promise<{
  reservations: number;
  occupancy: number;
  pendingPayments: number;
  messages: number;
}> => {
  const targetDate = subMonths(new Date(), Math.abs(monthOffset));
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;

  // Get reservations for this month
  const { count: reservationsCount } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("is_test", false)
    .neq("status", "cancelled")
    .gte("check_in", monthStart.toISOString())
    .lte("check_in", monthEnd.toISOString());

  // Get confirmed reservations for occupancy
  const { data: occupancyReservations } = await supabase
    .from("reservations")
    .select("check_in, check_out")
    .eq("is_test", false)
    .in("status", ["confirmed", "hosted"])
    .or(
      `and(check_in.lte.${monthEnd.toISOString()},check_out.gte.${monthStart.toISOString()})`
    );

  // Get active rooms count
  const { count: roomsCount } = await supabase
    .from("rooms")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const totalNightsAvailable = (roomsCount || 3) * daysInMonth;
  const occupiedNights = calculateOccupiedNights(
    occupancyReservations || [],
    monthStart,
    monthEnd
  );
  const occupancy =
    totalNightsAvailable > 0
      ? Math.round((occupiedNights / totalNightsAvailable) * 100)
      : 0;

  // Get pending payments for this month
  const { count: pendingPaymentsCount } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .gte("created_at", monthStart.toISOString())
    .lte("created_at", monthEnd.toISOString());

  // Get new messages for this month
  const { count: messagesCount } = await supabase
    .from("contact_messages")
    .select("*", { count: "exact", head: true })
    .eq("status", "new")
    .gte("created_at", monthStart.toISOString())
    .lte("created_at", monthEnd.toISOString());

  return {
    reservations: reservationsCount || 0,
    occupancy,
    pendingPayments: pendingPaymentsCount || 0,
    messages: messagesCount || 0,
  };
};

export type ChartBasis = "sale" | "stay";

export const useDashboardStats = (
  chartBasis: ChartBasis = "sale"
): DashboardData & { refetch: () => Promise<void> } => {
  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    occupancyRate: 0,
    pendingPayments: 0,
    newMessages: 0,
  });
  const [trends, setTrends] = useState<Trends>({
    reservations: "0%",
    occupancy: "0%",
    payments: "0%",
    messages: "0%",
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // === FETCH CURRENT STATS ===
      
      // Total reservations (only real ones)
      const { count: totalReservationsCount } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("is_test", false);

      // Current month occupancy
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;

      const { data: currentMonthReservations } = await supabase
        .from("reservations")
        .select("check_in, check_out")
        .eq("is_test", false)
        .in("status", ["confirmed", "hosted"])
        .or(
          `and(check_in.lte.${monthEnd.toISOString()},check_out.gte.${monthStart.toISOString()})`
        );

      const { count: roomsCount } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const totalNightsAvailable = (roomsCount || 3) * daysInMonth;
      const occupiedNights = calculateOccupiedNights(
        currentMonthReservations || [],
        monthStart,
        monthEnd
      );
      const occupancyRate =
        totalNightsAvailable > 0
          ? Math.round((occupiedNights / totalNightsAvailable) * 100)
          : 0;

      // Pending payments (current)
      const { count: pendingPaymentsCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // New messages (current)
      const { count: newMessagesCount } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");

      setStats({
        totalReservations: totalReservationsCount || 0,
        occupancyRate,
        pendingPayments: pendingPaymentsCount || 0,
        newMessages: newMessagesCount || 0,
      });

      // === CALCULATE TRENDS (current month vs previous month) ===
      const currentMonthStats = await getMonthStats(0);
      const previousMonthStats = await getMonthStats(-1);

      setTrends({
        reservations: calculateTrend(
          currentMonthStats.reservations,
          previousMonthStats.reservations
        ),
        occupancy: calculateTrend(
          currentMonthStats.occupancy,
          previousMonthStats.occupancy
        ),
        payments: calculateTrend(
          currentMonthStats.pendingPayments,
          previousMonthStats.pendingPayments
        ),
        messages: calculateTrend(
          currentMonthStats.messages,
          previousMonthStats.messages
        ),
      });

      // === FETCH MONTHLY DATA FOR CHARTS (last 6 months, current month included) ===
      const chartWindowStart = startOfMonth(subMonths(now, 5));
      const chartWindowEnd = endOfMonth(now);

      const { data: chartReservations } = await supabase
        .from("reservations")
        .select("check_in, total_price, status")
        .eq("is_test", false)
        .neq("status", "cancelled")
        .gte("check_in", format(chartWindowStart, "yyyy-MM-dd"))
        .lte("check_in", format(chartWindowEnd, "yyyy-MM-dd"))
        .order("check_in", { ascending: true });

      // Group by year+month so months from different years never collide
      const monthlyMap = new Map<
        string,
        { label: string; reservations: number; revenue: number }
      >();

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, "yyyy-MM");
        const label = format(monthDate, "MMM/yy", { locale: ptBR });
        monthlyMap.set(monthKey, {
          label: label.charAt(0).toUpperCase() + label.slice(1),
          reservations: 0,
          revenue: 0,
        });
      }

      // Aggregate real data (ignore anything outside the 6-month window)
      chartReservations?.forEach((res) => {
        const checkInDate = parseDateOnly(res.check_in);
        const monthKey = format(checkInDate, "yyyy-MM");
        const existing = monthlyMap.get(monthKey);
        if (!existing) return;

        monthlyMap.set(monthKey, {
          label: existing.label,
          reservations: existing.reservations + 1,
          revenue: existing.revenue + (Number(res.total_price) || 0),
        });
      });

      const chartData: MonthlyData[] = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, data]) => ({
          month: data.label,
          reservations: data.reservations,
          revenue: data.revenue,
        }));

      setMonthlyData(chartData);


      // === FETCH RECENT ACTIVITY ===
      const { data: recentReservations } = await supabase
        .from("reservations")
        .select("*")
        .eq("is_test", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentReservations) {
        const activity = recentReservations.map((res) => {
          let action = "Reserva atualizada";
          if (res.status === "confirmed") action = "Nova reserva confirmada";
          else if (res.status === "pending") action = "Nova reserva pendente";
          else if (res.status === "cancelled") action = "Reserva cancelada";

          return {
            action,
            user: res.guest_name,
            time: new Date(res.created_at || "").toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });
        setRecentActivity(activity);
      }

      console.log("Dashboard data loaded (real data only):", {
        totalReservations: totalReservationsCount,
        occupancyRate,
        pendingPayments: pendingPaymentsCount,
        newMessages: newMessagesCount,
        monthlyDataPoints: chartData.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Setup realtime subscription for reservations
    const reservationsChannel = supabase
      .channel("dashboard-reservations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
        },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsChannel);
    };
  }, [fetchDashboardData]);

  return {
    stats,
    trends,
    monthlyData,
    recentActivity,
    loading,
    refetch: fetchDashboardData,
  };
};
