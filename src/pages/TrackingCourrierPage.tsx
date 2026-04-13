import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface Affectation {
  id: number;
  courrier: number;
  courrier_numero: string;
  courrier_objet: string;
  courrier_details?: any;
  utilisateur: number;
  utilisateur_username: string;
  utilisateur_nom_complet: string;
  utilisateur_service: string;
  affecte_par_username: string;
  affecte_par_nom_complet: string;
  note: string;
  statut: string;
  statut_display: string;
  niveau_urgence: string;
  niveau_urgence_display: string;
  date_echeance: string | null;
  commentaire_traitement: string;
  motif_rejet: string;
  date_affectation: string;
  date_lecture: string | null;
  date_traitement: string | null;
  nb_commentaires: number;
}

export default function TrackingCourrierPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [filteredAffectations, setFilteredAffectations] = useState<Affectation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [urgenceFilter, setUrgenceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_affectation");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Charger les affectations
  useEffect(() => {
    loadAffectations();
  }, []);

  // Filtrer et trier les affectations
  useEffect(() => {
    let filtered = [...affectations];

    // Filtre de recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (aff) =>
          aff.courrier_numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
          aff.courrier_objet.toLowerCase().includes(searchQuery.toLowerCase()) ||
          aff.utilisateur_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          aff.utilisateur_nom_complet.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par statut
    if (statutFilter !== "all") {
      filtered = filtered.filter((aff) => aff.statut === statutFilter);
    }

    // Filtre par urgence
    if (urgenceFilter !== "all") {
      filtered = filtered.filter((aff) => aff.niveau_urgence === urgenceFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Affectation];
      let bValue: any = b[sortBy as keyof Affectation];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAffectations(filtered);
  }, [affectations, searchQuery, statutFilter, urgenceFilter, sortBy, sortOrder]);

  const loadAffectations = async () => {
    setLoading(true);
    try {
      const response = await api.get("/affectations/");
      // L'API peut retourner un tableau ou un objet avec results
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setAffectations(data);
    } catch (error: any) {
      console.error("Erreur lors du chargement des affectations:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les affectations.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string, display: string) => {
    const variants: Record<string, any> = {
      en_attente: { variant: "secondary", icon: Clock },
      lu: { variant: "default", icon: Eye },
      en_traitement: { variant: "default", icon: Clock },
      valide: { variant: "default", icon: CheckCircle2, className: "bg-green-500" },
      rejete: { variant: "destructive", icon: XCircle },
      signe: { variant: "default", icon: CheckCircle2, className: "bg-blue-500" },
    };

    const config = variants[statut] || { variant: "secondary", icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {display}
      </Badge>
    );
  };

  const getUrgenceBadge = (urgence: string, display: string) => {
    const colors: Record<string, string> = {
      faible: "bg-green-500",
      normal: "bg-blue-500",
      eleve: "bg-orange-500",
      critique: "bg-red-500",
    };

    return (
      <Badge className={`${colors[urgence] || "bg-gray-500"} text-white`}>
        <AlertCircle className="h-3 w-3 mr-1" />
        {display}
      </Badge>
    );
  };

  const getEcheanceInfo = (dateEcheance: string | null) => {
    if (!dateEcheance) {
      return <span className="text-muted-foreground text-sm">Aucune</span>;
    }

    const echeance = new Date(dateEcheance);
    const isOverdue = isPast(echeance) && differenceInDays(new Date(), echeance) > 0;
    const daysRemaining = differenceInDays(echeance, new Date());

    if (isOverdue) {
      return (
        <span className="text-red-600 font-semibold text-sm flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          Dépassée ({Math.abs(daysRemaining)} j)
        </span>
      );
    } else if (daysRemaining === 0) {
      return (
        <span className="text-orange-600 font-semibold text-sm flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          Aujourd'hui
        </span>
      );
    } else if (daysRemaining <= 3) {
      return (
        <span className="text-orange-500 text-sm flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
        </span>
      );
    } else {
      return (
        <span className="text-sm flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {format(echeance, "dd MMM yyyy", { locale: fr })}
        </span>
      );
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleVoirCourrier = (courrierId: number) => {
    navigate(`/courriers/${courrierId}`);
  };

  // Statistiques
  const stats = {
    total: affectations.length,
    en_attente: affectations.filter((a) => a.statut === "en_attente").length,
    en_traitement: affectations.filter((a) => a.statut === "en_traitement" || a.statut === "lu").length,
    valide: affectations.filter((a) => a.statut === "valide").length,
    critique: affectations.filter((a) => a.niveau_urgence === "critique").length,
    en_retard: affectations.filter(
      (a) => a.date_echeance && isPast(new Date(a.date_echeance)) && a.statut !== "valide" && a.statut !== "signe"
    ).length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Suivi des Courriers</h1>
          <p className="text-muted-foreground">
            Suivez toutes les affectations et leur progression en temps réel
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En attente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.en_attente}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En traitement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.en_traitement}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En retard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.en_retard}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bouton pour afficher/masquer les filtres */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filtres */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres et Recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="lu">Lu</SelectItem>
                  <SelectItem value="en_traitement">En traitement</SelectItem>
                  <SelectItem value="valide">Validé</SelectItem>
                  <SelectItem value="rejete">Rejeté</SelectItem>
                  <SelectItem value="signe">Signé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={urgenceFilter} onValueChange={setUrgenceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les urgences</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="eleve">Élevé</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatutFilter("all");
                  setUrgenceFilter("all");
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des affectations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Affectations ({filteredAffectations.length})
          </CardTitle>
          <CardDescription>
            Liste de toutes les affectations de courriers et leur progression
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer w-[120px]" onClick={() => handleSort("courrier_numero")}>
                    <div className="flex items-center gap-1">
                      N° Courrier
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">Objet</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("utilisateur_nom_complet")}>
                    <div className="flex items-center gap-1">
                      Affecté à
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("niveau_urgence")}>
                    <div className="flex items-center gap-1">
                      Urgence
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("statut")}>
                    <div className="flex items-center gap-1">
                      Statut
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("date_echeance")}>
                    <div className="flex items-center gap-1">
                      Échéance
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredAffectations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune affectation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAffectations.map((affectation) => (
                    <TableRow key={affectation.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {affectation.courrier_numero}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate" title={affectation.courrier_objet}>
                        {affectation.courrier_objet}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{affectation.utilisateur_nom_complet}</span>
                          <span className="text-xs text-muted-foreground">{affectation.utilisateur_service || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getUrgenceBadge(affectation.niveau_urgence, affectation.niveau_urgence_display)}
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(affectation.statut, affectation.statut_display)}
                      </TableCell>
                      <TableCell>{getEcheanceInfo(affectation.date_echeance)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoirCourrier(affectation.courrier)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
