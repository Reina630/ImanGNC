import { useState, useEffect } from "react";
import {
  Mail,
  Inbox,
  Send,
  TrendingUp,
  Clock,
  Calendar,
  BarChart3,
  AlertCircle,
  Plus,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend 
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import courrierService from "@/services/courrierService";
import type { CourrierStatistics, Courrier } from "@/types";

/**
 * Dashboard principal pour le système de registre de courrier RH
 * Affiche les statistiques et les courriers récents
 */

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/**
 * Formater une date en relatif (il y a X jours)
 */
const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  return date.toLocaleDateString("fr-FR");
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<CourrierStatistics | null>(null);
  const [recentCourriers, setRecentCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodeFiltre, setPeriodeFiltre] = useState<string>("6");
  const [anneeFiltre, setAnneeFiltre] = useState<string>(new Date().getFullYear().toString());

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Charger les statistiques
      const stats = await courrierService.getStatistiques();
      setStatistics(stats);

      // Charger les 5 courriers les plus récents
      const courriers = await courrierService.getCourriers({
        ordering: "-created_at",
      });
      setRecentCourriers(courriers.slice(0, 5));
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données pour le graphique à barres
  const tendancesData = statistics?.tendances_mensuelles || [];
  
  // Filtrer les données selon la période sélectionnée
  const filteredData = (() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    if (periodeFiltre === "annee") {
      // Filtrer par année sélectionnée
      return tendancesData.filter(item => {
        const [mois, annee] = item.mois.split(' ');
        return annee === anneeFiltre;
      });
    } else {
      // Filtrer par nombre de mois (6 ou 12)
      const moisCount = parseInt(periodeFiltre);
      return tendancesData.slice(-moisCount);
    }
  })();
  
  // Générer la liste des années disponibles
  const anneesDisponibles = Array.from(
    new Set(tendancesData.map(item => {
      const [, annee] = item.mois.split(' ');
      return annee;
    }))
  ).sort().reverse();

  // Préparer les données pour le camembert des statuts
  const statutsData = [
    { 
      name: 'Reçus', 
      value: statistics?.par_statut?.recu?.count || 0,
      color: 'hsl(210, 80%, 52%)'
    },
    { 
      name: 'En traitement', 
      value: statistics?.par_statut?.en_traitement?.count || 0,
      color: 'hsl(38, 92%, 50%)'
    },
    { 
      name: 'Traités', 
      value: statistics?.par_statut?.traite?.count || 0,
      color: 'hsl(152, 60%, 40%)'
    },
    { 
      name: 'Archivés', 
      value: statistics?.par_statut?.archive?.count || 0,
      color: 'hsl(340, 8%, 46%)'
    },
  ].filter(item => item.value > 0);

  // Préparer les données pour le graphique des services
  const servicesData = Object.entries(statistics?.par_service || {})
    .map(([service, data]: [string, any]) => ({
      service: service.length > 20 ? service.substring(0, 20) + '...' : service,
      serviceFull: service,
      count: data.count || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 services

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* En-tête */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm">
            Vue d'ensemble du registre de courrier
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/courriers/nouveau")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau courrier
          </Button>
          <Button variant="outline" onClick={() => navigate("/courriers")}>
            <Mail className="h-4 w-4 mr-2" />
            Voir le registre
          </Button>
        </div>
      </motion.div>

      {/* Statistiques principales */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total courriers */}
        <div className="stat-card flex items-start justify-between" style={{ background: 'hsl(340, 96%, 27%)', color: 'white' }}>
          <div>
            <p className="text-sm opacity-90">Total courriers</p>
            <p className="text-3xl font-bold mt-1">
              {loading ? "..." : statistics?.total || 0}
            </p>
            <span className="text-xs opacity-80 mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Tous les temps
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white/20">
            <Mail className="h-6 w-6" />
          </div>
        </div>

          {/* Courriers entrants */}
          <div className="stat-card flex items-start justify-between" style={{ background: 'hsl(210,80%,58%)', color: 'white' }}>
          <div>
            <p className="text-sm opacity-90">Courriers entrants</p>
            <p className="text-3xl font-bold mt-1">
              {loading ? "..." : statistics?.entrants || 0}
            </p>
            <span className="text-xs opacity-80 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Reçus
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white/20">
            <Inbox className="h-6 w-6" />
          </div>
        </div>

          {/* Courriers sortants */}
          <div className="stat-card flex items-start justify-between" style={{ background: 'hsl(152,60%,46%)', color: 'white' }}>
          <div>
            <p className="text-sm opacity-90">Courriers sortants</p>
            <p className="text-3xl font-bold mt-1">
              {loading ? "..." : statistics?.sortants || 0}
            </p>
            <span className="text-xs opacity-80 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Envoyés
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white/20">
            <Send className="h-6 w-6" />
          </div>
        </div>

          {/* Courriers urgents */}
          <div className="stat-card flex items-start justify-between cursor-pointer" style={{ background: 'hsl(38,92%,56%)', color: 'white' }} onClick={() => navigate("/courriers/prioritaires")}> 
          <div>
            <p className="text-sm opacity-90">Courriers urgents</p>
            <p className="text-3xl font-bold mt-1">
              {loading ? "..." : statistics?.urgents || 0}
            </p>
            <span className="text-xs opacity-80 mt-1 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Prioritaires
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white/20">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </motion.div>

      {/* Graphique d'évolution + Récents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graphique d'évolution - 2/3 */}
        <motion.div variants={item} className="stat-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Évolution des courriers
            </h3>
            <div className="flex items-center gap-2">
              <Select value={periodeFiltre} onValueChange={setPeriodeFiltre}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 derniers mois</SelectItem>
                  <SelectItem value="12">12 derniers mois</SelectItem>
                  <SelectItem value="annee">Par année</SelectItem>
                </SelectContent>
              </Select>
              
              {periodeFiltre === "annee" && anneesDisponibles.length > 0 && (
                <Select value={anneeFiltre} onValueChange={setAnneeFiltre}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {anneesDisponibles.map(annee => (
                      <SelectItem key={annee} value={annee}>
                        {annee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          {loading || filteredData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              {loading ? "Chargement..." : "Aucune donnée pour cette période"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="colorEntrants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 80%, 52%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(210, 80%, 52%)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSortants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(340, 10%, 90%)" />
                <XAxis dataKey="mois" stroke="hsl(340, 8%, 46%)" />
                <YAxis stroke="hsl(340, 8%, 46%)" />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="entrants"
                  stroke="hsl(210, 80%, 52%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEntrants)"
                  name="Entrants"
                />
                <Area
                  type="monotone"
                  dataKey="sortants"
                  stroke="hsl(152, 60%, 40%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSortants)"
                  name="Sortants"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Courriers récents - 1/3 */}
        <motion.div variants={item} className="stat-card lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Récents
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/courriers")}
            >
              Tout
            </Button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : recentCourriers.length > 0 ? (
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-2">
              {recentCourriers.map((courrier) => (
                <div
                  key={courrier.id}
                  className="flex flex-col gap-2 p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/courriers/${courrier.id}`)}
                >
                  <div className="flex items-start gap-2">
                    <div className={`p-1.5 rounded ${
                      courrier.type_courrier === "entrant" 
                        ? "bg-[hsl(210,80%,52%)] text-white" 
                        : "bg-[hsl(152,60%,40%)] text-white"
                    }`}>
                      {courrier.type_courrier === "entrant" ? (
                        <Inbox className="h-3 w-3" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{courrier.objet}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {courrier.numero_registre}
                      </p>
                    </div>
                    {courrier.urgent && (
                      <Zap className="h-3 w-3 text-red-600 fill-red-600 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeDate(courrier.created_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucun courrier
            </div>
          )}
        </motion.div>
      </div>

      {/* Répartition par statut et par service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Camembert - Répartition par statut */}
        <motion.div variants={item} className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Répartition par statut
            </h3>
          </div>
          {loading || statutsData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              {loading ? "Chargement..." : "Aucune donnée disponible"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statutsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statutsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Graphique en barres - Distribution par service */}
        <motion.div variants={item} className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Distribution par service
            </h3>
          </div>
          {loading || servicesData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              {loading ? "Chargement..." : "Aucune donnée disponible"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={servicesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(340, 10%, 90%)" />
                <XAxis type="number" stroke="hsl(340, 8%, 46%)" />
                <YAxis
                  dataKey="service"
                  type="category"
                  width={100}
                  stroke="hsl(340, 8%, 46%)"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border rounded shadow-lg">
                          <p className="font-medium">{payload[0].payload.serviceFull}</p>
                          <p className="text-sm text-muted-foreground">
                            {payload[0].value} courriers
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(340, 61%, 36%)"
                  radius={[0, 4, 4, 0]}
                  name="Courriers"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
