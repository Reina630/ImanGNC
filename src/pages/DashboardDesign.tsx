import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Dashboard Design - Inspiré de MailSystem avec données fictives
 * Page pour travailler sur le design avant l'implémentation finale
 */

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Données fictives
const MOCK_DATA = {
  kpis: [
    { label: "Total courriers", value: "2,842", change: "+4%", positive: true, color: "bg-sky-50/80 border-sky-100" },
    { label: "Reçus aujourd'hui", value: "148", change: "+12%", positive: true, color: "bg-sky-50/80 border-sky-100" },
    { label: "En attente", value: "64", change: "-2%", positive: false, color: "bg-amber-50/80 border-amber-100" },
    { label: "Urgents", value: "12", change: "Élevé", positive: false, color: "bg-red-50/80 border-red-100" },
  ],
  
  lifecycle: [
    { label: "Enregistrés", count: 142, icon: Mail, color: "bg-red-500" },
    { label: "Affectés", count: 85, icon: UserCheck, color: "bg-sky-400" },
    { label: "En traitement", count: 216, icon: Clock, color: "bg-blue-700" },
    { label: "Validés", count: 1204, icon: CheckCircle, color: "bg-emerald-500" },
    { label: "Archivés", count: 18400, icon: Archive, color: "bg-slate-400" },
  ],
  
  distribution: [
    { name: "Factures", percent: 40, color: "#800020" },
    { name: "Administratif", percent: 35, color: "#505f76" },
    { name: "Personnel", percent: 25, color: "#c3c6d6" },
  ],
  
  urgentItems: [
    {
      id: 1,
      title: "Réclamation légale #8821",
      subtitle: "En retard de 4 heures",
      department: "Juridique",
      status: "urgent"
    },
    {
      id: 2,
      title: "Demande d'expédition urgente",
      subtitle: "Priorité: Niveau 1",
      department: "Logistique",
      status: "urgent"
    },
  ],
  
  recentMails: [
    {
      id: 1,
      subject: "Facture-2024-001.pdf",
      sender: "Global Tech Solutions Inc.",
      received: "24 Oct, 09:12",
      department: "Finance",
      status: "pending",
      icon: FileText,
      iconColor: "bg-red-50 text-red-600"
    },
    {
      id: 2,
      subject: "Contrat d'emploi - J. Doe",
      sender: "Service RH Interne",
      received: "24 Oct, 08:45",
      department: "RH",
      status: "in_progress",
      icon: Mail,
      iconColor: "bg-emerald-50 text-emerald-600"
    },
    {
      id: 3,
      subject: "Urgent: Maintenance serveur",
      sender: "Équipe Infrastructure AWS",
      received: "23 Oct, 23:30",
      department: "IT",
      status: "urgent",
      icon: AlertTriangle,
      iconColor: "bg-red-50 text-red-600"
    },
  ],
  
  serviceWorkload: [
    { name: "Finance & Comptabilité", percent: 82, color: "bg-[#800020]" },
    { name: "Ressources Humaines", percent: 45, color: "bg-emerald-500" },
    { name: "Technologies de l'information", percent: 68, color: "bg-amber-500" },
    { name: "Juridique & Conformité", percent: 12, color: "bg-slate-500" },
  ],
  
  weeklyTrend: [
    { day: "Lun", value: 40 },
    { day: "Mar", value: 60 },
    { day: "Mer", value: 55 },
    { day: "Jeu", value: 80 },
    { day: "Ven", value: 95 },
    { day: "Sam", value: 70 },
    { day: "Dim", value: 45 },
  ],
};

export default function DashboardDesign() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("30days");

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      

      {/* Main Content */}
      <main className="p-8 pt-6">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
          
          {/* Filters Bar */}
          <motion.section variants={item} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
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
            <Button variant="ghost" size="sm" className="ml-auto text-[#800020] hover:text-[#800020] gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Réinitialiser les filtres</span>
            </Button>
          </motion.section>

          {/* KPI Cards */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_DATA.kpis.map((kpi, index) => (
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
                  {MOCK_DATA.lifecycle.map((step, index) => (
                    <div key={index} className="relative z-10 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-900">{step.label}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {step.count.toLocaleString()} items
                      </span>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Mail Type Distribution */}
                <motion.div variants={item} className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50">
                  <h3 className="text-sm font-bold mb-6">Distribution par type</h3>
                  <div className="flex items-center gap-8">
                    {/* Donut Chart */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle className="text-slate-100" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="12"></circle>
                        <circle className="text-[#800020]" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeDasharray="339.292" strokeDashoffset="203.5" strokeWidth="12"></circle>
                        <circle className="text-[#505f76]" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeDasharray="339.292" strokeDashoffset="220" strokeWidth="12" style={{ transform: "rotate(144deg)", transformOrigin: "center" }}></circle>
                        <circle className="text-slate-300" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeDasharray="339.292" strokeDashoffset="254" strokeWidth="12" style={{ transform: "rotate(270deg)", transformOrigin: "center" }}></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-extrabold text-slate-900">100%</span>
                        <span className="text-[10px] text-slate-500 font-medium">Volume</span>
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="space-y-3">
                      {MOCK_DATA.distribution.map((item, index) => (
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
                    {MOCK_DATA.weeklyTrend.map((day, index) => {
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
                    {MOCK_DATA.weeklyTrend.map((day, index) => (
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
                        <th className="px-6 py-4">Département</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {MOCK_DATA.recentMails.map((mail) => (
                        <tr key={mail.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg ${mail.iconColor} flex items-center justify-center`}>
                                <mail.icon className="h-4 w-4" />
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
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          </td>
                        </tr>
                      ))}
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
                  Attention urgente ({MOCK_DATA.urgentItems.length})
                </h3>
                <div className="space-y-4 relative z-10">
                  {MOCK_DATA.urgentItems.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition-shadow">
                      <p className="text-xs font-bold text-slate-900 mb-1 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-600 font-medium mb-2">{item.subtitle}</p>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {item.department}
                        </Badge>
                        <Button variant="link" size="sm" className="text-[10px] text-[#800020] font-bold p-0 h-auto gap-1">
                          Traiter maintenant
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Service Workload */}
              <motion.section variants={item} className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50">
                <h3 className="text-sm font-bold mb-6">Charge de travail par service</h3>
                <div className="space-y-6">
                  {MOCK_DATA.serviceWorkload.map((service, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-700 font-bold">{service.name}</span>
                        <span className="font-extrabold" style={{ color: service.color.replace('bg-', '') }}>
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

              {/* Activity Feed Placeholder */}
              <motion.section variants={item} className="bg-[#f2f4f6]/60 p-6 rounded-xl shadow-sm border border-slate-200/50">
                <h3 className="text-sm font-bold mb-6">Fil d'activité</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Nouveau courrier enregistré</p>
                      <p className="text-[10px] text-slate-500">ID-992: Créé par Sarah Collins</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Il y a 11 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Affecté au service IT</p>
                      <p className="text-[10px] text-slate-500">Chaque 4428 mis à jour</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Il y a 31 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Vérification terminée</p>
                      <p className="text-[10px] text-slate-500">12 items vérifiés par Finance</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Il y a 1 heure</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-4 text-xs">
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
