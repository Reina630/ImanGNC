import { useState, useMemo, useEffect } from "react";
import courrierService from "@/services/courrierService";
import { userService } from "@/services/userService";
import type { Courrier } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Plus,
  Filter,
  Send,
  Edit3,
  Paperclip,
  Bell,
  Eye,
  Building2,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Search,
  Upload,
  ChevronDown,
  Inbox,
  CalendarClock,
  PenLine,
  MailCheck,
  MessageSquareReply,
  Info,
  GitBranch,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AffecterServiceDialog } from "@/components/AffecterServiceDialog";
import { ModifierInfosAffectationDialog } from "@/components/dialogs/ModifierInfosAffectationDialog";




export default function TrackerCourriersPage() {
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [services, setServices] = useState<{ id: number; nom: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals
  const [nouveauCourrierOpen, setNouveauCourrierOpen] = useState(false);
  const [affecterOpen, setAffecterOpen] = useState(false);
  const [modifierOpen, setModifierOpen] = useState(false);
  const [ajouterPJOpen, setAjouterPJOpen] = useState(false);
  const [relancerOpen, setRelancerOpen] = useState(false);
  const [selectedCourrier, setSelectedCourrier] = useState<Courrier | null>(null);
  const [selectedAffectation, setSelectedAffectation] = useState<{
    id: number;
    action_requise: string;
    niveau_urgence: string;
    date_echeance: string | null;
  } | null>(null);

  // Form states
  const [messageRelance, setMessageRelance] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [courrierData, serviceData] = await Promise.all([
          courrierService.getCourriers({ statut: 'non_archive' }),
          userService.getServices(),
        ]);
        if (isMounted) {
          setCourriers(courrierData);
          setServices(serviceData);
        }
      } catch {
        if (isMounted) toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Filtrage et tri
  const filteredCourriers = useMemo(() => {
    let filtered = [...courriers];

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.numero_registre.toLowerCase().includes(query) ||
          c.objet.toLowerCase().includes(query) ||
          c.expediteur?.toLowerCase().includes(query) ||
          c.destinataire?.toLowerCase().includes(query)
      );
    }

    // Filtres
    if (statutFilter !== "all") {
      filtered = filtered.filter((c) => c.statut === statutFilter);
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.type_courrier === typeFilter);
    }
    if (serviceFilter !== "all") {
      filtered = filtered.filter((c) => c.service_concerne_display === serviceFilter);
    }

    // Tri optimisé par urgence : date d'échéance + niveau d'urgence
    filtered.sort((a, b) => {
      // Helper : trouver la date d'échéance la plus proche (plus critique)
      const getDateEcheancePlusProche = (courrier: Courrier): number => {
        const dates: number[] = [];
        
        // Vérifier les affectations v2
        if (courrier.affectations_v2 && courrier.affectations_v2.length > 0) {
          courrier.affectations_v2.forEach(aff => {
            if (aff.date_echeance) {
              dates.push(new Date(aff.date_echeance).getTime());
            }
          });
        }
        
        // Si pas de date, retourner une date très lointaine (basse priorité)
        return dates.length > 0 ? Math.min(...dates) : Number.MAX_SAFE_INTEGER;
      };
      
      // Helper : compter le nombre d'affectations urgentes (critique + élevé)
      const getNombreAffectationsUrgentes = (courrier: Courrier): number => {
        if (!courrier.affectations_v2) return 0;
        
        return courrier.affectations_v2.filter(aff => 
          aff.niveau_urgence === 'critique' || aff.niveau_urgence === 'eleve'
        ).length;
      };
      
      const dateA = getDateEcheancePlusProche(a);
      const dateB = getDateEcheancePlusProche(b);
      
      // 1. Comparer les dates d'échéance (plus proche = plus urgent)
      if (dateA !== dateB) {
        return dateA - dateB; // Ordre croissant (date plus proche en premier)
      }
      
      // 2. En cas d'égalité, comparer le nombre d'affectations urgentes
      const urgentesA = getNombreAffectationsUrgentes(a);
      const urgentesB = getNombreAffectationsUrgentes(b);
      
      if (urgentesA !== urgentesB) {
        return urgentesB - urgentesA; // Ordre décroissant (plus d'affectations urgentes en premier)
      }
      
      // 3. En cas d'égalité totale, trier par date de création (plus récent d'abord)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [
    courriers,
    searchQuery,
    statutFilter,
    typeFilter,
    serviceFilter,
  ]);

  // Pagination
  const paginatedCourriers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCourriers.slice(startIndex, endIndex);
  }, [filteredCourriers, currentPage]);

  const totalPages = Math.ceil(filteredCourriers.length / itemsPerPage);

  // Reset à la page 1 quand les filtres changent
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statutFilter, typeFilter, serviceFilter]);

  // Handlers
  const handleAffecter = (courrier: Courrier) => {
    setSelectedCourrier(courrier);
    setAffecterOpen(true);
  };

  // Réaffecter : même dialog + même handler
  const handleReaffecter = (courrier: Courrier) => handleAffecter(courrier);

  const handleAffectationPersonnalisee = (courrier: Courrier) => {
    const hasAffectations = (courrier.affectations_v2 && courrier.affectations_v2.length > 0) || !!courrier.service_concerne_display;
    navigate(`/courriers/affecter/${courrier.id}${hasAffectations ? '?mode=edit' : ''}`);
  };

  const handleRelancer = (courrier: Courrier) => {
    setSelectedCourrier(courrier);
    setMessageRelance(
      `Bonjour,\n\nNous vous relançons concernant le courrier "${courrier.objet}" (${courrier.numero_registre}).\n\nMerci de traiter ce dossier dans les meilleurs délais.`
    );
    setRelancerOpen(true);
  };

  const handleSubmitRelance = () => {
    if (!selectedCourrier) return;

    toast({
      title: "Relance envoyée",
      description: `Service ${selectedCourrier.service_concerne_display} relancé avec succès`,
    });

    setRelancerOpen(false);
    setSelectedCourrier(null);
    setMessageRelance("");
  };

  const handleModifier = (courrier: Courrier, affectation?: {
    id: number;
    action_requise: string;
    niveau_urgence: string;
    date_echeance: string | null;
  }) => {
    setSelectedCourrier(courrier);
    setSelectedAffectation(affectation || null);
    setModifierOpen(true);
  };

  const handleAjouterPJ = (courrier: Courrier) => {
    setSelectedCourrier(courrier);
    setAjouterPJOpen(true);
  };

  const handleVoirDetails = (courrierId: number) => {
    // Rediriger la RH vers la page de détails RH avec circuit d'affectation
    if (user?.role === 'rh' || user?.role === 'admin') {
      navigate(`/courriers/${courrierId}/details-rh`);
    } else {
      navigate(`/courriers/${courrierId}`);
    }
  };

  // Utilitaires
  const getStatutBadge = (statut: string, statutDisplay?: string) => {
    // Statuts d'affectation (micro)
    const affectationVariants: Record<string, { color: string; icon: any; label: string }> = {
      distribue:     { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: Clock,        label: "Distribué" },
      en_attente:    { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: Clock,        label: "Distribué" },
      vu:            { color: "bg-blue-500/10 text-blue-600 border-blue-500/20",       icon: Eye,          label: "Vu" },
      lu:            { color: "bg-blue-500/10 text-blue-600 border-blue-500/20",       icon: Eye,          label: "Vu" },
      en_traitement: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Users,        label: "En traitement" },
      valide:        { color: "bg-green-500/10 text-green-600 border-green-500/20",    icon: CheckCircle,  label: "Traité" },
      signe:         { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle, label: "Signé" },
      rejete:        { color: "bg-red-500/10 text-red-600 border-red-500/20",          icon: XCircle,      label: "Rejeté" },
      renvoye:       { color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Users,        label: "Renvoyé" },
      // Statuts courrier (macro) — quand pas d'affectation
      recu:          { color: "bg-slate-500/10 text-slate-600 border-slate-500/20",   icon: Clock,        label: "À traiter" },
      traite:        { color: "bg-green-500/10 text-green-600 border-green-500/20",    icon: CheckCircle,  label: "Traité" },
      brouillon:     { color: "bg-gray-500/10 text-gray-500 border-gray-500/20",       icon: FileText,     label: "Brouillon" },
      archive:       { color: "bg-gray-400/10 text-gray-500 border-gray-400/20",       icon: XCircle,      label: "Archivé" },
    };

    const variant = affectationVariants[statut] ?? { color: "bg-gray-500/10 text-gray-600 border-gray-500/20", icon: Clock, label: statutDisplay ?? statut };
    const { color, icon: Icon, label } = variant;

    return (
      <Badge className={`${color} border text-xs font-medium gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getNumeroColor = (type: string) => {
    const colors: Record<string, string> = {
      entrant: "text-blue-600",
      sortant: "text-green-600",
      interne: "text-purple-600",
    };
    return colors[type] ?? "text-slate-600";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getTraitementDisplay = (action: string | null, echeance: string | null) => {
    if (!action) return <span className="text-[11px] text-muted-foreground">—</span>;

    const actionLabels: Record<string, string> = {
      informatif:           "Informatif",
      a_signer:             "\u00c0 signer",
      accusation_reception: "Accus\u00e9 r\u00e9c.",
      a_repondre:           "\u00c0 r\u00e9pondre",
    };
    const actionColors: Record<string, string> = {
      informatif:           "bg-slate-100 text-slate-600",
      a_signer:             "bg-blue-100 text-blue-700",
      accusation_reception: "bg-orange-100 text-orange-700",
      a_repondre:           "bg-purple-100 text-purple-700",
    };
    const label = actionLabels[action] ?? action;
    const baseColor = actionColors[action] ?? "bg-gray-100 text-gray-600";

    let delaiSuffix = "";
    let overrideColor = "";
    if (echeance) {
      const now = new Date();
      const end = new Date(echeance); // DateTimeField : heure exacte de l'API
      const diffMs = end.getTime() - now.getTime();
      const diffH = Math.round(diffMs / 3600000);
      if (diffMs < 0) {
        delaiSuffix = " (échu)";
        overrideColor = "bg-red-100 text-red-700";
      } else if (diffH < 24) {
        delaiSuffix = ` (${diffH}h)`;
        overrideColor = "bg-orange-100 text-orange-700";
      } else {
        const diffJ = Math.floor(diffH / 24);
        delaiSuffix = ` (${diffJ}j)`;
      }
    }

    const finalColor = overrideColor || baseColor;
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${finalColor}`}>
        {label}{delaiSuffix}
      </span>
    );
  };

  // Helper pour afficher les labels des actions requises
  const getActionRequiseLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'informatif': 'Informer',
      'a_signer': 'À signer',
      'accusation_reception': 'Accusé réception',
      'a_repondre': 'À répondre',
      'a_valider': 'À valider',
      'a_annoter': 'À annoter',
    };
    return labels[action] || action;
  };

  // Helper pour afficher les labels d'urgence
  const getNiveauUrgenceLabel = (niveau: string): string => {
    const labels: Record<string, string> = {
      'faible': 'Faible',
      'normal': 'Normal',
      'eleve': 'Élevé',
      'critique': 'Critique',
    };
    return labels[niveau] || niveau;
  };

  // Helper pour afficher les labels de statut
  const getStatutLabel = (statut: string): string => {
    const labels: Record<string, string> = {
      'distribue': 'Distribué',
      'vu': 'Vu',
      'en_traitement': 'En traitement',
      'valide': 'Validé',
      'signe': 'Signé',
      'rejete': 'Rejeté',
      'renvoye': 'Renvoyé',
    };
    return labels[statut] || statut;
  };

  // Helper pour formater le temps restant
  const getTempsRestant = (dateEcheance: string | null): string | null => {
    if (!dateEcheance) return null;
    
    const now = new Date();
    const echeance = new Date(dateEcheance);
    const diffMs = echeance.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return "Échu";
    }
    
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      return remainingHours > 0 ? `${diffDays}j ${remainingHours}h` : `${diffDays}j`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      return remainingMinutes > 0 ? `${diffHours}h ${remainingMinutes}` : `${diffHours}h`;
    } else {
      return `${diffMinutes}min`;
    }
  };

  // Helper pour afficher le traitement avec niveau d'urgence
  const getTraitementAffectationDisplay = (
    actionRequise: string,
    niveauUrgence: string,
    dateEcheance: string | null
  ) => {
    const actionLabel = getActionRequiseLabel(actionRequise);
    const tempsRestant = getTempsRestant(dateEcheance);
    
    // Déterminer la couleur et l'icône selon le niveau d'urgence
    let colorClass = "text-slate-700";
    let iconColor = "";
    let showIcon = false;
    
    if (niveauUrgence === "critique") {
      colorClass = "text-red-600 font-semibold";
      iconColor = "text-red-600";
      showIcon = true;
    } else if (niveauUrgence === "eleve") {
      colorClass = "text-yellow-600 font-semibold";
      iconColor = "text-yellow-600";
      showIcon = true;
    }
    
    return (
      <div className="flex flex-col gap-1">
        <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
          {showIcon && <AlertCircle className={`h-3 w-3 ${iconColor}`} />}
          <span>{actionLabel}</span>
        </div>
        {tempsRestant && (
          <div className={`text-[10px] ${niveauUrgence === "critique" ? "text-red-500" : niveauUrgence === "eleve" ? "text-yellow-500" : "text-muted-foreground"}`}>
            {tempsRestant === "Échu" ? "⚠️ Échu" : `⏱️ ${tempsRestant}`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-4 max-w-[1600px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#800020] to-[#a0002a] bg-clip-text text-transparent flex items-center gap-2">
                <Mail className="h-6 w-6 text-[#800020]" />
                Suivi des Courriers
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gérez et tracez tous vos courriers • Triés par urgence et priorité
              </p>
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
                  <Building2 className="h-4 w-4 text-amber-600" />
                  <div>
                    <div className="font-medium">Courrier Interne</div>
                    <div className="text-xs text-slate-500">Communication interne</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border rounded-lg p-3 shadow-sm mb-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Filtres</h3>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Recherche */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, objet, contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Statut */}
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="recu">À traiter</SelectItem>
                <SelectItem value="en_traitement">En traitement</SelectItem>
                <SelectItem value="traite">Traité</SelectItem>
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="entrant">Entrant</SelectItem>
                <SelectItem value="sortant">Sortant</SelectItem>
                <SelectItem value="interne">Interne</SelectItem>
              </SelectContent>
            </Select>

            {/* Service */}
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.nom}>
                    {service.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Résultats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card border rounded-lg shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-muted/50 border-b-2 border-border">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border">
                    Numéro
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border">
                    Objet
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border">
                    Contact
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border">
                    Service
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border">
                    Statut
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border w-36">
                    Traitement
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border">
                    Date
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="animate-spin h-5 w-5 border-2 border-[#800020] border-t-transparent rounded-full" />
                        <span className="text-sm">Chargement des courriers...</span>
                      </div>
                    </td>
                  </tr>
                )}
                <AnimatePresence mode="popLayout">
                  {!loading && paginatedCourriers.map((courrier, index) => {
                    // Vérifier si le courrier a des affectations v2
                    const hasAffectationsV2 = courrier.affectations_v2 && courrier.affectations_v2.length > 0;
                    const affectations = hasAffectationsV2 ? courrier.affectations_v2! : [];
                    const rowSpan = affectations.length || 1;
                    const hasRenvoye = affectations.some(a => a.statut === 'renvoye');

                    return (
                      <>
                        {/* Première ligne (avec rowspan sur colonnes gauche si multiple affectations) */}
                        <motion.tr
                          key={`courrier-${courrier.id}-0`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-muted/30 transition-colors border-b border-border"
                        >
                          {/* Colonnes avec rowspan : Numéro, Objet, Contact */}
                          <td className="px-3 py-3 align-middle text-center border-r border-border" rowSpan={rowSpan}>
                            <div className="flex items-center justify-center gap-2">
                              {courrier.urgent && (
                                <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />
                              )}
                              <span className={`font-mono text-sm font-medium ${getNumeroColor(courrier.type_courrier)}`}>
                                {courrier.numero_registre}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 align-middle text-center border-r border-border" rowSpan={rowSpan}>
                            <div className="truncate text-sm max-w-[280px] mx-auto" title={courrier.objet}>
                              {courrier.objet}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                              <span>{courrier.categorie_name}</span>
                              {(courrier.pieces_jointes?.length ?? 0) > 0 && (
                                <span className="text-[10px] text-red-600">
                                  ({courrier.pieces_jointes.length} PJ)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 align-middle text-center border-r border-border" rowSpan={rowSpan}>
                            <div className="flex items-center justify-center gap-1 text-sm">
                              {courrier.type_courrier === "entrant" && (
                                <>
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[120px]">
                                    {courrier.expediteur}
                                  </span>
                                </>
                              )}
                              {courrier.type_courrier === "sortant" && (
                                <>
                                  <Send className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[120px]">
                                    {courrier.destinataire}
                                  </span>
                                </>
                              )}
                              {courrier.type_courrier === "interne" && (
                                <>
                                  <Building2 className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[120px]">
                                    {courrier.expediteur}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Colonnes spécifiques à la première affectation (ou données génériques si pas d'affectations v2) */}
                          {hasAffectationsV2 ? (
                            <>
                              {/* Service */}
                              <td className="px-3 py-3 align-top border-r border-border">
                                <Badge variant="outline" className="text-xs truncate max-w-[140px]" title={affectations[0].service_nom || affectations[0].destinataire_nom}>
                                  {affectations[0].service_nom || affectations[0].destinataire_nom}
                                </Badge>
                              </td>
                              {/* Statut */}
                              <td className="px-3 py-3 align-top border-r border-border">
                                {getStatutBadge(affectations[0].statut, getStatutLabel(affectations[0].statut))}
                              </td>
                              {/* Traitement */}
                              <td className="px-3 py-3 align-top border-r border-border">
                                {getTraitementAffectationDisplay(
                                  affectations[0].action_requise,
                                  affectations[0].niveau_urgence,
                                  affectations[0].date_echeance
                                )}
                              </td>
                              {/* Date */}
                              <td className="px-3 py-3 align-top border-r border-border">
                                <span className="text-xs text-muted-foreground">
                                  {affectations[0].date_echeance
                                    ? formatDate(affectations[0].date_echeance)
                                    : formatDate(courrier.date_principale || courrier.created_at)}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              {/* Service */}
                              <td className="px-3 py-3 align-top border-r border-border">
                                {courrier.service_concerne_display ? (
                                  <Badge variant="outline" className="text-xs truncate max-w-[140px]" title={courrier.service_concerne_display}>
                                    {courrier.service_concerne_display}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    Non affecté
                                  </span>
                                )}
                              </td>
                              {/* Statut */}
                              <td className="px-3 py-3 align-top border-r border-border">
                                {getStatutBadge(
                                  courrier.derniere_affectation_statut ?? courrier.statut,
                                  courrier.derniere_affectation_statut_display ?? courrier.statut_display
                                )}
                              </td>
                              {/* Traitement */}
                              <td className="px-3 py-3 align-top border-r border-border">
                                {getTraitementDisplay(
                                  courrier.derniere_affectation_action_requise,
                                  courrier.derniere_affectation_echeance
                                )}
                              </td>
                              {/* Date */}
                              <td className="px-3 py-3 align-top border-r border-border">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(courrier.created_at)}
                                </span>
                              </td>
                            </>
                          )}

                          {/* Actions */}
                          <td className="px-3 py-3 align-middle text-center">
                            <div className="flex items-center justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <span className="text-lg">⋯</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuItem
                                    onClick={() => handleVoirDetails(courrier.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir les détails
                                  </DropdownMenuItem>
                                  
                                  {/* Si l'affectation est traitée (validée ou signée), afficher uniquement "Voir détails" */}
                                  {!(hasAffectationsV2 && (affectations[0].statut === 'valide' || affectations[0].statut === 'signe')) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      {/* Bouton Réaffecter en évidence si courrier renvoyé */}
                                      {hasRenvoye && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => handleReaffecter(courrier)}
                                            className="text-purple-700 font-semibold bg-purple-50 hover:bg-purple-100 focus:bg-purple-100"
                                          >
                                            <RotateCcw className="h-4 w-4 mr-2 text-purple-600" />
                                            Réaffecter (renvoyé)
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                        </>
                                      )}
                                      {/* Afficher le sous-menu Affecter/Réaffecter uniquement si pas renvoyé */}
                                      {!hasRenvoye && (
                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger>
                                            <Building2 className="h-4 w-4 mr-2" />
                                            {hasAffectationsV2 || courrier.service_concerne_display
                                              ? "Réaffecter"
                                              : "Affecter"}
                                          </DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent>
                                            <DropdownMenuItem
                                              onClick={() => handleAffecter(courrier)}
                                            >
                                              <Building2 className="h-4 w-4 mr-2" />
                                              Changer le service concerné
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleAffectationPersonnalisee(courrier)}
                                            >
                                              <GitBranch className="h-4 w-4 mr-2" />
                                              Ajouter une nouvelle affectation
                                            </DropdownMenuItem>
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                      )}
                                      {/* Afficher "Modifier les infos" uniquement si une affectation existe */}
                                      {hasAffectationsV2 && (
                                        <DropdownMenuItem
                                          onClick={() => handleModifier(courrier, {
                                            id: affectations[0].id,
                                            action_requise: affectations[0].action_requise,
                                            niveau_urgence: affectations[0].niveau_urgence,
                                            date_echeance: affectations[0].date_echeance,
                                          })}
                                        >
                                          <Edit3 className="h-4 w-4 mr-2" />
                                          Modifier les infos
                                        </DropdownMenuItem>
                                      )}
                                      {/* <DropdownMenuItem
                                        onClick={() => handleAjouterPJ(courrier)}
                                      >
                                        <Paperclip className="h-4 w-4 mr-2" />
                                        Ajouter une pièce jointe
                                      </DropdownMenuItem> */}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleRelancer(courrier)}
                                        disabled={!courrier.service_concerne_display}
                                        className="text-orange-600"
                                      >
                                        <Bell className="h-4 w-4 mr-2" />
                                        Relancer le service
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </motion.tr>

                        {/* Lignes supplémentaires pour les autres affectations (à partir de l'index 1) */}
                        {hasAffectationsV2 && affectations.slice(1).map((affectation, affIndex) => (
                          <tr 
                            key={`courrier-${courrier.id}-aff-${affIndex + 1}`}
                            className="hover:bg-muted/30 transition-colors border-b border-border bg-muted/10"
                          >
                            {/* Service */}
                            <td className="px-3 py-3 align-top border-r border-border">
                              <Badge variant="outline" className="text-xs truncate max-w-[140px]" title={affectation.service_nom || affectation.destinataire_nom}>
                                {affectation.service_nom || affectation.destinataire_nom}
                              </Badge>
                            </td>
                            {/* Statut */}
                            <td className="px-3 py-3 align-top border-r border-border">
                              {getStatutBadge(affectation.statut, getStatutLabel(affectation.statut))}
                            </td>
                            {/* Traitement */}
                            <td className="px-3 py-3 align-top border-r border-border">
                              {getTraitementAffectationDisplay(
                                affectation.action_requise,
                                affectation.niveau_urgence,
                                affectation.date_echeance
                              )}
                            </td>
                            {/* Date */}
                            <td className="px-3 py-3 align-top border-r border-border">
                              <span className="text-xs text-muted-foreground">
                                {affectation.date_echeance
                                  ? formatDate(affectation.date_echeance)
                                  : formatDate(courrier.date_principale || courrier.created_at)}
                              </span>
                            </td>
                            {/* Actions */}
                            <td className="px-3 py-3 align-middle text-center">
                              <div className="flex items-center justify-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="text-lg">⋯</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem
                                      onClick={() => handleVoirDetails(courrier.id)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Voir les détails
                                    </DropdownMenuItem>
                                    
                                    {/* Si l'affectation est traitée (validée ou signée), afficher uniquement "Voir détails" */}
                                    {!(affectation.statut === 'valide' || affectation.statut === 'signe') && (
                                      <>
                                        <DropdownMenuSeparator />
                                        {/* Bouton Réaffecter en évidence si cette affectation a été renvoyée */}
                                        {affectation.statut === 'renvoye' && (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() => handleReaffecter(courrier)}
                                              className="text-purple-700 font-semibold bg-purple-50 hover:bg-purple-100 focus:bg-purple-100"
                                            >
                                              <RotateCcw className="h-4 w-4 mr-2 text-purple-600" />
                                              Réaffecter (renvoyé)
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                          </>
                                        )}
                                        {/* Afficher le sous-menu Réaffecter uniquement si pas renvoyé */}
                                        {affectation.statut !== 'renvoye' && (
                                          <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                              <Building2 className="h-4 w-4 mr-2" />
                                              Réaffecter
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                              <DropdownMenuItem
                                                onClick={() => handleAffecter(courrier)}
                                              >
                                                <Building2 className="h-4 w-4 mr-2" />
                                                Changer le service concerné
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => handleAffectationPersonnalisee(courrier)}
                                              >
                                                <GitBranch className="h-4 w-4 mr-2" />
                                                Ajouter une nouvelle affectation
                                              </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                          </DropdownMenuSub>
                                        )}
                                        <DropdownMenuItem
                                          onClick={() => handleModifier(courrier, {
                                            id: affectation.id,
                                            action_requise: affectation.action_requise,
                                            niveau_urgence: affectation.niveau_urgence,
                                            date_echeance: affectation.date_echeance,
                                          })}
                                        >
                                          <Edit3 className="h-4 w-4 mr-2" />
                                          Modifier les infos
                                        </DropdownMenuItem>
                                        {/* <DropdownMenuItem
                                          onClick={() => handleAjouterPJ(courrier)}
                                          >
                                          <Paperclip className="h-4 w-4 mr-2" />
                                          Ajouter une pièce jointe
                                        </DropdownMenuItem> */}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleRelancer(courrier)}
                                          disabled={!courrier.service_concerne_display}
                                          className="text-orange-600"
                                        >
                                          <Bell className="h-4 w-4 mr-2" />
                                          Relancer le service
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredCourriers.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Aucun courrier trouvé avec ces critères
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Pagination */}
        {filteredCourriers.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
              {Math.min(currentPage * itemsPerPage, filteredCourriers.length)} sur{" "}
              {filteredCourriers.length} courrier{filteredCourriers.length > 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Affecter (composant dédié) */}
      <AffecterServiceDialog
        open={affecterOpen}
        onOpenChange={setAffecterOpen}
        courrier={selectedCourrier}
        mode={selectedCourrier?.service_concerne_display ? 'reaffecter' : 'affecter'}
        onSuccess={async () => {
          const data = await courrierService.getCourriers({ statut: 'non_archive' });
          setCourriers(data);
        }}
      />

      {/* Modal: Relancer */}
      <Dialog open={relancerOpen} onOpenChange={setRelancerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Relancer le service</DialogTitle>
            <DialogDescription>
              Service: {selectedCourrier?.service_concerne_display} • Courrier:{" "}
              {selectedCourrier?.numero_registre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message de relance</Label>
              <Textarea
                id="message"
                value={messageRelance}
                onChange={(e) => setMessageRelance(e.target.value)}
                rows={6}
                placeholder="Votre message..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRelancerOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmitRelance}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Bell className="h-4 w-4 mr-2" />
              Envoyer la relance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Modifier les infos d'affectation */}
      <ModifierInfosAffectationDialog
        open={modifierOpen}
        onOpenChange={setModifierOpen}
        affectation={selectedAffectation}
        courrierNumero={selectedCourrier?.numero_registre}
        onSuccess={async () => {
          const data = await courrierService.getCourriers({ statut: 'non_archive' });
          setCourriers(data);
        }}
      />

      {/* Modal: Modifier (legacy placeholder - à supprimer plus tard) */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifier les informations</DialogTitle>
            <DialogDescription>
              Courrier: {selectedCourrier?.numero_registre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Formulaire de modification complet à implémenter...
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModifierOpen(false)}>
              Annuler
            </Button>
            <Button className="bg-gradient-to-r from-[#800020] to-[#a0002a]">
              <Edit3 className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Ajouter PJ (placeholder) */}
      <Dialog open={ajouterPJOpen} onOpenChange={setAjouterPJOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une pièce jointe</DialogTitle>
            <DialogDescription>
              Courrier: {selectedCourrier?.numero_registre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Glissez un fichier ou cliquez pour parcourir
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAjouterPJOpen(false)}>
              Annuler
            </Button>
            <Button className="bg-gradient-to-r from-[#800020] to-[#a0002a]">
              <Paperclip className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nouveau courrier (placeholder) */}
      <Dialog open={nouveauCourrierOpen} onOpenChange={setNouveauCourrierOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enregistrer un nouveau courrier</DialogTitle>
            <DialogDescription>
              Remplissez les informations du courrier à enregistrer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Formulaire complet d'enregistrement de courrier à implémenter...
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de courrier</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrant">Entrant</SelectItem>
                    <SelectItem value="Sortant">Sortant</SelectItem>
                    <SelectItem value="Interne">Interne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Catégorie</Label>
                <Input placeholder="Ex: Facture, Devis..." />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNouveauCourrierOpen(false)}
            >
              Annuler
            </Button>
            <Button className="bg-gradient-to-r from-[#800020] to-[#a0002a]">
              <Plus className="h-4 w-4 mr-2" />
              Enregistrer le courrier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
