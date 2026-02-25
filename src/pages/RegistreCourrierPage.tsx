/**
 * Page principale du Registre de Courrier RH
 * Affiche tous les courriers avec filtres, recherche et export Excel
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Search,
  Filter,
  Plus,
  Eye,
  FileSpreadsheet,
  Calendar,
  Building2,
  User,
  Send,
  Inbox,
  CheckCircle2,
  Clock,
  Archive,
  MoreHorizontal,
  Zap,
  ChevronDown,
  ChevronUp,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import type { Courrier, CourrierStatistics, CourrierFilters } from "@/types";
import { SERVICE_CHOICES, STATUT_CHOICES } from "@/types";
import { AffecterServiceDialog } from "@/components/AffecterServiceDialog";

export default function RegistreCourrierPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // États
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [statistics, setStatistics] = useState<CourrierStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedCourrier, setSelectedCourrier] = useState<Courrier | null>(null);
  const [activeTab, setActiveTab] = useState<"entrants" | "sortants">("entrants");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [affecterDialogOpen, setAffecterDialogOpen] = useState(false);
  
  // Filtres
  const [filters, setFilters] = useState<CourrierFilters>({
    search: "",
    type_courrier: "entrant" as any, // Initialiser avec l'onglet par défaut
    statut: undefined,
    service_concerne: undefined,
    date_debut: undefined,
    date_fin: undefined,
    ordering: "-created_at",
  });

  // Synchroniser l'onglet actif avec le filtre type_courrier
  const handleTabChange = (value: "entrants" | "sortants") => {
    setActiveTab(value);
    setFilters({ ...filters, type_courrier: value === "entrants" ? "entrant" : "sortant" as any });
  };

  // Charger les courriers et statistiques au montage
  useEffect(() => {
    loadCourriers();
    loadStatistics();
  }, [filters]);

  /**
   * Charger tous les courriers avec les filtres
   */
  const loadCourriers = async () => {
    try {
      setLoading(true);
      const data = await courrierService.getCourriers(filters);
      setCourriers(data);
    } catch (error) {
      console.error("Erreur lors du chargement des courriers:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les courriers",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marquer/Démarquer un courrier comme urgent
   */
  const handleToggleUrgent = async (id: number) => {
    try {
      await courrierService.toggleUrgent(id);
      // Recharger les courriers pour afficher le changement
      loadCourriers();
      toast({
        title: "Courrier mis à jour",
        description: "Le marquage urgent a été modifié",
      });
    } catch (error) {
      console.error("Erreur lors du marquage urgent:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le marquage urgent",
      });
    }
  };

  /**
   * Charger les statistiques
   */
  const loadStatistics = async () => {
    try {
      const data = await courrierService.getStatistiques();
      setStatistics(data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  /**
   * Exporter le registre en Excel
   */
  const handleExport = async () => {
    try {
      setExporting(true);
      await courrierService.telechargerExcel(filters);
      toast({
        title: "Export réussi",
        description: "Le registre a été exporté en Excel",
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'exporter le registre",
      });
    } finally {
      setExporting(false);
    }
  };

  /**
   * Télécharger le fichier d'un courrier
   */
  const handleDownload = async (courrier: Courrier) => {
    try {
      await courrierService.telechargerFichier(courrier.id, courrier.numero_registre);
      toast({
        title: "Téléchargement réussi",
        description: `Fichier du courrier ${courrier.numero_registre} téléchargé`,
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
      });
    }
  };

  /**
   * Formater la taille du fichier
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
  };

  /**
   * Formater une date
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  /**
   * Obtenir l'icône selon le statut
   */
  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case "recu":
        return <Inbox className="h-4 w-4" />;
      case "en_traitement":
        return <Clock className="h-4 w-4" />;
      case "traite":
        return <CheckCircle2 className="h-4 w-4" />;
      case "archive":
        return <Archive className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  /**
   * Obtenir la couleur du badge statut
   */
  const getStatutColor = (statut: string) => {
    return STATUT_CHOICES.find((s) => s.value === statut)?.color || "bg-gray-100 text-gray-800";
  };

  /**
   * Filtrer les courriers en fonction de l'onglet actif
   * Note: Maintenant géré côté backend via filters.type_courrier
   */
  const filteredCourriers = courriers;

  /**
   * Compter les courriers urgents - afficher le nombre total car filtering côté backend
   */
  const urgentCount = courriers.filter(c => c.urgent).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* En-tête avec titre et bouton d'export */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Registre de Courrier
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestion des courriers entrants et sortants
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="outline"
          >
            {exporting ? (
              "Export en cours..."
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter Excel
              </>
            )}
          </Button>
          
          <Button onClick={() => navigate("/courriers/nouveau")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau courrier
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <Mail className="h-8 w-8 text-primary opacity-20" />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entrants</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.entrants}</p>
              </div>
              <Inbox className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sortants</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.sortants}</p>
              </div>
              <Send className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En traitement</p>
                <p className="text-2xl font-bold text-amber-600">
                  {statistics.par_statut?.en_traitement?.count || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-600 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Barre de recherche et filtres visibles */}
      <div className="stat-card flex flex-row items-center gap-3 py-3 px-4">
        <div className="relative flex items-center flex-1 min-w-[350px] max-w-[600px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher (n°, objet, expéditeur...)"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10 h-9 w-full"
          />
        </div>
        <Select
          value={filters.statut || "all"}
          onValueChange={(value) =>
            setFilters({ ...filters, statut: value === "all" ? undefined : value as any })
          }
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUT_CHOICES.map((statut) => (
              <SelectItem key={statut.value} value={statut.value}>
                {statut.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.service_concerne || "all"}
          onValueChange={(value) =>
            setFilters({ ...filters, service_concerne: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            {SERVICE_CHOICES.map((service) => (
              <SelectItem key={service.value} value={service.value}>
                {service.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tableau des courriers avec onglets */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="entrants" className="gap-2">
              <Inbox className="h-4 w-4" />
              Entrants
              <Badge variant="secondary" className="ml-1">
                {statistics?.entrants || 0}
              </Badge>
              {urgentCount > 0 && activeTab === "entrants" && (
                <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
                  {urgentCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sortants" className="gap-2">
              <Send className="h-4 w-4" />
              Sortants
              <Badge variant="secondary" className="ml-1">
                {statistics?.sortants || 0}
              </Badge>
              {urgentCount > 0 && activeTab === "sortants" && (
                <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
                  {urgentCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="stat-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      N° Registre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Date
                    </th>
                    {activeTab === "entrants" && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Expéditeur
                      </th>
                    )}
                    {activeTab === "sortants" && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Destinataire
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Objet
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Chargement...
                      </td>
                    </tr>
                  ) : filteredCourriers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Aucun courrier trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredCourriers.map((courrier) => (
                      <tr 
                        key={courrier.id} 
                        className={`hover:bg-muted/30 transition-colors ${
                          courrier.urgent ? 'bg-amber-50/50 border-l-4 border-amber-500' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {courrier.urgent && (
                              <div className="relative">
                                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                              </div>
                            )}
                            <span className="font-mono text-sm font-medium">
                              {courrier.numero_registre}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatDate(courrier.date_principale)}
                        </td>
                        {activeTab === "entrants" && (
                          <td className="px-4 py-3 text-sm max-w-[150px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/courriers/entite/${encodeURIComponent(courrier.expediteur)}`);
                              }}
                              className="text-left truncate hover:text-primary hover:underline transition-colors font-medium"
                            >
                              {courrier.expediteur}
                            </button>
                          </td>
                        )}
                        {activeTab === "sortants" && (
                          <td className="px-4 py-3 text-sm max-w-[150px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/courriers/entite/${encodeURIComponent(courrier.destinataire)}`);
                              }}
                              className="text-left truncate hover:text-primary hover:underline transition-colors font-medium"
                            >
                              {courrier.destinataire}
                            </button>
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm max-w-[200px] truncate">
                          {courrier.objet}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {courrier.service_concerne_display || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`gap-1 ${getStatutColor(courrier.statut)}`}>
                            {getStatutIcon(courrier.statut)}
                            {courrier.statut_display}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {/* Menu dropdown avec toutes les actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => navigate(`/courriers/${courrier.id}`)}
                                  className="font-medium"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCourrier(courrier);
                                    setAffecterDialogOpen(true);
                                  }}
                                >
                                  <Building2 className="h-4 w-4 mr-2" />
                                  Affecter à un service
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleUrgent(courrier.id)}
                                  className={courrier.urgent ? "text-amber-700" : ""}
                                >
                                  <Zap className={`h-4 w-4 mr-2 ${courrier.urgent ? 'fill-amber-500 text-amber-500' : ''}`} />
                                  {courrier.urgent ? "Retirer urgent" : "Marquer urgent"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog d'affectation à un service */}
      <AffecterServiceDialog
        open={affecterDialogOpen}
        onOpenChange={setAffecterDialogOpen}
        courrier={selectedCourrier}
        onSuccess={() => {
          loadCourriers();
          loadStatistics();
        }}
      />
    </motion.div>
  );
}
