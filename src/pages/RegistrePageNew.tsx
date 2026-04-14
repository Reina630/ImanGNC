
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
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
  Eye,
  Download,
  History,
  X,
  ChevronDown,
  ChevronRight,
  Grid3x3,
  List,
  SlidersHorizontal,
  FolderOpen,
  FolderClosed,
  AlertCircle,
  TrendingUp,
  Mail,
  FileText,
  GitBranch,
  Zap,
  Tag,
  RotateCcw,
  Plus,
  Upload,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";
import { ExportExcelDialog, type ExportFilters } from "@/components/ExportExcelDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import scanService from "@/services/scanService";

// Types locaux
interface YearMonth {
  year: string;
  month: string;
  label: string;
  count: number;
}

interface ArchivesByYearMonth {
  [year: string]: {
    [month: string]: Courrier[];
  };
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  enregistre: { label: "Enregistré", color: "bg-slate-100 text-slate-700" },
  affecte: { label: "Affecté", color: "bg-blue-100 text-blue-700" },
  en_traitement: { label: "En traitement", color: "bg-amber-100 text-amber-700" },
  valide: { label: "Validé", color: "bg-green-100 text-green-700" },
  archive: { label: "Archivé", color: "bg-gray-100 text-gray-700" },
};

/* Données fictives - commentées car maintenant connecté à l'API
const MOCK_COURRIERS: Courrier[] = [
  // 2026 - Avril
  {
    id: 1,
    objet: "Demande de congé annuel - Marie Dubois",
    type_courrier: "interne",
    statut: "en_traitement",
    expediteur: "Marie Dubois",
    destinataire: "Service RH",
    date_courrier: "2026-04-01",
    service_destinataire: { id: 1, nom: "Ressources Humaines" },
    categorie: { id: 3, nom: "Congés" },
    urgent: false,
    fichier: "conge_marie.pdf",
    versions_count: 1,
  },
  {
    id: 2,
    objet: "Facture Fournisseur - Électricité Mars 2026",
    type_courrier: "entrant",
    statut: "affecte",
    expediteur: "EDF France",
    date_reception: "2026-04-01",
    date_courrier: "2026-03-31",
    service_destinataire: { id: 2, nom: "Comptabilité" },
    categorie: { id: 1, nom: "Factures" },
    urgent: true,
    fichier: "facture_edf_mars.pdf",
    versions_count: 1,
  },
  // 2026 - Mars
  {
    id: 3,
    objet: "Réponse appel d'offres - Projet Digital",
    type_courrier: "sortant",
    statut: "valide",
    destinataire: "Mairie de Paris",
    date_envoi: "2026-03-28",
    date_courrier: "2026-03-28",
    service_destinataire: { id: 4, nom: "Direction Générale" },
    categorie: { id: 5, nom: "Appels d'offres" },
    urgent: false,
    fichier: "reponse_ao_digital.pdf",
    versions_count: 2,
  },
  {
    id: 4,
    objet: "Demande d'information - Subventions 2026",
    type_courrier: "entrant",
    statut: "archive",
    expediteur: "Marie Durand",
    date_reception: "2026-03-25",
    date_courrier: "2026-03-24",
    service_destinataire: { id: 1, nom: "Ressources Humaines" },
    categorie: { id: 2, nom: "Administratif" },
    urgent: false,
    fichier: "demande_subventions.pdf",
    versions_count: 1,
  },
  {
    id: 5,
    objet: "Notification de mutation interne",
    type_courrier: "interne",
    statut: "valide",
    expediteur: "Direction RH",
    destinataire: "Jean Martin",
    date_courrier: "2026-03-20",
    service_destinataire: { id: 1, nom: "Ressources Humaines" },
    categorie: { id: 3, nom: "Personnel" },
    urgent: false,
    fichier: "mutation_jean.pdf",
    versions_count: 1,
  },
  {
    id: 6,
    objet: "Convocation réunion comité direction",
    type_courrier: "interne",
    statut: "archive",
    expediteur: "Secrétariat DG",
    destinataire: "Tous les directeurs",
    date_courrier: "2026-03-15",
    service_destinataire: { id: 4, nom: "Direction Générale" },
    categorie: { id: 6, nom: "Réunions" },
    urgent: true,
    fichier: "convocation_comite.pdf",
    versions_count: 1,
  },
  // 2026 - Février
  {
    id: 7,
    objet: "Rapport d'activité Q1 2026",
    type_courrier: "sortant",
    statut: "archive",
    destinataire: "Préfecture",
    date_envoi: "2026-02-28",
    date_courrier: "2026-02-28",
    service_destinataire: { id: 4, nom: "Direction Générale" },
    categorie: { id: 7, nom: "Rapports" },
    urgent: false,
    fichier: "rapport_q1.pdf",
    versions_count: 3,
  },
  {
    id: 8,
    objet: "Demande de fournitures bureau",
    type_courrier: "interne",
    statut: "archive",
    expediteur: "Service IT",
    destinataire: "Service Achats",
    date_courrier: "2026-02-20",
    service_destinataire: { id: 5, nom: "Achats" },
    categorie: { id: 8, nom: "Achats" },
    urgent: false,
    fichier: "demande_fournitures.pdf",
    versions_count: 1,
  },
  {
    id: 9,
    objet: "Réclamation client - Dossier #4521",
    type_courrier: "entrant",
    statut: "archive",
    expediteur: "Sophie Blanc",
    date_reception: "2026-02-15",
    date_courrier: "2026-02-14",
    service_destinataire: { id: 6, nom: "Service Client" },
    categorie: { id: 9, nom: "Réclamations" },
    urgent: true,
    fichier: "reclamation_4521.pdf",
    versions_count: 2,
  },
  // 2025 - Décembre
  {
    id: 10,
    objet: "Bilan annuel 2025",
    type_courrier: "sortant",
    statut: "archive",
    destinataire: "Conseil d'administration",
    date_envoi: "2025-12-30",
    date_courrier: "2025-12-30",
    service_destinataire: { id: 4, nom: "Direction Générale" },
    categorie: { id: 7, nom: "Rapports" },
    urgent: false,
    fichier: "bilan_2025.pdf",
    versions_count: 5,
  },
  {
    id: 11,
    objet: "Vœux de fin d'année",
    type_courrier: "sortant",
    statut: "archive",
    destinataire: "Partenaires",
    date_envoi: "2025-12-20",
    date_courrier: "2025-12-20",
    service_destinataire: { id: 4, nom: "Direction Générale" },
    categorie: { id: 10, nom: "Communication" },
    urgent: false,
    fichier: "voeux_2025.pdf",
    versions_count: 1,
  },
  {
    id: 12,
    objet: "Facture maintenance serveurs",
    type_courrier: "entrant",
    statut: "archive",
    expediteur: "OVH",
    date_reception: "2025-12-15",
    date_courrier: "2025-12-14",
    service_destinataire: { id: 3, nom: "Informatique" },
    categorie: { id: 1, nom: "Factures" },
    urgent: false,
    fichier: "facture_ovh.pdf",
    versions_count: 1,
  },
  // 2025 - Novembre
  {
    id: 13,
    objet: "Demande de formation - Développement web",
    type_courrier: "interne",
    statut: "archive",
    expediteur: "Thomas Bernard",
    destinataire: "Service RH",
    date_courrier: "2025-11-25",
    service_destinataire: { id: 1, nom: "Ressources Humaines" },
    categorie: { id: 11, nom: "Formation" },
    urgent: false,
    fichier: "demande_formation.pdf",
    versions_count: 1,
  },
  {
    id: 14,
    objet: "Invitation salon professionnel TechExpo",
    type_courrier: "entrant",
    statut: "archive",
    expediteur: "TechExpo Organisation",
    date_reception: "2025-11-20",
    date_courrier: "2025-11-19",
    service_destinataire: { id: 4, nom: "Direction Générale" },
    categorie: { id: 12, nom: "Invitations" },
    urgent: false,
    fichier: "invitation_techexpo.pdf",
    versions_count: 1,
  },
  {
    id: 15,
    objet: "Mise à jour politique RGPD",
    type_courrier: "interne",
    statut: "archive",
    expediteur: "DPO",
    destinataire: "Tous les services",
    date_courrier: "2025-11-10",
    service_destinataire: { id: 3, nom: "Informatique" },
    categorie: { id: 13, nom: "Juridique" },
    urgent: true,
    fichier: "rgpd_update.pdf",
    versions_count: 2,
  },
];
*/

