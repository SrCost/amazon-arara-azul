import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CalendarCheck,
  MessageSquare,
  LogOut,
  Home,
  Users as UsersIcon,
  DollarSign,
  History,
  Package,
  Images,
  Building2,
} from "lucide-react";
import logoArara from "@/assets/logo-arara-azul.jpg";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin, isSuperAdmin, user, loading } = useAuth();

  // Allow access to all authenticated users (user, admin, super_admin)
  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  if (loading) {
    return null; // Show nothing while checking auth
  }

  // Menu items baseado em permissões
  // Usuário: apenas Messages, Reservations, Dashboard
  // Admin: Messages, Reservations, Dashboard, Payments
  // Super Admin: tudo, incluindo Users
  
  const baseMenuItems = [
    {
      icon: LayoutDashboard,
      label: t("admin.dashboard"),
      path: "/admin",
    },
    {
      icon: CalendarCheck,
      label: t("admin.reservations"),
      path: "/admin/reservations",
    },
    {
      icon: MessageSquare,
      label: t("admin.messages"),
      path: "/admin/messages",
    },
    {
      icon: Images,
      label: "Galeria",
      path: "/admin/gallery",
    },
  ];

  // Admin e Super Admin têm acesso adicional a Payments, Packages e Bangalôs
  const adminItems = isAdmin || isSuperAdmin
    ? [
        {
          icon: Package,
          label: "Pacotes",
          path: "/admin/packages",
        },
        {
          icon: Building2,
          label: "Bangalôs",
          path: "/admin/bangalos",
        },
        {
          icon: DollarSign,
          label: "Pagamentos",
          path: "/admin/payments",
        },
      ]
    : [];

  // Apenas Super Admin tem acesso a Users e Audit
  const superAdminItems = isSuperAdmin
    ? [
        {
          icon: UsersIcon,
          label: t("admin.users"),
          path: "/admin/users",
        },
        {
          icon: History,
          label: "Histórico",
          path: "/admin/audit",
        },
      ]
    : [];

  const menuItems = [...baseMenuItems, ...adminItems, ...superAdminItems];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <img 
              src={logoArara} 
              alt="Pousada Arara Azul" 
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                Admin Panel
              </h1>
              <p className="text-xs text-muted-foreground">Pousada Arara Azul</p>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-border mt-4">
            <Link to="/">
              <Button variant="ghost" className="w-full justify-start">
                <Home className="h-5 w-5 mr-3" />
                {t("nav.home")}
              </Button>
            </Link>

            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {t("nav.logout")}
            </Button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;
