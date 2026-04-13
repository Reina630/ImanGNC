import React from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  MoreVertical,
  ArrowRight,
  Inbox,
  Send,
  FileText,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courrierService, circuitAffectationService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Courrier } from "@/types";
import { useMemo } from "react";

const statutColor = (s: string) => {
  if (s === "Reçu" || s === "recu") return "bg-amber-100 text-amber-700 border-amber-200";
  if (s === "En traitement" || s === "en_traitement") return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "Traité" || s === "traite") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-muted text-muted-foreground border-border";
};

const prioriteColor = (urgent: boolean) => {
  if (urgent) return "bg-red-100 text-red-700 border-red-200";
  return "bg-muted text-muted-foreground border-border";
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { 
      day: "2-digit", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  } catch {
    return "N/A";
  }
};

const getTimeAgo = (dateString: string | null) => {
  if (!dateString) return "N/A";
  try {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: fr 
    });
  } catch {
    return "N/A";
  }
};

export default function DashboardUser() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Récupérer les courriers affectés à l'utilisateur
  const { data: mesCourriers = [], isLoading, error } = useQuery({
    queryKey: ['mes-courriers'],
    queryFn: () => courrierService.getMesCourriers(),
  });

  // Calculer les statistiques dynamiquement
  const stats = useMemo(() => {
    const total = mesCourriers.length;
    const enAttente = mesCourriers.filter(c => c.statut === 'recu').length;
    const enTraitement = mesCourriers.filter(c => c.statut === 'en_traitement').length;
    const traites = mesCourriers.filter(c => c.statut === 'traite').length;

    return [
      { 
        label: "COURRIERS AFFECTÉS", 
        value: total.toString(), 
        icon: Inbox, 
        change: ` au total`, 
        changeColor: "text-primary" 
      },
      { 
        label: "EN ATTENTE", 
        value: enAttente.toString(), 
        icon: Clock, 
        change: "À traiter", 
        changeColor: "text-amber-500" 
      },
      { 
        label: "EN TRAITEMENT", 
        value: enTraitement.toString(), 
        icon: FileText, 
        change: "En cours", 
        changeColor: "text-blue-500" 
      },
      { 
        label: "TRAITÉS", 
        value: traites.toString(), 
        icon: CheckCircle2, 
        change: "Complétés", 
        changeColor: "text-emerald-500" 
      },
    ];
  }, [mesCourriers]);

  // Mutation pour marquer comme traité
  const marquerTraiteMutation = useMutation({
    mutationFn: (id: number) => courrierService.changerStatut(id, 'traite'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes-courriers'] });
      toast.success('Courrier marqué comme traité');
    },
    onError: () => {
      toast.error('Erreur lors du changement de statut');
    },
  });

  // Mutation pour marquer en traitement
  const marquerEnTraitementMutation = useMutation({
    mutationFn: (id: number) => courrierService.changerStatut(id, 'en_traitement'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes-courriers'] });
      toast.success('Courrier marqué en traitement');
    },
    onError: () => {
      toast.error('Erreur lors du changement de statut');
    },
  });

  const handleConsulter = (courrier: Courrier) => {
    // Chercher l'affectation v2 de l'utilisateur pour ce courrier
    const affectationV2 = courrier.affectations_v2?.find(
      (aff) => aff.destinataire === user?.id
    );

    if (affectationV2) {
      // Rediriger vers VoirCourrierUser avec l'ID de l'affectation v2
      navigate(`/mes-courriers/traiter/${courrier.id}?affectation=${affectationV2.id}`);
    } else {
      // Fallback vers l'ancienne page si pas d'affectation v2
      navigate(`/courriers/${courrier.id}`);
    }
  };

  const handleTelecharger = async (courrier: Courrier) => {
    try {
      await courrierService.telechargerFichier(courrier.id, courrier.numero_registre);
      toast.success('Téléchargement démarré');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  // Courriers urgents
  const courriersUrgents = useMemo(
    () => mesCourriers.filter(c => c.urgent && c.statut !== 'traite'),
    [mesCourriers]
  );

  // Activités récentes (courriers récemment modifiés/créés)
  const activitesRecentes = useMemo(() => {
    return [...mesCourriers]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 4)
      .map(c => ({
        courrier: c,
        action: c.statut === 'traite' 
          ? 'Courrier traité' 
          : c.statut === 'en_traitement' 
          ? 'En cours de traitement' 
          : 'Nouveau courrier affecté',
        color: c.statut === 'traite' 
          ? 'bg-emerald-500' 
          : c.statut === 'en_traitement' 
          ? 'bg-blue-500' 
          : 'bg-primary',
      }));
  }, [mesCourriers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-muted-foreground">Erreur lors du chargement des courriers</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes Courriers</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble de vos courriers affectés</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">{s.value}</span>
              <span className={`text-xs font-medium ${s.changeColor} mb-1`}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Main: courrier list */}
        <div className="space-y-4">
          {/* Urgent alert */}
          {courriersUrgents.length > 0 && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  {courriersUrgents.length} courrier{courriersUrgents.length > 1 ? 's' : ''} urgent{courriersUrgents.length > 1 ? 's' : ''}
                </span>
                <span className="text-xs text-red-600/70 dark:text-red-400/70 ml-2">
                  nécessite{courriersUrgents.length > 1 ? 'nt' : ''} votre attention immédiate
                </span>
              </div>
            </div>
          )}

          {/* Courrier table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Courriers affectés</h2>
              <Button 
                variant="link" 
                className="text-primary text-sm p-0 h-auto"
                onClick={() => navigate('/courriers')}
              >
                Voir tout <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {mesCourriers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Aucun courrier affecté</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left px-5 py-3 font-medium">OBJET & EXPÉDITEUR</th>
                      <th className="text-left px-3 py-3 font-medium hidden md:table-cell">REÇU</th>
                      <th className="text-left px-3 py-3 font-medium hidden lg:table-cell">TYPE</th>
                      <th className="text-left px-3 py-3 font-medium">PRIORITÉ</th>
                      <th className="text-left px-3 py-3 font-medium">STATUT</th>
                      <th className="text-center px-3 py-3 font-medium">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesCourriers.slice(0, 8).map((c) => (
                      <tr 
                        key={c.id} 
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => handleConsulter(c)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              {c.type_courrier === "entrant" ? (
                                <Inbox className="h-4 w-4 text-primary" />
                              ) : (
                                <Send className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground leading-tight">{c.objet}</p>
                              <p className="text-xs text-muted-foreground">{c.expediteur} · {c.numero_registre}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                          {formatDate(c.date_principale)}
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <Badge variant="outline" className="text-xs">{c.type_courrier_display}</Badge>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className={`text-xs ${prioriteColor(c.urgent)}`}>
                            {c.urgent ? 'Urgent' : 'Normal'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className={`text-xs ${statutColor(c.statut)}`}>
                            {c.statut_display}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleConsulter(c)}>
                                <Eye className="h-4 w-4 mr-2" /> Consulter
                              </DropdownMenuItem>
                              {c.statut === 'recu' && (
                                <DropdownMenuItem 
                                  onClick={() => marquerEnTraitementMutation.mutate(c.id)}
                                  disabled={marquerEnTraitementMutation.isPending}
                                >
                                  <FileText className="h-4 w-4 mr-2" /> Marquer en traitement
                                </DropdownMenuItem>
                              )}
                              {(c.statut === 'recu' || c.statut === 'en_traitement') && (
                                <DropdownMenuItem 
                                  onClick={() => marquerTraiteMutation.mutate(c.id)}
                                  disabled={marquerTraiteMutation.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Marquer traité
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleTelecharger(c)}>
                                <Download className="h-4 w-4 mr-2" /> Télécharger
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
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Traitement progress */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Avancement traitement</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Traités</span>
                <span className="font-semibold text-emerald-600">
                  {stats[3].value}/{stats[0].value} — {mesCourriers.length > 0 
                    ? Math.round((parseInt(stats[3].value) / parseInt(stats[0].value)) * 100) 
                    : 0}%
                </span>
              </div>
              <Progress 
                value={mesCourriers.length > 0 
                  ? (parseInt(stats[3].value) / parseInt(stats[0].value)) * 100 
                  : 0} 
                className="h-2" 
              />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">En attente</span>
                <span className="font-medium text-amber-600">{stats[1].value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">En traitement</span>
                <span className="font-medium text-blue-600">{stats[2].value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Complétés</span>
                <span className="font-medium text-emerald-600">{stats[3].value}</span>
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Fil d'activité</h3>
            {activitesRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            ) : (
              <div className="space-y-4">
                {activitesRecentes.map((a, i) => (
                  <div key={a.courrier.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${a.color} mt-1.5`} />
                      {i < activitesRecentes.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-foreground leading-tight">{a.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.courrier.numero_registre} · {a.courrier.expediteur}
                      </p>
                      <p className="text-xs text-muted-foreground">{getTimeAgo(a.courrier.updated_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button 
              variant="link" 
              className="text-primary text-sm p-0 h-auto"
              onClick={() => navigate('/courriers')}
            >
              Voir l'historique complet
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
