import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  Share2,
  Camera,
  Zap,
  BookOpen,
} from "lucide-react";
import imanLogo from "@/assets/logo-iman.png";
import courrierService from "@/services/courrierService";

/**
 * Menu principal pour le système de registre de courrier RH
 * Navigation simplifiée adaptée à la gestion du courrier
 */
const mainNav = [
  { title: "Tableau de bord", icon: LayoutDashboard, path: "/" },
  { title: "Mes Courriers", icon: Inbox, path: "/mes-courriers" },
  { title: "Registre", icon: Mail, path: "/courriers" },
  // { title: "Prioritaires", icon: Zap, path: "/courriers/prioritaires", badge: false }, // badge mis à jour dynamiquement
  { title: "Scanner", icon: Camera, path: "/scan" },
  { title: "Archives", icon: Archive, path: "/archives" },
  { title: "Historique", icon: Share2, path: "/partages" },
 
];

/**
 * Menu administration (visible uniquement pour les admins et RH)
 */
const adminNav = [
   { title: "Documentation", icon: BookOpen, path: "/documentation" },
  { title: "Paramètres", icon: Settings, path: "/admin" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [urgentCount, setUrgentCount] = useState(0);
  const location = useLocation();
  const { isAdmin } = useAuth();

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
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
    } ${collapsed ? "justify-center px-2" : ""}`;
  };

  return (
    <aside
      className={`bg-sidebar text-sidebar-foreground h-screen sticky top-0 flex flex-col border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo et titre de l'application */}
      <div className={`flex items-center justify-center h-16 px-4 border-b border-sidebar-border`}>
        {!collapsed ? (
          <img src={imanLogo} alt="IMAN" className="h-9 object-contain brightness-0 invert" />
        ) : (
          <span className="text-lg font-bold text-sidebar-primary">I</span>
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

        {isAdmin && (
          <>
            <div className={`border-t border-sidebar-border my-4 ${collapsed ? "mx-1" : ""}`} />

            {adminNav.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClass(item.path)}>
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 mx-3 mb-3 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
