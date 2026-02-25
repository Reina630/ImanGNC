/**
 * Page de détails complète d'un courrier
 * Affiche toutes les informations et actions disponibles
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Edit2,
  GitBranch,
  Share2,
  Zap,
  Calendar,
  Mail,
  Send,
  Inbox,
  FileText,
  Building2,
  User,
  Clock,
  Eye,
  Trash2,
  AlertCircle,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";
import { SERVICE_CHOICES, STATUT_CHOICES } from "@/types";
import { EditCourrierDialog } from "@/components/EditCourrierDialog";
import { CourrierVersionsDialog } from "@/components/CourrierVersionsDialog";
import { ShareCourrierDialog } from "@/components/ShareCourrierDialog";

export default function DetailsCourrier() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // États
  const [courrier, setCourrier] = useState<Courrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Charger le courrier
  useEffect(() => {
    if (id) {
      loadCourrier();
    }
  }, [id]);

  const loadCourrier = async () => {
    try {
      setLoading(true);
      const data = await courrierService.getCourrier(Number(id));
      setCourrier(data);
      setNewStatus(data.statut);

      // Charger l'aperçu du fichier si disponible
      if (data.fichier) {
        setPreviewUrl(data.fichier);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du courrier:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le courrier",
      });
      navigate("/courriers");
    } finally {
      setLoading(false);
    }
  };

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
    if (!courrier) return;
    
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
    if (!courrier || !newStatus || newStatus === courrier.statut) return;

    try {
      setChangingStatus(true);
      await courrierService.changerStatut(courrier.id, newStatus);
      toast({
        title: "Statut mis à jour",
        description: `Le statut a été changé en "${STATUT_CHOICES.find((s) => s.value === newStatus)?.label}"`,
      });
      loadCourrier(); // Recharger pour avoir les nouvelles données
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

  // Marquer urgent/normal
  const handleToggleUrgent = async () => {
    if (!courrier) return;

    try {
      await courrierService.toggleUrgent(courrier.id);
      toast({
        title: courrier.urgent ? "Courrier normal" : "Courrier urgent",
        description: courrier.urgent
          ? "Le courrier n'est plus urgent"
          : "Le courrier a été marqué comme urgent",
      });
      loadCourrier();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le statut urgent",
      });
    }
  };

  // Supprimer le courrier
  const handleDelete = async () => {
    if (!courrier) return;
    
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce courrier ?")) {
      return;
    }

    try {
      await courrierService.deleteCourrier(courrier.id);
      toast({
        title: "Courrier supprimé",
        description: "Le courrier a été supprimé avec succès",
      });
      navigate("/courriers");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le courrier",
      });
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

  // Obtenir le label du service
  const getServiceLabel = (value: string) => {
    return SERVICE_CHOICES.find((s) => s.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!courrier) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Courrier introuvable</p>
          <Button onClick={() => navigate("/courriers")} className="mt-4">
            Retour au registre
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête avec bouton retour */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/courriers")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {courrier.numero_registre}
              </h1>
              {courrier.urgent && (
                <Badge variant="destructive" className="gap-1">
                  <Zap className="h-3 w-3 fill-current" />
                  Urgent
                </Badge>
              )}
              {getStatusBadge(courrier.statut)}
            </div>
            <p className="text-muted-foreground mt-1">
              {courrier.type_courrier === "entrant" ? "Courrier entrant" : "Courrier sortant"}
            </p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleUrgent}
            className={courrier.urgent ? "border-amber-500 text-amber-700" : ""}
          >
            <Zap className={`h-4 w-4 mr-2 ${courrier.urgent ? "fill-amber-500" : ""}`} />
            {courrier.urgent ? "Retirer urgent" : "Marquer urgent"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading || !courrier.fichier}
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Téléchargement..." : "Télécharger"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVersionsDialogOpen(true)}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Versions ({courrier.nombre_versions || 0})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Objet du courrier - Mis en avant */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="stat-card"
      >
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Objet
        </h2>
        <p className="text-base text-foreground leading-relaxed">{courrier.objet}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale - Aperçu du document */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Aperçu du document */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu du document
              </h2>
            </div>

            {previewUrl ? (
              <div className="bg-muted/30 rounded-lg overflow-hidden border">
                {previewUrl.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[600px]"
                    title="Aperçu du document"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Aperçu du courrier"
                    className="w-full h-auto"
                  />
                )}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-12 text-center border">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun document scanné disponible
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {courrier.notes && (
            <div className="stat-card">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              <p className="text-foreground whitespace-pre-wrap">{courrier.notes}</p>
            </div>
          )}
        </motion.div>

        {/* Colonne latérale - Informations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Informations principales */}
          <div className="stat-card space-y-4">
            <h2 className="text-lg font-semibold">Informations</h2>

            <Separator />

            {/* Type */}
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

            {/* Dates */}
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

            {/* Expéditeur / Destinataire */}
            {courrier.type_courrier === "entrant" && courrier.expediteur && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Expéditeur
                </Label>
                <button
                  onClick={() => navigate(`/courriers/entite/${encodeURIComponent(courrier.expediteur)}`)}
                  className="text-sm font-medium hover:text-primary hover:underline transition-colors text-left"
                >
                  {courrier.expediteur}
                </button>
              </div>
            )}

            {courrier.type_courrier === "sortant" && courrier.destinataire && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Destinataire
                </Label>
                <button
                  onClick={() => navigate(`/courriers/entite/${encodeURIComponent(courrier.destinataire)}`)}
                  className="text-sm font-medium hover:text-primary hover:underline transition-colors text-left"
                >
                  {courrier.destinataire}
                </button>
              </div>
            )}

            {/* Service concerné */}
            {courrier.service_concerne && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Service concerné
                </Label>
                <p className="text-sm font-medium">
                  {getServiceLabel(courrier.service_concerne)}
                </p>
              </div>
            )}

            {/* Catégorie */}
            {courrier.categorie_name && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Catégorie
                </Label>
                <Badge variant="outline">{courrier.categorie_name}</Badge>
              </div>
            )}

            {/* Référence */}
            {courrier.reference && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Référence
                </Label>
                <p className="text-sm font-medium">{courrier.reference}</p>
              </div>
            )}

            <Separator />

            {/* Dates système */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Créé le
              </Label>
              <p className="text-xs text-muted-foreground">
                {formatDate(courrier.created_at)}
              </p>
            </div>

            {courrier.updated_at && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Modifié le
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formatDate(courrier.updated_at)}
                </p>
              </div>
            )}
          </div>

          {/* Changer le statut */}
          <div className="stat-card space-y-4">
            <h2 className="text-lg font-semibold">Changer le statut</h2>

            <div className="space-y-3">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUT_CHOICES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="w-full"
                onClick={handleChangeStatus}
                disabled={changingStatus || !newStatus || newStatus === courrier.statut}
              >
                {changingStatus ? "Modification..." : "Modifier le statut"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dialogues */}
      {editDialogOpen && (
        <EditCourrierDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          courrier={courrier}
          onSuccess={loadCourrier}
        />
      )}

      {versionsDialogOpen && (
        <CourrierVersionsDialog
          open={versionsDialogOpen}
          onOpenChange={setVersionsDialogOpen}
          courrier={courrier}
        />
      )}

      {shareDialogOpen && (
        <ShareCourrierDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          courrier={courrier}
        />
      )}
    </div>
  );
}
