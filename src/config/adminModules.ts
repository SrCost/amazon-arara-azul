import {
  LayoutDashboard,
  CalendarCheck,
  CalendarRange,
  MessageSquare,
  Users as UsersIcon,
  DollarSign,
  History,
  Package,
  Images,
  Building2,
  SlidersHorizontal,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  Compass,
  type LucideIcon,
} from "lucide-react";

export type AdminRole = "user" | "admin" | "super_admin";

export interface AdminModule {
  key: string;
  label: string;
  path: string;
  minRole: AdminRole;
  icon: LucideIcon;
  /** Enabled by default when creating a new user */
  defaultEnabled: boolean;
}

export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
};

export const ADMIN_MODULES: AdminModule[] = [
  { key: "dashboard", label: "Dashboard", path: "/admin", minRole: "user", icon: LayoutDashboard, defaultEnabled: true },
  { key: "calendar", label: "Calendário", path: "/admin/calendario-reservas", minRole: "user", icon: CalendarRange, defaultEnabled: true },
  { key: "reservations", label: "Reservas", path: "/admin/reservations", minRole: "user", icon: CalendarCheck, defaultEnabled: true },
  { key: "messages", label: "Mensagens", path: "/admin/messages", minRole: "user", icon: MessageSquare, defaultEnabled: true },
  { key: "gallery", label: "Galeria", path: "/admin/gallery", minRole: "user", icon: Images, defaultEnabled: false },
  { key: "carousel", label: "Carrossel", path: "/admin/carrossel", minRole: "admin", icon: SlidersHorizontal, defaultEnabled: false },
  { key: "automation", label: "Automação", path: "/admin/guest-automation", minRole: "admin", icon: ClipboardCheck, defaultEnabled: false },
  { key: "forms", label: "Formulários", path: "/admin/formularios", minRole: "admin", icon: ClipboardList, defaultEnabled: false },
  { key: "fnrh", label: "FNRH", path: "/admin/fnrh", minRole: "admin", icon: FileCheck2, defaultEnabled: false },
  { key: "packages", label: "Pacotes", path: "/admin/packages", minRole: "admin", icon: Package, defaultEnabled: false },
  { key: "bungalows", label: "Bangalôs", path: "/admin/bangalos", minRole: "admin", icon: Building2, defaultEnabled: false },
  { key: "experiences", label: "Experiências", path: "/admin/experiencias", minRole: "admin", icon: Compass, defaultEnabled: false },
  { key: "payments", label: "Pagamentos", path: "/admin/payments", minRole: "admin", icon: DollarSign, defaultEnabled: false },
  { key: "users", label: "Usuários", path: "/admin/users", minRole: "super_admin", icon: UsersIcon, defaultEnabled: false },
  { key: "audit", label: "Histórico", path: "/admin/audit", minRole: "super_admin", icon: History, defaultEnabled: false },
];

export const ADMIN_MODULE_KEYS = ADMIN_MODULES.map((m) => m.key);

export const DEFAULT_ENABLED_MODULES = ADMIN_MODULES.filter((m) => m.defaultEnabled).map((m) => m.key);

export const getModule = (key: string) => ADMIN_MODULES.find((m) => m.key === key);

/**
 * Decides whether a module is visible/accessible.
 * - super_admin always has everything
 * - role acts as a ceiling (module.minRole must be satisfied)
 * - when the user has no saved permissions at all, fall back to role-only behaviour
 */
export const canAccessModule = (
  moduleKey: string,
  role: AdminRole,
  permissions: Record<string, boolean> | null,
): boolean => {
  const mod = getModule(moduleKey);
  if (!mod) return false;
  if (role === "super_admin") return true;
  if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY[mod.minRole]) return false;
  if (!permissions || Object.keys(permissions).length === 0) return true;
  return permissions[moduleKey] === true;
};
