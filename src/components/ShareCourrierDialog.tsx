/**
 * Dialog pour partager un courrier par Email ou WhatsApp
 */

import { useState } from "react";
import { Mail, MessageCircle, Share2, Send, X } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import partageService, { type PartageCreate } from "@/services/partageService";
import type { Courrier } from "@/types";

interface ShareCourrierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrier: Courrier | null;
  onSuccess?: () => void;
}

export function ShareCourrierDialog({
  open,
  onOpenChange,
  courrier,
  onSuccess,
}: ShareCourrierDialogProps) {
  const { toast } = useToast();
  const [type, setType] = useState<"email" | "whatsapp">("email");
  const [destinataire, setDestinataire] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!courrier) return null;

  const handleShare = async () => {
    if (!destinataire.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: type === "email" ? "L'adresse email est obligatoire" : "Le numéro de téléphone est obligatoire",
      });
      return;
    }

    try {
      setLoading(true);

      if (type === "email") {
        // Envoyer l'email directement via le backend
        const result = await partageService.sendEmail({
          courrier_id: courrier.id,
          destinataire: destinataire.trim(),
          message: message.trim(),
        });

        toast({
          title: "Email envoyé",
          description: result.message || "L'email a été envoyé avec succès",
        });

        // Réinitialiser et fermer
        setDestinataire("");
        setMessage("");
        onOpenChange(false);
        onSuccess?.();
      } else {
        // Pour WhatsApp, enregistrer d'abord le partage
        const partageData: PartageCreate = {
          courrier: courrier.id,
          type_partage: type,
          destinataire: destinataire.trim(),
          message: message.trim() || `Partage du courrier ${courrier.numero_registre}`,
        };

        await partageService.createPartage(partageData);

        // Ouvrir WhatsApp avec le message pré-rempli
        const whatsappLink = partageService.generateWhatsAppLink(
          destinataire,
          message || `Partage du courrier ${courrier.numero_registre} : ${courrier.objet}`,
          courrier.fichier
        );
        window.open(whatsappLink, "_blank");

        toast({
          title: "Partage enregistré",
          description: "Le courrier a été partagé par WhatsApp",
        });

        // Réinitialiser et fermer
        setDestinataire("");
        setMessage("");
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error("Erreur lors du partage:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de partager le courrier",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Partager le courrier
          </DialogTitle>
          <DialogDescription>
            {courrier.numero_registre} - {courrier.objet}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Choix du type de partage */}
          <div className="space-y-2">
            <Label>Méthode de partage</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("email")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  type === "email"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Mail className="h-5 w-5" />
                <span className="font-medium">Email</span>
              </button>

              <button
                type="button"
                onClick={() => setType("whatsapp")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  type === "whatsapp"
                    ? "border-green-600 bg-green-50 text-green-600"
                    : "border-border hover:border-green-600/50"
                }`}
              >
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Destinataire */}
          <div className="space-y-2">
            <Label htmlFor="destinataire">
              {type === "email" ? "Adresse email" : "Numéro de téléphone"}
            </Label>
            <Input
              id="destinataire"
              type={type === "email" ? "email" : "tel"}
              placeholder={
                type === "email"
                  ? "exemple@email.com"
                  : "+221 77 123 45 67"
              }
              value={destinataire}
              onChange={(e) => setDestinataire(e.target.value)}
            />
            {type === "whatsapp" && (
              <p className="text-xs text-muted-foreground">
                Format international recommandé (ex: +221771234567)
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optionnel)</Label>
            <Textarea
              id="message"
              placeholder="Ajouter un message d'accompagnement..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Info */}
          {/* <div className="bg-muted/30 p-3 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              📌 <strong>Note :</strong>{" "}
              {type === "email" 
                ? "L'email sera envoyé directement avec le fichier en pièce jointe." 
                : "Le partage ouvrira WhatsApp avec le message pré-rempli."
              }
              {" "}Le partage sera enregistré dans l'historique.
            </p>
          </div> */}

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button onClick={handleShare} disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Partage..." : `Partager par ${type === "email" ? "Email" : "WhatsApp"}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
