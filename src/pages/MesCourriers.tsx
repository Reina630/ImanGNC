import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileSignature,
  Clock,
  Mail,
  Calendar,
  User,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import courrierService from "@/services/courrierService";

// Types
interface Commentaire {
  id: number;
  auteur: string;
  auteur_nom?: string;
  date: string;
  date_creation?: string;
  contenu: string;
}

interface AffectationCourrier {
  id: number;
  affectation_id: number;
  numero: string;
  reference?: string;
  objet: string;
  expediteur: string;
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
  note?: string;
  date_affectation?: string;
  affecte_par?: string;
}

export default function MesCourriers() {
  const navigate = useNavigate();
  const [courriers, setCourriers] = useState<AffectationCourrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [selectedCourrier, setSelectedCourrier] = useState<AffectationCourrier | null>(null);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"valider" | "rejeter" | "signer" | null>(null);
  const [newComment, setNewComment] = useState("");
  const [motifRejet, setMotifRejet] = useState("");

  // Charger les courriers affectés
  useEffect(() => {
    const loadAffectations = async () => {
      try {
        setIsLoading(true);
        const data = await courrierService.getMesAffectations();
        
        console.log('API Response:', data); // Debug
        
        // Mapper les données de l'API au format attendu par le composant
        const mappedData: AffectationCourrier[] = data.map((item: any) => {
          console.log('Mapping item:', item); // Debug
          return {
            id: item.courrier, // ID du courrier pour la redirection
            affectation_id: item.id,
            numero: item.courrier_numero || item.courrier_details?.numero_registre || '',
            objet: item.courrier_objet || item.courrier_details?.objet || '',
            expediteur: item.courrier_details?.expediteur || item.courrier_details?.service_expediteur || "Service RH",
            type: item.courrier_details?.type_courrier || 'entrant',
            dateReception: item.courrier_details?.date_reception || item.courrier_details?.created_at?.split('T')[0] || '',
            statut: item.statut === 'en_attente' ? 'en_attente' : 
                    item.statut === 'lu' ? 'en_attente' :
                    item.statut === 'valide' ? 'valide' :
                    item.statut === 'rejete' ? 'rejete' : 'signe',
            urgent: item.courrier_details?.urgent || false,
            commentaires: [],
            pieceJointe: item.courrier_details?.fichier_url || item.courrier_details?.fichier,
            note: item.note || '',
            date_affectation: item.date_affectation,
            affecte_par: item.affecte_par_nom_complet || item.affecte_par_username,
          };
        });
        
        setCourriers(mappedData);
      } catch (error) {
        console.error("Erreur lors du chargement des affectations:", error);
        toast.error("Erreur lors du chargement des courriers");
      } finally {
        setIsLoading(false);
      }
    };

    loadAffectations();
  }, []);

  // Filtrage
  const courriersFiltres = courriers.filter((c) => {
    const matchSearch = searchTerm === '' ||
      (c.objet && c.objet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.numero && c.numero.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.expediteur && c.expediteur.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatut = filterStatut === "tous" || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  // Statistiques
  const stats = {
    total: courriers.length,
    enAttente: courriers.filter((c) => c.statut === "en_attente").length,
    valides: courriers.filter((c) => c.statut === "valide").length,
    rejetes: courriers.filter((c) => c.statut === "rejete").length,
    signes: courriers.filter((c) => c.statut === "signe").length,
    urgents: courriers.filter((c) => c.urgent && c.statut === "en_attente").length,
  };

  // Actions
  const handleAddComment = async () => {
    if (!selectedCourrier || !newComment.trim()) return;

    try {
      await courrierService.commenterAffectation(
        selectedCourrier.affectation_id,
        newComment
      );

      // Recharger les affectations
      const data = await courrierService.getMesAffectations();
      const mappedData: AffectationCourrier[] = data.map((item: any) => ({
        id: item.courrier, // ID du courrier pour la redirection
        affectation_id: item.id,
        numero: item.courrier_numero || item.courrier_details?.numero_registre || '',
        objet: item.courrier_objet || item.courrier_details?.objet || '',
        expediteur: item.courrier_details?.expediteur || item.courrier_details?.service_expediteur || "Service RH",
        type: item.courrier_details?.type_courrier || 'entrant',
        dateReception: item.courrier_details?.date_reception || item.courrier_details?.created_at?.split('T')[0] || '',
        statut: item.statut === 'en_attente' ? 'en_attente' : 
                item.statut === 'lu' ? 'en_attente' :
                item.statut === 'valide' ? 'valide' :
                item.statut === 'rejete' ? 'rejete' : 'signe',
        urgent: item.courrier_details?.urgent || false,
        commentaires: [],
        pieceJointe: item.courrier_details?.fichier_url || item.courrier_details?.fichier,
        note: item.note || '',
        date_affectation: item.date_affectation,
        affecte_par: item.affecte_par_nom_complet || item.affecte_par_username,
      }));
      setCourriers(mappedData);

      setNewComment("");
      toast.success("Commentaire ajouté avec succès");
      setIsCommentDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  const handleAction = async () => {
    if (!selectedCourrier || !actionType) return;

    try {
      await courrierService.traiterAffectation(
        selectedCourrier.affectation_id,
        actionType,
        undefined,
        actionType === "rejeter" ? motifRejet : undefined
      );

      // Recharger les affectations
      const data = await courrierService.getMesAffectations();
      const mappedData: AffectationCourrier[] = data.map((item: any) => ({
        id: item.courrier, // ID du courrier pour la redirection
        affectation_id: item.id,
        numero: item.courrier_numero || item.courrier_details?.numero_registre || '',
        objet: item.courrier_objet || item.courrier_details?.objet || '',
        expediteur: item.courrier_details?.expediteur || item.courrier_details?.service_expediteur || "Service RH",
        type: item.courrier_details?.type_courrier || 'entrant',
        dateReception: item.courrier_details?.date_reception || item.courrier_details?.created_at?.split('T')[0] || '',
        statut: item.statut === 'en_attente' ? 'en_attente' : 
                item.statut === 'lu' ? 'en_attente' :
                item.statut === 'valide' ? 'valide' :
                item.statut === 'rejete' ? 'rejete' : 'signe',
        urgent: item.courrier_details?.urgent || false,
        commentaires: [],
        pieceJointe: item.courrier_details?.fichier_url || item.courrier_details?.fichier,
        note: item.note || '',
        date_affectation: item.date_affectation,
        affecte_par: item.affecte_par_nom_complet || item.affecte_par_username,
      }));
      setCourriers(mappedData);

      setMotifRejet("");
      toast.success(
        actionType === "valider"
          ? "Courrier validé"
          : actionType === "rejeter"
          ? "Courrier rejeté"
          : "Courrier signé"
      );
      setIsActionDialogOpen(false);
      setSelectedCourrier(null);
    } catch (error) {
      console.error("Erreur lors du traitement:", error);
      toast.error("Erreur lors du traitement du courrier");
    }
  };

  const openActionDialog = (courrier: AffectationCourrier, type: "valider" | "rejeter" | "signer") => {
    setSelectedCourrier(courrier);
    setActionType(type);
    setIsActionDialogOpen(true);
  };

  const openCommentDialog = (courrier: AffectationCourrier) => {
    setSelectedCourrier(courrier);
    setIsCommentDialogOpen(true);
  };

  const getStatutBadge = (statut: AffectationCourrier["statut"]) => {
    const variants = {
      en_attente: { variant: "outline" as const, label: "En attente", className: "border-amber-200 text-amber-700 bg-amber-50" },
      valide: { variant: "outline" as const, label: "Validé", className: "border-emerald-200 text-emerald-700 bg-emerald-50" },
      rejete: { variant: "outline" as const, label: "Rejeté", className: "border-rose-200 text-rose-700 bg-rose-50" },
      signe: { variant: "outline" as const, label: "Signé", className: "border-blue-200 text-blue-700 bg-blue-50" },
    };
    const config = variants[statut];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mes Courriers</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos courriers : commentez, validez, rejetez ou signez
        </p>
      </div>

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Affichage des courriers */}
      {!isLoading && (
        <>
          {/* Filtres et recherche */}
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par objet, numéro ou expéditeur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-slate-200"
                  />
                </div>
                <Select value={filterStatut} onValueChange={setFilterStatut}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="valide">Validé</SelectItem>
                    <SelectItem value="rejete">Rejeté</SelectItem>
                    <SelectItem value="signe">Signé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

      {/* Table compacte des courriers */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Liste des courriers ({courriersFiltres.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Expéditeur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courriersFiltres.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucun courrier trouvé
                  </TableCell>
                </TableRow>
              ) : (
                courriersFiltres.map((courrier) => (
                  <TableRow key={courrier.id} className={courrier.urgent ? "border-l-2 border-l-amber-400" : ""}>
                    <TableCell className="font-medium">
                      {courrier.numero}
                      {courrier.urgent && (
                        <Badge variant="outline" className="ml-2 text-xs border-amber-300 text-amber-700 bg-amber-50">
                          Urgent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{courrier.objet}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {courrier.expediteur}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={courrier.type === "entrant" ? "border-blue-200 text-blue-700 bg-blue-50" : "border-slate-200 text-slate-700 bg-slate-50"}>
                        <Mail className="h-3 w-3 mr-1" />
                        {courrier.type === "entrant" ? "Entrant" : "Sortant"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatutBadge(courrier.statut)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-md border-[#7c2235] text-[#7c2235] hover:bg-[#7c2235]/10 px-3 py-0.5 text-xs font-semibold shadow-none border-2 min-h-0 h-7"
                        onClick={() => navigate(`/mes-courriers/traiter/${courrier.id}`)}
                        title="Traiter ce courrier"
                      >
                        Traiter
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Détails du courrier */}
      <Dialog open={!!selectedCourrier} onOpenChange={() => setSelectedCourrier(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du courrier</DialogTitle>
            <DialogDescription>
              {selectedCourrier && (
                <>
                  <div className="mb-2"><b>Numéro :</b> {selectedCourrier.numero}</div>
                  <div className="mb-2"><b>Objet :</b> {selectedCourrier.objet}</div>
                  <div className="mb-2"><b>Expéditeur :</b> {selectedCourrier.expediteur}</div>
                  <div className="mb-2"><b>Type :</b> {selectedCourrier.type === "entrant" ? "Entrant" : "Sortant"}</div>
                  <div className="mb-2"><b>Date de réception :</b> {new Date(selectedCourrier.dateReception).toLocaleDateString("fr-FR")}</div>
                  {selectedCourrier.dateEcheance && (
                    <div className="mb-2"><b>Échéance :</b> {new Date(selectedCourrier.dateEcheance).toLocaleDateString("fr-FR")}</div>
                  )}
                  <div className="mb-2"><b>Statut :</b> {getStatutBadge(selectedCourrier.statut)}</div>
                  {selectedCourrier.pieceJointe && (
                    <div className="mb-2"><b>Pièce jointe :</b> {selectedCourrier.pieceJointe}</div>
                  )}
                  {selectedCourrier.commentaires.length > 0 && (
                    <div className="mb-2">
                      <b>Commentaires :</b>
                      <ul className="list-disc ml-5 mt-1">
                        {selectedCourrier.commentaires.map((com) => (
                          <li key={com.id} className="text-xs text-muted-foreground">
                            <span className="font-medium">{com.auteur}</span> ({com.date}) : {com.contenu}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Dialog Commentaire */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un commentaire</DialogTitle>
            <DialogDescription>
              Courrier: {selectedCourrier?.numero} - {selectedCourrier?.objet}
            </DialogDescription>
          </DialogHeader>

          {/* Affichage des commentaires existants */}
          {selectedCourrier && selectedCourrier.commentaires.length > 0 && (
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              <h4 className="text-sm font-semibold text-muted-foreground">Commentaires précédents:</h4>
              {selectedCourrier.commentaires.map((com) => (
                <div key={com.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-medium">{com.auteur}</span>
                    <span>{com.date}</span>
                  </div>
                  <p className="text-sm">{com.contenu}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <Textarea
              placeholder="Votre commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Action (Valider/Rejeter/Signer) */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "valider"
                ? "Valider le courrier"
                : actionType === "rejeter"
                ? "Rejeter le courrier"
                : "Signer le courrier"}
            </DialogTitle>
            <DialogDescription>
              Courrier: {selectedCourrier?.numero} - {selectedCourrier?.objet}
            </DialogDescription>
          </DialogHeader>

          {actionType === "rejeter" && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Motif du rejet (optionnel)</label>
              <Textarea
                placeholder="Précisez le motif du rejet..."
                value={motifRejet}
                onChange={(e) => setMotifRejet(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {actionType === "valider" && (
            <p className="text-sm text-muted-foreground">
              Confirmez-vous la validation de ce courrier ?
            </p>
          )}

          {actionType === "signer" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Confirmez-vous la signature électronique de ce courrier ?
              </p>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-800">
                  <FileSignature className="h-4 w-4 inline mr-1" />
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
              variant={
                actionType === "rejeter"
                  ? "outline"
                  : actionType === "valider"
                  ? "default"
                  : "outline"
              }
              className={
                actionType === "rejeter"
                  ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                  : actionType === "signer"
                  ? "border-blue-200 text-blue-700 hover:bg-blue-50"
                  : ""
              }
            >
              {actionType === "valider" && <CheckCircle2 className="h-4 w-4 mr-2" />}
              {actionType === "rejeter" && <XCircle className="h-4 w-4 mr-2" />}
              {actionType === "signer" && <FileSignature className="h-4 w-4 mr-2" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
