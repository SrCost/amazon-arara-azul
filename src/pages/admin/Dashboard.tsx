import { useTranslation } from "react-i18next";
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

const Dashboard = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t("admin.totalReservations"),
      value: "156",
      icon: CalendarCheck,
      trend: "+12.5%",
    },
    {
      title: t("admin.occupancyRate"),
      value: "78%",
      icon: TrendingUp,
      trend: "+5.2%",
    },
    {
      title: t("admin.pendingPayments"),
      value: "23",
      icon: DollarSign,
      trend: "-3.1%",
    },
    {
      title: t("admin.newMessages"),
      value: "47",
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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {t("admin.dashboard")}
        </h1>
        <p className="text-muted-foreground">{t("common.welcome")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-forest flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    stat.trend.startsWith("+") ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-sm text-muted-foreground mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.recentReservations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
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
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "Nova reserva", user: "João Silva", time: "5 min atrás" },
              { action: "Pagamento confirmado", user: "Maria Santos", time: "12 min atrás" },
              { action: "Nova mensagem", user: "Pedro Costa", time: "1 hora atrás" },
              { action: "Reserva cancelada", user: "Ana Lima", time: "2 horas atrás" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium text-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.user}</p>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
