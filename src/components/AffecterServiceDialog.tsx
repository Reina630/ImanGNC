import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import courrierService from "@/services/courrierService";
import circuitAffectationService from "@/services/circuitAffectationService";
import serviceService, { type Service } from "@/services/serviceService";
import { useToast } from "@/hooks/use-toast";
import type { Courrier } from "@/types";
import { Mail, Send, Bell, Building2, Calendar, AlertCircle, FileText, Edit3, Inbox, CheckSquare, X } from "lucide-react";

interface AffectationEditData {
  id: number;
  service?: number | null;
  action_requise?: string;
  niveau_urgence?: string;
  date_echeance?: string | null;
  note_instruction?: string;
}

interface AffecterServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrier: Courrier | null;
  onSuccess?: () => void;
  mode?: 'affecter' | 'reaffecter';
  affectationId?: number;
  affectationToEdit?: AffectationEditData;  // Si fourni → mode édition
}

export function AffecterServiceDialog({ 
  open, 
  onOpenChange, 
  courrier, 
  onSuccess,
  mode = 'affecter',
  affectationId,
  affectationToEdit,
}: AffecterServiceDialogProps) {
  const isEditMode = !!affectationToEdit;
  const { toast } = useToast();
  const [modeAffectation, setModeAffectation] = useState<"email" | "plateforme">("plateforme");
  const [serviceId, setServiceId] = useState<string>(""); // Sélection unique pour affecter et réaffecter
  const [email, setEmail] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [niveauUrgence, setNiveauUrgence] = useState<string>("normal");
  const [dateEcheance, setDateEcheance] = useState<string>("");
  const [actionRequise, setActionRequise] = useState<string>("informatif");
  const [noteInstruction, setNoteInstruction] = useState<string>("");
  
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

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (open && affectationToEdit) {
      if (affectationToEdit.service) {
        setServiceId(affectationToEdit.service.toString());
      }
      if (affectationToEdit.action_requise) setActionRequise(affectationToEdit.action_requise);
      if (affectationToEdit.niveau_urgence) setNiveauUrgence(affectationToEdit.niveau_urgence);
      if (affectationToEdit.note_instruction) setNoteInstruction(affectationToEdit.note_instruction);
      if (affectationToEdit.date_echeance) {
        // Convertir ISO → datetime-local (YYYY-MM-DDTHH:MM)
        const d = new Date(affectationToEdit.date_echeance);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        setDateEcheance(local.toISOString().slice(0, 16));
      } else {
        setDateEcheance("");
      }
    }
  }, [open, affectationToEdit]);

  const handleAffecter = async () => {
    if (!courrier) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Aucun courrier sélectionné." 
      });
      return;
    }

    // Validation
    if (!serviceId) {
      toast({
        variant: "destructive",
        title: "Service requis",
        description: "Veuillez sélectionner un service",
      });
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && affectationToEdit) {
        // Mode édition : PATCH sur l'affectation existante
        await circuitAffectationService.updateAffectation(affectationToEdit.id, {
          service: parseInt(serviceId),
          action_requise: actionRequise,
          niveau_urgence: niveauUrgence,
          date_echeance: dateEcheance || null,
          note_instruction: noteInstruction || undefined,
        });
        toast({
          title: "✓ Affectation modifiée",
          description: "Les modifications ont été enregistrées.",
        });
      } else {
        // Mode création : créer une nouvelle affectation
        await courrierService.affecterServicePlateforme(
          courrier.id, 
          parseInt(serviceId),
          noteInstruction || undefined,
          niveauUrgence,
          dateEcheance || undefined,
          actionRequise
        );
        
        const serviceName = services.find(s => s.id.toString() === serviceId)?.nom;
        toast({
          title: "✓ Affectation réussie",
          description: `Courrier ${courrier.numero_registre} affecté à : ${serviceName}`,
        });
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        setServiceId("");
        setEmail("");
        setMessage(defaultMessage);
        setNiveauUrgence("normal");
        setDateEcheance("");
        setActionRequise("informatif");
        setNoteInstruction("");
        onSuccess && onSuccess();
      }, 1800);
    } catch (error: any) {
      console.error("Erreur lors de l'affectation:", error);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.response?.data?.error || `Impossible d'${mode === 'reaffecter' ? 'réaffecter' : 'affecter'} le courrier.`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 rounded-lg shadow-lg"
            >
              <svg className="mx-auto mb-3" width="56" height="56" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#22c55e" opacity="0.15"/><path d="M7 13l3 3 7-7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div className="text-xl font-bold text-green-600 mb-1">
                {mode === 'reaffecter' 
                  ? 'Réaffectation réussie !' 
                  : 'Affectation réussie !'}
              </div>
              <div className="text-sm text-muted-foreground text-center">
                {mode === 'reaffecter' 
                  ? 'Le courrier a été réaffecté avec succès.'
                  : 'Le courrier a été affecté avec succès.'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            {isEditMode ? 'Modifier l\'affectation' : 'Affecter à un service'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditMode
              ? 'Modifiez les paramètres de cette affectation'
              : 'Sélectionnez un service pour affecter le courrier'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode d'affectation — toggle compact */}
          <div className="flex rounded-lg border overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setModeAffectation("plateforme")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 transition-colors ${
                modeAffectation === "plateforme"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              Via la plateforme
            </button>
            <button
              type="button"
              onClick={() => setModeAffectation("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border-l transition-colors ${
                modeAffectation === "email"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              Par email
            </button>
          </div>

          {/* Service (commun aux deux modes) */}
          <div className="space-y-1.5">
            <Label htmlFor="service" className="text-sm font-medium">
              Service <span className="text-red-500">*</span>
            </Label>
            <Select value={serviceId} onValueChange={setServiceId} disabled={loadingServices}>
              <SelectTrigger id="service" className="h-9">
                <SelectValue placeholder={loadingServices ? "Chargement..." : "Sélectionnez un service"} />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{service.nom}</span>
                      <span className="text-xs text-muted-foreground">
                        ({service.nombre_utilisateurs || 0})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plateforme only: urgence + date sur une ligne, puis action requise */}
          {modeAffectation === "plateforme" && (
            <>
              {/* Urgence + Date côte à côte */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="niveau-urgence" className="text-sm font-medium flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Urgence <span className="text-red-500">*</span>
                  </Label>
                  <Select value={niveauUrgence} onValueChange={setNiveauUrgence}>
                    <SelectTrigger id="niveau-urgence" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faible">
                        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /><span>Faible</span></div>
                      </SelectItem>
                      <SelectItem value="normal">
                        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500" /><span>Normal</span></div>
                      </SelectItem>
                      <SelectItem value="eleve">
                        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-orange-500" /><span>Élevé</span></div>
                      </SelectItem>
                      <SelectItem value="critique">
                        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500" /><span>Critique</span></div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date-echeance" className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Échéance
                    <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                  </Label>
                  <Input
                    id="date-echeance"
                    type="datetime-local"
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Action requise — chips horizontaux */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" />
                  Action requise <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: 'informatif', label: 'À titre informatif', icon: FileText, active: 'bg-slate-100 border-slate-400 text-slate-700' },
                    { value: 'a_signer', label: 'À signer', icon: Edit3, active: 'bg-blue-50 border-blue-400 text-blue-700' },
                    { value: 'accusation_reception', label: 'Accuser réception', icon: Inbox, active: 'bg-green-50 border-green-400 text-green-700' },
                    { value: 'a_repondre', label: 'À répondre', icon: Send, active: 'bg-orange-50 border-orange-400 text-orange-700' },
                  ].map(({ value, label, icon: Icon, active }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActionRequise(value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all ${
                        actionRequise === value ? `${active} border font-medium` : 'border-border hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note d'instruction (optionnelle) */}
              <div className="space-y-1.5">
                <Label htmlFor="note-instruction" className="text-sm font-medium">
                  Note d'instruction
                  <span className="text-xs text-muted-foreground font-normal ml-1">(optionnel)</span>
                </Label>
                <Textarea
                  id="note-instruction"
                  value={noteInstruction}
                  onChange={(e) => setNoteInstruction(e.target.value)}
                  placeholder="Instructions supplémentaires pour le destinataire..."
                  className="resize-none text-sm"
                  rows={2}
                />
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
            disabled={loading || !serviceId}
          >
            {modeAffectation === "plateforme" ? (
              <>
                <Bell className="h-4 w-4 mr-2" />
                {loading 
                  ? (isEditMode ? "Modification en cours..." : "Affectation en cours...") 
                  : (isEditMode ? "Enregistrer les modifications" : "Affecter via la plateforme")
                }
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {loading 
                  ? "Envoi en cours..." 
                  : (isEditMode ? "Modifier et envoyer par email" : "Affecter et envoyer par email")
                }
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
