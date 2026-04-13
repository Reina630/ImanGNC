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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services";
import { Calendar, AlertCircle, CheckSquare, FileText, Edit3, Inbox, Send } from "lucide-react";

interface ModifierInfosAffectationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectation: {
    id: number;
    action_requise: string;
    niveau_urgence: string;
    date_echeance: string | null;
  } | null;
  courrierNumero?: string;
  onSuccess?: () => void;
}

export function ModifierInfosAffectationDialog({
  open,
  onOpenChange,
  affectation,
  courrierNumero,
  onSuccess,
}: ModifierInfosAffectationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [niveauUrgence, setNiveauUrgence] = useState<string>("normal");
  const [dateEcheance, setDateEcheance] = useState<string>("");
  const [actionRequise, setActionRequise] = useState<string>("informatif");

  // Charger les valeurs initiales quand l'affectation change
  useEffect(() => {
    if (affectation && open) {
      setNiveauUrgence(affectation.niveau_urgence || "normal");
      setDateEcheance(affectation.date_echeance || "");
      setActionRequise(affectation.action_requise || "informatif");
    }
  }, [affectation, open]);

  const handleSubmit = async () => {
    if (!affectation) return;

    setLoading(true);
    try {
      await api.patch(`/affectations/affectations/${affectation.id}/`, {
        niveau_urgence: niveauUrgence,
        date_echeance: dateEcheance || null,
        action_requise: actionRequise,
      });

      toast({
        title: "✓ Modification réussie",
        description: "Les informations de l'affectation ont été mises à jour",
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        onSuccess && onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("Erreur lors de la modification:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error.response?.data?.error ||
          "Impossible de modifier les informations de l'affectation.",
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
              <svg
                className="mx-auto mb-3"
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="12" cy="12" r="10" fill="#22c55e" opacity="0.15" />
                <path
                  d="M7 13l3 3 7-7"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-xl font-bold text-green-600 mb-1">
                Modification réussie !
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Les informations ont été mises à jour avec succès.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Edit3 className="h-4 w-4" />
            Modifier les informations de l'affectation
          </DialogTitle>
          {courrierNumero && (
            <DialogDescription className="text-xs text-muted-foreground">
              Courrier : {courrierNumero}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Urgence + Date côte à côte */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="niveau-urgence" className="text-sm font-medium flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Niveau d'urgence <span className="text-red-500">*</span>
              </Label>
              <Select value={niveauUrgence} onValueChange={setNiveauUrgence}>
                <SelectTrigger id="niveau-urgence" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="faible">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Faible</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Normal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="eleve">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span>Élevé</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="critique">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Critique</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date-echeance" className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Date d'échéance
              </Label>
              <Input
                id="date-echeance"
                type="datetime-local"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
                min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)}
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
                {
                  value: "informatif",
                  label: "À titre informatif",
                  icon: FileText,
                  active: "bg-slate-100 border-slate-400 text-slate-700",
                },
                {
                  value: "a_signer",
                  label: "À signer",
                  icon: Edit3,
                  active: "bg-blue-50 border-blue-400 text-blue-700",
                },
                {
                  value: "accusation_reception",
                  label: "Accuser réception",
                  icon: Inbox,
                  active: "bg-green-50 border-green-400 text-green-700",
                },
                {
                  value: "a_repondre",
                  label: "À répondre",
                  icon: Send,
                  active: "bg-orange-50 border-orange-400 text-orange-700",
                },
              ].map(({ value, label, icon: Icon, active }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActionRequise(value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all ${
                    actionRequise === value
                      ? `${active} border font-medium`
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Modification en cours..." : "Enregistrer les modifications"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
