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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import courrierService from "@/services/courrierService";
import serviceService, { type Service } from "@/services/serviceService";
import { useToast } from "@/hooks/use-toast";
import type { Courrier } from "@/types";
import { Mail, Send, Users, Bell, Building2 } from "lucide-react";

interface AffecterServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrier: Courrier | null;
  onSuccess?: () => void;
}

export function AffecterServiceDialog({ open, onOpenChange, courrier, onSuccess }: AffecterServiceDialogProps) {
  const { toast } = useToast();
  const [modeAffectation, setModeAffectation] = useState<"email" | "plateforme">("plateforme");
  const [serviceId, setServiceId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Message pré-rempli simple (les détails du courrier sont ajoutés automatiquement par le système)
  const defaultMessage = courrier ? `Bonjour,

Vous êtes destinataire de ce courrier pour traitement par votre service.

Merci de prendre les dispositions nécessaires.

Cordialement.` : "";
  
  const [message, setMessage] = useState<string>(defaultMessage);

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

  // Charger les services quand le dialog s'ouvre
  useEffect(() => {
    const loadServices = async () => {
      if (open) {
        setLoadingServices(true);
        try {
          const data = await serviceService.getServices();
          setServices(data);
        } catch (error) {
          console.error("Erreur lors du chargement des services:", error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de charger la liste des services.",
          });
        } finally {
          setLoadingServices(false);
        }
      }
    };
    
    loadServices();
  }, [open, toast]);

  // Réinitialiser le message quand le courrier change
  useEffect(() => {
    if (courrier && open) {
      setMessage(defaultMessage);
    }
  }, [courrier, open, defaultMessage]);

  const handleAffecter = async () => {
    if (!courrier) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Aucun courrier sélectionné." 
      });
      return;
    }

    // Validation selon le mode
    if (modeAffectation === "email") {
      if (!serviceId || !email) {
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
    } else {
      // Mode plateforme
      if (!serviceId) {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: "Veuillez sélectionner un service." 
        });
        return;
      }
    }
    
    setLoading(true);
    try {
      if (modeAffectation === "email") {
        // Trouver le service sélectionné et convertir son nom en code
        const selectedService = services.find(s => s.id.toString() === serviceId);
        const serviceCode = selectedService ? getServiceCode(selectedService.nom) : 'autre';
        
        // Affectation par email
        await courrierService.affecterServiceParEmail(courrier.id, serviceCode, email, message);
        toast({ 
          title: "Affectation réussie", 
          description: `Le courrier a été affecté au service et un email a été envoyé à ${email}.` 
        });
      } else {
        // Affectation via la plateforme (nouveau)
        const result = await courrierService.affecterServicePlateforme(courrier.id, parseInt(serviceId));
        const service = services.find(s => s.id === parseInt(serviceId));
        toast({ 
          title: "Affectation réussie", 
          description: `Le courrier a été affecté à ${result.nombre_affectations} utilisateur(s) du service ${service?.nom} via la plateforme.` 
        });
      }
      
      onOpenChange(false);
      setServiceCode("");
      setEmail("");
      setServiceId("");
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
            Choisissez le mode d'affectation : par email ou via la plateforme.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Choix du mode d'affectation */}
          <div className="space-y-3">
            <Label className="font-medium">Mode d'affectation</Label>
            <RadioGroup value={modeAffectation} onValueChange={(value) => setModeAffectation(value as "email" | "plateforme")}>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50 cursor-pointer">
                <RadioGroupItem value="plateforme" id="plateforme" />
                <Label htmlFor="plateforme" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">Via la plateforme</p>
                      <p className="text-xs text-muted-foreground">L'utilisateur recevra une notification et verra le courrier dans "Mes Courriers"</p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50 cursor-pointer">
                <RadioGroupItem value="email" id="email-mode" />
                <Label htmlFor="email-mode" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">Par email</p>
                      <p className="text-xs text-muted-foreground">Envoyer le courrier par email avec le document en pièce jointe</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mode Plateforme */}
          {modeAffectation === "plateforme" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="service" className="font-medium">
                  Service <span className="text-red-500">*</span>
                </Label>
                <Select value={serviceId} onValueChange={setServiceId} disabled={loadingServices}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder={loadingServices ? "Chargement..." : "Sélectionnez un service"} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{service.nom}</span>
                          <span className="text-xs text-muted-foreground">
                            ({service.nombre_utilisateurs || 0} utilisateur{(service.nombre_utilisateurs || 0) > 1 ? 's' : ''})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tous les utilisateurs du service verront ce courrier dans leur page "Mes Courriers" et pourront le traiter.
                </p>
              </div>
            </>
          )}

          {/* Mode Email */}
          {modeAffectation === "email" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="service-email" className="font-medium">
                  Service concerné <span className="text-red-500">*</span>
                </Label>
                <Select value={serviceId} onValueChange={setServiceId} disabled={loadingServices}>
                  <SelectTrigger id="service-email">
                    <SelectValue placeholder={loadingServices ? "Chargement..." : "Sélectionnez un service"} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{service.nom}</span>
                        </div>
                      </SelectItem>
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
                <Label htmlFor="message-email" className="font-medium">
                  Message
                </Label>
                <Textarea
                  id="message-email"
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
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleAffecter} 
            disabled={
              loading || 
              (modeAffectation === "email" && (!serviceId || !email)) ||
              (modeAffectation === "plateforme" && !serviceId)
            }
          >
            {modeAffectation === "plateforme" ? (
              <>
                <Bell className="h-4 w-4 mr-2" />
                {loading ? "Affectation en cours..." : "Affecter via la plateforme"}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Envoi en cours..." : "Affecter et envoyer"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
