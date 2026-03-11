/**
 * Dialog pour ajouter un nouveau courrier au registre
 * Formulaire complet avec validation des champs obligatoires
 */

import { useState, useEffect } from "react";
import { Upload, Calendar, Mail, Send, Inbox, FileText, Building2 } from "lucide-react";
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
import type { Categorie } from "@/types";
import { MODE_CHOICES, SERVICE_CHOICES } from "@/types";

interface AddCourrierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialFile?: File | null;
}

export function AddCourrierDialog({
  open,
  onOpenChange,
  onSuccess,
  initialFile,
}: AddCourrierDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    type_courrier: "entrant" as "entrant" | "sortant" | "interne",
    date_reception: "",
    mode_reception: "",
    date_envoi: "",
    mode_envoi: "",
    date_circulation: "",
    nom: "", // Expéditeur pour entrant, Destinataire pour sortant
    service_emetteur: "", // Pour courrier interne
    service_destinataire: "", // Pour courrier interne
    objet: "",
    reference: "",
    categorie: "",
  });
  
  const [fichier, setFichier] = useState<File | null>(null);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les catégories au montage
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getCategories();
      setCategories(cats || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  // Réinitialiser le formulaire quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setFormData({
        type_courrier: "entrant",
        date_reception: new Date().toISOString().split("T")[0], // Date du jour par défaut
        mode_reception: "",
        date_envoi: "",
        mode_envoi: "",
        date_circulation: "",
        nom: "",
        service_emetteur: "",
        service_destinataire: "",
        objet: "",
        reference: "",
        categorie: "",
      });
      // Utiliser le fichier initial si fourni, sinon null
      setFichier(initialFile || null);
      setErrors({});
    }
  }, [open, initialFile]);

  /**
   * Valider le formulaire
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation selon le type de courrier
    if (formData.type_courrier === "entrant") {
      if (!formData.date_reception) {
        newErrors.date_reception = "La date de réception est obligatoire";
      }
      if (!formData.nom.trim()) {
        newErrors.nom = "L'expéditeur est obligatoire";
      }
    }
    
    if (formData.type_courrier === "sortant") {
      if (!formData.date_envoi) {
        newErrors.date_envoi = "La date d'envoi est obligatoire";
      }
      if (!formData.nom.trim()) {
        newErrors.nom = "Le destinataire est obligatoire";
      }
    }
    
    if (formData.type_courrier === "interne") {
      if (!formData.date_circulation) {
        newErrors.date_circulation = "La date de circulation est obligatoire";
      }
      if (!formData.service_emetteur) {
        newErrors.service_emetteur = "Le service émetteur est obligatoire";
      }
      if (!formData.service_destinataire) {
        newErrors.service_destinataire = "Le service destinataire est obligatoire";
      }
    }

    // Champs obligatoires pour tous les types
    if (!formData.objet.trim()) {
      newErrors.objet = "L'objet est obligatoire";
    }
    
    if (!fichier) {
      newErrors.fichier = "Le fichier scanné est obligatoire";
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

      // Préparer le FormData pour l'upload
      const data = new FormData();
      data.append("type_courrier", formData.type_courrier);
      data.append("objet", formData.objet);
      data.append("fichier", fichier!);
      
      // Ajouter les champs selon le type de courrier
      if (formData.type_courrier === "entrant") {
        data.append("expediteur", formData.nom);
        data.append("date_reception", formData.date_reception);
        if (formData.mode_reception) {
          data.append("mode_reception", formData.mode_reception);
        }
      } else if (formData.type_courrier === "sortant") {
        data.append("destinataire", formData.nom);
        data.append("date_envoi", formData.date_envoi);
        if (formData.mode_envoi) {
          data.append("mode_envoi", formData.mode_envoi);
        }
      } else {
        // Courrier interne
        data.append("date_circulation", formData.date_circulation);
        data.append("service_emetteur", formData.service_emetteur);
        data.append("service_destinataire", formData.service_destinataire);
      }
      
      // Référence optionnelle
      if (formData.reference) {
        data.append("reference", formData.reference);
      }
      
      // Catégorie optionnelle
      if (formData.categorie) {
        data.append("categorie", formData.categorie);
      }
      
      // Statut par défaut
      data.append("statut", "recu");

      // Envoyer au backend
      const courrier = await courrierService.createCourrier(data);

      toast({
        title: "Courrier enregistré",
        description: `Le courrier ${courrier.numero_registre} a été créé avec succès`,
      });

      // Fermer le dialog et notifier le parent
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erreur lors de la création du courrier:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de créer le courrier",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gérer le changement de fichier
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10 MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 10 Mo",
        });
        return;
      }
      setFichier(file);
      // Retirer l'erreur si elle existe
      setErrors((prev) => {
        const { fichier, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Enregistrer un nouveau courrier
          </DialogTitle>
          <DialogDescription>
            Enregistrement simplifié : type, référence, date, provenance/destination et fichier.
            Le numéro de registre sera généré automatiquement.
          </DialogDescription>
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
                  setFormData({ 
                    ...formData, 
                    type_courrier: value as "entrant" | "sortant" | "interne",
                    nom: "",
                    service_emetteur: "",
                    service_destinataire: "",
                  })
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
                value="(Sera généré automatiquement)"
                disabled
                className="bg-muted text-muted-foreground"
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

          {/* Date et Nom (Provenance/Destination) - COURRIER ENTRANT */}
          {formData.type_courrier === "entrant" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_reception" className="required flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de réception
                  </Label>
                  <Input
                    id="date_reception"
                    type="date"
                    value={formData.date_reception}
                    onChange={(e) => setFormData({ ...formData, date_reception: e.target.value })}
                    className={errors.date_reception ? "border-red-500" : ""}
                  />
                  {errors.date_reception && (
                    <p className="text-sm text-red-500">{errors.date_reception}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode_reception">Mode de réception</Label>
                  <Select
                    value={formData.mode_reception}
                    onValueChange={(value) => setFormData({ ...formData, mode_reception: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODE_CHOICES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expediteur" className="required">Expéditeur</Label>
                <Input
                  id="expediteur"
                  placeholder="Nom de l'expéditeur ou organisation"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={errors.nom ? "border-red-500" : ""}
                />
                {errors.nom && (
                  <p className="text-sm text-red-500">{errors.nom}</p>
                )}
              </div>
            </>
          )}

          {/* Date et Nom - COURRIER SORTANT */}
          {formData.type_courrier === "sortant" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_envoi" className="required flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date d'envoi
                  </Label>
                  <Input
                    id="date_envoi"
                    type="date"
                    value={formData.date_envoi}
                    onChange={(e) => setFormData({ ...formData, date_envoi: e.target.value })}
                    className={errors.date_envoi ? "border-red-500" : ""}
                  />
                  {errors.date_envoi && (
                    <p className="text-sm text-red-500">{errors.date_envoi}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode_envoi">Mode d'envoi</Label>
                  <Select
                    value={formData.mode_envoi}
                    onValueChange={(value) => setFormData({ ...formData, mode_envoi: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODE_CHOICES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinataire" className="required">Destinataire</Label>
                <Input
                  id="destinataire"
                  placeholder="Nom du destinataire ou organisation"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={errors.nom ? "border-red-500" : ""}
                />
                {errors.nom && (
                  <p className="text-sm text-red-500">{errors.nom}</p>
                )}
              </div>
            </>
          )}

          {/* Date et Services - COURRIER INTERNE */}
          {formData.type_courrier === "interne" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="date_circulation" className="required flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de circulation
                </Label>
                <Input
                  id="date_circulation"
                  type="date"
                  value={formData.date_circulation}
                  onChange={(e) => setFormData({ ...formData, date_circulation: e.target.value })}
                  className={errors.date_circulation ? "border-red-500" : ""}
                />
                {errors.date_circulation && (
                  <p className="text-sm text-red-500">{errors.date_circulation}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_emetteur" className="required flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Service émetteur
                  </Label>
                  <Select
                    value={formData.service_emetteur}
                    onValueChange={(value) => setFormData({ ...formData, service_emetteur: value })}
                  >
                    <SelectTrigger className={errors.service_emetteur ? "border-red-500" : ""}>
                      <SelectValue placeholder="Sélectionnez un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CHOICES.map((service) => (
                        <SelectItem key={service.value} value={service.value}>
                          {service.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.service_emetteur && (
                    <p className="text-sm text-red-500">{errors.service_emetteur}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_destinataire" className="required flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Service destinataire
                  </Label>
                  <Select
                    value={formData.service_destinataire}
                    onValueChange={(value) => setFormData({ ...formData, service_destinataire: value })}
                  >
                    <SelectTrigger className={errors.service_destinataire ? "border-red-500" : ""}>
                      <SelectValue placeholder="Sélectionnez un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CHOICES.map((service) => (
                        <SelectItem key={service.value} value={service.value}>
                          {service.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.service_destinataire && (
                    <p className="text-sm text-red-500">{errors.service_destinataire}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="objet" className="required flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Objet
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
            <Label htmlFor="categorie">Catégorie</Label>
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

          {/* Upload fichier */}
          <div className="space-y-2">
            <Label htmlFor="fichier" className="required flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Fichier scanné
            </Label>
            <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors">
              <Input
                id="fichier"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Formats acceptés : PDF, JPG, PNG, GIF (max 10 Mo)
              </p>
              {fichier && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {fichier.name} ({(fichier.size / 1024).toFixed(1)} Ko)
                </p>
              )}
            </div>
            {errors.fichier && (
              <p className="text-sm text-red-500">{errors.fichier}</p>
            )}
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
              {loading ? "Enregistrement..." : "Enregistrer le courrier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
