import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  Mail,
  BarChart3,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Send,
  Archive,
  History,
  Camera,
  Zap,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import imanLogo from "@/assets/logo-iman.png";
import courrierService from "@/services/courrierService";

/**
 * Menu principal pour le système de registre de courrier RH
 * Navigation simplifiée adaptée au rôle connecté
 */
const userNav = [
  { title: "Tableau de bord", icon: LayoutDashboard, path: "/" },
  { title: "Mes Courriers", icon: Inbox, path: "/mes-courriers" },
  { title: "Documentation", icon: BookOpen, path: "/documentation" },
  { title: "Paramètres", icon: Settings, path: "/admin" },
];

const dgNav = [
  { title: "Tableau de bord", icon: LayoutDashboard, path: "/" },
  { title: "Mes Courriers", icon: Inbox, path: "/mes-courriers" },
  { title: "Historique", icon: History, path: "/historique" },
  { title: "Documentation", icon: BookOpen, path: "/documentation" },
  { title: "Paramètres", icon: Settings, path: "/admin" },
];

const rhAdminNav = [
  { title: "Tableau de bord", icon: LayoutDashboard, path: "/" },
  { title: "Mes Courriers", icon: Inbox, path: "/mes-courriers" },
  { title: "Suivi des Courriers", icon: TrendingUp, path: "/courriers/suivi" },
  { title: "Archives", icon: Archive, path: "/archives" },
  { title: "Historique", icon: History, path: "/historique" },
  { title: "Documentation", icon: BookOpen, path: "/documentation" },
  { title: "Paramètres", icon: Settings, path: "/admin" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [urgentCount, setUrgentCount] = useState(0);
  const location = useLocation();
  const { user } = useAuth();
  const { currentTheme } = useTheme();

  const mainNav = user?.role === "rh" || user?.role === "admin"
    ? rhAdminNav
    : user?.role === "dg"
      ? dgNav
      : userNav;

  // Écouter les changements dans localStorage pour réduire/restaurer la sidebar
  useEffect(() => {
    const handleStorageChange = () => {
      const shouldCollapse = localStorage.getItem('sidebar-collapsed') === 'true';
      setCollapsed(shouldCollapse);
    };

    // Vérifier au montage
    handleStorageChange();

    // Écouter les événements storage
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Charger le nombre de courriers urgents
  useEffect(() => {
    const loadUrgentCount = async () => {
      try {
        const courriers = await courrierService.getCourriers({});
        const urgents = courriers.filter(c => c.urgent);
        setUrgentCount(urgents.length);
      } catch (error) {
        console.error("Erreur lors du chargement des courriers urgents:", error);
      }
    };

    loadUrgentCount();
    // Recharger toutes les 30 secondes
    const interval = setInterval(loadUrgentCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const linkClass = (path: string) => {
    const active = location.pathname === path;
    return `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
      active
        ? `${currentTheme.colors.sidebarActiveBg} ${currentTheme.colors.sidebarActiveText} border-l-4 ${currentTheme.colors.sidebarBorder}`
        : `${currentTheme.colors.sidebarText} hover:${currentTheme.colors.sidebarActiveBg} hover:${currentTheme.colors.sidebarActiveText}`
    } ${collapsed ? "justify-center px-2" : ""}`;
  };

  return (
    <aside
      className={`${currentTheme.colors.sidebarBg} h-screen sticky top-0 flex flex-col border-r border-gray-700/30 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo et titre de l'application */}
      <div className={`flex items-center justify-center h-16 px-4 border-b border-gray-700/30`}>
        {!collapsed ? (
          <img src={imanLogo} alt="IMAN" className="h-9 object-contain brightness-0 invert" />
        ) : (
          <span className={`text-lg font-bold ${currentTheme.colors.sidebarActiveText}`}>I</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {mainNav.map((item) => (
          <NavLink key={item.path} to={item.path} className={linkClass(item.path)}>
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="flex-1">{item.title}</span>}
            {/* {!collapsed && item.badge && urgentCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-full">
                {urgentCount}
              </span> 
            )} */}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => {
          const newCollapsed = !collapsed;
          setCollapsed(newCollapsed);
          localStorage.setItem('sidebar-collapsed', newCollapsed.toString());
        }}
        className={`flex items-center justify-center h-10 mx-3 mb-3 rounded-lg ${currentTheme.colors.sidebarText} hover:${currentTheme.colors.sidebarActiveText} hover:${currentTheme.colors.sidebarActiveBg} transition-colors`}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
