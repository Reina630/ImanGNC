/**
 * Page simplifiée pour visualiser un courrier affecté à un utilisateur
 * Affiche uniquement le document et deux boutons d'action : Renvoyer et Action requise
 */

import React, { useState, useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  FileText,
  Forward,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  Clock,
  AlertCircle,
  Zap,
  Printer,
  PenLine,
  Reply,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import courrierService from "@/services/courrierService";
import affectationService from "@/services/affectationService";
import api from "@/services/api";
import type { Courrier, AffectationV2 } from "@/types";
import { SignatureDialog } from "@/components/SignatureDialog";

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

  if (error)
    return (
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
      <div ref={containerRef} className="docx-wrapper p-4 bg-white max-h-[600px] overflow-auto" />
    </div>
  );
}

export default function VoirCourrierUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const affectationId = searchParams.get("affectation"); // ID de l'affectation v2
  const mode = searchParams.get("mode"); // "view" ou "action"
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentTheme } = useTheme();

  const [courrier, setCourrier] = useState<Courrier | null>(null);
  const [affectation, setAffectation] = useState<AffectationV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [autoActionTriggered, setAutoActionTriggered] = useState(false);
  const [renvoiDialogOpen, setRenvoiDialogOpen] = useState(false);
  const [renvoiMotif, setRenvoiMotif] = useState("");
  const [renvoiMotifLibre, setRenvoiMotifLibre] = useState("");

  const MOTIFS_PREDEFINED = [
    "Document incomplet",
    "Mauvais destinataire",
    "Informations incorrectes",
    "Pièce jointe manquante",
    "Nécessite une validation préalable",
  ];

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger le courrier
      const courrierData = await courrierService.getCourrier(Number(id));
      setCourrier(courrierData);

      // Charger l'affectation v2 si l'ID est fourni
      if (affectationId) {
        const affectationData = await affectationService.getAffectation(Number(affectationId));
        setAffectation(affectationData);

        // Mise à jour automatique du statut selon l'action requise
        if (affectationData.statut === 'distribue') {
          // Si action requise = informatif, considérer comme traité (valide)
          if (affectationData.action_requise === 'informatif') {
            await affectationService.valider(Number(affectationId), 'Pris connaissance automatiquement');
            // Recharger l'affectation pour mettre à jour le statut
            const updatedAffectation = await affectationService.getAffectation(Number(affectationId));
            setAffectation(updatedAffectation);
          } else {
            // Sinon, marquer comme vu
            await affectationService.marquerLu(Number(affectationId));
            // Recharger l'affectation pour mettre à jour le statut
            const updatedAffectation = await affectationService.getAffectation(Number(affectationId));
            setAffectation(updatedAffectation);
          }
        }
      } else {
        // Fallback : chercher l'affectation de l'utilisateur dans les anciennes affectations
        const affectationsResponse = await api.get("/affectations/");
        const affectationsData = Array.isArray(affectationsResponse.data)
          ? affectationsResponse.data
          : affectationsResponse.data.results || [];

        // Trouver l'affectation de l'utilisateur connecté pour ce courrier
        const userAffectation = affectationsData.find(
          (aff: any) => aff.courrier === Number(id) && aff.utilisateur === user?.id
        );

        if (userAffectation) {
          // Convertir en format AffectationV2 (approximatif pour compatibilité)
          setAffectation(userAffectation as any);

          // Marquer comme lu si pas encore lu (ancienne logique)
          if (!userAffectation.date_lecture) {
            await courrierService.marquerAffectationLue(userAffectation.id);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le courrier",
      });
      navigate("/mes-courriers");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      distribue: "Distribué",
      vu: "Vu",
      en_traitement: "En traitement",
      valide: "Validé",
      signe: "Signé",
      rejete: "Rejeté",
      renvoye: "Renvoyé",
    };
    return labels[statut] || statut;
  };

  const handlePrint = () => {
    if (!courrier || !courrier.fichier) return;
    window.open(courrier.fichier, "_blank");
  };

  const getActionLabel = () => {
    if (!affectation) return { label: "Action requise", icon: CheckCircle2 };
    
    const actionLabels: Record<string, { label: string; icon: any }> = {
      a_signer: { label: "Signer", icon: PenLine },
      a_repondre: { label: "Répondre", icon: Reply },
      accusation_reception: { label: "Accuser réception", icon: CheckCircle2 },
      informatif: { label: "Prendre connaissance", icon: Eye },
    };

    return actionLabels[affectation.action_requise] || { label: "Traiter", icon: CheckCircle2 };
  };

  const handleRenvoyer = () => {
    if (!affectation) return;
    setRenvoiMotif("");
    setRenvoiMotifLibre("");
    setRenvoiDialogOpen(true);
  };

  const handleConfirmRenvoi = async () => {
    if (!affectation) return;
    const motifFinal = renvoiMotif === "__autre__" ? renvoiMotifLibre.trim() : renvoiMotif;
    if (!motifFinal) return;

    try {
      setActionLoading(true);
      setRenvoiDialogOpen(false);

      if (affectationId) {
        await affectationService.renvoyer(affectation.id, motifFinal);
      } else {
        await courrierService.renvoyerAffectation(affectation.id);
      }

      toast({
        title: "Courrier renvoyé",
        description: "Le courrier a été renvoyé avec succès",
      });
      navigate("/mes-courriers");
    } catch (error) {
      console.error("Erreur lors du renvoi:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de renvoyer ce courrier",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActionRequise = async () => {
    if (!affectation) return;

    // Si l'action est "signer", ouvrir le dialog de signature
    if (affectation.action_requise === "a_signer") {
      setSignatureDialogOpen(true);
      return;
    }

    try {
      setActionLoading(true);

      // Utiliser affectationService pour les affectations v2
      if (affectationId) {
        // Démarrer le traitement
        await affectationService.demarrer(affectation.id);

        toast({
          title: "Traitement commencé",
          description: "Le courrier est maintenant en cours de traitement",
        });

        // Rediriger selon l'action requise
        if (affectation.action_requise === "a_repondre") {
          navigate(`/courriers/repondre/${courrier?.id}?affectation=${affectation.id}`);
        } else {
          // Recharger les données pour mettre à jour le statut
          await loadData();
        }
      } else {
        // Fallback pour l'ancien système
        await courrierService.commencerTraitement(affectation.id);

        toast({
          title: "Traitement commencé",
          description: "Le courrier est maintenant en cours de traitement",
        });

        if (affectation.action_requise === "a_repondre") {
          navigate(`/courriers/repondre/${courrier?.id}?affectation=${affectation.id}`);
        } else {
          await loadData();
        }
      }
    } catch (error) {
      console.error("Erreur lors du traitement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de commencer le traitement",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Si mode="action", démarrer automatiquement le traitement
  useEffect(() => {
    if (mode === "action" && affectation && !actionLoading && !autoActionTriggered) {
      // Démarrer le traitement automatiquement uniquement si le statut le permet
      if (affectation.statut === "vu" || affectation.statut === "distribue") {
        setAutoActionTriggered(true);
        handleActionRequise();
      }
    }
  }, [mode, affectation, autoActionTriggered]);

  const handleSign = async (signatureData: {
    password: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }) => {
    if (!courrier || !affectation) return;

    try {
      setActionLoading(true);

      // Envoyer la demande de signature avec les coordonnées au backend
      await courrierService.traiterAffectation(
        affectation.id,
        "signer",
        "Signé électroniquement",
        undefined,
        signatureData.position,
        signatureData.size
      );

      setSignatureDialogOpen(false);
      
      toast({
        title: "Signature enregistrée",
        description: "Le courrier a été signé avec succès",
      });

      // Recharger les données
      await loadData();
    } catch (error) {
      console.error("Erreur lors de la signature:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer la signature",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getUrgenceBadge = (urgence: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      faible: { color: "bg-green-500", label: "Faible" },
      normal: { color: "bg-blue-500", label: "Normal" },
      eleve: { color: "bg-orange-500", label: "Élevé" },
      critique: { color: "bg-red-500", label: "Critique" },
    };

    const config = configs[urgence] || { color: "bg-gray-500", label: "Inconnu" };

    return (
      <Badge className={`${config.color} text-white`}>
        <AlertCircle className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Vérifier si le courrier peut être renvoyé
  const canRenvoyer = () => {
    if (!affectation) return false;
    
    // Si on est en mode "view" (consultation), on peut renvoyer
    if (mode === "view") return true;
    
    // Les statuts qui empêchent le renvoi (action déjà effectuée)
    const statutsFinaux = ["valide", "signe", "rejete", "renvoye", "traite", "en_traitement"];
    
    return !statutsFinaux.includes(affectation.statut);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du courrier...</p>
        </div>
      </div>
    );
  }

  if (!courrier || !affectation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Courrier introuvable ou vous n'avez pas accès à ce courrier</p>
          <Button onClick={() => navigate("/mes-courriers")} className="mt-4">
            Retour à mes courriers
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
                onClick={() => navigate("/mes-courriers")}
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
                  <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                    {getStatutLabel(affectation.statut)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate">{courrier.objet}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={!courrier.fichier}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              
              {/* Bouton Action requise - toujours visible pour permettre le traitement direct */}
              <Button
                className="h-9 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleActionRequise}
                disabled={
                  actionLoading || 
                  affectation.statut === 'signe' || 
                  affectation.statut === 'valide' ||
                  affectation.statut === 'rejete'
                }
                size="sm"
                title={
                  affectation.statut === 'signe' 
                    ? "Ce document a déjà été signé" 
                    : affectation.statut === 'valide'
                    ? "Cette affectation a déjà été validée"
                    : affectation.statut === 'rejete'
                    ? "Cette affectation a été rejetée"
                    : ""
                }
              >
                {React.createElement(getActionLabel().icon, { className: "h-4 w-4 mr-2" })}
                {affectation.statut === 'signe' 
                  ? "Déjà signé" 
                  : affectation.statut === 'valide'
                  ? "Déjà validé"
                  : affectation.statut === 'rejete'
                  ? "Rejeté"
                  : actionLoading 
                  ? "Traitement..." 
                  : getActionLabel().label
                }
              </Button>

              {/* Bouton Renvoyer */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRenvoyer}
                disabled={actionLoading || !canRenvoyer()}
                className={`border-orange-500 ${
                  canRenvoyer() 
                    ? "text-orange-600 hover:bg-orange-50" 
                    : "text-gray-400 border-gray-300 cursor-not-allowed opacity-50"
                }`}
                title={!canRenvoyer() ? "Vous ne pouvez plus renvoyer ce courrier après avoir effectué l'action requise" : ""}
              >
                <Forward className="h-4 w-4 mr-2" />
                Renvoyer
              </Button>
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
                const name = courrier.fichier.split("/").pop() || "Document principal";
                allDocs.push({ label: name, url: courrier.fichier });
              }
              (courrier.pieces_jointes || []).forEach((pj) => {
                allDocs.push({
                  label: pj.nom_fichier || pj.fichier_url.split("/").pop() || `Pièce ${pj.id}`,
                  url: pj.fichier_url,
                });
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
                      {allDocs[0].url.toLowerCase().match(/\.pdf$/) ? (
                        <iframe 
                          src={`${allDocs[0].url}#toolbar=0&navpanes=0&scrollbar=1`} 
                          className="w-full h-[600px] border-0" 
                          title="Aperçu du document"
                          style={{ border: 'none' }}
                        />
                      ) : allDocs[0].url.toLowerCase().match(/\.html$/) ? (
                        <iframe src={allDocs[0].url} className="w-full h-[600px]" title="Aperçu du document" />
                      ) : allDocs[0].url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ? (
                        <img src={allDocs[0].url} alt="Aperçu du courrier" className="w-full h-auto" />
                      ) : allDocs[0].url.toLowerCase().match(/\.docx?$/) ? (
                        <DocxPreview url={allDocs[0].url} />
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>Aperçu non disponible pour ce type de fichier</p>
                          <Button size="sm" className="mt-4" onClick={() => window.open(allDocs[0].url, "_blank")}>
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
                            {doc.url.toLowerCase().match(/\.pdf$/) ? (
                              <iframe 
                                src={`${doc.url}#toolbar=0&navpanes=0&scrollbar=1`} 
                                className="w-full h-[600px] border-0" 
                                title={doc.label}
                                style={{ border: 'none' }}
                              />
                            ) : doc.url.toLowerCase().match(/\.html$/) ? (
                              <iframe src={doc.url} className="w-full h-[600px]" title={doc.label} />
                            ) : doc.url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ? (
                              <img src={doc.url} alt={doc.label} className="w-full h-auto" />
                            ) : doc.url.toLowerCase().match(/\.docx?$/) ? (
                              <DocxPreview url={doc.url} />
                            ) : (
                              <div className="p-8 text-center text-muted-foreground">
                                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Aperçu non disponible pour ce type de fichier</p>
                                <Button size="sm" className="mt-4" onClick={() => window.open(doc.url, "_blank")}>
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
                  style={{ fontFamily: "Arial, sans-serif", fontSize: "11pt", lineHeight: "1.75" }}
                  dangerouslySetInnerHTML={{ __html: courrier.contenu_lettre }}
                />
              </div>
            )}
          </motion.div>

          {/* Colonne latérale - Informations et Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Informations de l'affectation */}
            <div className="stat-card space-y-4">
              <h2 className="text-lg font-semibold">Informations</h2>
              <Separator />

              {/* Type de courrier */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Type de courrier</Label>
                <Badge variant="outline" className="text-sm">
                  {courrier.type_courrier === "entrant" ? (
                    <>
                      <span className="mr-2">↓</span> Entrant
                    </>
                  ) : (
                    <>
                      <span className="mr-2">↑</span> Sortant
                    </>
                  )}
                </Badge>
              </div>

              {/* Expéditeur */}
              {courrier.expediteur && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Expéditeur
                  </Label>
                  <p className="text-sm font-medium">{courrier.expediteur}</p>
                </div>
              )}

              {/* Destinataire */}
              {courrier.destinataire && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Destinataire
                  </Label>
                  <p className="text-sm font-medium">{courrier.destinataire}</p>
                </div>
              )}

              {/* Service concerné */}
              {courrier.service_concerne && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Service concerné
                  </Label>
                  <p className="text-sm font-medium">{courrier.service_concerne}</p>
                </div>
              )}

              {/* Date de réception */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date de réception
                </Label>
                <p className="text-sm font-medium">
                  {courrier.date_reception ? formatDate(courrier.date_reception) : "—"}
                </p>
              </div>
              
              {/* Date d'affectation */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date d'affectation
                </Label>
                <p className="text-sm font-medium">
                  {affectation.date_affectation ? formatDate(affectation.date_affectation) : "—"}
                </p>
              </div>

              {/* Niveau d'urgence */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Niveau d'urgence</Label>
                {getUrgenceBadge(affectation.niveau_urgence)}
              </div>

              {/* Date d'échéance */}
              {affectation.date_echeance && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Date d'échéance
                  </Label>
                  <p className="text-sm font-medium">{formatDate(affectation.date_echeance)}</p>
                </div>
              )}

              {/* Note de l'affectation */}
              {(affectation.note_instruction || (affectation as any).note) && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Note d'affectation</Label>
                  <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                    {affectation.note_instruction || (affectation as any).note}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Dialog de renvoi */}
      <Dialog open={renvoiDialogOpen} onOpenChange={setRenvoiDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Forward className="h-4 w-4 text-orange-500" />
              Renvoyer le courrier
            </DialogTitle>
            <DialogDescription>
              Sélectionnez un motif ou expliquez la raison du renvoi. En renvoyant ce courrier, vous n'y aurez plus accès.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-sm font-medium">Motif du renvoi</Label>
            <div className="space-y-2">
              {MOTIFS_PREDEFINED.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRenvoiMotif(m)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                    renvoiMotif === m
                      ? "border-orange-400 bg-orange-50 text-orange-800 font-medium"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {m}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRenvoiMotif("__autre__")}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                  renvoiMotif === "__autre__"
                    ? "border-orange-400 bg-orange-50 text-orange-800 font-medium"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
              >
                Autre motif…
              </button>
            </div>

            {renvoiMotif === "__autre__" && (
              <Textarea
                autoFocus
                placeholder="Décrivez le motif du renvoi…"
                className="resize-none"
                rows={3}
                value={renvoiMotifLibre}
                onChange={(e) => setRenvoiMotifLibre(e.target.value)}
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRenvoiDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmRenvoi}
              disabled={
                !renvoiMotif ||
                (renvoiMotif === "__autre__" && !renvoiMotifLibre.trim())
              }
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Forward className="h-4 w-4 mr-2" />
              Confirmer le renvoi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de signature */}
      <SignatureDialog
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        pdfUrl={courrier?.fichier || ""}
        signatureUrl={user?.signature_url}
        userName={user?.username}
        onSign={handleSign}
      />
    </div>
  );
}
