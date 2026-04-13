import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Inbox,
  Send,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  UserCheck,
  FileText,
  Building,
  AlertTriangle,
  ArrowRight,
  Plus,
  ChevronDown,
  Archive,
  CheckCircle,
  CheckCircle2,
  Eye,
  Download,
  Loader2,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import courrierService from "@/services/courrierService";
import { api } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Courrier } from "@/types";

// ─── Animation variants ───────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Icon map (matching DashboardRH) ─────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
  Inbox,
  Send,
  Mail,
  FileText,
  AlertTriangle,
};

// ─── Activity log types ───────────────────────────────────────────────────────
interface ActivityLog {
  id: number;
  action_type: string;
  action_type_display: string;
  description: string;
  utilisateur_username: string;
  utilisateur_nom_complet: string;
  courrier_numero: string;
  timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
}

function getLogDotColor(action_type: string): string {
  if (
    action_type.startsWith("courrier_create") ||
    action_type.startsWith("affectation_validate") ||
    action_type.startsWith("affectation_sign")
  )
    return "bg-emerald-500";
  if (
    action_type.startsWith("affectation_create") ||
    action_type.startsWith("affectation_start")
  )
    return "bg-blue-500";
  if (
    action_type.startsWith("courrier_archive") ||
    action_type.startsWith("affectation_reject")
  )
    return "bg-red-500";
  if (action_type.startsWith("urgent")) return "bg-orange-500";
  return "bg-slate-400";
}

