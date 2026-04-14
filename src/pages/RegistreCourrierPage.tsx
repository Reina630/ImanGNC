

import { useState, useEffect, useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";
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
  X,
  Reply,
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import courrierService from "@/services/courrierService";
import type { Courrier, CourrierStatistics, CourrierFilters, Service } from "@/types";
import { STATUT_CHOICES } from "@/types";
import { AffecterServiceDialog } from "@/components/AffecterServiceDialog";
import { ExportExcelDialog, type ExportFilters } from "@/components/ExportExcelDialog";
import { useCategories } from "@/services/categoryHooks";

export default function RegistreCourrierPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isDG, isRH, isAdmin } = useAuth();
  
  // États
  const [allCourriers, setAllCourriers] = useState<Courrier[]>([]); // Tous les courriers
  const [filteredCourriers, setFilteredCourriers] = useState<Courrier[]>([]); // Courriers filtrés
  const [statistics, setStatistics] = useState<CourrierStatistics | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedCourrier, setSelectedCourrier] = useState<Courrier | null>(null);
  const [affecterDialogOpen, setAffecterDialogOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Charger les catégories depuis l'API
  const { data: categories = [] } = useCategories();
  
  // Filtres
  const [filters, setFilters] = useState<CourrierFilters>({
    search: "",
    type_courrier: undefined,
    statut: "non_archive", // Par défaut, ne pas afficher les archivés
    service: undefined,
    date_debut: undefined,
    date_fin: undefined,
    urgent: undefined,
    ordering: "-created_at",
  });

  // Charger les courriers une seule fois au montage
  useEffect(() => {
    loadCourriers();
    loadServices();
  }, []);

  // Appliquer les filtres côté frontend quand filters ou allCourriers changent
  useEffect(() => {
    applyFilters();
  }, [filters, allCourriers]);

  /**
   * Charger la liste des services disponibles
   */
  const loadServices = async () => {
    try {
      const data = await courrierService.getServicesDisponibles();
      setServices(data);
    } catch (error) {
      console.error("Erreur lors du chargement des services:", error);
    }
  };

  /**
   * Charger tous les courriers (sans filtres)
   * @param silent - si true, ne montre pas le spinner (rafraîchissement automatique)
   */
  const loadCourriers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await courrierService.getCourriers({ ordering: "-created_at" });
      setAllCourriers(data);
    } catch (error) {
      console.error("Erreur lors du chargement des courriers:", error);
      if (!silent) toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les courriers",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Rafraîchissement automatique toutes les 20 secondes (sans spinner)
  usePolling(() => loadCourriers(true));

  /**
   * Appliquer les filtres côté frontend
   */
  const applyFilters = () => {
    let result = [...allCourriers];

    // Filtre par recherche (numéro, objet, expéditeur, destinataire)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(courrier => 
        courrier.numero_registre.toLowerCase().includes(searchLower) ||
        courrier.objet.toLowerCase().includes(searchLower) ||
        courrier.expediteur.toLowerCase().includes(searchLower) ||
        courrier.destinataire.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par type de courrier
    if (filters.type_courrier) {
      result = result.filter(courrier => courrier.type_courrier === filters.type_courrier);
    }

    // Filtre par statut
    if (filters.statut) {
      if (filters.statut === "non_archive") {
        // Exclure les archivés par défaut
        result = result.filter(courrier => courrier.statut !== "archive");
      } else {
        result = result.filter(courrier => courrier.statut === filters.statut);
      }
    }

    // Filtre par service
    if (filters.service) {
      const selectedService = services.find(s => s.id === filters.service);
      if (selectedService) {
        result = result.filter(courrier => 
          courrier.service_concerne_display?.includes(selectedService.nom) ||
          courrier.service_concerne === selectedService.nom
        );
      }
    }

    // Filtre par urgence
    if (filters.urgent !== undefined) {
      result = result.filter(courrier => courrier.urgent === filters.urgent);
    }

    // Filtre par date de début
    if (filters.date_debut) {
      const dateDebut = new Date(filters.date_debut);
      result = result.filter(courrier => {
        const dateCourrier = new Date(courrier.date_principale);
        return dateCourrier >= dateDebut;
      });
    }

    // Filtre par date de fin
    if (filters.date_fin) {
      const dateFin = new Date(filters.date_fin);
      dateFin.setHours(23, 59, 59, 999); // Inclure toute la journée
      result = result.filter(courrier => {
        const dateCourrier = new Date(courrier.date_principale);
        return dateCourrier <= dateFin;
      });
    }

    // Tri
    if (filters.ordering) {
      const [direction, field] = filters.ordering.startsWith('-') 
        ? ['desc', filters.ordering.slice(1)]
        : ['asc', filters.ordering];

      result.sort((a, b) => {
        let aVal, bVal;
        
        switch (field) {
          case 'created_at':
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
            break;
          case 'date_principale':
            aVal = new Date(a.date_principale).getTime();
            bVal = new Date(b.date_principale).getTime();
            break;
          case 'numero_registre':
            aVal = a.numero_registre;
            bVal = b.numero_registre;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredCourriers(result);
    
    // Calculer les statistiques à partir des courriers filtrés
    calculateStatistics(result);
  };

  /**
   * Calculer les statistiques à partir des courriers
   */
  const calculateStatistics = (courriers: Courrier[]) => {
    const stats: CourrierStatistics = {
      total: courriers.length,
      entrants: courriers.filter(c => c.type_courrier === 'entrant').length,
      sortants: courriers.filter(c => c.type_courrier === 'sortant').length,
      internes: courriers.filter(c => c.type_courrier === 'interne').length,
      urgents: courriers.filter(c => c.urgent).length,
      courriers_avec_versions: 0,
      total_versions: 0,
      par_statut: {
        recu: { label: 'Reçu', count: courriers.filter(c => c.statut === 'recu').length },
        en_traitement: { label: 'En traitement', count: courriers.filter(c => c.statut === 'en_traitement').length },
        traite: { label: 'Traité', count: courriers.filter(c => c.statut === 'traite').length },
        archive: { label: 'Archivé', count: courriers.filter(c => c.statut === 'archive').length },
      },
      par_service: {},
      tendances_mensuelles: []
    };

    setStatistics(stats);
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

  const handleArchive = async (id: number) => {
    try {
      // Changer le statut du courrier à 'archive'
      await courrierService.changerStatut(id, 'archive');
      // Recharger les courriers pour afficher le changement
      loadCourriers();
      toast({
        title: "Courrier archivé",
        description: "Le courrier a été archivé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'archivage:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'archiver le courrier",
      });
    }
  };

  /**
   * Exporter le registre en Excel
   */
  const handleExport = async (exportFilters: ExportFilters, fields: string[]) => {
    try {
      setExporting(true);
      // Fusionner les filtres de la page avec ceux du dialog (le dialog prend la priorité)
      const { concerne, ...restExportFilters } = exportFilters as any;
      const mergedFilters: any = { ...filters, ...restExportFilters };
      if (concerne) mergedFilters.concerne = concerne;
      await courrierService.telechargerExcel(mergedFilters, fields);
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

  // Liste unique d'expéditeurs + destinataires issus des courriers chargés
  const contactsList = Array.from(
    new Set(
      allCourriers.flatMap((c) => [
        c.expediteur,
        c.destinataire,
      ]).filter(Boolean)
    )
  ).sort();

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
   * Obtenir l'icône et la couleur selon le type de courrier
   */
  const getTypeCourrierBadge = (type: string) => {
    if (type === "entrant") {
      return {
        icon: <Inbox className="h-3 w-3" />,
        className: "bg-blue-100 text-blue-700",
        label: "Entrant"
      };
    }
    if (type === "sortant") {
      return {
        icon: <Send className="h-3 w-3" />,
        className: "bg-green-100 text-green-700",
        label: "Sortant"
      };
    }
    return {
      icon: <Mail className="h-3 w-3" />,
      className: "bg-purple-100 text-purple-700",
      label: "Interne"
    };
  };

  /**
   * Mettre à jour un filtre spécifique
   */
  const updateFilter = (key: keyof CourrierFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * Réinitialiser tous les filtres
   */
  const resetFilters = () => {
    setFilters({
      search: "",
      type_courrier: undefined,
      statut: "non_archive", // Par défaut, ne pas afficher les archivés
      service: undefined,
      date_debut: undefined,
      date_fin: undefined,
      urgent: undefined,
      ordering: "-created_at",
    });
  };

  /**
   * Compter le nombre de filtres actifs
   */
  const countActiveFilters = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type_courrier) count++;
    if (filters.statut) count++;
    if (filters.service) count++;
    if (filters.date_debut) count++;
    if (filters.date_fin) count++;
    if (filters.urgent) count++;
    return count;
  };

  const activeFiltersCount = countActiveFilters();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* En-tête avec titre et bouton d'export */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Registre de Courrier
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestion des courriers entrants, sortants et internes
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setExportDialogOpen(true)}
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
          
          {!isDG && (
            <Button onClick={() => navigate("/courriers/nouveau")}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau courrier
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <p className="text-sm text-muted-foreground">Internes</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.internes}</p>
              </div>
              <Mail className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </div>

          {/* <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En traitement</p>
                <p className="text-2xl font-bold text-amber-600">
                  {statistics.par_statut?.en_traitement?.count || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-600 opacity-20" />
            </div>
          </div> */}
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="stat-card space-y-2 py-3">
        {/* Barre de recherche principale */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par numéro, objet, expéditeur ou destinataire..."
              value={filters.search || ""}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-10"
            />
            {filters.search && (
              <button
                onClick={() => updateFilter("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            {showAdvancedFilters ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Filtres avancés (collapsibles) */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t"
          >
            {/* Type de courrier */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Type
              </label>
              <Select
                value={filters.type_courrier || "all"}
                onValueChange={(value) => 
                  updateFilter("type_courrier", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="entrant">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-3 w-3" />
                      Entrant
                    </div>
                  </SelectItem>
                  <SelectItem value="sortant">
                    <div className="flex items-center gap-2">
                      <Send className="h-3 w-3" />
                      Sortant
                    </div>
                  </SelectItem>
                  <SelectItem value="interne">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Interne
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Statut
              </label>
              <Select
                value={filters.statut || "all"}
                onValueChange={(value) => 
                  updateFilter("statut", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non_archive">Actifs (non archivés)</SelectItem>
                  <SelectItem value="all">Tous</SelectItem>
                  {STATUT_CHOICES.map((statut) => (
                    <SelectItem key={statut.value} value={statut.value}>
                      {statut.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Service
              </label>
              <Select
                value={filters.service?.toString() || "all"}
                onValueChange={(value) => 
                  updateFilter("service", value === "all" ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Urgence */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Urgence
              </label>
              <Select
                value={filters.urgent === undefined ? "all" : filters.urgent.toString()}
                onValueChange={(value) => 
                  updateFilter("urgent", value === "all" ? undefined : value === "true")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="true">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                      Urgents uniquement
                    </div>
                  </SelectItem>
                  <SelectItem value="false">Non urgents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date début */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Date de début
              </label>
              <Input
                type="date"
                value={filters.date_debut || ""}
                onChange={(e) => updateFilter("date_debut", e.target.value || undefined)}
              />
            </div>

            {/* Date fin */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Date de fin
              </label>
              <Input
                type="date"
                value={filters.date_fin || ""}
                onChange={(e) => updateFilter("date_fin", e.target.value || undefined)}
              />
            </div>

            {/* Tri */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Trier par
              </label>
              <Select
                value={filters.ordering || "-created_at"}
                onValueChange={(value) => updateFilter("ordering", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_at">Plus récent</SelectItem>
                  <SelectItem value="created_at">Plus ancien</SelectItem>
                  <SelectItem value="-date_principale">Date décroissante</SelectItem>
                  <SelectItem value="date_principale">Date croissante</SelectItem>
                  <SelectItem value="numero_registre">N° Registre (A-Z)</SelectItem>
                  <SelectItem value="-numero_registre">N° Registre (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        {/* Affichage des filtres actifs sous forme de badges */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Recherche: {filters.search}
                <button
                  onClick={() => updateFilter("search", "")}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.type_courrier && (
              <Badge variant="secondary" className="gap-1">
                Type: {filters.type_courrier === "entrant" ? "Entrant" : filters.type_courrier === "sortant" ? "Sortant" : "Interne"}
                <button
                  onClick={() => updateFilter("type_courrier", undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.statut && filters.statut !== "non_archive" && (
              <Badge variant="secondary" className="gap-1">
                Statut: {filters.statut === "all" ? "Tous" : STATUT_CHOICES.find(s => s.value === filters.statut)?.label}
                <button
                  onClick={() => updateFilter("statut", "non_archive")}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.service && (
              <Badge variant="secondary" className="gap-1">
                Service: {services.find(s => s.id === filters.service)?.nom}
                <button
                  onClick={() => updateFilter("service", undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.urgent !== undefined && (
              <Badge variant="secondary" className="gap-1">
                {filters.urgent ? "Urgents uniquement" : "Non urgents"}
                <button
                  onClick={() => updateFilter("urgent", undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.date_debut && (
              <Badge variant="secondary" className="gap-1">
                Depuis: {new Date(filters.date_debut).toLocaleDateString("fr-FR")}
                <button
                  onClick={() => updateFilter("date_debut", undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.date_fin && (
              <Badge variant="secondary" className="gap-1">
                Jusqu'à: {new Date(filters.date_fin).toLocaleDateString("fr-FR")}
                <button
                  onClick={() => updateFilter("date_fin", undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Indicateur de résultats */}
      {!loading && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1 -mt-2">
          <span>
            {filteredCourriers.length === 0 ? (
              "Aucun courrier trouvé"
            ) : (
              <>
                <span className="font-medium text-foreground">{filteredCourriers.length}</span>
                {" "}courrier{filteredCourriers.length > 1 ? "s" : ""} trouvé{filteredCourriers.length > 1 ? "s" : ""}
                {activeFiltersCount > 0 && " (filtré)"}
              </>
            )}
          </span>
        </div>
      )}
     
      {/* Tableau des courriers */}
      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  N° Registre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Expéditeur / Destinataire
                </th>
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
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : filteredCourriers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Aucun courrier trouvé
                  </td>
                </tr>
              ) : (
                filteredCourriers.map((courrier) => {
                  const typeBadge = getTypeCourrierBadge(courrier.type_courrier);
                  return (
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
                      <td className="px-4 py-3">
                        <Badge className={`gap-1 ${typeBadge.className}`}>
                          {typeBadge.icon}
                          {typeBadge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(courrier.date_principale)}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[150px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const entite = courrier.type_courrier === "entrant" 
                              ? courrier.expediteur 
                              : courrier.destinataire;
                            navigate(`/courriers/entite/${encodeURIComponent(entite)}`);
                          }}
                          className="text-left truncate hover:text-primary hover:underline transition-colors font-medium"
                        >
                          {courrier.type_courrier === "entrant" 
                            ? courrier.expediteur 
                            : courrier.destinataire}
                        </button>
                      </td>
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
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem
                                onClick={() => navigate(`/courriers/${courrier.id}`)}
                                className="font-medium"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>

                              {/* Répondre — disponible uniquement pour les courriers entrants et internes, masqué pour DG */}
                              {!isDG && (courrier.type_courrier === 'entrant' || courrier.type_courrier === 'interne') && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/courriers/repondre/${courrier.id}`)}
                                  className="text-emerald-700 focus:text-emerald-700"
                                >
                                  <Reply className="h-4 w-4 mr-2" />
                                  Répondre
                                </DropdownMenuItem>
                              )}

                              {/* Option "Affecter" - cachée pour DG */}
                              {!isDG && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCourrier(courrier);
                                    setAffecterDialogOpen(true);
                                  }}
                                >
                                  <Building2 className="h-4 w-4 mr-2" />
                                  Affecter à un service
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem
                                onClick={() => handleToggleUrgent(courrier.id)}
                                className={courrier.urgent ? "text-amber-700" : ""}
                              >
                                <Zap className={`h-4 w-4 mr-2 ${courrier.urgent ? 'fill-amber-500 text-amber-500' : ''}`} />
                                {courrier.urgent ? "Retirer urgent" : "Marquer urgent"}
                              </DropdownMenuItem>
                              
                              {/* Archiver - masqué pour DG */}
                              {!isDG && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleArchive(courrier.id)}
                                    className="text-red-600"
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archiver
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog d'affectation à un service */}
      <AffecterServiceDialog
        open={affecterDialogOpen}
        onOpenChange={setAffecterDialogOpen}
        courrier={selectedCourrier}
        onSuccess={() => {
          loadCourriers();
        }}
      />

      {/* Dialog d'export Excel */}
      <ExportExcelDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        contacts={contactsList}
        onExport={handleExport}
      />
    </motion.div>
  );
}
