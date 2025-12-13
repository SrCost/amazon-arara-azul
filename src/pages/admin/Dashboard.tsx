import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, DollarSign, MessageSquare, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalReservations: 0,
    occupancyRate: 0,
    pendingPayments: 0,
    newMessages: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Setup realtime subscriptions
    const reservationsChannel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get total reservations (all status)
      const { count: reservationsCount } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true });

      // Get confirmed reservations for occupancy
      const { count: confirmedReservationsCount } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed");

      // Get total rooms for occupancy calculation
      const { count: roomsCount } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get pending payments
      const { count: pendingPaymentsCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get unread messages
      const { count: messagesCount } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");

      // Get recent reservations for activity (últimas 5 ações)
      const { data: recentReservations } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      // Calculate occupancy rate: (confirmed reservations ÷ total rooms) × 100
      const occupancy = roomsCount && confirmedReservationsCount 
        ? Math.round((confirmedReservationsCount / roomsCount) * 100) 
        : 0;

      setStats({
        totalReservations: reservationsCount || 0,
        occupancyRate: occupancy,
        pendingPayments: pendingPaymentsCount || 0,
        newMessages: messagesCount || 0,
      });

      // Format recent activity with proper status translation
      if (recentReservations) {
        const activity = recentReservations.map((res) => {
          let action = "Reserva atualizada";
          if (res.status === "confirmed") action = "Nova reserva confirmada";
          else if (res.status === "pending") action = "Nova reserva pendente";
          else if (res.status === "cancelled") action = "Reserva cancelada";
          
          return {
            action,
            user: res.guest_name,
            time: new Date(res.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });
        setRecentActivity(activity);
      }

      console.log("Dashboard data loaded:", {
        totalReservations: reservationsCount,
        confirmedReservations: confirmedReservationsCount,
        occupancyRate: occupancy,
        pendingPayments: pendingPaymentsCount,
        newMessages: messagesCount
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t("admin.totalReservations"),
      value: loading ? "..." : stats.totalReservations.toString(),
      icon: CalendarCheck,
      trend: "+12.5%",
    },
    {
      title: t("admin.occupancyRate"),
      value: loading ? "..." : `${stats.occupancyRate}%`,
      icon: TrendingUp,
      trend: "+5.2%",
    },
    {
      title: t("admin.pendingPayments"),
      value: loading ? "..." : stats.pendingPayments.toString(),
      icon: DollarSign,
      trend: "-3.1%",
    },
    {
      title: t("admin.newMessages"),
      value: loading ? "..." : stats.newMessages.toString(),
      icon: MessageSquare,
      trend: "+8.4%",
    },
  ];

  const monthlyData = [
    { month: "Jan", reservations: 45, revenue: 38000 },
    { month: "Fev", reservations: 52, revenue: 44000 },
    { month: "Mar", reservations: 61, revenue: 52000 },
    { month: "Abr", reservations: 58, revenue: 49000 },
    { month: "Mai", reservations: 67, revenue: 57000 },
    { month: "Jun", reservations: 72, revenue: 61000 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
          {t("admin.dashboard")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t("common.welcome")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-forest flex items-center justify-center">
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    stat.trend.startsWith("+") ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.title}</h3>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t("admin.recentReservations")}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="reservations"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-3 border-b last:border-0 gap-1">
                  <div>
                    <p className="font-medium text-foreground text-sm sm:text-base">{activity.action}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm">Nenhuma atividade recente</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;