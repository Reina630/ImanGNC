import React, { useState, useEffect, useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import affectationService from "@/services/affectationService";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Building2,
  Users,
  Info,
  FileText,
  Clock,
  MessageSquare,
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  PenLine,
  Reply,
  Forward,
  PlayCircle,
} from "lucide-react";

interface Courrier {
  id: number;           // affectation ID
  courrier_id: number;  // courrier réel ID
  numero: string;
  objet: string;
  service: string;
  statut: string;
  statut_display: string;
  action_requise: string;
  niveau_urgence: string;
  date_echeance: string | null;
  nb_commentaires: number;
  date_reception: string;
  is_read: boolean;
}

export default function MesCourriers(): React.JSX.Element {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentTheme } = useTheme();

  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [filteredCourriers, setFilteredCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"a_traiter" | "clotures">("a_traiter");
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");

  useEffect(() => {
    loadCourriers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courriers, activeTab, searchQuery, serviceFilter, statutFilter]);

  const loadCourriers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await affectationService.getAffectations({ mes_affectations: 1 });

      const userCourriers = data.map((item) => ({
        id: item.id,
        courrier_id: item.courrier,
        numero: item.courrier_numero || `#${item.courrier}`,
        objet: item.courrier_objet || "Sans objet",
        service: item.service_detail?.nom || "Non défini",
        statut: item.statut || "distribue",
        statut_display: item.statut,
        action_requise: item.action_requise || "informatif",
        niveau_urgence: item.niveau_urgence || "normal",
        date_echeance: item.date_echeance,
        nb_commentaires: 0,
        date_reception: item.date_affectation || new Date().toISOString(),
        is_read: item.date_lecture !== null,
      }));

      setCourriers(userCourriers);
    } catch (error: any) {
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

  const getServiceIcon = (service: string) => {
    const icons: Record<string, JSX.Element> = {
      "Direction Générale": <Building2 className="w-7 h-7 text-slate-600" />,
      "Ressources Humaines": <Users className="w-7 h-7 text-slate-600" />,
      "Communication": <Info className="w-7 h-7 text-slate-600" />,
      "Finance": <FileText className="w-7 h-7 text-slate-600" />,
    };
    return icons[service] || <FileText className="w-7 h-7 text-slate-600" />;
  };

  const applyFilters = () => {
    let filtered = [...courriers];

    // Filtrage par onglet
    if (activeTab === "a_traiter") {
      filtered = filtered.filter(c => ["distribue", "vu", "en_traitement", "en_attente", "lu"].includes(c.statut));
    } else if (activeTab === "clotures") {
      filtered = filtered.filter(c => ["valide", "signe", "rejete", "renvoye"].includes(c.statut));
    }

    // Filtrage par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.numero.toLowerCase().includes(query) ||
          c.objet.toLowerCase().includes(query) ||
          c.service.toLowerCase().includes(query)
      );
    }

    // Filtrage par service
    if (serviceFilter !== "all") {
      filtered = filtered.filter((c) => c.service === serviceFilter);
    }

    // Filtrage par statut
    if (statutFilter !== "all") {
      filtered = filtered.filter((c) => c.statut === statutFilter);
    }

    setFilteredCourriers(filtered);
  };

  const services = Array.from(new Set(courriers.map((c) => c.service).filter(Boolean)));

  const getStatutBadge = (statut: string, display: string) => {
    const variants: Record<string, string> = {
      distribue:      "bg-orange-100 text-orange-700",
      en_attente:     "bg-orange-100 text-orange-700",
      vu:             "bg-blue-100 text-blue-700",
      lu:             "bg-blue-100 text-blue-700",
      en_traitement:  "bg-yellow-100 text-yellow-700",
      valide:         "bg-green-100 text-green-700",
      signe:          "bg-emerald-100 text-emerald-700",
      rejete:         "bg-red-100 text-red-700",
      renvoye:        "bg-purple-100 text-purple-700",
    };
    const labels: Record<string, string> = {
      distribue:      "Distribué",
      en_attente:     "Distribué",
      vu:             "Vu",
      lu:             "Vu",
      en_traitement:  "En traitement",
      valide:         "Traité",
      signe:          "Signé",
      rejete:         "Rejeté",
      renvoye:        "Renvoyé",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${variants[statut] || "bg-gray-100 text-gray-700"}`}>
        {labels[statut] || display}
      </span>
    );
  };

  const getDeadlineText = (dateEcheance: string | null) => {
    if (!dateEcheance) return { text: "Reçu hier", icon: Calendar };
    
    const now = new Date();
    const echeance = new Date(dateEcheance);
    const diffTime = echeance.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours < 24 && diffHours > 0) {
      return { text: `${diffHours}h restantes`, icon: Clock };
    } else if (diffDays > 0) {
      return { text: `${diffDays}j restants`, icon: Clock };
    } else {
      return { text: "Reçu hier", icon: Calendar };
    }
  };

  const handleOuvrir = async (courrier: Courrier) => {
    try {
      await affectationService.marquerLu(courrier.id);
      // Pour les informatifs, le backend auto-valide : on recharge la liste avant de naviguer
      if (courrier.action_requise === "informatif") {
        await loadCourriers(true);
      }
      navigate(`/mes-courriers/traiter/${courrier.courrier_id}?affectation=${courrier.id}`);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ouvrir ce courrier." });
    }
  };

  const handleTraiter = (courrier: Courrier) => {
    navigate(`/mes-courriers/traiter/${courrier.courrier_id}?affectation=${courrier.id}`);
  };

  const handleRenvoyer = async (courrier: Courrier) => {
    try {
      await affectationService.renvoyer(courrier.id);
      toast({ title: "Courrier renvoyé", description: `Courrier ${courrier.numero} marqué comme renvoyé.` });
      await loadCourriers();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de renvoyer ce courrier." });
    }
  };

  const handleAccuserReception = async (courrier: Courrier) => {
    try {
      await affectationService.valider(courrier.id, "Accusé de réception");
      toast({ title: "Accusé de réception envoyé", description: `Courrier ${courrier.numero} traité.` });
      await loadCourriers();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'accuser réception." });
    }
  };

  const handleRepondre = (courrier: Courrier) => {
    navigate(`/courriers/repondre/${courrier.courrier_id}?affectation=${courrier.id}`);
  };

  const btnPrimary = "px-5 py-2.5 text-white rounded-xl text-sm font-semibold shadow-md transition-colors flex items-center gap-2";
  const btnSecondary = "px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-100";

  const getActionButtons = (courrier: Courrier) => {
    // --- Distribué : pas encore vu ---
    if (["distribue", "en_attente"].includes(courrier.statut)) {
      return (
        <Button
          onClick={() => handleOuvrir(courrier)}
          style={{ backgroundColor: currentTheme.hex.primary }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.hex.primaryHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.hex.primary}
          className={btnPrimary}
        >
          <Eye className="h-4 w-4" />
          {courrier.action_requise === "informatif" ? "Consulter" : "Voir"}
        </Button>
      );
    }

    // --- Vu : bouton Voir (consultation) + Signer (action) ---
    if (["vu", "lu"].includes(courrier.statut)) {
      return (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleOuvrir(courrier)}
            variant="outline"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Eye className="h-4 w-4" />
            Voir
          </Button>
          <Button
            onClick={() => handleTraiter(courrier)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md"
          >
            {courrier.action_requise === "a_signer" ? (
              <>
                <PenLine className="h-4 w-4" />
                Signer
              </>
            ) : courrier.action_requise === "a_repondre" ? (
              <>
                <Reply className="h-4 w-4" />
                Répondre
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Traiter
              </>
            )}
          </Button>
        </div>
      );
    }

    // --- En traitement : action spécifique selon action_requise ---
    if (courrier.statut === "en_traitement") {
      if (courrier.action_requise === "a_signer") {
        return (
          <Button
            onClick={() => navigate(`/mes-courriers/traiter/${courrier.courrier_id}?affectation=${courrier.id}`)}
            style={{ backgroundColor: currentTheme.hex.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.hex.primaryHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.hex.primary}
            className={btnPrimary}
          >
            <PenLine className="h-4 w-4" />
            Signer
          </Button>
        );
      }
      if (courrier.action_requise === "accusation_reception") {
        return (
          <Button
            onClick={() => handleAccuserReception(courrier)}
            style={{ backgroundColor: currentTheme.hex.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.hex.primaryHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.hex.primary}
            className={btnPrimary}
          >
            <CheckCircle className="h-4 w-4" />
            Accuser réception
          </Button>
        );
      }
      if (courrier.action_requise === "a_repondre") {
        return (
          <Button
            onClick={() => handleRepondre(courrier)}
            style={{ backgroundColor: currentTheme.hex.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.hex.primaryHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.hex.primary}
            className={btnPrimary}
          >
            <Reply className="h-4 w-4" />
            Répondre
          </Button>
        );
      }
    }

    // --- Clôturé (traité, signé, rejeté, renvoyé) ---
    return (
      <Button
        variant="outline"
        onClick={() => navigate(`/mes-courriers/traiter/${courrier.courrier_id}?affectation=${courrier.id}`)}
        style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = currentTheme.hex.primary; e.currentTarget.style.color = "white"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        Consulter
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header avec onglets */}
      <div className="bg-white/80 backdrop-blur-xl px-10 py-6 -mx-8 -mt-8 mb-8 shadow-[0px_12px_32px_rgba(25,28,30,0.04)]">
        <div className="flex flex-col">
          <h2 className="font-bold text-2xl leading-tight" style={{ color: currentTheme.hex.primary }}>
            Mes Courriers
          </h2>
          <div className="flex gap-8 mt-3">
            <button
              onClick={() => setActiveTab("a_traiter")}
              className={`text-sm font-semibold pb-2 transition-colors ${
                activeTab === "a_traiter"
                  ? "border-b-2"
                  : "text-slate-500"
              }`}
              style={activeTab === "a_traiter" ? { color: currentTheme.hex.primary, borderColor: currentTheme.hex.primary } : {}}
            >
              À traiter
              {courriers.filter(c => ["distribue", "vu", "en_traitement", "en_attente", "lu"].includes(c.statut)).length > 0 && (
                <span className="ml-2 text-[10px] font-bold bg-orange-500 text-white rounded-full px-1.5 py-0.5">
                  {courriers.filter(c => ["distribue", "vu", "en_traitement", "en_attente", "lu"].includes(c.statut)).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("clotures")}
              className={`text-sm font-semibold pb-2 transition-colors ${
                activeTab === "clotures"
                  ? "border-b-2"
                  : "text-slate-500"
              }`}
              style={activeTab === "clotures" ? { color: currentTheme.hex.primary, borderColor: currentTheme.hex.primary } : {}}
            >
              Clôturés
            </button>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher un courrier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-11 bg-slate-50 border-slate-200 rounded-xl w-full"
          />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-auto min-w-[140px] h-11 bg-slate-50 border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Service</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              {services.map((service) => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-auto min-w-[140px] h-11 bg-slate-50 border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Statut</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="distribue">Distribué</SelectItem>
              <SelectItem value="vu">Vu</SelectItem>
              <SelectItem value="en_traitement">En traitement</SelectItem>
              <SelectItem value="valide">Traité</SelectItem>
              <SelectItem value="signe">Signé</SelectItem>
              <SelectItem value="renvoye">Renvoyé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des courriers */}
      <div className="space-y-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
              <Skeleton className="h-24 w-full" />
            </div>
          ))
        ) : filteredCourriers.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center text-slate-500">
            {courriers.length === 0 ? "Aucun courrier à afficher" : "Aucun courrier ne correspond à vos critères de recherche"}
          </div>
        ) : (
          filteredCourriers.map((courrier) => {
            const deadline = getDeadlineText(courrier.date_echeance);
            const DeadlineIcon = deadline.icon;

            return (
              <div
                key={courrier.id}
                className="bg-white p-6 rounded-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-transform hover:scale-[1.01] duration-300"
              >
                {/* Contenu principal */}
                <div className="flex items-start gap-5 flex-1">
                  {/* Icône du service */}
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {getServiceIcon(courrier.service)}
                  </div>

                  {/* Informations du courrier */}
                  <div className="space-y-1">
                    {/* Service et Badge */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {courrier.service}
                      </span>
                      {getStatutBadge(courrier.statut, courrier.statut_display)}
                    </div>

                    {/* Titre */}
                    <h3 className="font-semibold text-base text-gray-900">
                      {courrier.objet}
                    </h3>

                    {/* Métadonnées */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <DeadlineIcon className="w-4 h-4" />
                        <span className={deadline.icon === Clock ? "text-red-600 font-semibold" : ""}>
                          {deadline.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{courrier.nb_commentaires} commentaire{courrier.nb_commentaires > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center gap-3 self-end md:self-center">
                  {getActionButtons(courrier)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => navigate("/courriers/nouveau")}
        style={{ backgroundColor: currentTheme.hex.primary }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.hex.primaryHover}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.hex.primary}
        className="fixed bottom-8 right-8 w-16 h-16 text-white rounded-full shadow-2xl transition-all active:scale-90 z-50 group"
      >
        <Plus className="w-8 h-8 transition-transform group-hover:rotate-90" />
      </Button>
    </div>
  );
}
