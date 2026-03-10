import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateService, useUpdateService } from "@/services/serviceHooks";
import type { Service } from "@/services/serviceService";
import { Loader2 } from "lucide-react";

interface ServiceManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSuccess?: () => void;
}

export function ServiceManagementDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServiceManagementDialogProps) {
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pré-remplir le formulaire si on édite un service
  useEffect(() => {
    if (open) {
      if (service) {
        setFormData({
          nom: service.nom,
          description: service.description || "",
        });
      } else {
        setFormData({
          nom: "",
          description: "",
        });
      }
      setErrors({});
    }
  }, [open, service]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (service) {
        // Modification
        await updateMutation.mutateAsync({
          id: service.id,
          nom: formData.nom,
          description: formData.description
        });
      } else {
        // Création
        await createMutation.mutateAsync({ 
          nom: formData.nom, 
          description: formData.description 
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
      console.error("Erreur lors de la gestion du service:", error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {service ? "Modifier le service" : "Nouveau service"}
          </DialogTitle>
          <DialogDescription>
            {service
              ? "Modifiez les informations du service"
              : "Ajoutez un nouveau service de l'organisation"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="nom" className="required">
              Nom du service
            </Label>
            <Input
              id="nom"
              placeholder="Ex: Ressources Humaines, Comptabilité, IT..."
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
              className={errors.nom ? "border-red-500" : ""}
            />
            {errors.nom && (
              <p className="text-sm text-red-500">{errors.nom}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Description du service..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : service ? (
                "Modifier"
              ) : (
                "Créer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
