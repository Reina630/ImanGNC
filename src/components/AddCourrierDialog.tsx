/**
 * Dialog pour ajouter un nouveau courrier au registre
 * Formulaire complet avec validation des champs obligatoires
 */

import { useState, useEffect } from "react";
import { Upload, Calendar, Mail, Send, Inbox, FileText } from "lucide-react";
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
    type_courrier: "entrant" as "entrant" | "sortant",
    date_reception: "",
    date_envoi: "",
    nom: "", // Expéditeur pour entrant, Destinataire pour sortant
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
        date_envoi: "",
        nom: "",
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
    if (formData.type_courrier === "entrant" && !formData.date_reception) {
      newErrors.date_reception = "La date est obligatoire";
    }
    
    if (formData.type_courrier === "sortant" && !formData.date_envoi) {
      newErrors.date_envoi = "La date est obligatoire";
    }

    // Champs obligatoires
    if (!formData.objet.trim()) {
      newErrors.objet = "L'objet est obligatoire";
    }
    
    if (!formData.nom.trim()) {
      newErrors.nom = formData.type_courrier === "entrant" 
        ? "L'expéditeur est obligatoire" 
        : "Le destinataire est obligatoire";
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
      
      // Définir expéditeur ou destinataire selon le type
      if (formData.type_courrier === "entrant") {
        data.append("expediteur", formData.nom);
        data.append("date_reception", formData.date_reception);
      } else {
        data.append("destinataire", formData.nom);
        data.append("date_envoi", formData.date_envoi);
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
          {/* Type de courrier et Référence */}
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
                    type_courrier: value as "entrant" | "sortant",
                    nom: "", // Réinitialiser le nom quand on change le type
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">
                Référence (optionnel)
              </Label>
              <Input
                id="reference"
                placeholder="Ex: N°123/RH/2026"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
          </div>

          {/* Date et Nom (Provenance/Destination) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="required flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formData.type_courrier === "entrant" ? "Date d'entrée" : "Date de sortie"}
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

            <div className="space-y-2">
              <Label htmlFor="nom" className="required">
                {formData.type_courrier === "entrant" ? "Provenance" : "Destination"}
              </Label>
              <Input
                id="nom"
                placeholder={formData.type_courrier === "entrant" ? "Nom de l'expéditeur" : "Nom du destinataire"}
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className={errors.nom ? "border-red-500" : ""}
              />
              {errors.nom && (
                <p className="text-sm text-red-500">{errors.nom}</p>
              )}
            </div>
          </div>

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
