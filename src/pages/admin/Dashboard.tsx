import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useDashboardStats, type ChartBasis } from "@/hooks/useDashboardStats";

const Dashboard = () => {
  const { t } = useTranslation();
  const [chartBasis, setChartBasis] = useState<ChartBasis>("sale");
  const { stats, trends, monthlyData, recentActivity, loading } =
    useDashboardStats(chartBasis);

  const statCards = [
    {
      title: t("admin.totalReservations"),
      value: loading ? "..." : stats.totalReservations.toString(),
      icon: CalendarCheck,
      trend: trends.reservations,
    },
    {
      title: t("admin.occupancyRate"),
      value: loading ? "..." : `${stats.occupancyRate}%`,
      icon: TrendingUp,
      trend: trends.occupancy,
    },
    {
      title: t("admin.pendingPayments"),
      value: loading ? "..." : stats.pendingPayments.toString(),
      icon: DollarSign,
      trend: trends.payments,
    },
    {
      title: t("admin.newMessages"),
      value: loading ? "..." : stats.newMessages.toString(),
      icon: MessageSquare,
      trend: trends.messages,
    },
  ];

  const hasMonthlyData = monthlyData.some(
    (d) => d.reservations > 0 || d.revenue > 0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

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
                    stat.trend.startsWith("+") && stat.trend !== "+0%" 
                      ? "text-green-600" 
                      : stat.trend.startsWith("-") 
                        ? "text-red-600" 
                        : "text-muted-foreground"
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

      {/* Chart basis selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs sm:text-sm text-muted-foreground mr-1">
          Base dos gráficos:
        </span>
        <Button
          size="sm"
          variant={chartBasis === "sale" ? "default" : "outline"}
          onClick={() => setChartBasis("sale")}
        >
          Por venda (data da reserva)
        </Button>
        <Button
          size="sm"
          variant={chartBasis === "stay" ? "default" : "outline"}
          onClick={() => setChartBasis("stay")}
        >
          Por estadia (check-in)
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t("admin.recentReservations")}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            {hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="reservations"
                    name="Reservas"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="text-center">
                  Nenhuma reserva nos últimos 6 meses.
                  <br />
                  <span className="text-sm">Os dados aparecerão aqui quando houver reservas reais.</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            {hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Receita" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="text-center">
                  Nenhuma receita registrada nos últimos 6 meses.
                  <br />
                  <span className="text-sm">Os dados aparecerão aqui quando houver reservas reais.</span>
                </p>
              </div>
            )}
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
              <p className="text-muted-foreground text-center py-4 text-sm">
                {loading ? "Carregando..." : "Nenhuma atividade recente com reservas reais"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
