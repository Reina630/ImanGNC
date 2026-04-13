/**
 * Dialogue pour archiver directement un courrier (sans passer par le circuit de traitement)
 * Statut 'archive' par défaut.
 */

import { useState } from "react";
import { Loader2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/services/categoryHooks";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";

interface ArchiverDirectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ArchiverDirectDialog({
  open,
  onOpenChange,
  onSuccess,
}: ArchiverDirectDialogProps) {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();

  const [loading, setLoading] = useState(false);
  const [typeCourrier, setTypeCourrier] = useState<"entrant" | "sortant" | "interne">("entrant");
  const [formData, setFormData] = useState({
    date_courrier: new Date().toISOString().split("T")[0],
    expediteur: "",
    destinataire: "",
    objet: "",
    reference_structure: "",
    categorie: "",
    mode_envoi: "courrier",
    mode_reception: "courrier",
    notes: "",
  });
  const [fichier, setFichier] = useState<File | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: "entrant" | "sortant" | "interne") => {
    setTypeCourrier(type);
  };

  const handleSubmit = async () => {
    if (!formData.objet.trim()) {
      toast({ variant: "destructive", title: "Champ requis", description: "L'objet est obligatoire." });
      return;
    }
    if (!formData.date_courrier) {
      toast({ variant: "destructive", title: "Champ requis", description: "La date est obligatoire." });
      return;
    }
    if ((typeCourrier === "entrant" || typeCourrier === "interne") && !formData.expediteur.trim()) {
      toast({ variant: "destructive", title: "Champ requis", description: "L'expéditeur est obligatoire." });
      return;
    }
    if ((typeCourrier === "sortant" || typeCourrier === "interne") && !formData.destinataire.trim()) {
      toast({ variant: "destructive", title: "Champ requis", description: "Le destinataire est obligatoire." });
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append("type_courrier", typeCourrier);
      data.append("statut", "archive");
      data.append("objet", formData.objet);
      data.append("date_courrier", formData.date_courrier);

      if (typeCourrier === "entrant" || typeCourrier === "interne") {
        data.append("expediteur", formData.expediteur);
      }
      if (typeCourrier === "sortant" || typeCourrier === "interne") {
        data.append("destinataire", formData.destinataire);
      }
      if (formData.categorie) data.append("categorie", formData.categorie);
      if (formData.reference_structure) data.append("reference_structure", formData.reference_structure);
      if (typeCourrier === "entrant") data.append("mode_reception", formData.mode_reception);
      if (typeCourrier === "sortant") data.append("mode_envoi", formData.mode_envoi);
      if (formData.notes) data.append("notes", formData.notes);
      if (fichier) data.append("fichier", fichier);

      await courrierService.createCourrier(data);
      toast({ title: "Archivé", description: "Le courrier a été archivé avec succès." });
      onSuccess();
      onOpenChange(false);
      // Réinitialiser
      setFormData({
        date_courrier: new Date().toISOString().split("T")[0],
        expediteur: "",
        destinataire: "",
        objet: "",
        reference_structure: "",
        categorie: "",
        mode_envoi: "courrier",
        mode_reception: "courrier",
        notes: "",
      });
      setFichier(null);
      setTypeCourrier("entrant");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible d'archiver le courrier.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#800020]/10">
              <Archive className="h-5 w-5 text-[#800020]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Archiver un courrier</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Enregistrement direct — statut <span className="font-medium text-[#800020]">archivé</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-5">
          {/* Type de courrier */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
            {(["entrant", "sortant", "interne"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`py-2 rounded-md text-sm font-medium transition-all capitalize ${
                  typeCourrier === type
                    ? "bg-[#800020] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Ligne date + référence */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date_courrier">
                {typeCourrier === "sortant" ? "Date d'envoi" : "Date de réception"}
                <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="date_courrier"
                type="date"
                value={formData.date_courrier}
                onChange={(e) => handleChange("date_courrier", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference_structure">Référence structure</Label>
              <Input
                id="reference_structure"
                placeholder="Ex: REF-2024-001"
                value={formData.reference_structure}
                onChange={(e) => handleChange("reference_structure", e.target.value)}
              />
            </div>
          </div>

          {/* Expéditeur / Destinataire */}
          <div className="grid grid-cols-2 gap-4">
            {(typeCourrier === "entrant" || typeCourrier === "interne") && (
              <div className="space-y-1.5">
                <Label htmlFor="expediteur">
                  Expéditeur <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expediteur"
                  placeholder="Nom ou organisation"
                  value={formData.expediteur}
                  onChange={(e) => handleChange("expediteur", e.target.value)}
                />
              </div>
            )}
            {(typeCourrier === "sortant" || typeCourrier === "interne") && (
              <div className="space-y-1.5">
                <Label htmlFor="destinataire">
                  Destinataire <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="destinataire"
                  placeholder="Nom ou organisation"
                  value={formData.destinataire}
                  onChange={(e) => handleChange("destinataire", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Objet */}
          <div className="space-y-1.5">
            <Label htmlFor="objet">
              Objet <span className="text-red-500">*</span>
            </Label>
            <Input
              id="objet"
              placeholder="Objet du courrier"
              value={formData.objet}
              onChange={(e) => handleChange("objet", e.target.value)}
            />
          </div>

          {/* Catégorie + Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select
                value={formData.categorie}
                onValueChange={(v) => handleChange("categorie", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {typeCourrier === "entrant" && (
              <div className="space-y-1.5">
                <Label>Mode de réception</Label>
                <Select
                  value={formData.mode_reception}
                  onValueChange={(v) => handleChange("mode_reception", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="courrier">Courrier postal</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="fax">Fax</SelectItem>
                    <SelectItem value="main_propre">Main propre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {typeCourrier === "sortant" && (
              <div className="space-y-1.5">
                <Label>Mode d'envoi</Label>
                <Select
                  value={formData.mode_envoi}
                  onValueChange={(v) => handleChange("mode_envoi", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="courrier">Courrier postal</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="fax">Fax</SelectItem>
                    <SelectItem value="main_propre">Main propre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires..."
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Fichier joint */}
          <div className="space-y-1.5">
            <Label>Document joint</Label>
            {fichier ? (
              <div className="flex items-center justify-between px-3 py-2 border rounded-lg bg-muted/30">
                <span className="text-sm truncate">{fichier.name}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive ml-2 shrink-0"
                  onClick={() => setFichier(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-[#800020]/50 hover:bg-[#800020]/5 transition-all">
                <span className="text-sm text-muted-foreground">Cliquer pour joindre un fichier</span>
                <span className="text-xs text-muted-foreground mt-0.5">PDF, Word, JPG, PNG — max 10 Mo</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#800020] hover:bg-[#600018] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Archivage...
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
