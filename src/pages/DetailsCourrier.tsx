/**
 * Page de détails complète d'un courrier
 * Affiche toutes les informations et actions disponibles
 */

import { useState, useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";
import { api } from "@/services/api";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAuth } from "@/contexts/AuthContext";
import courrierService from "@/services/courrierService";
import serviceService, { type Service } from "@/services/serviceService";
import type { Courrier } from "@/types";
import { STATUT_CHOICES } from "@/types";
import { EditCourrierDialog } from "@/components/EditCourrierDialog";
import { CourrierVersionsDialog } from "@/components/CourrierVersionsDialog";
import { ShareCourrierDialog } from "@/components/ShareCourrierDialog";

function DocxPreview({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url || !containerRef.current) return;
    setLoading(true);
    setError(false);
    const ctrl = new AbortController();
    (async () => {
      try {
        const token = localStorage.getItem("access_token");
        const resp = await fetch(url, {
          signal: ctrl.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!resp.ok) throw new Error("fetch error");
        const blob = await resp.blob();
        const arrayBuffer = await blob.arrayBuffer();
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          await renderAsync(arrayBuffer, containerRef.current, undefined, {
            className: "docx-preview-body",
            inWrapper: true,
            ignoreWidth: true,
          });
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [url]);

  if (error) return (
    <div className="p-8 text-center text-muted-foreground">
      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
      <p>Impossible d'afficher ce document</p>
      <Button size="sm" className="mt-4" onClick={() => window.open(url, "_blank")}>Ouvrir dans un nouvel onglet</Button>
    </div>
  );

  return (
    <div className="relative min-h-[300px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
      <div ref={containerRef} className="docx-wrapper p-4 bg-white max-h-[600px] overflow-auto" />
    </div>
  );
}

export default function DetailsCourrier() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDG } = useAuth();

  // États
  const [courrier, setCourrier] = useState<Courrier | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Charger le courrier et les services
  useEffect(() => {
    if (id) {
      loadCourrier();
      loadServices();
    }
  }, [id]);

  const loadServices = async () => {
    try {
      const data = await serviceService.getServices();
      setServices(data);
    } catch (error) {
      console.error("Erreur lors du chargement des services:", error);
      // Ne pas bloquer si les services ne se chargent pas
    }
  };

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
      navigate("/courriers/suivi");
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
      navigate("/courriers/suivi");
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

  // Obtenir le label du service depuis la base de données
  const getServiceLabel = (serviceCode: string) => {
    // Créer un mapping code -> nom de service
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

    // D'abord essayer de trouver le service dans la BDD
    const serviceName = codeToNameMapping[serviceCode];
    const service = services.find(s => s.nom === serviceName);
    
    if (service) {
      return service.nom;
    }
    
    // Sinon, utiliser le mapping statique
    return codeToNameMapping[serviceCode] || serviceCode;
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
          <Button onClick={() => navigate("/courriers/suivi")} className="mt-4">
            Retour au tracker
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header sticky compact */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/courriers/suivi")}
                className="hover:bg-slate-100 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Separator orientation="vertical" className="h-6 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold">{courrier.numero_registre}</h1>
                  {courrier.urgent && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                      <Zap className="h-3 w-3 mr-1 fill-amber-500" />
                      Urgent
                    </Badge>
                  )}
                  {getStatusBadge(courrier.statut)}
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate">{courrier.objet}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Modifier - masqué pour DG */}
              {!isDG && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVersionsDialogOpen(true)}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Versions ({courrier.nombre_versions || 0})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleUrgent}
              >
                <Zap className={`h-4 w-4 mr-2 ${courrier.urgent ? "fill-amber-500" : ""}`} />
                {courrier.urgent ? "Retirer urgent" : "Urgent"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloading || !courrier.fichier}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading ? "..." : "Télécharger"}
              </Button>
              
              {/* Partager - masqué pour DG */}
              {!isDG && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              )}
              
              {/* Supprimer - masqué pour DG */}
              {!isDG && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale - Aperçu du document */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {(() => {
            // Construire la liste de tous les fichiers à afficher
            const allDocs: { label: string; url: string }[] = [];
            if (courrier.fichier) {
              const name = courrier.fichier.split('/').pop() || 'Document principal';
              allDocs.push({ label: name, url: courrier.fichier });
            }
            (courrier.pieces_jointes || []).forEach((pj) => {
              allDocs.push({ label: pj.nom_fichier || pj.fichier_url.split('/').pop() || `Pièce ${pj.id}`, url: pj.fichier_url });
            });

            // Si pas de fichier mais contenu_lettre existe, ne pas afficher cette section
            if (allDocs.length === 0 && courrier.contenu_lettre) {
              return null;
            }

            // Si pas de fichier et pas de contenu_lettre, afficher message
            if (allDocs.length === 0) {
              return (
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Aperçu du document
                    </h2>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-12 text-center border">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun document disponible</p>
                  </div>
                </div>
              );
            }

            // Si fichier(s) existe(nt), afficher la section aperçu
            return (
              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Aperçu du document
                  </h2>
                </div>

                {allDocs.length === 1 ? (
                  <div className="bg-muted/30 rounded-lg overflow-hidden border">
                    {allDocs[0].url.toLowerCase().match(/\.(pdf|html)$/) ? (
                      <iframe src={allDocs[0].url} className="w-full h-[600px]" title="Aperçu du document" />
                    ) : allDocs[0].url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ? (
                      <img src={allDocs[0].url} alt="Aperçu du courrier" className="w-full h-auto" />
                    ) : allDocs[0].url.toLowerCase().match(/\.docx?$/) ? (
                      <DocxPreview url={allDocs[0].url} />
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Aperçu non disponible pour ce type de fichier</p>
                        <Button size="sm" className="mt-4" onClick={() => window.open(allDocs[0].url, '_blank')}>
                          Ouvrir dans un nouvel onglet
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Tabs defaultValue="doc-0">
                    <TabsList className="mb-3 flex-wrap h-auto gap-1">
                      {allDocs.map((doc, i) => (
                        <TabsTrigger key={i} value={`doc-${i}`} className="max-w-[200px] truncate text-xs">
                          <FileText className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                          <span className="truncate">{doc.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {allDocs.map((doc, i) => (
                      <TabsContent key={i} value={`doc-${i}`}>
                        <div className="bg-muted/30 rounded-lg overflow-hidden border">
                          {doc.url.toLowerCase().match(/\.(pdf|html)$/) ? (
                            <iframe src={doc.url} className="w-full h-[600px]" title={doc.label} />
                          ) : doc.url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ? (
                            <img src={doc.url} alt={doc.label} className="w-full h-auto" />
                          ) : doc.url.toLowerCase().match(/\.docx?$/) ? (
                            <DocxPreview url={doc.url} />
                          ) : (
                            <div className="p-8 text-center text-muted-foreground">
                              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                              <p>Aperçu non disponible pour ce type de fichier</p>
                              <Button size="sm" className="mt-4" onClick={() => window.open(doc.url, '_blank')}>
                                Ouvrir dans un nouvel onglet
                              </Button>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </div>
            );
          })()}

          {/* Contenu de la lettre rédigée sur la plateforme */}
          {courrier.contenu_lettre && (
            <div className="stat-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Lettre rédigée
              </h2>
              <div
                className="prose prose-sm max-w-none bg-white border rounded-lg p-6 shadow-sm"
                style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', lineHeight: '1.75' }}
                dangerouslySetInnerHTML={{ __html: courrier.contenu_lettre }}
              />
            </div>
          )}

          {/* Notes (texte brut uniquement, pas du HTML) */}
          {courrier.notes && !courrier.contenu_lettre && (
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
