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
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  Compass,
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

  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  if (loading) {
    return null;
  }

  const menuItems = ADMIN_MODULES.filter((m) => hasModule(m.key)).map((m) => ({
    icon: m.icon,
    label: m.key === "dashboard" ? t("admin.dashboard")
      : m.key === "reservations" ? t("admin.reservations")
      : m.key === "messages" ? t("admin.messages")
      : m.key === "users" ? t("admin.users")
      : m.label,
    path: m.path,
  }));


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

      <nav className="px-2 lg:px-4 space-y-0.5 lg:space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path} onClick={onItemClick}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start text-sm min-h-[44px]"
              >
                <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                {item.label}
              </Button>
            </Link>
          );
        })}

        <div className="pt-3 border-t border-border mt-3">
          <Link to="/" onClick={onItemClick}>
            <Button variant="ghost" className="w-full justify-start text-sm min-h-[44px]">
              <Home className="h-4 w-4 mr-2 flex-shrink-0" />
              {t("nav.home")}
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 text-sm min-h-[44px]"
            onClick={() => {
              onItemClick?.();
              handleSignOut();
            }}
          >
            <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
            {t("nav.logout")}
          </Button>
        </div>
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Header — hamburger on LEFT */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-3 py-2.5 flex items-center gap-3">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
            <SidebarContent onItemClick={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 min-w-0">
          <img 
            src={logoArara} 
            alt="Pousada Arara Azul" 
            width={32}
            height={32}
            loading="eager"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <span className="font-display font-bold text-foreground text-sm truncate">Admin</span>
        </div>
      </div>

      {/* Dark overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-card border-r border-border fixed h-full overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-[52px] lg:pt-0 lg:ml-64 px-3 sm:px-4 lg:px-0">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
