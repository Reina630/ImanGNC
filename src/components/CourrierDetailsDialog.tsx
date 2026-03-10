/**
 * Dialog pour afficher les détails complets d'un courrier
 * Affiche toutes les informations en lecture seule avec option de téléchargement
 */

import { useState } from "react";
import { X, Download, Calendar, Mail, Send, Inbox, FileText, Building2, User, Clock, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";
import { STATUT_CHOICES } from "@/types";
import { ShareCourrierDialog } from "@/components/ShareCourrierDialog";

interface CourrierDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrier: Courrier | null;
  onStatusChanged?: () => void;
}

export function CourrierDetailsDialog({
  open,
  onOpenChange,
  courrier,
  onStatusChanged,
}: CourrierDetailsDialogProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [showShareDialog, setShowShareDialog] = useState(false);

  if (!courrier) return null;

  // Formater la date pour affichage
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Télécharger le fichier scanné
  const handleDownload = async () => {
    try {
      setDownloading(true);
      await courrierService.telechargerFichier(courrier.id, courrier.numero_registre);
      toast({
        title: "Téléchargement réussi",
        description: `Le fichier ${courrier.numero_registre} a été téléchargé`,
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
      });
    } finally {
      setDownloading(false);
    }
  };

  // Changer le statut du courrier
  const handleChangeStatus = async () => {
    if (!newStatus || newStatus === courrier.statut) return;

    try {
      setChangingStatus(true);
      await courrierService.changerStatut(courrier.id, newStatus);
      toast({
        title: "Statut mis à jour",
        description: `Le statut a été changé en "${STATUT_CHOICES.find((s) => s.value === newStatus)?.label}"`,
      });
      onStatusChanged?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de changer le statut",
      });
    } finally {
      setChangingStatus(false);
    }
  };

  // Obtenir l'indicateur de statut
  const getStatusBadge = (statut: string) => {
    const statusData = STATUT_CHOICES.find((s) => s.value === statut);
    if (!statusData) return null;

    return (
      <Badge
        variant="outline"
        style={{
          borderColor: statusData.color,
          backgroundColor: `${statusData.color}15`,
          color: statusData.color,
        }}
        className="gap-1"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: statusData.color }}
        />
        {statusData.label}
      </Badge>
    );
  };

  // Obtenir le label du service depuis le code
  const getServiceLabel = (serviceCode: string) => {
    const codeToNameMapping: Record<string, string> = {
      'rh': 'Ressources Humaines',
      'comptabilite': 'Comptabilité',
      'direction': 'Direction',
      'technique': 'Service Technique',
      'commercial': 'Commercial',
      'juridique': 'Juridique',
      'informatique': 'Informatique',
      'logistique': 'Logistique',
      'autre': 'Autre',
    };
    return codeToNameMapping[serviceCode] || serviceCode;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Détails du courrier
              </DialogTitle>
              <DialogDescription className="mt-1">
                Numéro de registre : {courrier.numero_registre}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type et Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Type de courrier
              </Label>
              <Badge
                variant={courrier.type_courrier === "entrant" ? "default" : "secondary"}
                className="gap-1"
              >
                {courrier.type_courrier === "entrant" ? (
                  <Inbox className="h-3 w-3" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                {courrier.type_courrier === "entrant" ? "Entrant" : "Sortant"}
              </Badge>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Statut
              </Label>
              {getStatusBadge(courrier.statut)}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {courrier.type_courrier === "entrant" && courrier.date_reception && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date de réception
                </Label>
                <p className="text-sm font-medium">
                  {formatDate(courrier.date_reception)}
                </p>
              </div>
            )}

            {courrier.type_courrier === "sortant" && courrier.date_envoi && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date d'envoi
                </Label>
                <p className="text-sm font-medium">
                  {formatDate(courrier.date_envoi)}
                </p>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Date d'enregistrement
              </Label>
              <p className="text-sm font-medium">
                {formatDate(courrier.created_at)}
              </p>
            </div>
          </div>

          {/* Expéditeur / Destinataire */}
          <div className="grid grid-cols-2 gap-4">
            {courrier.expediteur && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Expéditeur
                </Label>
                <p className="text-sm font-medium">{courrier.expediteur}</p>
              </div>
            )}

            {courrier.destinataire && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Destinataire
                </Label>
                <p className="text-sm font-medium">{courrier.destinataire}</p>
              </div>
            )}
          </div>

          {/* Service et Objet */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Service concerné
              </Label>
              <p className="text-sm font-medium">
                {getServiceLabel(courrier.service_concerne)}
              </p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Objet du courrier
              </Label>
              <p className="text-sm font-medium">{courrier.objet}</p>
            </div>
          </div>

          {/* Observations */}
          {courrier.notes && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1">
                Observations
              </Label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                {courrier.notes}
              </p>
            </div>
          )}

          {/* Enregistré par */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <User className="h-3 w-3" />
              Enregistré par
            </Label>
            <p className="text-sm font-medium">
              {courrier.enregistre_par_nom || "—"}
            </p>
          </div>

          {/* Changer le statut */}
          <div className="border-t pt-4">
            <Label className="text-sm font-semibold mb-2 block">
              Changer le statut
            </Label>
            <div className="flex gap-2">
              <Select value={newStatus || courrier.statut} onValueChange={setNewStatus}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUT_CHOICES.map((statut) => (
                    <SelectItem key={statut.value} value={statut.value}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: statut.color }}
                        />
                        {statut.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleChangeStatus}
                disabled={!newStatus || newStatus === courrier.statut || changingStatus}
              >
                {changingStatus ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={downloading || !courrier.fichier}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "Téléchargement..." : "Télécharger"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
      
      {/* Dialog de partage */}
      <ShareCourrierDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        courrier={courrier}
      />
    </Dialog>
  );
}
