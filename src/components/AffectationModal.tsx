/**
 * Modal d'affectation de courrier - Affectation simple ou personnalisée
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  GitBranch,
  CheckCircle2,
  Eye,
  FileText,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import circuitAffectationService from "@/services/circuitAffectationService";
import serviceService, { type Service } from "@/services/serviceService";

interface AffectationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrierId: number;
  courrierNumero: string;
  courrierObjet: string;
  onSuccess?: () => void;
}

const ACTIONS_REQUISES = [
  { value: "informatif", label: "À titre informatif", icon: Eye, color: "text-blue-600" },
  { value: "a_valider", label: "À valider", icon: CheckCircle2, color: "text-green-600" },
  { value: "a_signer", label: "À signer", icon: FileText, color: "text-purple-600" },
  { value: "a_repondre", label: "À répondre", icon: ArrowRight, color: "text-orange-600" },
];

const NIVEAUX_URGENCE = [
  { value: "faible", label: "Faible", color: "bg-gray-100 text-gray-700 border-gray-300" },
  { value: "normal", label: "Normal", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "eleve", label: "Élevé", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "critique", label: "Critique", color: "bg-red-100 text-red-700 border-red-300" },
];

export function AffectationModal({
  open,
  onOpenChange,
  courrierId,
  courrierNumero,
  courrierObjet,
  onSuccess,
}: AffectationModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [etape, setEtape] = useState<"choix" | "simple" | "personnalisee">("choix");
  const [service, setService] = useState("");
  const [actionRequise, setActionRequise] = useState("informatif");
  const [niveauUrgence, setNiveauUrgence] = useState("normal");
  const [dateEcheance, setDateEcheance] = useState("");
  const [note, setNote] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  // Charger les services au montage
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
            title: "Erreur",
            description: "Impossible de charger la liste des services",
            variant: "destructive",
          });
        } finally {
          setLoadingServices(false);
        }
      }
    };
    
    loadServices();
  }, [open, toast]);

  const handleAffectationSimple = async () => {
    if (!service) {
      toast({
        title: "Service requis",
        description: "Veuillez sélectionner un service",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Créer un circuit simple avec une seule affectation
      await circuitAffectationService.createCircuit({
        courrier_id: courrierId,
        type_circuit: "simultane",
        affectations: [{
          service: parseInt(service),
          action_requise: actionRequise,
          niveau_urgence: niveauUrgence,
          etape_numero: 1,
          type_traitement: "parallele",
          date_echeance: dateEcheance || undefined,
          note: note || undefined,
        }],
      });

      const serviceName = services.find(s => s.id === parseInt(service))?.nom || "le service";
      
      toast({
        title: "✓ Affectation créée",
        description: `Courrier ${courrierNumero} affecté à ${serviceName}`,
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Réinitialiser le formulaire
      setEtape("choix");
      setService("");
      setActionRequise("informatif");
      setNiveauUrgence("normal");
      setDateEcheance("");
      setNote("");
    } catch (error: any) {
      console.error("Erreur lors de l'affectation:", error);
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de créer l'affectation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAffectationPersonnalisee = () => {
    // Naviguer vers la page d'affectation personnalisée
    navigate(`/courriers/affecter/${courrierId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Affecter le courrier</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{courrierNumero}</span> · {courrierObjet}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {etape === "choix" ? (
            <>
              {/* Choix du type d'affectation */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">Quel type d'affectation ?</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEtape("simple")}
                    className="p-4 rounded-lg border-2 border-slate-200 hover:border-[#800020] hover:bg-[#800020]/5 transition-all text-left group"
                  >
                    <Building2 className="h-6 w-6 mb-2 text-slate-600 group-hover:text-[#800020]" />
                    <div className="font-semibold text-sm text-slate-900">Affectation simple</div>
                    <div className="text-xs text-slate-500 mt-1">Un service, une action directe</div>
                  </button>

                  <button
                    onClick={() => setEtape("personnalisee")}
                    className="p-4 rounded-lg border-2 border-slate-200 hover:border-[#800020] hover:bg-[#800020]/5 transition-all text-left group"
                  >
                    <GitBranch className="h-6 w-6 mb-2 text-slate-600 group-hover:text-[#800020]" />
                    <div className="font-semibold text-sm text-slate-900">Circuit personnalisé</div>
                    <div className="text-xs text-slate-500 mt-1">Multi-services, workflow avancé</div>
                  </button>
                </div>
              </div>
            </>
          ) : etape === "simple" ? (
            <>
              {/* Affectation simple */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                {/* Service */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Service *</Label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#800020] outline-none"
                    disabled={loadingServices}
                  >
                    <option value="">Sélectionner un service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action requise */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Action requise</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACTIONS_REQUISES.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.value}
                          onClick={() => setActionRequise(action.value)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            actionRequise === action.value
                              ? "border-[#800020] bg-[#800020]/5"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <Icon className={`h-4 w-4 mb-1 ${action.color}`} />
                          <div className="text-xs font-medium text-slate-900">{action.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Niveau d'urgence */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Niveau d'urgence</Label>
                  <div className="flex gap-2">
                    {NIVEAUX_URGENCE.map((niveau) => (
                      <button
                        key={niveau.value}
                        onClick={() => setNiveauUrgence(niveau.value)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          niveauUrgence === niveau.value
                            ? niveau.color + " border-2"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {niveau.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date d'échéance */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date d'échéance (optionnel)
                  </Label>
                  <input
                    type="date"
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#800020] outline-none"
                  />
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Note (optionnel)</Label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Instructions pour le destinataire..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#800020] outline-none resize-none text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between gap-3 pt-2">
                <Button variant="outline" onClick={() => setEtape("choix")}>
                  Retour
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAffectationSimple}
                    className="bg-[#800020] hover:bg-[#600018] text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Affectation...
                      </>
                    ) : (
                      "Affecter"
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Circuit personnalisé - Info */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#800020]/10 shrink-0">
                    <GitBranch className="h-6 w-6 text-[#800020]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">Circuit de validation avancé</h3>
                    <p className="text-sm text-slate-600">
                      Créez un circuit personnalisé avec plusieurs services, étapes parallèles ou
                      séquentielles, et actions spécifiques.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Affecter à plusieurs services simultanément</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Définir des étapes séquentielles avec prérequis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Actions et échéances personnalisées par étape</span>
                  </div>
                </div>

                <div className="flex justify-between gap-3">
                  <Button variant="outline" onClick={() => setEtape("choix")}>
                    Retour
                  </Button>
                  <Button
                    onClick={handleAffectationPersonnalisee}
                    className="bg-[#800020] hover:bg-[#600018] text-white gap-2"
                  >
                    <GitBranch className="h-4 w-4" />
                    Ouvrir l'éditeur
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
