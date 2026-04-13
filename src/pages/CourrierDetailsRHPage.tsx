/**
 * Page de détails d'un courrier - Vue RH
 * Affiche toutes les informations, permet l'édition et le suivi du circuit d'affectation
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { renderAsync } from "docx-preview";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Download,
  Mail,
  Calendar,
  Building2,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PenLine,
  Eye,
  Zap,
  Users,
  ArrowRight,
  Send,
  Inbox,
  Network,
  Paperclip,
  Upload,
  UserPlus,
  Pencil,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import circuitAffectationService, { 
  type CircuitAffectationData, 
  type AffectationServiceData 
} from "@/services/circuitAffectationService";
import serviceService, { type Service } from "@/services/serviceService";
import type { Courrier } from "@/types";
import { AffecterServiceDialog } from "@/components/AffecterServiceDialog";
import { ModifierInfosCourrierDialog } from "@/components/ModifierInfosCourrierDialog";

// Composant pour prévisualiser les documents DOCX
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
      <Button size="sm" className="mt-4" onClick={() => window.open(url, "_blank")}>
        Ouvrir dans un nouvel onglet
      </Button>
    </div>
  );

  return (
    <div className="relative min-h-[300px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
      <div ref={containerRef} className="docx-wrapper p-4 bg-white max-h-[600px] overflow-auto rounded-lg border" />
    </div>
  );
}

// Modal pour modifier le document (créer une nouvelle version)
// Modal pour ajouter des pièces jointes
function AjouterPieceJointeDialog({
  open,
  onOpenChange,
  courrierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrierId: number;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [fichiers, setFichiers] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fichiers || fichiers.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un fichier",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await courrierService.ajouterPiecesJointes(courrierId, Array.from(fichiers));
      toast({
        title: "Succès",
        description: `${fichiers.length} pièce(s) jointe(s) ajoutée(s) avec succès`,
      });
      onSuccess?.();
      onOpenChange(false);
      setFichiers(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'ajout des pièces jointes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter des pièces jointes</DialogTitle>
          <DialogDescription>
            Sélectionnez un ou plusieurs fichiers à joindre au courrier.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="fichiers">Fichiers</Label>
            <Input
              id="fichiers"
              type="file"
              multiple
              onChange={(e) => setFichiers(e.target.files)}
              className="mt-2"
            />
            {fichiers && fichiers.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {fichiers.length} fichier(s) sélectionné(s)
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !fichiers || fichiers.length === 0}>
            {loading ? "Ajout..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CourrierDetailsRHPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAffecterDialog, setShowAffecterDialog] = useState(false);
  const [showAjouterPJDialog, setShowAjouterPJDialog] = useState(false);
  const [showModifierInfosDialog, setShowModifierInfosDialog] = useState(false);
  const [affectationToEdit, setAffectationToEdit] = useState<{
    id: number;
    service?: number | null;
    action_requise?: string;
    niveau_urgence?: string;
    date_echeance?: string | null;
    note_instruction?: string;
  } | null>(null);

  // Charger le courrier
  const { data: courrier, isLoading: loadingCourrier } = useQuery({
    queryKey: ['courrier', id],
    queryFn: () => courrierService.getCourrier(Number(id)),
    enabled: !!id,
  });

  // Charger le circuit d'affectation si existant
  const { data: circuit, isLoading: loadingCircuit } = useQuery({
    queryKey: ['circuit', courrier?.id],
    queryFn: async () => {
      if (!courrier?.a_circuit) return null;
      const circuits = await circuitAffectationService.getCircuits();
      return circuits.find((c) => c.courrier === courrier.id) || null;
    },
    enabled: !!courrier?.a_circuit,
  });

  // Charger les services
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: serviceService.getServices,
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatutBadge = (statut: string, display: string) => {
    const colors: Record<string, string> = {
      en_attente: "bg-gray-100 text-gray-700 border-gray-300",
      distribue: "bg-blue-100 text-blue-700 border-blue-300",
      vu: "bg-cyan-100 text-cyan-700 border-cyan-300",
      en_traitement: "bg-yellow-100 text-yellow-700 border-yellow-300",
      valide: "bg-green-100 text-green-700 border-green-300",
      signe: "bg-purple-100 text-purple-700 border-purple-300",
      rejete: "bg-red-100 text-red-700 border-red-300",
    };

    return (
      <Badge variant="outline" className={`${colors[statut] || ""} text-xs`}>
        {display}
      </Badge>
    );
  };

  const getStatutIcon = (statut: string) => {
    const icons: Record<string, any> = {
      en_attente: Clock,
      distribue: Send,
      vu: Eye,
      en_traitement: PenLine,
      valide: CheckCircle2,
      signe: CheckCircle2,
      rejete: XCircle,
    };
    const Icon = icons[statut] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const peutModifier = courrier && !['traite', 'archive'].includes(courrier.statut);

  if (loadingCourrier) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!courrier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Courrier introuvable</p>
        <Button onClick={() => navigate("/courriers/suivi")}>
          Retour au suivi
        </Button>
      </div>
    );
  }

  // Grouper les affectations par étape
  const affectationsParEtape: Record<number, AffectationServiceData[]> = {};
  if (circuit && circuit.affectations_service) {
    circuit.affectations_service.forEach((aff) => {
      const etape = aff.etape_numero || 1;
      if (!affectationsParEtape[etape]) {
        affectationsParEtape[etape] = [];
      }
      affectationsParEtape[etape].push(aff);
    });
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/courriers/suivi")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{courrier.numero_registre}</h1>
            <p className="text-sm text-muted-foreground">{courrier.objet}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {courrier.urgent && (
            <Badge variant="destructive" className="gap-1">
              <Zap className="h-3 w-3" />
              Urgent
            </Badge>
          )}
          {getStatutBadge(courrier.statut, courrier.statut_display)}
          
          <Button onClick={() => {/* TODO: implémenter archivage */}} variant="outline" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            Archiver
          </Button>
        </div>
      </div>

      {/* Disposition en grille : Aperçu à gauche, Infos à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Colonne gauche : Aperçu du document (3/4 de largeur) */}
        <div className="lg:col-span-3 lg:sticky lg:top-6 lg:self-start">
          <Card className="h-full shadow-lg overflow-hidden">
            <CardContent className="p-0">
              {(() => {
                const allDocs: { label: string; url: string; type: string }[] = [];
                if (courrier.fichier) {
                  const name = courrier.fichier.split("/").pop() || "Document principal";
                  allDocs.push({ label: name, url: courrier.fichier, type: courrier.file_type });
                }
                (courrier.pieces_jointes || []).forEach((pj) => {
                  allDocs.push({
                    label: pj.nom_fichier || pj.fichier_url.split("/").pop() || `Pièce jointe ${pj.id}`,
                    url: pj.fichier_url,
                    type: pj.file_type,
                  });
                });

                if (allDocs.length === 0) {
                  return (
                    <div className="p-16 text-center text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">Aucun fichier associé à ce courrier</p>
                    </div>
                  );
                }

                return (
                  <Tabs defaultValue="doc-0" className="w-full">
                    {/* Barre d'onglets + bouton télécharger */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b bg-gray-50/60">
                      <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
                        {allDocs.map((doc, i) => (
                          <TabsTrigger
                            key={i}
                            value={`doc-${i}`}
                            className="max-w-[200px] truncate text-xs border data-[state=active]:bg-white data-[state=active]:shadow-sm"
                          >
                            <FileText className="h-3 w-3 mr-1.5 shrink-0" />
                            <span className="truncate">{doc.label}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {allDocs.map((doc, i) => (
                      <TabsContent key={i} value={`doc-${i}`} className="mt-0">
                        {/* Bandeau nom + téléchargement */}
                        <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
                          <span className="text-xs text-muted-foreground truncate max-w-[70%]">{doc.label}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = doc.url;
                              a.download = doc.label;
                              a.click();
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Télécharger
                          </Button>
                        </div>

                        {/* Contenu du preview */}
                        {doc.type === 'pdf' ? (
                          <iframe
                            src={`${doc.url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                            className="w-full border-0"
                            style={{ height: '750px' }}
                            title={doc.label}
                          />
                        ) : doc.type === 'docx' || doc.type === 'doc' ? (
                          <div className="max-h-[750px] overflow-auto p-4">
                            <DocxPreview url={doc.url} />
                          </div>
                        ) : doc.type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(doc.type) ? (
                          <div className="flex justify-center p-6 bg-gray-50 max-h-[750px] overflow-auto">
                            <img
                              src={doc.url}
                              alt={doc.label}
                              className="max-w-full h-auto object-contain rounded"
                            />
                          </div>
                        ) : (
                          <div className="p-16 text-center text-muted-foreground">
                            <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p className="text-sm mb-1">Aperçu non disponible</p>
                            <p className="text-xs text-muted-foreground/60">Type de fichier : {doc.type}</p>
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Informations et Circuit (1/4 de largeur) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Boutons d'actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setShowModifierInfosDialog(true)}
                      disabled={!peutModifier}
                      variant="outline"
                      className="w-full justify-start bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifier les infos
                    </Button>
                    <Button
                      onClick={() => setShowAjouterPJDialog(true)}
                      variant="outline"
                      className="w-full justify-start bg-green-500 text-white hover:bg-green-600 hover:text-white"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Ajouter une pièce jointe
                    </Button>
                    <Button
                      onClick={() => setShowAffecterDialog(true)}
                      variant="outline"
                      className="w-full justify-start bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Nouvelle affectation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          {/* Informations générales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Informations générales
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 text-sm">
                {/* Type de courrier */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <div className="flex items-center gap-1.5">
                    {courrier.type_courrier === 'entrant' && <Inbox className="h-3 w-3 text-blue-600" />}
                    {courrier.type_courrier === 'sortant' && <Send className="h-3 w-3 text-green-600" />}
                    {courrier.type_courrier === 'interne' && <Building2 className="h-3 w-3 text-purple-600" />}
                    <span className="font-medium">{courrier.type_courrier_display}</span>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    {courrier.type_courrier === 'entrant' ? 'Date de réception' : 'Date d\'envoi'}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDate(courrier.date_principale)}</span>
                  </div>
                </div>

                {/* Expéditeur */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Expéditeur</Label>
                  <p className="text-right">{courrier.expediteur || "—"}</p>
                </div>

                {/* Destinataire */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Destinataire</Label>
                  <p className="text-right">{courrier.destinataire || "—"}</p>
                </div>

                {/* Référence */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Référence</Label>
                  <p className="text-right">{courrier.reference || "—"}</p>
                </div>

                {/* Service concerné */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Service concerné</Label>
                  <p className="text-right">{courrier.service_concerne_display || "—"}</p>
                </div>

                {/* Objet */}
                <div>
                  <Label className="text-xs text-muted-foreground">Objet</Label>
                  <p className="mt-1 text-xs">{courrier.objet}</p>
                </div>

                {/* Notes */}
                {courrier.notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Notes internes</Label>
                    <p className="mt-1 text-xs text-muted-foreground">{courrier.notes}</p>
                  </div>
                )}
              </div>

              <Separator className="my-2" />

              {/* Métadonnées */}
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Enregistré par</Label>
                  <p>{courrier.enregistre_par_nom}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Créé le</Label>
                  <p>{formatDateTime(courrier.created_at)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Modifié le</Label>
                  <p>{formatDateTime(courrier.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Circuit d'affectation */}
          {courrier.a_circuit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {loadingCircuit ? (
                <Card className="shadow-md">
                  <CardContent className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </CardContent>
                </Card>
              ) : circuit ? (
                <div className="space-y-3">
                  {/* En-tête du circuit */}
                  <Card className="shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Network className="h-4 w-4" />
                            Circuit {circuit.type_circuit_display || circuit.type_circuit}
                          </CardTitle>
                      </div>
                      {circuit.est_termine ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Terminé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          En cours
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground">Affectations</Label>
                        <p className="font-medium">{circuit.affectations_service?.length || 0} services</p>
                      </div>
                      {circuit.type_circuit === 'sequentiel' && circuit.etape_actuelle && (
                        <div className="flex items-center justify-between">
                          <Label className="text-muted-foreground">Étape actuelle</Label>
                          <p className="font-medium">Étape {circuit.etape_actuelle}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Affichage des étapes */}
                <div className="space-y-3">
                  {circuit.type_circuit === 'sequentiel' ? (
                    // Affichage séquentiel par étapes
                    Object.keys(affectationsParEtape)
                      .map(Number)
                      .sort((a, b) => a - b)
                      .map((etapeNum) => (
                        <Card key={etapeNum} className="shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {etapeNum}
                              </div>
                              Étape {etapeNum}
                              {circuit.etape_actuelle === etapeNum && (
                                <Badge variant="secondary" className="text-xs">En cours</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {affectationsParEtape[etapeNum].map((aff, idx) => (
                                <div key={aff.id}>
                                  {idx > 0 && <Separator className="my-2" />}
                                  <AffectationServiceCard affectation={aff} />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    // Affichage simultané
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Tous les services (traitement simultané)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {circuit.affectations_service && circuit.affectations_service.map((aff, idx) => (
                            <div key={aff.id}>
                              {idx > 0 && <Separator className="my-2" />}
                              <AffectationServiceCard affectation={aff} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : courrier.affectations_v2 && courrier.affectations_v2.length > 0 ? (
              // Affectations du nouveau système (v2) — modifiables
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Affectations ({courrier.affectations_v2.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {courrier.affectations_v2.map((aff, idx) => {
                      const urgenceColors: Record<string, string> = {
                        critique: 'bg-red-50 text-red-700 border-red-200',
                        eleve: 'bg-orange-50 text-orange-700 border-orange-200',
                        normal: 'bg-blue-50 text-blue-700 border-blue-200',
                        faible: 'bg-gray-50 text-gray-600 border-gray-200',
                      };
                      const statutColors: Record<string, string> = {
                        valide: 'bg-green-50 text-green-700 border-green-200',
                        signe: 'bg-purple-50 text-purple-700 border-purple-200',
                        en_traitement: 'bg-blue-50 text-blue-700 border-blue-200',
                        vu: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                        rejete: 'bg-red-50 text-red-700 border-red-200',
                        en_attente: 'bg-gray-50 text-gray-700 border-gray-200',
                        distribue: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                      };
                      return (
                        <div key={aff.id}>
                          {idx > 0 && <Separator className="my-2" />}
                          <div className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/30">
                            <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{aff.destinataire_nom}</p>
                                  {aff.service_nom && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Building2 className="h-3 w-3 shrink-0" />
                                      {aff.service_nom}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge variant="outline" className={`text-xs ${statutColors[aff.statut] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                    {aff.statut}
                                  </Badge>
                                  {/* Bouton Modifier — seulement si pas encore terminé */}
                                  {!['valide', 'signe', 'rejete'].includes(aff.statut) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-primary/10"
                                      title="Modifier l'affectation"
                                      onClick={() => {
                                        setAffectationToEdit({
                                          id: aff.id,
                                          service: aff.service,
                                          action_requise: aff.action_requise,
                                          niveau_urgence: aff.niveau_urgence,
                                          date_echeance: aff.date_echeance,
                                        });
                                        setShowAffecterDialog(true);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 text-xs">
                                <Badge variant="outline" className={`text-xs ${urgenceColors[aff.niveau_urgence] || ''}`}>
                                  <Zap className="h-2.5 w-2.5 mr-1" />
                                  {aff.niveau_urgence}
                                </Badge>
                                <span className="text-muted-foreground flex items-center gap-1">
                                  {aff.action_requise === 'informatif' && <Eye className="h-3 w-3" />}
                                  {aff.action_requise === 'a_signer' && <PenLine className="h-3 w-3" />}
                                  {aff.action_requise === 'a_repondre' && <ArrowRight className="h-3 w-3" />}
                                  {aff.action_requise}
                                </span>
                                {aff.date_echeance && (
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(aff.date_echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : courrier.affectations_list && courrier.affectations_list.length > 0 ? (
              // Afficher les affectations de l'ancien système (lecture seule)
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Affectations individuelles ({courrier.affectations_list.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {courrier.affectations_list.map((aff, idx) => (
                      <div key={aff.id}>
                        {idx > 0 && <Separator className="my-2" />}
                        <div className="flex items-start gap-2 text-sm">
                          <div className={`p-1.5 rounded ${
                            aff.statut === 'valide' || aff.statut === 'signe' ? 'bg-green-50' :
                            aff.statut === 'en_traitement' ? 'bg-blue-50' :
                            aff.statut === 'vu' ? 'bg-orange-50' : 'bg-gray-50'
                          }`}>
                            <Users className={`h-4 w-4 ${
                              aff.statut === 'valide' || aff.statut === 'signe' ? 'text-green-600' :
                              aff.statut === 'en_traitement' ? 'text-blue-600' :
                              aff.statut === 'vu' ? 'text-orange-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{aff.utilisateur_nom_complet}</p>
                                {aff.utilisateur_service && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {aff.utilisateur_service}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className={`text-xs ${
                                aff.statut === 'valide' || aff.statut === 'signe' ? 'bg-green-50 text-green-700 border-green-200' :
                                aff.statut === 'en_traitement' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                aff.statut === 'vu' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {aff.statut_display}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                {aff.action_requise === 'informatif' && <Eye className="h-3 w-3" />}
                                {aff.action_requise === 'a_signer' && <PenLine className="h-3 w-3" />}
                                {aff.action_requise === 'a_repondre' && <ArrowRight className="h-3 w-3" />}
                                {aff.action_requise_display}
                              </div>
                              <Badge variant="outline" className={`text-xs ${
                                aff.niveau_urgence === 'critique' ? 'bg-red-50 text-red-700 border-red-200' :
                                aff.niveau_urgence === 'eleve' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                aff.niveau_urgence === 'normal' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                <Zap className="h-2.5 w-2.5 mr-1" />
                                {aff.niveau_urgence_display}
                              </Badge>
                            </div>
                            {aff.note && (
                              <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                                {aff.note}
                              </p>
                            )}
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                Affecté le {new Date(aff.date_affectation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              {aff.date_lecture && (
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Lu le {new Date(aff.date_lecture).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                </div>
                              )}
                              {aff.date_traitement && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Traité le {new Date(aff.date_traitement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-md">
                <CardContent className="py-6 text-center text-muted-foreground text-sm">
                  <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune affectation trouvée</p>
                </CardContent>
              </Card>
            )}
            </motion.div>
          )}

          {/* Pièces jointes */}
          {courrier.pieces_jointes && courrier.pieces_jointes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Paperclip className="h-4 w-4" />
                    Pièces jointes ({courrier.pieces_jointes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {courrier.pieces_jointes.map((pj) => (
                      <div
                        key={pj.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 hover:border-primary/30 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded bg-primary/10 flex-shrink-0">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs truncate">{pj.nom_fichier}</p>
                            <p className="text-xs text-muted-foreground">
                              {(pj.file_size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(pj.fichier_url, '_blank')}
                          className="hover:bg-primary/10 h-7 w-7 p-0 flex-shrink-0"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      {courrier && (
        <>
          <AffecterServiceDialog
            open={showAffecterDialog}
            onOpenChange={(open) => {
              setShowAffecterDialog(open);
              if (!open) setAffectationToEdit(null);
            }}
            courrier={courrier}
            affectationToEdit={affectationToEdit ?? undefined}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['courrier', id] });
              queryClient.invalidateQueries({ queryKey: ['circuit', courrier.id] });
              setShowAffecterDialog(false);
              setAffectationToEdit(null);
            }}
          />

          <AjouterPieceJointeDialog
            open={showAjouterPJDialog}
            onOpenChange={setShowAjouterPJDialog}
            courrierId={courrier.id}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['courrier', id] });
              setShowAjouterPJDialog(false);
            }}
          />

          <ModifierInfosCourrierDialog
            open={showModifierInfosDialog}
            onOpenChange={setShowModifierInfosDialog}
            courrier={courrier}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['courrier', id] });
              setShowModifierInfosDialog(false);
            }}
          />
        </>
      )}
    </div>
  );
}

// Composant pour afficher une affectation de service
function AffectationServiceCard({ affectation }: { affectation: AffectationServiceData }) {
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatutBadge = (statut: string, display: string) => {
    const colors: Record<string, string> = {
      en_attente: "bg-gray-100 text-gray-700 border-gray-300",
      distribue: "bg-blue-100 text-blue-700 border-blue-300",
      vu: "bg-cyan-100 text-cyan-700 border-cyan-300",
      en_traitement: "bg-yellow-100 text-yellow-700 border-yellow-300",
      valide: "bg-green-100 text-green-700 border-green-300",
      signe: "bg-purple-100 text-purple-700 border-purple-300",
      rejete: "bg-red-100 text-red-700 border-red-300",
    };

    return (
      <Badge variant="outline" className={`${colors[statut] || ""} text-xs`}>
        {display}
      </Badge>
    );
  };

  const getUrgenceBadge = (niveau: string, display: string) => {
    const colors: Record<string, string> = {
      faible: "bg-gray-100 text-gray-600",
      normal: "bg-blue-100 text-blue-600",
      eleve: "bg-orange-100 text-orange-600",
      critique: "bg-red-100 text-red-600",
    };

    return (
      <Badge variant="secondary" className={`${colors[niveau] || ""} text-xs`}>
        {display}
      </Badge>
    );
  };

  return (
    <div className="space-y-2 p-2.5 bg-muted/30 rounded-lg text-sm">
      {/* En-tête de l'affectation */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{affectation.service_nom || 'Service'}</h4>
            {affectation.service_description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{affectation.service_description}</p>
            )}
          </div>
        </div>
        {affectation.statut && affectation.statut_display && 
          getStatutBadge(affectation.statut, affectation.statut_display)
        }
      </div>

      {/* Informations de l'affectation */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-start gap-1.5">
          <PenLine className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <div>
            <Label className="text-xs text-muted-foreground">Action</Label>
            <p className="mt-0.5">{affectation.action_requise_display || affectation.action_requise}</p>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Zap className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <div>
            <Label className="text-xs text-muted-foreground">Urgence</Label>
            <div className="mt-0.5">
              {affectation.niveau_urgence && affectation.niveau_urgence_display &&
                getUrgenceBadge(affectation.niveau_urgence, affectation.niveau_urgence_display)
              }
            </div>
          </div>
        </div>
        {affectation.date_echeance && (
          <div className="flex items-start gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <div>
              <Label className="text-xs text-muted-foreground">Échéance</Label>
              <p className="mt-0.5">{formatDateTime(affectation.date_echeance)}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <div>
            <Label className="text-xs text-muted-foreground">Distribué</Label>
            <p className="mt-0.5">{formatDateTime(affectation.date_creation)}</p>
          </div>
        </div>
      </div>

      {/* Dates de traitement */}
      {(affectation.date_lecture || affectation.date_traitement) && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {affectation.date_lecture && (
            <div className="flex items-start gap-1.5">
              <Eye className="h-3.5 w-3.5 text-cyan-600 mt-0.5" />
              <div>
                <Label className="text-xs text-muted-foreground">Lu le</Label>
                <p className="mt-0.5">{formatDateTime(affectation.date_lecture)}</p>
              </div>
            </div>
          )}
          {affectation.date_traitement && (
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5" />
              <div>
                <Label className="text-xs text-muted-foreground">Traité le</Label>
                <p className="mt-0.5">{formatDateTime(affectation.date_traitement)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes et commentaires */}
      {affectation.note && (
        <div className="p-2 bg-blue-50/50 border border-blue-200 rounded">
          <Label className="text-xs text-blue-700 font-medium">Note</Label>
          <p className="mt-0.5 text-xs text-blue-900">{affectation.note}</p>
        </div>
      )}

      {affectation.commentaire_traitement && (
        <div className="p-2 bg-green-50/50 border border-green-200 rounded">
          <Label className="text-xs text-green-700 font-medium">Commentaire de traitement</Label>
          <p className="mt-0.5 text-xs text-green-900">{affectation.commentaire_traitement}</p>
        </div>
      )}

      {affectation.motif_rejet && (
        <div className="p-2 bg-red-50/50 border border-red-200 rounded">
          <Label className="text-xs text-red-700 font-medium">Motif de rejet</Label>
          <p className="mt-0.5 text-xs text-red-900">{affectation.motif_rejet}</p>
        </div>
      )}
    </div>
  );
}
