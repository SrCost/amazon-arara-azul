import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarRange,
  MessageSquare,
  LogOut,
  Home,
  Users as UsersIcon,
  DollarSign,
  History,
  Package,
  Images,
  Building2,
  Menu,
  SlidersHorizontal,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      icon: CalendarRange,
      label: "Calendário",
      path: "/admin/calendario-reservas",
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
    {
      icon: SlidersHorizontal,
      label: "Carrossel",
      path: "/admin/carrossel",
    },
  ];

  // Admin e Super Admin têm acesso a Pacotes, Bangalôs e Pagamentos
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

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-2">
          <img 
            src={logoArara} 
            alt="Pousada Arara Azul" 
            width={48}
            height={48}
            loading="eager"
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover"
          />
          <div>
            <h1 className="text-lg lg:text-xl font-display font-bold text-foreground">
              Admin Panel
            </h1>
            <p className="text-xs text-muted-foreground">Pousada Arara Azul</p>
          </div>
        </div>
      </div>

      <nav className="px-2 lg:px-4 space-y-1 lg:space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path} onClick={onItemClick}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start text-sm lg:text-base"
              >
                <Icon className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                {item.label}
              </Button>
            </Link>
          );
        })}

        <div className="pt-4 border-t border-border mt-4">
          <Link to="/" onClick={onItemClick}>
            <Button variant="ghost" className="w-full justify-start text-sm lg:text-base">
              <Home className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
              {t("nav.home")}
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 text-sm lg:text-base"
            onClick={() => {
              onItemClick?.();
              handleSignOut();
            }}
          >
            <LogOut className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
            {t("nav.logout")}
          </Button>
        </div>
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={logoArara} 
            alt="Pousada Arara Azul" 
            width={32}
            height={32}
            loading="eager"
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-display font-bold text-foreground">Admin</span>
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onItemClick={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-card border-r border-border fixed h-full">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 lg:ml-64">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
