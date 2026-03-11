/**
 * Dialog pour éditer un courrier existant
 * Permet de modifier les métadonnées du courrier (pas le fichier)
 */

import { useState, useEffect } from "react";
import { X, Calendar, Mail, Send, Inbox, FileText, Building2, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import categoryService from "@/services/categoryService";
import serviceService, { type Service } from "@/services/serviceService";
import type { Courrier, Categorie } from "@/types";
import { STATUT_CHOICES } from "@/types";

interface EditCourrierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrier: Courrier | null;
  onSuccess?: () => void;
}

export function EditCourrierDialog({
  open,
  onOpenChange,
  courrier,
  onSuccess,
}: EditCourrierDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    type_courrier: "entrant" as "entrant" | "sortant",
    date_reception: "",
    date_envoi: "",
    expediteur: "",
    destinataire: "",
    objet: "",
    reference: "",
    categorie: "",
    service_concerne: "",
    statut: "recu" as string,
    notes: "",
  });

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les catégories et services au montage
  useEffect(() => {
    loadCategories();
    loadServices();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getCategories();
      setCategories(cats || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const loadServices = async () => {
    try {
      const data = await serviceService.getServices();
      setServices(data);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
    }
  };

  // Mapper le nom d'un service vers son code (pour compatibilité avec l'ancien système)
  const getServiceCode = (serviceName: string): string => {
    const mapping: Record<string, string> = {
      'Ressources Humaines': 'rh',
      'RH': 'rh',
      'Comptabilité': 'comptabilite',
      'Direction': 'direction',
      'Direction Générale': 'direction',
      'DG': 'direction',
      'Service Technique': 'technique',
      'Technique': 'technique',
      'Commercial': 'commercial',
      'Juridique': 'juridique',
      'Informatique': 'informatique',
      'IT': 'informatique',
      'Logistique': 'logistique',
    };
    return mapping[serviceName] || 'autre';
  };

  // Mapper un code de service vers le nom (inverse)
  const getServiceNameFromCode = (code: string): string => {
    const mapping: Record<string, string> = {
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
    return mapping[code] || code;
  };

  // Pré-remplir le formulaire quand le courrier change
  useEffect(() => {
    if (open && courrier) {
      setFormData({
        type_courrier: courrier.type_courrier,
        date_reception: courrier.date_reception || "",
        date_envoi: courrier.date_envoi || "",
        expediteur: courrier.expediteur,
        destinataire: courrier.destinataire,
        objet: courrier.objet,
        reference: courrier.reference || "",
        categorie: courrier.categorie?.toString() || "",
        service_concerne: courrier.service_concerne || "",
        statut: courrier.statut,
        notes: courrier.notes || "",
      });
      setErrors({});
    }
  }, [open, courrier]);

  if (!courrier) return null;

  /**
   * Valider le formulaire
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation selon le type de courrier
    if (formData.type_courrier === "entrant" && !formData.date_reception) {
      newErrors.date_reception = "La date de réception est obligatoire pour un courrier entrant";
    }

    if (formData.type_courrier === "sortant" && !formData.date_envoi) {
      newErrors.date_envoi = "La date d'envoi est obligatoire pour un courrier sortant";
    }

    // Champs obligatoires
    if (!formData.expediteur.trim()) {
      newErrors.expediteur = "L'expéditeur est obligatoire";
    }

    if (!formData.destinataire.trim()) {
      newErrors.destinataire = "Le destinataire est obligatoire";
    }

    if (!formData.objet.trim()) {
      newErrors.objet = "L'objet est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Soumettre le formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valider le formulaire
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
      });
      return;
    }

    try {
      setLoading(true);

      // Préparer les données pour la mise à jour
      const updateData: any = {
        type_courrier: formData.type_courrier,
        expediteur: formData.expediteur,
        destinataire: formData.destinataire,
        objet: formData.objet,
        statut: formData.statut,
      };

      // Ajouter la date selon le type
      if (formData.type_courrier === "entrant") {
        updateData.date_reception = formData.date_reception;
        updateData.date_envoi = null;
      } else {
        updateData.date_envoi = formData.date_envoi;
        updateData.date_reception = null;
      }

      // Champs optionnels
      updateData.reference = formData.reference || null;
      updateData.service_concerne = formData.service_concerne || null;
      updateData.notes = formData.notes || null;
      updateData.categorie = formData.categorie ? parseInt(formData.categorie) : null;

      // Envoyer au backend
      await courrierService.updateCourrier(courrier.id, updateData);

      toast({
        title: "Courrier mis à jour",
        description: `Le courrier ${courrier.numero_registre} a été modifié avec succès`,
      });

      // Fermer le dialog et notifier le parent
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du courrier:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de mettre à jour le courrier",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Modifier le courrier
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de courrier et Numéro d'ordre */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type_courrier" className="required">
                Type de courrier
              </Label>
              <Select
                value={formData.type_courrier}
                onValueChange={(value) =>
                  setFormData({ ...formData, type_courrier: value as "entrant" | "sortant" | "interne" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrant">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4" />
                      Courrier Entrant
                    </div>
                  </SelectItem>
                  <SelectItem value="sortant">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Courrier Sortant
                    </div>
                  </SelectItem>
                  <SelectItem value="interne">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Courrier Interne
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_ordre">
                Numéro d'ordre
              </Label>
              <Input
                id="numero_ordre"
                value={courrier.numero_registre}
                disabled
                className="bg-muted text-muted-foreground font-medium"
              />
            </div>
          </div>

          {/* Référence (uniquement pour courrier sortant) */}
          {formData.type_courrier === "sortant" && (
            <div className="space-y-2">
              <Label htmlFor="reference">
                Référence (optionnel)
              </Label>
              <Input
                id="reference"
                placeholder="Ex: Réf. courrier entrant N°2026-045"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Pour référencer un courrier entrant auquel vous répondez
              </p>
            </div>
          )}

          {/* Date (conditionnelle selon le type) */}
          <div className="space-y-2">
            <Label htmlFor="date" className="required flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formData.type_courrier === "entrant" ? "Date de réception" : "Date d'envoi"}
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.type_courrier === "entrant" ? formData.date_reception : formData.date_envoi}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [formData.type_courrier === "entrant" ? "date_reception" : "date_envoi"]: e.target.value,
                })
              }
              className={errors.date_reception || errors.date_envoi ? "border-red-500" : ""}
            />
            {(errors.date_reception || errors.date_envoi) && (
              <p className="text-sm text-red-500">{errors.date_reception || errors.date_envoi}</p>
            )}
          </div>

          {/* Expéditeur et Destinataire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expediteur" className="required">
                Expéditeur
              </Label>
              <Input
                id="expediteur"
                placeholder="Nom ou organisation"
                value={formData.expediteur}
                onChange={(e) => setFormData({ ...formData, expediteur: e.target.value })}
                className={errors.expediteur ? "border-red-500" : ""}
              />
              {errors.expediteur && (
                <p className="text-sm text-red-500">{errors.expediteur}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinataire" className="required">
                Destinataire
              </Label>
              <Input
                id="destinataire"
                placeholder="Nom ou organisation"
                value={formData.destinataire}
                onChange={(e) => setFormData({ ...formData, destinataire: e.target.value })}
                className={errors.destinataire ? "border-red-500" : ""}
              />
              {errors.destinataire && (
                <p className="text-sm text-red-500">{errors.destinataire}</p>
              )}
            </div>
          </div>

          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="objet" className="required flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Objet du courrier
            </Label>
            <Input
              id="objet"
              placeholder="Sujet ou objet du courrier"
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              className={errors.objet ? "border-red-500" : ""}
            />
            {errors.objet && (
              <p className="text-sm text-red-500">{errors.objet}</p>
            )}
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="categorie">Catégorie (optionnel)</Label>
            <Select
              value={formData.categorie || undefined}
              onValueChange={(value) => setFormData({ ...formData, categorie: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucune catégorie" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(categories) && categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service et Statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_concerne" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Service concerné (optionnel)
              </Label>
              <Select
                value={formData.service_concerne || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, service_concerne: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun service</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={getServiceCode(service.nom)}>
                      {service.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statut" className="required">
                Statut
              </Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => setFormData({ ...formData, statut: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            </div>
          </div>

          {/* Note : Fichier non modifiable */}
          <div className="bg-muted/30 p-3 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              📄 <strong>Note :</strong> Le fichier scanné ne peut pas être modifié. Pour changer le fichier,
              supprimez ce courrier et créez-en un nouveau.
            </p>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Observations (optionnel)
            </Label>
            <Textarea
              id="notes"
              placeholder="Observations ou remarques..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Mise à jour..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
