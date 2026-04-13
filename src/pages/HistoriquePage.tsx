/**
 * Page d'historique - Journal d'audit de toutes les activités
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  History,
  Activity,
  FileText,
  UserCheck,
  Share2,
  MessageSquare,
  Clock,
  User,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileSignature,
  Mail,
  MessageCircle,
  AlertCircle,
  Play,
  Flag,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import historiqueService, {
  type ActionLog,
  type ActionType,
} from "@/services/historiqueService";

export default function HistoriquePage() {
  const { isRHOrAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  // Suppression des statistiques, plus besoin de state
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
    // Suppression du chargement des statistiques
  }, [isRHOrAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await historiqueService.getActionLogs({ ordering: "-timestamp" });
      setActionLogs(data);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };



  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return diffMins === 0 ? "À l'instant" : `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getActionIcon = (actionType: ActionType) => {
    const iconMap: Record<string, any> = {
      courrier_create: FileText,
      courrier_update: Edit,
      courrier_delete: Trash2,
      courrier_archive: Archive,
      courrier_restore: RotateCcw,
      affectation_create: UserCheck,
      affectation_accuse: Eye,
      affectation_start: Play,
      affectation_validate: CheckCircle2,
      affectation_reject: XCircle,
      affectation_sign: FileSignature,
      partage_email: Mail,
      partage_whatsapp: MessageCircle,
      commentaire_add: MessageSquare,
      urgent_mark: Flag,
      urgent_unmark: Flag,
    };
    return iconMap[actionType] || Activity;
  };

  const getActionBadgeVariant = (actionType: ActionType) => {
    if (actionType.includes('create')) return 'default';
    if (actionType.includes('delete')) return 'destructive';
    if (actionType.includes('validate') || actionType.includes('sign')) return 'default';
    if (actionType.includes('reject')) return 'destructive';
    return 'secondary';
  };

  const filteredLogs = actionLogs.filter((log) => {
    if (actionTypeFilter !== "all" && log.action_type !== actionTypeFilter) {
      return false;
    }
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        log.description.toLowerCase().includes(searchLower) ||
        log.utilisateur_username.toLowerCase().includes(searchLower) ||
        log.courrier_numero.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  // Reset page if filter/search changes
  useEffect(() => {
    setPage(1);
  }, [search, actionTypeFilter]);

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <History className="h-8 w-8 text-[#7c2235]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Journal d'Activité</h1>
            <p className="text-sm text-muted-foreground">
              Suivi complet de toutes les actions effectuées sur la plateforme
            </p>
          </div>
        </div>
      </div>



      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans l'historique..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger className="w-full md:w-[250px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="courrier_create">Création courrier</SelectItem>
                <SelectItem value="courrier_update">Modification courrier</SelectItem>
                <SelectItem value="courrier_delete">Suppression courrier</SelectItem>
                <SelectItem value="affectation_create">Affectation</SelectItem>
                <SelectItem value="affectation_accuse">Accusé réception</SelectItem>
                <SelectItem value="affectation_start">Début traitement</SelectItem>
                <SelectItem value="affectation_validate">Validation</SelectItem>
                <SelectItem value="affectation_reject">Rejet</SelectItem>
                <SelectItem value="affectation_sign">Signature</SelectItem>
                <SelectItem value="partage_email">Partage Email</SelectItem>
                <SelectItem value="partage_whatsapp">Partage WhatsApp</SelectItem>
                <SelectItem value="commentaire_add">Commentaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des activités avec pagination et affichage compact */}
      <Card>
        <CardHeader>
          <CardTitle>Activités Récentes</CardTitle>
          <CardDescription>
            {filteredLogs.length} action{filteredLogs.length > 1 ? "s" : ""} trouvée{filteredLogs.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c2235]" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune activité trouvée</p>
            </div>
          ) : (
            <>
              <div className="divide-y border rounded-md bg-background">
                {paginatedLogs.map((log) => {
                  const Icon = getActionIcon(log.action_type);
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 transition-colors"
                    >
                      <span className="rounded-full p-1 bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-foreground block truncate">
                          {log.description}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {log.utilisateur_nom_complet || log.utilisateur_username}
                          </span>
                          {log.courrier_numero && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {log.courrier_numero}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={getActionBadgeVariant(log.action_type)} className="text-xs">
                        {log.action_type_display}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Pagination Controls */}
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
                  Précédent
                </Button>
                <span className="text-xs">
                  Page {page} / {totalPages}
                </span>
                <Button size="sm" variant="outline" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                  Suivant
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