const statutColor = (s: string) => {
  if (s === "Reçu" || s === "recu")
    return "bg-amber-100 text-amber-700 border-amber-200";
  if (s === "En traitement" || s === "en_traitement")
    return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "Traité" || s === "traite")
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-muted text-muted-foreground border-border";
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardDG() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Global stats (same as RH)
  useEffect(() => {
    loadDashboardData();
    loadActivityLogs();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await courrierService.getStatistiques();
      setDashboardData(data);
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const response = await api.get("/action-logs/", {
        params: { ordering: "-timestamp", page_size: 3 },
      });
      const results = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setActivityLogs(results.slice(0, 3));
    } catch (error) {
      console.error("Erreur chargement activité:", error);
    }
  };

  // DG's own courriers (from affectations)
  const { data: mesCourriers = [], isLoading: coursLoading } = useQuery({
    queryKey: ["mes-courriers-dg"],
    queryFn: () => courrierService.getMesCourriers(),
  });

  // Sort: urgent non-traités first, then by date desc
  const courriersPrioritaires = useMemo(() => {
    return [...mesCourriers].sort((a, b) => {
      // urgent non-traité → top
      const aUrgentPending = a.urgent && a.statut !== "traite" ? 1 : 0;
      const bUrgentPending = b.urgent && b.statut !== "traite" ? 1 : 0;
      if (bUrgentPending !== aUrgentPending) return bUrgentPending - aUrgentPending;
      // then by date desc
      return (
        new Date(b.date_principale || b.created_at || 0).getTime() -
        new Date(a.date_principale || a.created_at || 0).getTime()
      );
    });
  }, [mesCourriers]);

  const nbUrgentsNonTraites = useMemo(
    () => mesCourriers.filter((c) => c.urgent && c.statut !== "traite").length,
    [mesCourriers]
  );

  const handleConsulter = (courrier: Courrier) => {
    const affectationV2 = courrier.affectations_v2?.find(
      (aff) => aff.destinataire === user?.id
    );
    if (affectationV2) {
      navigate(`/mes-courriers/traiter/${courrier.id}?affectation=${affectationV2.id}`);
    } else {
      navigate(`/courriers/${courrier.id}`);
    }
  };

  const handleTelecharger = async (courrier: Courrier) => {
    try {
      await courrierService.telechargerFichier(courrier.id, courrier.numero_registre);
      toast.success("Téléchargement démarré");
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020] mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
            <p className="text-sm text-slate-500 mt-1">
              Vue d'ensemble · courriers vous concernant en priorité
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-slate-500 hover:text-slate-700"
              onClick={() => { loadDashboardData(); }}
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#800020] hover:bg-[#600018] text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau courrier
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => navigate("/courriers/nouveau?type=entrant")}
                  className="gap-2 cursor-pointer"
                >
                  <Inbox className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Courrier Entrant</div>
                    <div className="text-xs text-slate-500">Courrier reçu de l'extérieur</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/courriers/nouveau?type=sortant")}
                  className="gap-2 cursor-pointer"
                >
                  <Send className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">Courrier Sortant</div>
                    <div className="text-xs text-slate-500">Courrier à envoyer</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/courriers/nouveau?type=interne")}
                  className="gap-2 cursor-pointer"
                >
                  <Building className="h-4 w-4 text-amber-600" />
                  <div>
                    <div className="font-medium">Courrier Interne</div>
                    <div className="text-xs text-slate-500">Communication interne</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="p-8 pt-6">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

          {/* KPI Cards */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData.kpis?.map((kpi: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-xl shadow-sm border ${kpi.color} hover:shadow-md transition-shadow`}
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                  {kpi.label}
                </p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-extrabold text-slate-900">{kpi.value}</h3>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold ${
                      kpi.positive
                        ? "text-emerald-600 bg-emerald-100/60"
                        : "text-amber-700 bg-amber-100/60"
                    }`}
                  >
                    {kpi.positive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {kpi.change}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-8">

            {/* Left — 8 cols */}
            <div className="col-span-12 lg:col-span-8 space-y-8">

              {/* Lifecycle Flow */}
              <motion.section
                variants={item}
                className="bg-[#f2f4f6] p-8 rounded-xl shadow-sm border border-slate-200/50"
              >
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-lg font-bold text-slate-900">Flux de traitement</h2>
                  <span className="text-xs text-slate-500 font-medium">
                    Statut du pipeline en temps réel
                  </span>
                </div>
                <div className="relative flex items-center justify-between px-4">
                  <div className="absolute top-[20px] left-8 right-8 h-1 rounded-full -z-0 opacity-60 bg-gradient-to-r from-red-500 via-blue-500 to-slate-400"></div>
                  {dashboardData.lifecycle?.map((step: any, index: number) => {
                    const IconComponent =
                      step.label === "Enregistrés"
                        ? Mail
                        : step.label === "Affectés"
                        ? UserCheck
                        : step.label === "En traitement"
                        ? Clock
                        : step.label === "Validés"
                        ? CheckCircle
                        : Archive;
                    return (
                      <div key={index} className="relative z-10 flex flex-col items-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white mb-3 shadow-md"
                          style={{ backgroundColor: step.color }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-900">
                          {step.label}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {step.count.toLocaleString()} items
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.section>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Distribution donut */}
                <motion.div
                  variants={item}
                  className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50"
                >
                  <h3 className="text-sm font-bold mb-6">Distribution par type</h3>
                  <div className="flex items-center gap-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        {/* Background track */}
                        <circle className="text-slate-100" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="12" />
                        {/* Dynamic arcs */}
                        {(() => {
                          const circ = 2 * Math.PI * 54;
                          let cumDeg = 0;
                          return dashboardData.distribution?.map((d: any, i: number) => {
                            const pct = Math.max(0, Math.min(100, d.percent));
                            const dash = (pct / 100) * circ;
                            const rotation = cumDeg;
                            cumDeg += (pct / 100) * 360;
                            return (
                              <circle
                                key={i}
                                cx="64" cy="64"
                                fill="transparent"
                                r="54"
                                stroke={d.color}
                                strokeWidth="12"
                                strokeDasharray={`${dash} ${circ - dash}`}
                                strokeDashoffset={0}
                                style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "center" }}
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-extrabold text-slate-900">100%</span>
                        <span className="text-[10px] text-slate-500 font-medium">Volume</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {dashboardData.distribution?.map((d: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="text-xs text-slate-600 font-semibold">
                            {d.name} ({d.percent}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Weekly trend bars */}
                <motion.div
                  variants={item}
                  className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold">Tendance de traitement</h3>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#800020]/20" />
                      <span className="w-2 h-2 rounded-full bg-[#800020]" />
                    </div>
                  </div>
                  <div className="h-32 flex items-end gap-2 px-2">
                    {dashboardData.weeklyTrend?.map((day: any, index: number) => {
                      const isActive = index >= 3 && index <= 5;
                      return (
                        <div
                          key={index}
                          className={`flex-1 rounded-t-sm transition-all hover:opacity-80 ${
                            isActive ? "bg-[#800020]" : "bg-slate-200/50"
                          }`}
                          style={{ height: `${day.value}%` }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold px-1">
                    {dashboardData.weeklyTrend?.map((day: any, index: number) => (
                      <span key={index}>{day.day}</span>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* ── Mes courriers (urgents en premier) ──────────────────────── */}
              <motion.section
                variants={item}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900">Mes courriers</h2>
                    {nbUrgentsNonTraites > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {nbUrgentsNonTraites} urgent{nbUrgentsNonTraites > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#800020] hover:text-[#800020]"
                    onClick={() => navigate("/mes-courriers")}
                  >
                    Voir tout
                  </Button>
                </div>

                {coursLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#800020]" />
                  </div>
                ) : courriersPrioritaires.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Inbox className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 text-sm">Aucun courrier affecté</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-600 tracking-widest">
                          <th className="px-6 py-4">Objet &amp; Expéditeur</th>
                          <th className="px-6 py-4 hidden md:table-cell">Reçu</th>
                          <th className="px-6 py-4">Priorité</th>
                          <th className="px-6 py-4">Statut</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {courriersPrioritaires.slice(0, 8).map((c) => (
                          <tr
                            key={c.id}
                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                              c.urgent && c.statut !== "traite"
                                ? "border-l-4 border-l-red-400"
                                : ""
                            }`}
                            onClick={() => handleConsulter(c)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    c.urgent && c.statut !== "traite"
                                      ? "bg-red-100"
                                      : "bg-slate-100"
                                  }`}
                                >
                                  {c.type_courrier === "entrant" ? (
                                    <Inbox
                                      className={`h-4 w-4 ${
                                        c.urgent && c.statut !== "traite"
                                          ? "text-red-500"
                                          : "text-slate-500"
                                      }`}
                                    />
                                  ) : (
                                    <Send
                                      className={`h-4 w-4 ${
                                        c.urgent && c.statut !== "traite"
                                          ? "text-red-500"
                                          : "text-slate-500"
                                      }`}
                                    />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900 leading-tight">
                                    {c.objet}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {c.expediteur} · {c.numero_registre}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-700 font-medium hidden md:table-cell">
                              {formatDate(c.date_principale)}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  c.urgent
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {c.urgent ? "Urgent" : "Normal"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${statutColor(c.statut)}`}
                              >
                                {c.statut_display}
                              </Badge>
                            </td>
                            <td
                              className="px-6 py-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleConsulter(c)}>
                                    <Eye className="h-4 w-4 mr-2" /> Consulter
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTelecharger(c)}>
                                    <Download className="h-4 w-4 mr-2" /> Télécharger
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.section>
            </div>

            {/* Right Sidebar — 4 cols */}
            <div className="col-span-12 lg:col-span-4 space-y-8">

              {/* Urgent attention (global, from stats) */}
              <motion.section
                variants={item}
                className="bg-[#f2f4f6]/60 p-6 rounded-xl border border-red-100/30 relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12" />
                <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-4 relative z-10">
                  <AlertCircle className="h-5 w-5" />
                  Attention urgente ({dashboardData.urgentItems?.length || 0})
                </h3>
                <div className="space-y-4 relative z-10">
                  {dashboardData.urgentItems && dashboardData.urgentItems.length > 0 ? (
                    <>
                      {dashboardData.urgentItems.map((urgentItem: any) => (
                        <div
                          key={urgentItem.id}
                          className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition-shadow"
                        >
                          <p className="text-xs font-bold text-slate-900 mb-1 truncate">
                            {urgentItem.numero_registre}
                          </p>
                          <p className="text-[10px] text-slate-600 font-medium mb-2">
                            {urgentItem.title}
                          </p>
                          <p className="text-[10px] text-slate-500 mb-2">{urgentItem.subtitle}</p>
                          <div className="flex justify-between items-center">
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              {urgentItem.department}
                            </Badge>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-[10px] text-[#800020] font-bold p-0 h-auto gap-1"
                              onClick={() => navigate(`/courriers/${urgentItem.id}`)}
                            >
                              Voir le courrier
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 text-xs text-[#800020] border-[#800020]/20 hover:bg-[#800020]/5"
                        onClick={() => navigate("/courriers/suivi")}
                      >
                        Voir plus
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Aucun courrier critique en attente
                    </p>
                  )}
                </div>
              </motion.section>

              {/* Service Workload */}
              <motion.section
                variants={item}
                className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50"
              >
                <h3 className="text-sm font-bold mb-6">Charge de travail par service</h3>
                <div className="space-y-6">
                  {dashboardData.serviceWorkload?.map((service: any, index: number) => (
                    <div key={index}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-700 font-bold">{service.name}</span>
                        <span
                          className="font-extrabold"
                          style={{
                            color: service.color
                              .replace("bg-", "")
                              .replace("[", "")
                              .replace("]", ""),
                          }}
                        >
                          {service.percent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${service.color} rounded-full transition-all`}
                          style={{ width: `${service.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Activity Feed */}
              <motion.section
                variants={item}
                className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50"
              >
                <h3 className="text-sm font-bold mb-6">Fil d'activité</h3>
                <div className="space-y-4">
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">
                      Aucune activité récente
                    </p>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getLogDotColor(
                            log.action_type
                          )}`}
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {log.action_type_display}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {log.courrier_numero ? `${log.courrier_numero} · ` : ""}
                            {log.utilisateur_nom_complet || log.utilisateur_username}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatRelativeTime(log.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4 text-xs"
                  onClick={() => navigate("/historique")}
                >
                  Voir l'historique complet
                </Button>
              </motion.section>

            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