export default function RegistrePageNew() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isRH, isAdmin } = useAuth();
  
  // États principaux
  const [allCourriers, setAllCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filtres
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [urgentFilter, setUrgentFilter] = useState<string>("all");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [contactFilter, setContactFilter] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Sidebar année/mois
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set(["2026"]));
  const [selectedYearMonth, setSelectedYearMonth] = useState<YearMonth | null>(null);

  // Extraire tous les contacts uniques
  const allContacts = useMemo(() => {
    const contactsSet = new Set<string>();
    allCourriers.forEach((c) => {
      if (c.expediteur) contactsSet.add(c.expediteur);
      if (c.destinataire) contactsSet.add(c.destinataire);
    });
    return Array.from(contactsSet).sort();
  }, [allCourriers]);

  // Suggestions filtrées
  const suggestions = useMemo(() => {
    if (!search || search.length < 2) return { contacts: [], courriers: [] };
    
    const searchLower = search.toLowerCase();
    
    // Contacts qui matchent
    const matchingContacts = allContacts.filter(contact => 
      contact.toLowerCase().includes(searchLower)
    ).slice(0, 5); // Limite à 5 contacts
    
    // Courriers qui matchent (par objet ou numéro registre)
    const matchingCourriers = allCourriers.filter(c => 
      c.objet?.toLowerCase().includes(searchLower) ||
      c.numero_registre?.toLowerCase().includes(searchLower)
    ).slice(0, 3); // Limite à 3 courriers
    
    return { contacts: matchingContacts, courriers: matchingCourriers };
  }, [search, allContacts, allCourriers]);

  // Organiser les courriers par année/mois
  const archivesByYearMonth = useMemo<ArchivesByYearMonth>(() => {
    const organized: ArchivesByYearMonth = {};
    
    allCourriers.forEach((courrier) => {
      // Utiliser date_principale ou date_reception/date_envoi selon le type
      const dateString = courrier.date_principale || courrier.date_reception || courrier.date_envoi;
      if (!dateString) return; // Skip si pas de date
      
      const date = new Date(dateString);
      const year = date.getFullYear().toString();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      
      if (!organized[year]) organized[year] = {};
      if (!organized[year][month]) organized[year][month] = [];
      
      organized[year][month].push(courrier);
    });
    
    return organized;
  }, [allCourriers]);

  // Construire la liste des années/mois
  const yearMonthList = useMemo<YearMonth[]>(() => {
    const list: YearMonth[] = [];
    
    Object.keys(archivesByYearMonth)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .forEach((year) => {
        Object.keys(archivesByYearMonth[year])
          .sort((a, b) => parseInt(b) - parseInt(a))
          .forEach((month) => {
            const monthIndex = parseInt(month) - 1;
            list.push({
              year,
              month,
              label: `${MONTHS[monthIndex]} ${year}`,
              count: archivesByYearMonth[year][month].length,
            });
          });
      });
    
    return list;
  }, [archivesByYearMonth]);

  // Charger les courriers archivés depuis l'API
  useEffect(() => {
    const fetchCourriers = async () => {
      try {
        setLoading(true);
        const data = await courrierService.getArchivedCourriersByStatus();
        setAllCourriers(data);
      } catch (error) {
        console.error("Erreur lors du chargement des courriers archivés:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les courriers archivés.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourriers();
  }, [toast]);

  // Auto-sélectionner le premier mois au chargement
  useEffect(() => {
    if (!selectedYearMonth && yearMonthList.length > 0) {
      setSelectedYearMonth(yearMonthList[0]);
    }
  }, [yearMonthList, selectedYearMonth]);

  // Laisser la sidebar principale ouverte sur cette page
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', 'false');
    window.dispatchEvent(new Event('storage'));
  }, []);

  // Courriers filtrés
  const filteredCourriers = useMemo(() => {
    let filtered = allCourriers;

    // Vérifier si des filtres sont actifs (recherche ou filtres avancés)
    const hasActiveFilters = search || typeFilter !== "all" || statutFilter !== "all" || 
                            serviceFilter !== "all" || categorieFilter !== "all" || 
                            urgentFilter !== "all" || dateDebut || dateFin || contactFilter;

    // Si aucun filtre actif ET un dossier année/mois est sélectionné → filtrer par année/mois
    // Si des filtres sont actifs → rechercher dans TOUS les courriers (indépendamment du dossier)
    if (!hasActiveFilters && selectedYearMonth) {
      filtered = archivesByYearMonth[selectedYearMonth.year]?.[selectedYearMonth.month] || [];
    }

    // Recherche textuelle (s'applique sur tous les courriers)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.objet?.toLowerCase().includes(searchLower) ||
          c.expediteur?.toLowerCase().includes(searchLower) ||
          c.destinataire?.toLowerCase().includes(searchLower) ||
          c.numero_registre?.toLowerCase().includes(searchLower) ||
          c.id.toString().includes(searchLower)
      );
    }

    // Filtre par type
    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.type_courrier === typeFilter);
    }

    // Filtre par statut
    if (statutFilter !== "all") {
      filtered = filtered.filter((c) => c.statut === statutFilter);
    }

    // Filtre par service
    if (serviceFilter !== "all") {
      filtered = filtered.filter((c) => c.service_concerne_display === serviceFilter);
    }

    // Filtre par catégorie
    if (categorieFilter !== "all") {
      filtered = filtered.filter((c) => c.categorie_name === categorieFilter);
    }

    // Filtre par urgent
    if (urgentFilter !== "all") {
      const isUrgent = urgentFilter === "true";
      filtered = filtered.filter((c) => c.urgent === isUrgent);
    }

    // Filtre par date début
    if (dateDebut) {
      const debut = new Date(dateDebut);
      filtered = filtered.filter((c) => {
        const dateString = c.date_principale || c.date_reception || c.date_envoi;
        return dateString && new Date(dateString) >= debut;
      });
    }

    // Filtre par date fin
    if (dateFin) {
      const fin = new Date(dateFin);
      filtered = filtered.filter((c) => {
        const dateString = c.date_principale || c.date_reception || c.date_envoi;
        return dateString && new Date(dateString) <= fin;
      });
    }

    // Filtre par contact
    if (contactFilter) {
      filtered = filtered.filter(
        (c) => c.expediteur === contactFilter || c.destinataire === contactFilter
      );
    }

    return filtered;
  }, [allCourriers, selectedYearMonth, search, typeFilter, statutFilter, serviceFilter, categorieFilter, urgentFilter, dateDebut, dateFin, contactFilter, archivesByYearMonth]);

  // Statistiques rapides
  const stats = useMemo(() => {
    const total = filteredCourriers.length;
    const entrants = filteredCourriers.filter((c) => c.type_courrier === "entrant").length;
    const sortants = filteredCourriers.filter((c) => c.type_courrier === "sortant").length;
    const internes = filteredCourriers.filter((c) => c.type_courrier === "interne").length;
    const urgents = filteredCourriers.filter((c) => c.urgent).length;
    
    return { total, entrants, sortants, internes, urgents };
  }, [filteredCourriers]);

  // Liste unique d'expéditeurs + destinataires pour l'export
  const contactsList = useMemo(() => {
    return Array.from(
      new Set(
        allCourriers.flatMap((c) => [
          c.expediteur,
          c.destinataire,
        ]).filter(Boolean)
      )
    ).sort();
  }, [allCourriers]);

  // Toggle année
  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  // Icônes par type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "entrant":
        return <Inbox className="h-4 w-4" />;
      case "sortant":
        return <Send className="h-4 w-4" />;
      case "interne":
        return <Building2 className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "entrant":
        return "bg-blue-100 text-blue-700";
      case "sortant":
        return "bg-green-100 text-green-700";
      case "interne":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Upload + analyse OCR
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await scanService.extractDocumentInfo(file);
      navigate('/archives/nouveau', {
        state: {
          file,
          extracted: result.fields ?? {},
          ocr_used: result.ocr_used,
          warning: result.warning,
        },
      });
    } catch {
      // Naviguer quand même — saisie manuelle
      navigate('/archives/nouveau', { state: { file, extracted: {}, ocr_used: false } });
    } finally {
      setUploading(false);
      setUploadOpen(false);
    }
  };

  // Exporter en Excel
  const handleExport = async (exportFilters: ExportFilters, fields: string[]) => {
    try {
      setExporting(true);
      
      // Construire les filtres pour l'API
      const { concerne, ...restExportFilters } = exportFilters as any;
      const apiFilters: any = {};
      
      // Ajouter les filtres d'export
      if (exportFilters.date_debut) apiFilters.date_debut = exportFilters.date_debut;
      if (exportFilters.date_fin) apiFilters.date_fin = exportFilters.date_fin;
      if (exportFilters.type_courrier) apiFilters.type_courrier = exportFilters.type_courrier;
      if (exportFilters.statut) apiFilters.statut = exportFilters.statut;
      if (exportFilters.service) apiFilters.service = exportFilters.service;
      if (exportFilters.urgent !== undefined) apiFilters.urgent = exportFilters.urgent;
      if (concerne) apiFilters.concerne = concerne;
      
      await courrierService.telechargerExcel(apiFilters, fields);
      
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

  // Restaurer un courrier archivé (seulement RH/Admin)
  const handleRestaurer = async (courrier: Courrier) => {
    if (!isRH && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Accès refusé",
        description: "Seule la RH peut restaurer des courriers archivés",
      });
      return;
    }

    try {
      await courrierService.changerStatut(courrier.id, "traite");
      
      // Recharger les courriers archivés
      const data = await courrierService.getArchivedCourriersByStatus();
      setAllCourriers(data);
      
      toast({
        title: "Courrier restauré",
        description: `Le courrier ${courrier.numero_registre} a été remis dans le flux actif`,
      });
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de restaurer le courrier",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex">
      
      {/* État de chargement */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020]"></div>
            <p className="mt-4 text-sm text-slate-600">Chargement des courriers...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Sidebar - Années/Mois */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Archive className="h-4 w-4 text-[#800020]" />
            Registre des courriers
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {allCourriers.length} courriers au total
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {Object.keys(archivesByYearMonth)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .map((year) => (
              <div key={year} className="mb-1">
                {/* Année */}
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {expandedYears.has(year) ? (
                      <FolderOpen className="h-3.5 w-3.5 text-yellow-400" />
                    ) : (
                      <FolderClosed className="h-3.5 w-3.5 text-yellow-400" />
                    )}
                    <span>{year}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className="text-[7px] px-0.5 py-0 h-3 min-w-[12px] flex items-center justify-center leading-none font-semibold bg-white/20 text-white border-0">
                      {Object.values(archivesByYearMonth[year]).reduce(
                        (sum, courriers) => sum + courriers.length,
                        0
                      )}
                    </Badge>
                    {expandedYears.has(year) ? (
                      <ChevronDown className="h-3 w-3 text-white/70" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-white/70" />
                    )}
                  </div>
                </button>

                {/* Mois */}
                <AnimatePresence>
                  {expandedYears.has(year) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="ml-3 mt-0.5 space-y-0.5"
                    >
                      {Object.keys(archivesByYearMonth[year])
                        .sort((a, b) => parseInt(b) - parseInt(a))
                        .map((month) => {
                          const monthIndex = parseInt(month) - 1;
                          const courriers = archivesByYearMonth[year][month];
                          const isSelected =
                            selectedYearMonth?.year === year &&
                            selectedYearMonth?.month === month;

                          return (
                            <button
                              key={month}
                              onClick={() =>
                                setSelectedYearMonth({
                                  year,
                                  month,
                                  label: `${MONTHS[monthIndex]} ${year}`,
                                  count: courriers.length,
                                })
                              }
                              className={cn(
                                "w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition-all",
                                isSelected
                                  ? "bg-white text-[#800020] font-semibold shadow-sm"
                                  : "text-white/70 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                <Calendar className={cn("h-3 w-3", isSelected ? "text-[#800020]" : "text-white/50")} />
                                {MONTHS[monthIndex]}
                              </span>
                              <Badge
                                className={cn(
                                  "text-[7px] px-0.5 py-0 h-3 min-w-[12px] flex items-center justify-center leading-none font-semibold border-0",
                                  isSelected ? "bg-[#800020]/10 text-[#800020]" : "bg-white/20 text-white"
                                )}
                              >
                                {courriers.length}
                              </Badge>
                            </button>
                          );
                        })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
        </div>
      </aside>

      {/* Content principal */}
      <main className="flex-1 flex flex-col">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {selectedYearMonth ? selectedYearMonth.label : "Tous les courriers"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {selectedYearMonth
                  ? `${filteredCourriers.length} courriers`
                  : "Sélectionnez une période dans la sidebar"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Badge filtre contact actif */}
              {contactFilter && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 pl-2 pr-1 py-1 bg-[#800020]/10 text-[#800020] border border-[#800020]/20 hover:bg-[#800020]/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setContactFilter("");
                    toast({
                      title: "Filtre retiré",
                      description: "Affichage de tous les courriers",
                    });
                  }}
                >
                  <User className="h-3 w-3" />
                  <span className="text-xs font-medium">{contactFilter}</span>
                  <X className="h-3 w-3 hover:text-red-600" />
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {viewMode === "grid" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid3x3 className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => setExportDialogOpen(true)}
                className="gap-2 bg-[#800020] hover:bg-[#600018] text-white"
                disabled={exporting}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {exporting ? "Export..." : "Exporter"}
              </Button>
            </div>
          </div>

          {/* Stats rapides - Commentées pour gagner de l'espace */}
          {/* <div className="grid grid-cols-5 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Total</span>
                <FileText className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-600">Entrants</span>
                <Inbox className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-xl font-bold text-blue-900 mt-1">{stats.entrants}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-green-600">Sortants</span>
                <Send className="h-4 w-4 text-green-400" />
              </div>
              <p className="text-xl font-bold text-green-900 mt-1">{stats.sortants}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-600">Internes</span>
                <Building2 className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xl font-bold text-amber-900 mt-1">{stats.internes}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-red-600">Urgents</span>
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
              <p className="text-xl font-bold text-red-900 mt-1">{stats.urgents}</p>
            </div>
          </div> */}
        </header>

        {/* Filtres */}
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="flex items-center gap-3">
            {/* Recherche avec suggestions */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un contact, objet, numéro..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10"
              />
              
              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && search.length >= 2 && (suggestions.contacts.length > 0 || suggestions.courriers.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                  >
                    {/* Section Contacts */}
                    {suggestions.contacts.length > 0 && (
                      <div className="p-2">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-1.5 flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          Contacts
                        </div>
                        {suggestions.contacts.map((contact, idx) => (
                          <button
                            key={`contact-${idx}`}
                            onClick={() => {
                              setContactFilter(contact);
                              setSearch("");
                              setShowSuggestions(false);
                              toast({
                                title: "Filtre appliqué",
                                description: `Affichage des courriers de/vers ${contact}`,
                              });
                            }}
                            className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 transition-colors flex items-center gap-2 group"
                          >
                            <User className="h-4 w-4 text-slate-400 group-hover:text-[#800020]" />
                            <span className="text-sm text-slate-700 group-hover:text-[#800020] font-medium">{contact}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Section Courriers */}
                    {suggestions.courriers.length > 0 && (
                      <div className="p-2 border-t border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-1.5 flex items-center gap-1.5">
                          <FileText className="h-3 w-3" />
                          Courriers
                        </div>
                        {suggestions.courriers.map((courrier) => (
                          <button
                            key={courrier.id}
                            onClick={() => {
                              navigate(`/courriers/${courrier.id}`);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 transition-colors group"
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5">
                                {getTypeIcon(courrier.type_courrier)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900 group-hover:text-[#800020] font-medium truncate">
                                  {courrier.objet}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {courrier.numero_registre || `#${courrier.id}`} • {courrier.date_principale ? new Date(courrier.date_principale).toLocaleDateString('fr-FR') : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bouton Filtres avec Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 border-slate-300 text-slate-700 hover:border-[#800020] hover:text-[#800020]",
                    (typeFilter !== "all" || statutFilter !== "all" || serviceFilter !== "all" || categorieFilter !== "all" || urgentFilter !== "all" || dateDebut || dateFin || contactFilter) && "border-[#800020] text-[#800020] bg-[#800020]/5"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtres
                  {(typeFilter !== "all" || statutFilter !== "all" || serviceFilter !== "all" || categorieFilter !== "all" || urgentFilter !== "all" || dateDebut || dateFin || contactFilter) && (
                    <Badge variant="secondary" className="ml-1 h-3 w-3 rounded-full p-0 flex items-center justify-center text-[7px] leading-none font-bold">
                      {[typeFilter !== "all", statutFilter !== "all", serviceFilter !== "all", categorieFilter !== "all", urgentFilter !== "all", dateDebut, dateFin, contactFilter].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Filtrer les courriers</h4>
                  </div>

                  {/* Type de courrier */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Type de courrier</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="entrant">
                          <div className="flex items-center gap-2">
                            <Inbox className="h-3.5 w-3.5 text-blue-600" />
                            Entrant
                          </div>
                        </SelectItem>
                        <SelectItem value="sortant">
                          <div className="flex items-center gap-2">
                            <Send className="h-3.5 w-3.5 text-green-600" />
                            Sortant
                          </div>
                        </SelectItem>
                        <SelectItem value="interne">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-amber-600" />
                            Interne
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Statut */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Statut</label>
                    <Select value={statutFilter} onValueChange={setStatutFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="enregistre">Enregistré</SelectItem>
                        <SelectItem value="affecte">Affecté</SelectItem>
                        <SelectItem value="en_traitement">En traitement</SelectItem>
                        <SelectItem value="valide">Validé</SelectItem>
                        <SelectItem value="archive">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Service</label>
                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les services</SelectItem>
                        <SelectItem value="Ressources Humaines">Ressources Humaines</SelectItem>
                        <SelectItem value="Comptabilité">Comptabilité</SelectItem>
                        <SelectItem value="Informatique">Informatique</SelectItem>
                        <SelectItem value="Direction Générale">Direction Générale</SelectItem>
                        <SelectItem value="Achats">Achats</SelectItem>
                        <SelectItem value="Service Client">Service Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Catégorie</label>
                    <Select value={categorieFilter} onValueChange={setCategorieFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        <SelectItem value="Factures">Factures</SelectItem>
                        <SelectItem value="Administratif">Administratif</SelectItem>
                        <SelectItem value="Congés">Congés</SelectItem>
                        <SelectItem value="Personnel">Personnel</SelectItem>
                        <SelectItem value="Appels d'offres">Appels d'offres</SelectItem>
                        <SelectItem value="Réunions">Réunions</SelectItem>
                        <SelectItem value="Rapports">Rapports</SelectItem>
                        <SelectItem value="Achats">Achats</SelectItem>
                        <SelectItem value="Réclamations">Réclamations</SelectItem>
                        <SelectItem value="Communication">Communication</SelectItem>
                        <SelectItem value="Formation">Formation</SelectItem>
                        <SelectItem value="Invitations">Invitations</SelectItem>
                        <SelectItem value="Juridique">Juridique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Urgent */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Priorité</label>
                    <Select value={urgentFilter} onValueChange={setUrgentFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="true">
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-red-500 fill-red-500" />
                            Urgents uniquement
                          </div>
                        </SelectItem>
                        <SelectItem value="false">Non urgents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date début */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Date de début</label>
                    <Input
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Date fin */}
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Date de fin</label>
                    <Input
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Bouton Reset */}
                  {(typeFilter !== "all" || statutFilter !== "all" || serviceFilter !== "all" || categorieFilter !== "all" || urgentFilter !== "all" || dateDebut || dateFin) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTypeFilter("all");
                        setStatutFilter("all");
                        setServiceFilter("all");
                        setCategorieFilter("all");
                        setUrgentFilter("all");
                        setDateDebut("");
                        setDateFin("");
                      }}
                      className="w-full gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      <X className="h-4 w-4" />
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Reset rapide */}
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch("")}
                className="gap-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Liste des courriers */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020] mx-auto mb-4"></div>
                <p className="text-slate-600">Chargement...</p>
              </div>
            </div>
          ) : filteredCourriers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Aucun courrier trouvé
              </h3>
              <p className="text-sm text-slate-500">
                {selectedYearMonth
                  ? "Aucun courrier pour cette période"
                  : "Sélectionnez une période dans la sidebar"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredCourriers.map((courrier) => (
                <motion.div
                  key={courrier.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all group"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg", getTypeColor(courrier.type_courrier))}>
                          {getTypeIcon(courrier.type_courrier)}
                        </div>
                        <div>
                          <Badge
                            variant="outline"
                            className="text-[7px] font-bold px-1 py-0 h-3.5 leading-none"
                          >
                            {courrier.numero_registre}
                          </Badge>
                          {courrier.urgent && (
                            <Badge variant="destructive" className="ml-1 text-[7px] px-1 py-0 h-3.5 leading-none font-semibold">
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => navigate(`/archives/${courrier.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled className="gap-2 text-slate-400">
                            <RotateCcw className="h-4 w-4" />
                            Restaurer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2">
                      {courrier.objet}
                    </h3>

                    <Badge className={cn("text-[7px] px-1 py-0 h-3.5 leading-none font-medium", STATUT_LABELS[courrier.statut]?.color)}>
                      {STATUT_LABELS[courrier.statut]?.label || courrier.statut}
                    </Badge>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2 text-xs">
                    {courrier.expediteur && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium">De:</span>
                        <span className="truncate">{courrier.expediteur}</span>
                      </div>
                    )}
                    {courrier.destinataire && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Send className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium">À:</span>
                        <span className="truncate">{courrier.destinataire}</span>
                      </div>
                    )}
                    {courrier.service_concerne_display && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{courrier.service_concerne_display}</span>
                      </div>
                    )}
                    {courrier.categorie_name && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[7px] px-1 py-0 h-3.5 leading-none font-medium">
                          {courrier.categorie_name}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {courrier.date_principale ? new Date(courrier.date_principale).toLocaleDateString("fr-FR") : 'N/A'}
                      </div>
                      {courrier.fichier && (
                        <div className="flex items-center gap-1 text-[#800020]">
                          <FileText className="h-3.5 w-3.5" />
                          {courrier.nombre_versions && courrier.nombre_versions > 1 && (
                            <span className="font-medium">({courrier.nombre_versions})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Vue Liste */
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Objet
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Expéditeur/Dest.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCourriers.map((courrier) => (
                    <tr key={courrier.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {courrier.numero_registre}
                          </span>
                          {courrier.urgent && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium", getTypeColor(courrier.type_courrier))}>
                          {getTypeIcon(courrier.type_courrier)}
                          <span className="capitalize">{courrier.type_courrier}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {courrier.objet}
                          </p>
                          {courrier.categorie_name && (
                            <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 py-0 h-5">
                              {courrier.categorie_name}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 truncate max-w-xs">
                          {courrier.expediteur || courrier.destinataire || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 truncate max-w-xs">
                          {courrier.service_concerne_display || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700">
                          {courrier.date_principale ? new Date(courrier.date_principale).toLocaleDateString("fr-FR") : 'N/A'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[9px] px-1.5 py-0 h-5", STATUT_LABELS[courrier.statut]?.color)}>
                          {STATUT_LABELS[courrier.statut]?.label || courrier.statut}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => navigate(`/archives/${courrier.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled className="gap-2 text-slate-400">
                              <RotateCcw className="h-4 w-4" />
                              Restaurer
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
        </div>
      </main>
      </>
      )}
      
      {/* Dialog d'export Excel */}
      <ExportExcelDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        contacts={contactsList}
        onExport={handleExport}
      />

      {/* FAB - Nouveau courrier */}
      <button
        onClick={() => setUploadOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#800020] hover:bg-[#600018] text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Nouveau courrier"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modal upload + OCR */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f);
          e.target.value = '';
        }}
      />
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!uploading) setUploadOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#800020]" />
              Nouveau courrier par document
            </DialogTitle>
          </DialogHeader>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFileUpload(f);
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
              dragOver ? 'border-[#800020] bg-[#800020]/5' : 'border-border hover:border-[#800020]/50 hover:bg-muted/50'
            } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#800020]" />
                <p className="text-sm font-medium text-[#800020]">Analyse en cours...</p>
                <p className="text-xs text-muted-foreground">Extraction des informations</p>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-[#800020]/10">
                  <Upload className="h-6 w-6 text-[#800020]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Déposer le document ici</p>
                  <p className="text-xs text-muted-foreground mt-1">ou cliquer pour sélectionner</p>
                </div>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG, TIFF</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
