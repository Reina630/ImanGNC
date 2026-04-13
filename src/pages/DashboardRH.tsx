import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Inbox,
  Send,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Filter,
  RefreshCw,
  Archive,
  CheckCircle,
  Clock,
  UserCheck,
  MoreVertical,
  FileText,
  Building,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import courrierService from "@/services/courrierService";
import { api } from "@/services";

/**
 * Dashboard Design - Inspiré de MailSystem avec données réelles de l'API
 * Page pour travailler sur le design avec données en temps réel
 */

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Icon mapping pour les courriers
const ICON_MAP: Record<string, any> = {
  'Inbox': Inbox,
  'Send': Send,
  'Mail': Mail,
  'FileText': FileText,
  'AlertTriangle': AlertTriangle,
};

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

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
}

function getLogDotColor(action_type: string): string {
  if (action_type.startsWith('courrier_create') || action_type.startsWith('affectation_validate') || action_type.startsWith('affectation_sign')) return 'bg-emerald-500';
  if (action_type.startsWith('affectation_create') || action_type.startsWith('affectation_start')) return 'bg-blue-500';
  if (action_type.startsWith('courrier_archive') || action_type.startsWith('affectation_reject')) return 'bg-red-500';
  if (action_type.startsWith('urgent')) return 'bg-orange-500';
  return 'bg-slate-400';
}

