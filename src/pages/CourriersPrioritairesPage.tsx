/**
 * Page des courriers prioritaires/urgents
 * Affiche uniquement les courriers marqués comme urgents
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Download,
  Eye,
  Edit2,
  Mail,
  Send,
  Inbox,
  Clock,
  CheckCircle2,
  Archive,
  FileText,
  GitBranch,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";
import { CourrierDetailsDialog } from "@/components/CourrierDetailsDialog";
import { CourrierPreviewDialog } from "@/components/CourrierPreviewDialog";
import { EditCourrierDialog } from "@/components/EditCourrierDialog";
import { CourrierVersionsDialog } from "@/components/CourrierVersionsDialog";
import { AffecterServiceDialog } from "@/components/AffecterServiceDialog";

export default function CourriersPrioritairesPage() {
  const { toast } = useToast();
  
  // États
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [affecterDialogOpen, setAffecterDialogOpen] = useState(false);
  const [selectedCourrier, setSelectedCourrier] = useState<Courrier | null>(null);

  // Charger les courriers urgents au montage
  useEffect(() => {
    loadCourriersPrioritaires();
  }, []);

  /**
   * Charger uniquement les courriers urgents
   */
  const loadCourriersPrioritaires = async () => {
    try {
      setLoading(true);
      const allCourriers = await courrierService.getCourriers({});
      // Filtrer uniquement les courriers urgents
      const urgents = allCourriers.filter(c => c.urgent);
      setCourriers(urgents);
    } catch (error) {
      console.error("Erreur lors du chargement des courriers urgents:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les courriers urgents",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retirer le marquage urgent d'un courrier
   */
  const handleToggleUrgent = async (id: number) => {
    try {
      await courrierService.toggleUrgent(id);
      // Retirer de la liste
      setCourriers(courriers.filter(c => c.id !== id));
      toast({
        title: "Courrier retiré",
        description: "Le courrier n'est plus marqué comme urgent",
      });
    } catch (error) {
      console.error("Erreur lors du retrait urgent:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le marquage urgent",
      });
    }
  };

  /**
   * Télécharger le fichier d'un courrier
   */
  const handleDownload = async (courrier: Courrier) => {
    try {
      await courrierService.telechargerFichier(courrier.id, courrier.numero_registre);
      toast({
        title: "Téléchargement démarré",
        description: `Téléchargement de ${courrier.numero_registre}`,
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
   * Formater la date
   */
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  /**
   * Couleur du statut
   */
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "recu":
        return "bg-info/15 text-info border-info/30";
      case "en_traitement":
        return "bg-warning/15 text-warning border-warning/30";
      case "traite":
        return "bg-success/15 text-success border-success/30";
      case "archive":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  /**
   * Icône du statut
   */
  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case "recu":
        return <Clock className="h-3 w-3" />;
      case "en_traitement":
        return <Mail className="h-3 w-3" />;
      case "traite":
        return <CheckCircle2 className="h-3 w-3" />;
      case "archive":
        return <Archive className="h-3 w-3" />;
      default:
        return null;
    }
  };


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* En-tête immersif */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-neutral-50 to-white rounded-xl p-6 border border-neutral-100 shadow-sm relative overflow-hidden">
        {/* Illustration de fond douce */}
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{background: 'url(https://www.transparenttextures.com/patterns/symphony.png) repeat'}} />
        <div className="flex items-center gap-4 z-10">
          <div className="rounded-full bg-neutral-200 p-4 flex items-center justify-center">
            <Zap className="h-8 w-8 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Courriers prioritaires</h1>
            <p className="text-neutral-700 text-base mt-1">
              {courriers.length === 0 ? "Aucun courrier urgent" : `${courriers.length} courrier${courriers.length > 1 ? "s" : ""} urgent${courriers.length > 1 ? "s" : ""}`}
            </p>
            <p className="text-neutral-400 text-xs mt-1">Gardez un œil sur les dossiers sensibles et gagnez du temps sur vos traitements !</p>
          </div>
        </div>
        {courriers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0 z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium text-sm">
              <Zap className="h-4 w-4" /> Prioritaire
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium text-sm">
              <Mail className="h-4 w-4" /> {courriers.filter(c => c.type_courrier === "entrant").length} entrant(s)
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium text-sm">
              <Send className="h-4 w-4" /> {courriers.filter(c => c.type_courrier === "sortant").length} sortant(s)
            </span>
          </div>
        )}
      </div>

      {/* Message si aucun courrier urgent */}
      {!loading && courriers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-neutral-200 shadow-inner">
          <Zap className="h-16 w-16 text-yellow-100 mb-6 animate-pulse" />
          <h3 className="text-2xl font-semibold text-neutral-800 mb-2">Aucun courrier urgent</h3>
          <p className="text-neutral-500 text-base">Tous vos courriers sont traités ou non urgents.<br/>Profitez-en pour avancer sur d'autres tâches ou prendre une pause ☕</p>
        </div>
      )}

      {/* Liste des courriers urgents sous forme de cartes */}
      {courriers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courriers.map((courrier) => (
            <div key={courrier.id} className="bg-white border border-neutral-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-2 relative min-h-[180px]">
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold">
                  <Zap className="h-3 w-3" /> Urgent
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-base font-bold text-neutral-900">{courrier.numero_registre}</span>
                <Badge
                  variant={courrier.type_courrier === "entrant" ? "default" : "secondary"}
                  className="gap-1 text-xs px-2 py-1"
                >
                  {courrier.type_courrier === "entrant" ? (
                    <Inbox className="h-3 w-3" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  {courrier.type_courrier_display}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">{formatDate(courrier.date_principale)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-2 text-xs">
                  <span className="font-medium text-neutral-400">Expéditeur :</span>
                  <span className="truncate">{courrier.expediteur}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="font-medium text-neutral-400">Destinataire :</span>
                  <span className="truncate">{courrier.destinataire}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="font-medium text-neutral-400">Objet :</span>
                  <span className="truncate">{courrier.objet}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="font-medium text-neutral-400">Statut :</span>
                  <Badge className={`gap-1 ${getStatutColor(courrier.statut)} text-xs px-2 py-1`}>
                    {getStatutIcon(courrier.statut)}
                    {courrier.statut_display}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setSelectedCourrier(courrier);
                    setPreviewDialogOpen(true);
                  }}
                  className="bg-primary"
                >
                  <FileText className="h-4 w-4 mr-1" /> Voir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleUrgent(courrier.id)}
                  title="Retirer urgent"
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <Zap className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(courrier)}
                  title="Télécharger"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedCourrier(courrier);
                    setVersionsDialogOpen(true);
                  }}
                  title="Versions"
                >
                  <GitBranch className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedCourrier(courrier);
                    setDetailsDialogOpen(true);
                  }}
                  title="Voir détails"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedCourrier(courrier);
                    setEditDialogOpen(true);
                  }}
                  title="Modifier"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedCourrier(courrier);
                    setAffecterDialogOpen(true);
                  }}
                  title="Affecter à un service"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Building2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CourrierPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        courrier={selectedCourrier}
      />
      <CourrierDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        courrier={selectedCourrier}
      />
      <EditCourrierDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        courrier={selectedCourrier}
        onSuccess={() => {
          setEditDialogOpen(false);
          loadCourriersPrioritaires();
        }}
      />
      <CourrierVersionsDialog
        open={versionsDialogOpen}
        onOpenChange={setVersionsDialogOpen}
        courrier={selectedCourrier}
        onVersionCreated={loadCourriersPrioritaires}
      />
      <AffecterServiceDialog
        open={affecterDialogOpen}
        onOpenChange={setAffecterDialogOpen}
        courrier={selectedCourrier}
        onSuccess={loadCourriersPrioritaires}
      />
    </motion.div>
  );
}
