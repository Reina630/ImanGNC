/**
 * Dialog pour modifier les informations d'un courrier
 * Modifie uniquement les champs texte (pas le document)
 */

import { useState, useEffect } from "react";
import {
  Edit2,
  Calendar,
  Mail,
  Send,
  Inbox,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";
import { CourrierCombobox } from "@/components/CourrierCombobox";

interface ModifierInfosCourrierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrier: Courrier;
  onSuccess?: () => void;
}

export function ModifierInfosCourrierDialog({
  open,
  onOpenChange,
  courrier,
  onSuccess,
}: ModifierInfosCourrierDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    expediteur: courrier.expediteur || "",
    destinataire: courrier.destinataire || "",
    reference: courrier.reference_structure || "",
    objet: courrier.objet || "",
    notes: courrier.notes || "",
    date_reception: courrier.date_reception || "",
    date_envoi: courrier.date_envoi || "",
    reponse_a: courrier.reponse_a || null,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        expediteur: courrier.expediteur || "",
        destinataire: courrier.destinataire || "",
        reference: courrier.reference_structure || "",
        objet: courrier.objet || "",
        notes: courrier.notes || "",
        date_reception: courrier.date_reception || "",
        date_envoi: courrier.date_envoi || "",
        reponse_a: courrier.reponse_a || null,
      });
      setSelectedFile(null);
    }
  }, [open, courrier]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Déterminer si on doit envoyer en FormData (avec fichier) ou en JSON
      if (selectedFile) {
        // Avec fichier : FormData multipart
        const formDataToSend = new FormData();
        formDataToSend.append('expediteur', formData.expediteur);
        formDataToSend.append('destinataire', formData.destinataire);
        formDataToSend.append('reference_structure', formData.reference);
        formDataToSend.append('objet', formData.objet);
        formDataToSend.append('notes', formData.notes);
        formDataToSend.append('fichier', selectedFile);

        // Ajouter les champs selon le type de courrier
        if (courrier.type_courrier === "entrant") {
          formDataToSend.append('date_reception', formData.date_reception);
          if (formData.reponse_a) {
            formDataToSend.append('reponse_a', formData.reponse_a.toString());
          }
        } else if (courrier.type_courrier === "sortant") {
          formDataToSend.append('date_envoi', formData.date_envoi);
          if (formData.reponse_a) {
            formDataToSend.append('reponse_a', formData.reponse_a.toString());
          }
        }

        console.log("🔄 Mise à jour du courrier ID:", courrier.id, "(avec fichier)");
        await courrierService.updateCourrier(courrier.id, formDataToSend);
      } else {
        // Sans fichier : JSON
        const data: any = {
          expediteur: formData.expediteur,
          destinataire: formData.destinataire,
          reference_structure: formData.reference,
          objet: formData.objet,
          notes: formData.notes,
        };

        // Ajouter les champs selon le type de courrier
        if (courrier.type_courrier === "entrant") {
          data.date_reception = formData.date_reception;
          data.reponse_a = formData.reponse_a;
        } else if (courrier.type_courrier === "sortant") {
          data.date_envoi = formData.date_envoi;
          data.reponse_a = formData.reponse_a;
        }

        console.log("🔄 Mise à jour du courrier ID:", courrier.id);
        console.log("📦 Données envoyées:", data);
        
        await courrierService.updateCourrier(courrier.id, data);
      }

      toast({
        title: "Succès",
        description: selectedFile 
          ? "Informations et document modifiés avec succès" 
          : "Informations modifiées avec succès",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("❌ Erreur lors de la modification:", error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la modification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Modifier le courrier {courrier.numero_registre}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Modifiez les informations du courrier
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-3">
          {/* Type de courrier et Référence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Type de courrier</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                {courrier.type_courrier === 'entrant' && <Inbox className="h-3.5 w-3.5" />}
                {courrier.type_courrier === 'sortant' && <Send className="h-3.5 w-3.5" />}
                {courrier.type_courrier === 'interne' && <Mail className="h-3.5 w-3.5" />}
                <span className="font-medium">{courrier.type_courrier_display}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-reference" className="text-sm">Référence structure</Label>
              <Input
                id="edit-reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Référence externe"
                className="h-9"
              />
            </div>
          </div>

          {/* Champs spécifiques COURRIER ENTRANT */}
          {courrier.type_courrier === "entrant" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-date-reception" className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-3.5 w-3.5" />
                    Date de réception
                  </Label>
                  <Input
                    id="edit-date-reception"
                    type="date"
                    value={formData.date_reception}
                    onChange={(e) => setFormData({ ...formData, date_reception: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-expediteur" className="text-sm">Expéditeur</Label>
                  <Input
                    id="edit-expediteur"
                    value={formData.expediteur}
                    onChange={(e) => setFormData({ ...formData, expediteur: e.target.value })}
                    placeholder="Nom de l'expéditeur"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-reponse-a" className="text-sm">En réponse à (optionnel)</Label>
                <CourrierCombobox
                  value={formData.reponse_a}
                  onValueChange={(value) => setFormData({ ...formData, reponse_a: value })}
                  placeholder="Sélectionner un courrier..."
                  typeCourrier="sortant"
                />
              </div>
            </>
          )}

          {/* Champs spécifiques COURRIER SORTANT */}
          {courrier.type_courrier === "sortant" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-date-envoi" className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-3.5 w-3.5" />
                    Date d'envoi
                  </Label>
                  <Input
                    id="edit-date-envoi"
                    type="date"
                    value={formData.date_envoi}
                    onChange={(e) => setFormData({ ...formData, date_envoi: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-destinataire" className="text-sm">Destinataire</Label>
                  <Input
                    id="edit-destinataire"
                    value={formData.destinataire}
                    onChange={(e) => setFormData({ ...formData, destinataire: e.target.value })}
                    placeholder="Nom du destinataire"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-reponse-a-sortant" className="text-sm">En réponse à (optionnel)</Label>
                <CourrierCombobox
                  value={formData.reponse_a}
                  onValueChange={(value) => setFormData({ ...formData, reponse_a: value })}
                  placeholder="Sélectionner un courrier..."
                  typeCourrier="entrant"
                />
              </div>
            </>
          )}

          {/* Champs spécifiques COURRIER INTERNE */}
          {courrier.type_courrier === "interne" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-expediteur-interne" className="text-sm">Expéditeur</Label>
                <Input
                  id="edit-expediteur-interne"
                  value={formData.expediteur}
                  onChange={(e) => setFormData({ ...formData, expediteur: e.target.value })}
                  placeholder="Nom de l'expéditeur"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-destinataire-interne" className="text-sm">Destinataire</Label>
                <Input
                  id="edit-destinataire-interne"
                  value={formData.destinataire}
                  onChange={(e) => setFormData({ ...formData, destinataire: e.target.value })}
                  placeholder="Nom du destinataire"
                  className="h-9"
                />
              </div>
            </div>
          )}

          {/* Objet et Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-objet" className="text-sm">
              Objet
            </Label>
            <Textarea
              id="edit-objet"
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              rows={1}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes" className="text-sm">Notes internes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ajoutez des notes internes..."
              rows={2}
              className="resize-none"
            />
          </div>

          <Separator className="my-2" />
          
          <div className="space-y-1.5">
            <Label htmlFor="edit-fichier" className="flex items-center gap-1.5 text-sm">
              <Upload className="h-3.5 w-3.5" />
              Remplacer le document (optionnel)
            </Label>
            <Input
              id="edit-fichier"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="h-9 cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="h-9">
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
