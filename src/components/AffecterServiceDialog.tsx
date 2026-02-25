import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_CHOICES } from "@/types";
import courrierService from "@/services/courrierService";
import { useToast } from "@/hooks/use-toast";
import type { Courrier } from "@/types";
import { Mail, Send } from "lucide-react";

interface AffecterServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrier: Courrier | null;
  onSuccess?: () => void;
}

export function AffecterServiceDialog({ open, onOpenChange, courrier, onSuccess }: AffecterServiceDialogProps) {
  const { toast } = useToast();
  const [service, setService] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Message pré-rempli simple (les détails du courrier sont ajoutés automatiquement par le système)
  const defaultMessage = courrier ? `Bonjour,

Vous êtes destinataire de ce courrier pour traitement par votre service.

Merci de prendre les dispositions nécessaires.

Cordialement.` : "";
  
  const [message, setMessage] = useState<string>(defaultMessage);

  // Réinitialiser le message quand le courrier change
  useEffect(() => {
    if (courrier && open) {
      setMessage(defaultMessage);
    }
  }, [courrier, open, defaultMessage]);

  const handleAffecter = async () => {
    if (!courrier || !service || !email) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Veuillez remplir tous les champs obligatoires." 
      });
      return;
    }
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Veuillez saisir une adresse email valide." 
      });
      return;
    }
    
    setLoading(true);
    try {
      await courrierService.affecterService(courrier.id, service, email, message);
      toast({ 
        title: "Affectation réussie", 
        description: `Le courrier a été affecté au service et un email a été envoyé à ${email}.` 
      });
      onOpenChange(false);
      setService("");
      setEmail("");
      setMessage(defaultMessage);
      onSuccess && onSuccess();
    } catch (error: any) {
      console.error("Erreur lors de l'affectation:", error);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.response?.data?.error || "Impossible d'affecter le courrier." 
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
            <Mail className="h-5 w-5" />
            Affecter à un service
          </DialogTitle>
          <DialogDescription>
            Le courrier sera affecté au service sélectionné et un email contenant le document sera automatiquement envoyé au destinataire.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="service" className="font-medium">
              Service concerné <span className="text-red-500">*</span>
            </Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger id="service">
                <SelectValue placeholder="Sélectionnez un service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CHOICES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-medium">
              Email du destinataire <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              L'email recevra le document en pièce jointe avec toutes les informations du courrier.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Message à envoyer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              disabled={loading}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Les informations du courrier (numéro, type, objet, dates, etc.) seront automatiquement ajoutées dans l'email.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleAffecter} disabled={!service || !email || loading}>
            <Send className="h-4 w-4 mr-2" />
            {loading ? "Envoi en cours..." : "Affecter et envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