export default function DashboardRH() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("30days");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

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
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
            <p className="text-sm text-slate-500 mt-1">Vue d'ensemble de l'activité des courriers</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#800020] hover:bg-[#600018] text-white gap-2">
                <Plus className="h-4 w-4" />
                Nouveau courrier
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/courriers/nouveau?type=entrant")} className="gap-2 cursor-pointer">
                <Inbox className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Courrier Entrant</div>
                  <div className="text-xs text-slate-500">Courrier reçu de l'extérieur</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/courriers/nouveau?type=sortant")} className="gap-2 cursor-pointer">
                <Send className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Courrier Sortant</div>
                  <div className="text-xs text-slate-500">Courrier à envoyer</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/courriers/nouveau?type=interne")} className="gap-2 cursor-pointer">
                <Building className="h-4 w-4 text-amber-600" />
                <div>
                  <div className="font-medium">Courrier Interne</div>
                  <div className="text-xs text-slate-500">Communication interne</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 pt-6">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
          
          {/* Filters Bar */}
          {/* <motion.section variants={item} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">30 derniers jours</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-xs font-medium">Tous les statuts</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Haute priorité</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Building className="h-4 w-4" />
              <span className="text-xs font-medium">Départements</span>
            </Button>
            <Button variant="ghost" size="sm" className="ml-auto text-[#800020] hover:text-[#800020] gap-2" onClick={loadDashboardData}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Actualiser les données</span>
            </Button>
          </motion.section> */}

          {/* KPI Cards */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData.kpis?.map((kpi: any, index: number) => (
              <div key={index} className={`p-4 rounded-xl shadow-sm border ${kpi.color} hover:shadow-md transition-shadow`}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">{kpi.label}</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-extrabold text-slate-900">{kpi.value}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold ${
                    kpi.positive ? 'text-emerald-600 bg-emerald-100/60' : 'text-amber-700 bg-amber-100/60'
                  }`}>
                    {kpi.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.change}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-12 gap-8">
            
            {/* Left Content - 8 columns */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              
              {/* Lifecycle Flow */}
              <motion.section variants={item} className="bg-[#f2f4f6] p-8 rounded-xl shadow-sm border border-slate-200/50">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-lg font-bold text-slate-900">Flux de traitement</h2>
                  <span className="text-xs text-slate-500 font-medium">Statut du pipeline en temps réel</span>
                </div>
                
                <div className="relative flex items-center justify-between px-4">
                  {/* Gradient Line */}
                  <div className="absolute top-[20px] left-8 right-8 h-1 rounded-full -z-0 opacity-60 bg-gradient-to-r from-red-500 via-blue-500 to-slate-400"></div>
                  
                  {/* Lifecycle Steps */}
                  {dashboardData.lifecycle?.map((step: any, index: number) => {
                    const IconComponent = step.label === "Enregistrés" ? Mail :
                                         step.label === "Affectés" ? UserCheck :
                                         step.label === "En traitement" ? Clock :
                                         step.label === "Validés" ? CheckCircle :
                                         Archive;
                    
                    return (
                      <div key={index} className="relative z-10 flex flex-col items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white mb-3 shadow-md"
                          style={{ backgroundColor: step.color }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-900">{step.label}</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {step.count.toLocaleString()} items
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.section>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Mail Type Distribution */}
                <motion.div variants={item} className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50">
                  <h3 className="text-sm font-bold mb-6">Distribution par type</h3>
                  <div className="flex items-center gap-8">
                    {/* Donut Chart — dynamic */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        {/* Background track */}
                        <circle className="text-slate-100" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="12" />
                        {/* One arc per distribution item */}
                        {(() => {
                          const circ = 2 * Math.PI * 54; // ≈339.292
                          let cumDeg = 0;
                          return dashboardData.distribution?.map((d: any, i: number) => {
                            const pct   = Math.max(0, Math.min(100, d.percent));
                            const dash  = (pct / 100) * circ;
                            const offset = circ - dash;
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

                    {/* Legend */}
                    <div className="space-y-3">
                      {dashboardData.distribution?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="text-xs text-slate-600 font-semibold">{item.name} ({item.percent}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Processing Trend */}
                <motion.div variants={item} className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold">Tendance de traitement</h3>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#800020]/20"></span>
                      <span className="w-2 h-2 rounded-full bg-[#800020]"></span>
                    </div>
                  </div>
                  <div className="h-32 flex items-end gap-2 px-2">
                    {dashboardData.weeklyTrend?.map((day: any, index: number) => {
                      const isActive = index >= 3 && index <= 5;
                      return (
                        <div 
                          key={index} 
                          className={`flex-1 rounded-t-sm transition-all hover:opacity-80 ${
                            isActive ? 'bg-[#800020]' : 'bg-slate-200/50'
                          }`}
                          style={{ height: `${day.value}%` }}
                        ></div>
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

              {/* Recent Mails Table */}
              <motion.section variants={item} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-900">Courriers récents enregistrés</h2>
                  <Button variant="ghost" size="sm" className="text-[#800020] hover:text-[#800020]">
                    Voir tout
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-600 tracking-widest">
                        <th className="px-6 py-4">Objet & Expéditeur</th>
                        <th className="px-6 py-4">Reçu</th>
                            <th className="px-6 py-4">Catégorie</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dashboardData.recentMails?.map((mail: any) => {
                        const MailIcon = ICON_MAP[mail.icon] || Mail;
                        return (
                          <tr key={mail.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg ${mail.iconColor} flex items-center justify-center`}>
                                  <MailIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{mail.subject}</p>
                                  <p className="text-[11px] text-slate-500">{mail.sender}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-700 font-medium">{mail.received}</td>
                            <td className="px-6 py-4">
                              <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                                {mail.department}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                variant={mail.status === 'urgent' ? 'destructive' : mail.status === 'in_progress' ? 'default' : 'outline'}
                                className="text-[10px] font-bold"
                              >
                                {mail.status === 'pending' && 'En attente'}
                                {mail.status === 'in_progress' && 'En cours'}
                                {mail.status === 'urgent' && 'Urgent'}
                                {mail.status === 'completed' && 'Complété'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4 text-slate-400" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.section>

            </div>

            {/* Right Sidebar - 4 columns */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              
              {/* Urgent Attention */}
              <motion.section variants={item} className="bg-[#f2f4f6]/60 p-6 rounded-xl border border-red-100/30 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12"></div>
                <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-4 relative z-10">
                  <AlertCircle className="h-5 w-5" />
                  Attention urgente ({dashboardData.urgentItems?.length || 0})
                </h3>
                <div className="space-y-4 relative z-10">
                  {dashboardData.urgentItems && dashboardData.urgentItems.length > 0 ? (
                    <>
                      {dashboardData.urgentItems.map((item: any) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition-shadow">
                          <p className="text-xs font-bold text-slate-900 mb-1 truncate">{item.numero_registre}</p>
                          <p className="text-[10px] text-slate-600 font-medium mb-2">{item.title}</p>
                          <p className="text-[10px] text-slate-500 mb-2">{item.subtitle}</p>
                          <div className="flex justify-between items-center">
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              {item.department}
                            </Badge>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-[10px] text-[#800020] font-bold p-0 h-auto gap-1"
                              onClick={() => navigate(`/courriers/${item.id}`)}
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
                    <p className="text-xs text-slate-400 text-center py-4">Aucun courrier critique en attente</p>
                  )}
                </div>
              </motion.section>

              {/* Service Workload */}
              <motion.section variants={item} className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50">
                <h3 className="text-sm font-bold mb-6">Charge de travail par service</h3>
                <div className="space-y-6">
                  {dashboardData.serviceWorkload?.map((service: any, index: number) => (
                    <div key={index}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-700 font-bold">{service.name}</span>
                        <span className="font-extrabold" style={{ color: service.color.replace('bg-', '').replace('[', '').replace(']', '') }}>
                          {service.percent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${service.color} rounded-full transition-all`}
                          style={{ width: `${service.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Activity Feed */}
              <motion.section variants={item} className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50">
                <h3 className="text-sm font-bold mb-6">Fil d'activité</h3>
                <div className="space-y-4">
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">Aucune activité récente</p>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getLogDotColor(log.action_type)}`}></div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{log.action_type_display}</p>
                          <p className="text-[10px] text-slate-500">
                            {log.courrier_numero ? `${log.courrier_numero} · ` : ""}{log.utilisateur_nom_complet || log.utilisateur_username}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatRelativeTime(log.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-4 text-xs" onClick={() => navigate("/historique")}>
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
