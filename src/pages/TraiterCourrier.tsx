import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  FileSignature,
  MessageSquare,
  ArrowLeft,
  Calendar,
  User,
  Mail,
  FileText,
  Clock,
  Zap,
  Download,
  Share2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import courrierService from "@/services/courrierService";
import { SignatureDialog } from "@/components/SignatureDialog";
import { useAuth } from "@/contexts/AuthContext";

// Types
interface Commentaire {
  id: number;
  auteur: string;
  auteur_nom?: string;
  date: string;
  date_creation?: string;
  contenu: string;
  avatar?: string;
}

interface AffectationCourrier {
  id: number;
  affectation_id: number;
  numero: string;
  reference?: string;
  objet: string;
  expediteur: string;
  destinataire?: string;
  type: "entrant" | "sortant";
  type_courrier?: string;
  dateReception: string;
  date_reception?: string;
  dateEcheance?: string;
  statut: "en_attente" | "lu" | "valide" | "rejete" | "signe";
  statut_affectation?: string;
  urgent: boolean;
  commentaires: Commentaire[];
  pieceJointe?: string;
  fichier?: string;
  categorie?: string;
  categorie_nom?: string;
  description?: string;
  note?: string;
  date_affectation?: string;
  affecte_par?: string;
}

export default function TraiterCourrier() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courrier, setCourrier] = useState<AffectationCourrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"valider" | "rejeter" | "signer" | null>(null);
  const [newComment, setNewComment] = useState("");
  const [motifRejet, setMotifRejet] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);

  // Charger le courrier depuis l'API
  useEffect(() => {
    const loadCourrier = async () => {
      try {
        setLoading(true);
        const courierId = parseInt(id || "0");
        
        console.log('Recherche du courrier ID:', courierId); // Debug
        
        // Charger toutes les affectations et trouver celle qui correspond
        const affectations = await courrierService.getMesAffectations();
        console.log('Affectations reçues:', affectations); // Debug
        
        // Le champ 'courrier' du serializer est l'ID, pas un objet
        const affectation = affectations.find((a: any) => a.courrier === courierId);
        
        console.log('Affectation trouvée:', affectation); // Debug
        
        if (affectation) {
          // Charger le courrier complet pour avoir l'URL du fichier
          const courrierComplet = await courrierService.getCourrier(courierId);
          console.log('Courrier complet:', courrierComplet); // Debug
          
          // Définir l'URL d'aperçu
          if (courrierComplet.fichier) {
            setPreviewUrl(courrierComplet.fichier);
            console.log('Preview URL définie:', courrierComplet.fichier);
          }
          
          const mappedData: AffectationCourrier = {
            id: affectation.courrier,
            affectation_id: affectation.id,
            numero: courrierComplet.numero_registre || '',
            objet: courrierComplet.objet || '',
            expediteur: courrierComplet.expediteur || "Service RH",
            destinataire: courrierComplet.destinataire || '',
            type: courrierComplet.type_courrier || 'entrant',
            dateReception: courrierComplet.date_reception || courrierComplet.created_at?.split('T')[0] || '',
            statut: affectation.statut === 'en_attente' ? 'en_attente' : 
                    affectation.statut === 'lu' ? 'en_attente' :
                    affectation.statut === 'valide' ? 'valide' :
                    affectation.statut === 'rejete' ? 'rejete' : 'signe',
            urgent: courrierComplet.urgent || false,
            commentaires: [],
            pieceJointe: courrierComplet.fichier,
            categorie: courrierComplet.categorie_name,
            description: '',
            note: affectation.note || '',
            date_affectation: affectation.date_affectation,
            affecte_par: affectation.affecte_par_nom_complet || affectation.affecte_par_username,
          };
          setCourrier(mappedData);
        } else {
          toast.error("Courrier non trouvé");
          navigate("/mes-courriers");
        }
      } catch (error) {
        console.error("Erreur lors du chargement du courrier:", error);
        toast.error("Erreur lors du chargement du courrier");
      } finally {
        setLoading(false);
      }
    };
    
    loadCourrier();
  }, [id, navigate]);

  // Actions
  const handleAddComment = async () => {
    if (!courrier || !newComment.trim()) return;

    try {
      await courrierService.commenterAffectation(
        courrier.affectation_id,
        newComment
      );

      // Recharger le courrier
      const affectations = await courrierService.getMesAffectations();
      const affectation = affectations.find((a: any) => a.courrier === courrier.id);
      
      if (affectation) {
        const mappedData: AffectationCourrier = {
          id: affectation.courrier,
          affectation_id: affectation.id,
          numero: affectation.courrier_numero || affectation.courrier_details?.numero_registre || '',
          objet: affectation.courrier_objet || affectation.courrier_details?.objet || '',
          expediteur: affectation.courrier_details?.expediteur || affectation.courrier_details?.service_expediteur || "Service RH",
          destinataire: affectation.courrier_details?.destinataire || '',
          type: affectation.courrier_details?.type_courrier || 'entrant',
          dateReception: affectation.courrier_details?.date_reception || affectation.courrier_details?.created_at?.split('T')[0] || '',
          statut: affectation.statut === 'en_attente' ? 'en_attente' : 
                  affectation.statut === 'lu' ? 'en_attente' :
                  affectation.statut === 'valide' ? 'valide' :
                  affectation.statut === 'rejete' ? 'rejete' : 'signe',
          urgent: affectation.courrier_details?.urgent || false,
          commentaires: [],
          pieceJointe: affectation.courrier_details?.fichier_url || affectation.courrier_details?.fichier,
          categorie: affectation.courrier_details?.categorie_nom,
          description: affectation.courrier_details?.description || '',
          note: affectation.note || '',
          date_affectation: affectation.date_affectation,
          affecte_par: affectation.affecte_par_nom_complet || affectation.affecte_par_username,
        };
        setCourrier(mappedData);
      }

      setNewComment("");
      toast.success("Commentaire ajouté avec succès");
      setIsCommentDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  const handleAction = async () => {
    if (!courrier || !actionType) return;

    try {
      await courrierService.traiterAffectation(
        courrier.affectation_id,
        actionType,
        undefined,
        actionType === "rejeter" ? motifRejet : undefined
      );

      // Recharger le courrier
      const affectations = await courrierService.getMesAffectations();
      const affectation = affectations.find((a: any) => a.courrier === courrier.id);
      
      if (affectation) {
        const mappedData: AffectationCourrier = {
          id: affectation.courrier,
          affectation_id: affectation.id,
          numero: affectation.courrier_numero || affectation.courrier_details?.numero_registre || '',
          objet: affectation.courrier_objet || affectation.courrier_details?.objet || '',
          expediteur: affectation.courrier_details?.expediteur || affectation.courrier_details?.service_expediteur || "Service RH",
          destinataire: affectation.courrier_details?.destinataire || '',
          type: affectation.courrier_details?.type_courrier || 'entrant',
          dateReception: affectation.courrier_details?.date_reception || affectation.courrier_details?.created_at?.split('T')[0] || '',
          statut: affectation.statut === 'en_attente' ? 'en_attente' : 
                  affectation.statut === 'lu' ? 'en_attente' :
                  affectation.statut === 'valide' ? 'valide' :
                  affectation.statut === 'rejete' ? 'rejete' : 'signe',
          urgent: affectation.courrier_details?.urgent || false,
          commentaires: [],
          pieceJointe: affectation.courrier_details?.fichier_url || affectation.courrier_details?.fichier,
          categorie: affectation.courrier_details?.categorie_nom,
          description: affectation.courrier_details?.description || '',
          note: affectation.note || '',
          date_affectation: affectation.date_affectation,
          affecte_par: affectation.affecte_par_nom_complet || affectation.affecte_par_username,
        };
        setCourrier(mappedData);
      }

      setMotifRejet("");
      toast.success(
        actionType === "valider"
          ? "Courrier validé avec succès"
          : actionType === "rejeter"
          ? "Courrier rejeté"
          : "Courrier signé électroniquement"
      );
      setIsActionDialogOpen(false);
      setActionType(null);
    } catch (error) {
      console.error("Erreur lors du traitement:", error);
      toast.error("Erreur lors du traitement du courrier");
    }
  };

  const openActionDialog = (type: "valider" | "rejeter" | "signer") => {
    if (type === "signer") {
      // Ouvrir le dialogue de signature spécifique
      setSignatureDialogOpen(true);
    } else {
      setActionType(type);
      setIsActionDialogOpen(true);
    }
  };

  // Gérer la signature électronique
  const handleSign = async (signatureData: {
    password: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }) => {
    if (!courrier) return;

    try {
      // Envoyer la demande de signature avec les coordonnées au backend
      await courrierService.traiterAffectation(
        courrier.affectation_id,
        "signer",
        "Signé électroniquement",
        undefined,
        signatureData.position,
        signatureData.size
      );

      toast.success("Document signé avec succès");
      
      // Recharger le courrier pour voir le PDF mis à jour
      setTimeout(async () => {
        const affectations = await courrierService.getMesAffectations();
        const affectation = affectations.find((a: any) => a.courrier === courrier.id);
        
        if (affectation) {
          const courrierComplet = await courrierService.getCourrier(courrier.id);
          if (courrierComplet.fichier) {
            // Forcer le rechargement du PDF avec un timestamp pour éviter le cache
            setPreviewUrl(`${courrierComplet.fichier}?t=${Date.now()}`);
          }
        
          const mappedData: AffectationCourrier = {
            id: affectation.courrier,
            affectation_id: affectation.id,
            numero: courrierComplet.numero_registre || '',
            objet: courrierComplet.objet || '',
            expediteur: courrierComplet.expediteur || "Service RH",
            destinataire: courrierComplet.destinataire || '',
            type: courrierComplet.type_courrier || 'entrant',
            dateReception: courrierComplet.date_reception || courrierComplet.created_at?.split('T')[0] || '',
            statut: affectation.statut === 'en_attente' ? 'en_attente' : 
                    affectation.statut === 'lu' ? 'en_attente' :
                    affectation.statut === 'valide' ? 'valide' :
                    affectation.statut === 'rejete' ? 'rejete' : 'signe',
            urgent: courrierComplet.urgent || false,
            commentaires: [],
            pieceJointe: courrierComplet.fichier,
            categorie: courrierComplet.categorie_name,
            description: '',
            note: affectation.note || '',
            date_affectation: affectation.date_affectation,
            affecte_par: affectation.affecte_par_nom_complet || affectation.affecte_par_username,
          };
          setCourrier(mappedData);
        }
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la signature:", error);
      toast.error("Erreur lors de la signature du document");
    }
  };

  // Télécharger le fichier du courrier
  const handleDownload = async () => {
    if (!courrier || !previewUrl) {
      toast.error("Aucun fichier disponible pour ce courrier");
      return;
    }
    
    try {
      setDownloading(true);
      // Créer un lien temporaire pour télécharger le fichier
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `${courrier.numero}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Téléchargement démarré");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du fichier");
    } finally {
      setDownloading(false);
    }
  };

  const getStatutBadge = (statut: AffectationCourrier["statut"]) => {
    const variants = {
      en_attente: { label: "En attente", className: "border-amber-200 text-amber-700 bg-amber-50" },
      valide: { label: "Validé", className: "border-emerald-200 text-emerald-700 bg-emerald-50" },
      rejete: { label: "Rejeté", className: "border-rose-200 text-rose-700 bg-rose-50" },
      signe: { label: "Signé", className: "border-blue-200 text-blue-700 bg-blue-50" },
    };
    const config = variants[statut];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!courrier) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-lg text-muted-foreground">Courrier introuvable</p>
        <Button onClick={() => navigate("/mes-courriers")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/mes-courriers")}
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">{courrier.numero}</h1>
                  {courrier.urgent && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                      <Zap className="h-3 w-3 mr-1 fill-amber-500" />
                      Urgent
                    </Badge>
                  )}
                  {getStatutBadge(courrier.statut)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{courrier.objet}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
                disabled={downloading || !previewUrl}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Télécharger
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled
                title="Fonctionnalité à venir"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Aperçu du document - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Aperçu du document
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {previewUrl ? (
                  <div className="bg-slate-100">
                    {previewUrl.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-[800px]"
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
                  <div className="bg-slate-100 min-h-[800px] flex items-center justify-center">
                    <div className="text-center p-8">
                      <FileText className="h-20 w-20 text-slate-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-slate-600 mb-2">
                        Aucun document disponible
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Le document scanné n'est pas disponible
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panneau d'informations et actions - 1/3 */}
          <div className="space-y-6">
            {/* Actions rapides */}
            {courrier.statut === "en_attente" && (
              <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-white">
                <CardHeader className="border-b">
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => openActionDialog("valider")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Valider le courrier
                  </Button>
                  <Button
                    className="w-full border-rose-300 text-rose-700 hover:bg-rose-50"
                    variant="outline"
                    onClick={() => openActionDialog("rejeter")}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter le courrier
                  </Button>
                  <Button
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                    variant="outline"
                    onClick={() => openActionDialog("signer")}
                  >
                    <FileSignature className="h-4 w-4 mr-2" />
                    Signer électroniquement
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Informations du courrier */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-base">Informations</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <Badge variant="outline" className={courrier.type === "entrant" ? "border-blue-200 text-blue-700 bg-blue-50 mt-1" : "border-slate-200 text-slate-700 bg-slate-50 mt-1"}>
                        {courrier.type === "entrant" ? "Entrant" : "Sortant"}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Expéditeur</p>
                      <p className="text-sm font-medium mt-1">{courrier.expediteur}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Destinataire</p>
                      <p className="text-sm font-medium mt-1">{courrier.destinataire}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Date de réception</p>
                      <p className="text-sm font-medium mt-1">
                        {new Date(courrier.dateReception).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {courrier.dateEcheance && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Date d'échéance</p>
                        <p className="text-sm font-medium mt-1 text-amber-600">
                          {new Date(courrier.dateEcheance).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {courrier.categorie && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Catégorie</p>
                          <p className="text-sm font-medium mt-1">{courrier.categorie}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {courrier.description && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Description</p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {courrier.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Commentaires */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Commentaires ({courrier.commentaires.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCommentDialogOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {courrier.commentaires.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Aucun commentaire</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {courrier.commentaires.map((com) => (
                      <div key={com.id} className="border-l-2 border-primary/20 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {com.auteur.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{com.auteur}</p>
                            <p className="text-xs text-muted-foreground">{com.date}</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 mt-2 leading-relaxed">{com.contenu}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog Commentaire */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajouter un commentaire</DialogTitle>
            <DialogDescription>
              Ajoutez votre commentaire sur le courrier {courrier.numero}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Saisissez votre commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Ajouter le commentaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Action (Valider/Rejeter/Signer) */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === "valider"
                ? "Valider le courrier"
                : actionType === "rejeter"
                ? "Rejeter le courrier"
                : "Signer le courrier"}
            </DialogTitle>
            <DialogDescription>
              Courrier : {courrier.numero} - {courrier.objet}
            </DialogDescription>
          </DialogHeader>

          {actionType === "rejeter" && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Motif du rejet (optionnel)</label>
              <Textarea
                placeholder="Précisez le motif du rejet..."
                value={motifRejet}
                onChange={(e) => setMotifRejet(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          )}

          {actionType === "valider" && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
              <p className="text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 inline mr-2" />
                Vous êtes sur le point de valider ce courrier. Cette action sera enregistrée dans l'historique.
              </p>
            </div>
          )}

          {actionType === "signer" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Confirmez-vous la signature électronique de ce courrier ?
              </p>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <FileSignature className="h-4 w-4 inline mr-2" />
                  La signature électronique sera enregistrée avec votre identifiant et horodatage.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsActionDialogOpen(false);
                setMotifRejet("");
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              className={
                actionType === "valider"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : actionType === "rejeter"
                  ? "border-rose-300 text-rose-700 hover:bg-rose-50"
                  : "border-blue-300 text-blue-700 hover:bg-blue-50"
              }
              variant={actionType === "valider" ? "default" : "outline"}
            >
              {actionType === "valider" && <CheckCircle2 className="h-4 w-4 mr-2" />}
              {actionType === "rejeter" && <XCircle className="h-4 w-4 mr-2" />}
              {actionType === "signer" && <FileSignature className="h-4 w-4 mr-2" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Signature Électronique */}
      <SignatureDialog
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        pdfUrl={previewUrl}
        signatureUrl={user?.signature_url}
        userName={user?.username}
        onSign={handleSign}
      />
    </div>
  );
}
