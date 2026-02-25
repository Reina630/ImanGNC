/**
 * Page d'historique des partages de courriers
 * Permet de tracer tous les partages effectués (Email et WhatsApp)
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Share2,
  Mail,
  MessageCircle,
  Calendar,
  User,
  FileText,
  Filter,
  Search,
  Download,
  BarChart3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import partageService, { type PartageLog, type PartageStatistics } from "@/services/partageService";

export default function PartagesPage() {
  const { toast } = useToast();
  const [partages, setPartages] = useState<PartageLog[]>([]);
  const [statistics, setStatistics] = useState<PartageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadPartages();
    loadStatistics();
  }, []);

  const loadPartages = async () => {
    try {
      setLoading(true);
      const data = await partageService.getPartages({
        ordering: "-created_at",
      });
      setPartages(data);
    } catch (error) {
      console.error("Erreur lors du chargement des partages:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger l'historique des partages",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await partageService.getStatistiques();
      setStatistics(data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  // Filtrer les partages
  const filteredPartages = partages.filter((partage) => {
    // Filtre par type
    if (typeFilter !== "all" && partage.type_partage !== typeFilter) {
      return false;
    }

    // Filtre par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        partage.courrier_numero.toLowerCase().includes(searchLower) ||
        partage.courrier_objet.toLowerCase().includes(searchLower) ||
        partage.destinataire.toLowerCase().includes(searchLower) ||
        partage.partage_par_nom.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Share2 className="h-6 w-6 text-primary" />
          Historique des Partages
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Traçabilité complète de tous les partages de courriers
        </p>
      </div>

      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total partages</p>
                <p className="text-2xl font-bold mt-1">{statistics.total}</p>
              </div>
              <Share2 className="h-8 w-8 text-primary opacity-20" />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Par Email</p>
                <p className="text-2xl font-bold mt-1">
                  {statistics.par_type.email?.count || 0}
                </p>
              </div>
              <Mail className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Par WhatsApp</p>
                <p className="text-2xl font-bold mt-1">
                  {statistics.par_type.whatsapp?.count || 0}
                </p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, objet, destinataire, utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="email">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
            </SelectItem>
            <SelectItem value="whatsapp">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des partages */}
      <div className="stat-card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredPartages.length === 0 ? (
          <div className="text-center py-12">
            <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun partage trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPartages.map((partage) => (
              <motion.div
                key={partage.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                {/* Icône du type de partage */}
                <div
                  className={`p-2.5 rounded-lg ${
                    partage.type_partage === "email"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {partage.type_partage === "email" ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <MessageCircle className="h-5 w-5" />
                  )}
                </div>

                {/* Détails du partage */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Première ligne : Courrier */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold">
                          {partage.courrier_numero}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {partage.courrier_type_display}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {partage.courrier_objet}
                      </p>
                    </div>
                    <Badge
                      variant={
                        partage.type_partage === "email"
                          ? "default"
                          : "secondary"
                      }
                      className="shrink-0"
                    >
                      {partage.type_partage_display}
                    </Badge>
                  </div>

                  {/* Deuxième ligne : Détails du partage */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>Partagé par : {partage.partage_par_nom}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5" />
                      <span>À : {partage.destinataire}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(partage.created_at)}</span>
                    </div>
                  </div>

                  {/* Message si présent */}
                  {partage.message && (
                    <div className="bg-muted/30 p-2 rounded text-xs italic">
                      "{partage.message}"
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
