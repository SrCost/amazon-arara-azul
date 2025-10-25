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
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin, isSuperAdmin } = useAuth();

  if (!isAdmin && !isSuperAdmin) {
    navigate("/auth");
    return null;
  }

  const menuItems = [
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
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">Pousadas Amazônia</p>
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
