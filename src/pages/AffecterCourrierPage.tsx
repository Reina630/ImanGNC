/**
 * Éditeur de circuit d'affectation personnalisé
 * Page accessible depuis le modal d'affectation pour créer des circuits complexes
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import affectationService from "@/services/affectationService";
import serviceService, { type Service } from "@/services/serviceService";
import userService from "@/services/userService";
import courrierService from "@/services/courrierService";
import type { Courrier, User, CircuitCreateData, CircuitV2, AffectationV2 } from "@/types";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Zap,
  FileText,
  Info,
  GitBranch,
  GitMerge,
  Save,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

// Types
interface Affectation {
  id: string;
  service: number; // ID du service (OBLIGATOIRE)
  service_nom?: string;
  destinataire?: number; // ID de l'utilisateur (optionnel, si absent = tous les users du service)
  destinataire_username?: string;
  action_requise: string;
  niveau_urgence: string;
  etape_numero: number;
  date_echeance?: string;
  note_instruction?: string;
  metadata?: Record<string, any>;
}

// Données du courrier (chargé depuis l'API)

const ACTIONS = [
  { value: "informatif", label: "Informatif", icon: Info, color: "text-blue-600" },
  { value: "a_valider", label: "À valider", icon: CheckCircle2, color: "text-green-600" },
  { value: "a_signer", label: "À signer", icon: FileText, color: "text-purple-600" },
  { value: "a_repondre", label: "À répondre", icon: ArrowRight, color: "text-orange-600" },
  { value: "a_verifier", label: "À vérifier", icon: Eye, color: "text-cyan-600" },
];

const URGENCES = [
  { value: "faible", label: "Faible", badge: "bg-gray-400" },
  { value: "normal", label: "Normal", badge: "bg-blue-500" },
  { value: "eleve", label: "Élevé", badge: "bg-orange-500" },
  { value: "critique", label: "Critique", badge: "bg-red-500" },
];

// Icônes pour les services (fallback si pas d'emoji dans la DB)
const SERVICE_ICONS: Record<string, { icon: string; color: string }> = {
  "Ressources Humaines": { icon: "👥", color: "bg-blue-50" },
  "Comptabilité": { icon: "💰", color: "bg-green-50" },
  "Direction": { icon: "🎯", color: "bg-purple-50" },
  "Service Technique": { icon: "🔧", color: "bg-orange-50" },
  "Commercial": { icon: "💼", color: "bg-cyan-50" },
  "Juridique": { icon: "⚖️", color: "bg-amber-50" },
  "Informatique": { icon: "💻", color: "bg-indigo-50" },
  "Logistique": { icon: "📦", color: "bg-pink-50" },
  "Autre": { icon: "📋", color: "bg-slate-50" },
};

export default function AffecterCourrierPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const modeEdit = searchParams.get('mode') === 'edit';
  const { toast } = useToast();

  const [modeSequentiel, setModeSequentiel] = useState(false);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [affectationsExistantes, setAffectationsExistantes] = useState<AffectationV2[]>([]);
  const [circuitExistant, setCircuitExistant] = useState<CircuitV2 | null>(null);
  const [isLoadingCircuit, setIsLoadingCircuit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [courrier, setCourrier] = useState<Courrier | null>(null);
  const [isLoadingCourrier, setIsLoadingCourrier] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [showAddForm, setShowAddForm] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]); // IDs des utilisateurs cochés
  const [nouvelleAff, setNouvelleAff] = useState<Partial<Affectation>>({
    service: undefined,
    destinataire: undefined,
    action_requise: "informatif",
    niveau_urgence: "normal",
    etape_numero: 1,
  });

  // Charger le courrier au montage du composant
  useEffect(() => {
    const fetchCourrier = async () => {
      if (!id) {
        toast({
          title: "Erreur",
          description: "ID de courrier manquant",
          variant: "destructive",
        });
        navigate(-1);
        return;
      }

      try {
        const data = await courrierService.getCourrier(Number(id));
        setCourrier(data);
      } catch (error) {
        console.error("Erreur lors du chargement du courrier:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le courrier",
          variant: "destructive",
        });
        navigate(-1);
      } finally {
        setIsLoadingCourrier(false);
      }
    };

    fetchCourrier();
  }, [id, toast, navigate]);

  // Charger le circuit existant si mode edit
  useEffect(() => {
    if (!modeEdit || !id) return;
    const fetchCircuit = async () => {
      setIsLoadingCircuit(true);
      try {
        const circuit = await affectationService.getCircuitByCourrier(Number(id));
        if (circuit) {
          setCircuitExistant(circuit);
          setAffectationsExistantes(circuit.affectations || []);
          setModeSequentiel(circuit.type_circuit === 'sequentiel');
        }
      } catch (error) {
        console.error('Erreur chargement circuit:', error);
      } finally {
        setIsLoadingCircuit(false);
      }
    };
    fetchCircuit();
  }, [modeEdit, id]);

  // Charger les services et utilisateurs au montage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, usersData] = await Promise.all([
          serviceService.getServices(),
          userService.getUsers(),
        ]);
        setServices(servicesData);
        setUsers(usersData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive",
        });
      } finally {
        setIsLoadingServices(false);
        setIsLoadingUsers(false);
      }
    };

    fetchData();
  }, [toast]);

  const ajouterAffectation = () => {
    if (!nouvelleAff.service) {
      toast({ title: "Service requis", variant: "destructive" });
      return;
    }

    const service = services.find(s => s.id === nouvelleAff.service);
    const nouvelles: Affectation[] = [];

    if (selectedUsers.length === 0) {
      // Aucun utilisateur sélectionné → affectation pour tout le service
      nouvelles.push({
        id: `aff-${Date.now()}`,
        service: nouvelleAff.service!,
        service_nom: service?.nom,
        destinataire: undefined,
        destinataire_username: undefined,
        action_requise: nouvelleAff.action_requise || "informatif",
        niveau_urgence: nouvelleAff.niveau_urgence || "normal",
        etape_numero: nouvelleAff.etape_numero || 1,
        note_instruction: nouvelleAff.note_instruction,
        date_echeance: nouvelleAff.date_echeance,
      });
    } else {
      // Créer une affectation pour chaque utilisateur coché
      selectedUsers.forEach((userId, index) => {
        const user = users.find(u => u.id === userId);
        nouvelles.push({
          id: `aff-${Date.now()}-${index}`,
          service: nouvelleAff.service!,
          service_nom: service?.nom,
          destinataire: userId,
          destinataire_username: user?.username,
          action_requise: nouvelleAff.action_requise || "informatif",
          niveau_urgence: nouvelleAff.niveau_urgence || "normal",
          etape_numero: nouvelleAff.etape_numero || 1,
          note_instruction: nouvelleAff.note_instruction,
          date_echeance: nouvelleAff.date_echeance,
        });
      });
    }

    setAffectations([...affectations, ...nouvelles]);
    setNouvelleAff({
      service: undefined,
      destinataire: undefined,
      action_requise: "informatif",
      niveau_urgence: "normal",
      etape_numero: Math.max(...affectations.map((a) => a.etape_numero), 0) + 1,
    });
    setSelectedUsers([]);

    const message = selectedUsers.length === 0
      ? `✓ Affectation ajoutée pour tout le service ${service?.nom}`
      : `✓ ${nouvelles.length} affectation(s) ajoutée(s)`;
    toast({ title: message });
  };

  const supprimerAffectation = (id: string) => {
    setAffectations(affectations.filter((a) => a.id !== id));
    toast({ title: "Supprimée", variant: "destructive" });
  };

  const enregistrerCircuit = async () => {
    if (affectations.length === 0) {
      toast({
        title: "Erreur",
        description: "Ajoutez au moins une affectation avant d'enregistrer",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (modeEdit && circuitExistant) {
        // Mode édition : ajouter les nouvelles affectations au circuit existant
        await affectationService.ajouterAffectations(
          circuitExistant.id!,
          affectations.map((aff) => ({
            service: aff.service,
            destinataire: aff.destinataire,
            action_requise: aff.action_requise,
            niveau_urgence: aff.niveau_urgence,
            etape_numero: aff.etape_numero,
            date_echeance: aff.date_echeance,
            note_instruction: aff.note_instruction,
          }))
        );
        toast({
          title: "✓ Affectations ajoutées",
          description: `${affectations.length} affectation(s) ajoutée(s) au circuit existant`,
        });
      } else {
        // Mode création : créer un nouveau circuit
        const circuitData: CircuitCreateData = {
          courrier: Number(id),
          type_circuit: modeSequentiel ? "sequentiel" : "simultane",
          affectations: affectations.map((aff) => ({
            service: aff.service,
            destinataire: aff.destinataire,
            action_requise: aff.action_requise,
            niveau_urgence: aff.niveau_urgence,
            etape_numero: aff.etape_numero,
            date_echeance: aff.date_echeance,
            note_instruction: aff.note_instruction,
          })),
        };
        await affectationService.createCircuit(circuitData);
        toast({
          title: "✓ Circuit enregistré",
          description: `${affectations.length} affectation(s) créée(s) avec succès`,
        });
      }

      setTimeout(() => navigate(-1), 800);
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast({
        title: "Erreur",
        description: error.response?.data?.error || error.response?.data?.detail || "Impossible d'enregistrer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const grouperParEtape = () => {
    const etapes = new Map<number, Affectation[]>();
    affectations.forEach((aff) => {
      if (!etapes.has(aff.etape_numero)) {
        etapes.set(aff.etape_numero, []);
      }
      etapes.get(aff.etape_numero)!.push(aff);
    });
    return Array.from(etapes.entries()).sort((a, b) => a[0] - b[0]);
  };

  const getService = (id: number) => services.find((s) => s.id === id);
  const getServiceIcon = (nom: string) => SERVICE_ICONS[nom] || { icon: "📋", color: "bg-slate-50" };
  const getAction = (value: string) => ACTIONS.find((a) => a.value === value);
  const getUrgence = (value: string) => URGENCES.find((u) => u.value === value);

  // Afficher un indicateur de chargement si le courrier ou le circuit n'est pas encore chargé
  if (isLoadingCourrier || !courrier || (modeEdit && isLoadingCircuit)) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#800020]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Header compact */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div className="h-5 w-px bg-slate-300" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {modeEdit ? "Modifier le circuit" : "Éditeur de circuit"}
              </h1>
              <p className="text-xs text-slate-500">
                {courrier.numero_registre} · {courrier.objet}
              </p>
              {modeEdit && (
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                  ✎ Ajout d'affectations au circuit existant
                </p>
              )}
            </div>
            {courrier.urgent && (
              <Badge className="bg-red-500 text-white text-[10px]">
                <Zap className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
          <Button
            onClick={enregistrerCircuit}
            disabled={isLoading || affectations.length === 0}
            className="bg-[#800020] hover:bg-[#600018] text-white gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {modeEdit ? "Ajouter les affectations" : "Enregistrer"}
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Toggle Mode Séquentiel */}
        <div className="mb-5">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {modeSequentiel ? (
                  <GitMerge className="h-5 w-5 text-[#800020]" />
                ) : (
                  <GitBranch className="h-5 w-5 text-slate-600" />
                )}
                <div>
                  <Label className="text-sm font-semibold text-slate-900 cursor-pointer" htmlFor="mode-sequentiel">
                    {modeSequentiel ? "Mode séquentiel" : "Mode simultané"}
                  </Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {modeSequentiel
                      ? "Les affectations se déroulent par étapes successives"
                      : "Tous les services sont notifiés en même temps"}
                  </p>
                </div>
              </div>
              <Switch
                id="mode-sequentiel"
                checked={modeSequentiel}
                onCheckedChange={setModeSequentiel}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Circuit (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Circuit de validation</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {affectations.length} affectation(s){modeSequentiel && ` · ${grouperParEtape().length} étape(s)`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="gap-1.5 h-8"
                >
                  {showAddForm ? (
                    <>
                      <X className="h-3.5 w-3.5" />
                      <span className="text-xs">Annuler</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-xs">Ajouter</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Affectations existantes (mode edit) - lecture seule */}
              {modeEdit && affectationsExistantes.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Affectations existantes ({affectationsExistantes.length})
                  </p>
                  <div className="space-y-2 opacity-60">
                    {affectationsExistantes.map((aff) => {
                      const serviceNom = (aff.service_detail as any)?.nom || 'Service inconnu';
                      const serviceIcon = getServiceIcon(serviceNom);
                      const action = getAction(aff.action_requise);
                      const urgence = getUrgence(aff.niveau_urgence);
                      const ActionIcon = action?.icon || Info;
                      const destinataireNom = (aff.destinataire_detail as any)?.nom_complet || (aff.destinataire_detail as any)?.username;
                      return (
                        <div
                          key={aff.id}
                          className={`relative p-3 rounded-lg border border-dashed border-slate-300 ${serviceIcon.color} select-none`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base leading-none">{serviceIcon.icon}</span>
                                <span className="text-sm font-semibold text-slate-700 truncate">{serviceNom}</span>
                                {urgence && (
                                  <Badge className={`${urgence.badge} text-white text-[10px] px-1.5 py-0 h-4 shrink-0`}>
                                    {urgence.label}
                                  </Badge>
                                )}
                                <Badge className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0 h-4 shrink-0">
                                  {aff.statut || 'distribué'}
                                </Badge>
                              </div>
                              {destinataireNom ? (
                                <p className="text-[10px] text-slate-500 mb-1">👤 {destinataireNom}</p>
                              ) : (
                                <p className="text-[10px] text-slate-500 mb-1 font-medium">👥 Tout le service</p>
                              )}
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <ActionIcon className={`h-3.5 w-3.5 ${action?.color} shrink-0`} />
                                <span className="truncate">{action?.label}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-dashed border-slate-300 mt-4 mb-2" />
                  <p className="text-xs font-semibold text-[#800020] uppercase tracking-wide mb-2">
                    Nouvelles affectations à ajouter
                  </p>
                </div>
              )}

              {/* Étapes */}
              <div className="space-y-5">
                {!modeSequentiel ? (
                  // Mode simultané : liste simple sans étapes
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {affectations.map((aff) => {
                        const service = getService(aff.service);
                        const serviceIcon = service ? getServiceIcon(service.nom) : { icon: "📋", color: "bg-slate-50" };
                        const user = aff.destinataire ? users.find(u => u.id === aff.destinataire) : null;
                        const action = getAction(aff.action_requise);
                        const urgence = getUrgence(aff.niveau_urgence);
                        const ActionIcon = action?.icon || Info;

                        return (
                          <motion.div
                            key={aff.id}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className={`group relative p-3 rounded-lg border border-slate-200 ${serviceIcon.color} hover:shadow-sm transition-all`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-base leading-none">{serviceIcon.icon}</span>
                                  <span className="text-sm font-semibold text-slate-900 truncate">
                                    {service?.nom || "Service inconnu"}
                                  </span>
                                  <Badge className={`${urgence?.badge} text-white text-[10px] px-1.5 py-0 h-4 shrink-0`}>
                                    {urgence?.label}
                                  </Badge>
                                </div>
                                {user ? (
                                  <p className="text-[10px] text-slate-500 mb-1">
                                    👤 {user.username}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-slate-500 mb-1 font-medium">
                                    👥 Tout le service
                                  </p>
                                )}
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <ActionIcon className={`h-3.5 w-3.5 ${action?.color} shrink-0`} />
                                  <span className="truncate">{action?.label}</span>
                                  {aff.date_echeance && (
                                    <>
                                      <span className="text-slate-400">·</span>
                                      <Clock className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{new Date(aff.date_echeance).toLocaleDateString("fr-FR")}</span>
                                    </>
                                  )}
                                </div>
                                {aff.note_instruction && (
                                  <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">
                                    "{aff.note_instruction}"
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => supprimerAffectation(aff.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0 shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  // Mode séquentiel : groupement par étapes
                  grouperParEtape().map(([etapeNum, affectationsEtape], index) => {
                    // En mode séquentiel, toutes les affectations d'une même étape sont parallèles
                    const Icon = affectationsEtape.length > 1 ? GitBranch : ArrowRight;

                    return (
                      <motion.div
                        key={etapeNum}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        {index > 0 && (
                          <div className="flex justify-center -mb-3.5 -mt-3.5">
                            <div className="w-px h-7 bg-gradient-to-b from-[#800020]/20 to-[#800020]/60" />
                          </div>
                        )}

                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#800020] text-white text-xs font-bold shrink-0">
                            {etapeNum}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">Étape {etapeNum}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              {affectationsEtape.length > 1 ? `${affectationsEtape.length} affectations parallèles` : "1 affectation"}
                            </p>
                          </div>
                        </div>

                        <div className="ml-9 space-y-2">
                        <AnimatePresence mode="popLayout">
                          {affectationsEtape.map((aff) => {
                            const service = getService(aff.service);
                            const serviceIcon = service ? getServiceIcon(service.nom) : { icon: "📋", color: "bg-slate-50" };
                            const user = aff.destinataire ? users.find(u => u.id === aff.destinataire) : null;
                            const action = getAction(aff.action_requise);
                            const urgence = getUrgence(aff.niveau_urgence);
                            const ActionIcon = action?.icon || Info;

                            return (
                              <motion.div
                                key={aff.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className={`group relative p-3 rounded-lg border border-slate-200 ${serviceIcon.color} hover:shadow-sm transition-all`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-base leading-none">{serviceIcon.icon}</span>
                                      <span className="text-sm font-semibold text-slate-900 truncate">
                                        {service?.nom || "Service inconnu"}
                                      </span>
                                      <Badge className={`${urgence?.badge} text-white text-[10px] px-1.5 py-0 h-4 shrink-0`}>
                                        {urgence?.label}
                                      </Badge>
                                    </div>
                                    {user ? (
                                      <p className="text-[10px] text-slate-500 mb-1">
                                        👤 {user.username} 
                                      </p>
                                    ) : (
                                      <p className="text-[10px] text-slate-500 mb-1 font-medium">
                                        👥 Tout le service
                                      </p>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                      <ActionIcon className={`h-3.5 w-3.5 ${action?.color} shrink-0`} />
                                      <span className="truncate">{action?.label}</span>
                                      {aff.date_echeance && (
                                        <>
                                          <span className="text-slate-400">·</span>
                                          <Clock className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{new Date(aff.date_echeance).toLocaleDateString("fr-FR")}</span>
                                        </>
                                      )}
                                    </div>
                                    {aff.note_instruction && (
                                      <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">
                                        "{aff.note_instruction}"
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => supprimerAffectation(aff.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0 shrink-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </motion.div>
                            );
                          })}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })
                )}

                {affectations.length === 0 && (
                  <div className="text-center py-10">
                    <GitBranch className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">Aucune affectation</p>
                    <p className="text-xs text-slate-400">Créez votre circuit de validation</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panneau latéral (1/3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-5">
              <AnimatePresence mode="wait">
                {showAddForm ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-white rounded-lg border border-slate-200 shadow-sm p-4"
                  >
                    <h3 className="text-sm font-bold text-slate-900 mb-3.5">Nouvelle affectation</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Service *</Label>
                        <select
                          value={nouvelleAff.service || ""}
                          onChange={(e) => {
                            const serviceId = e.target.value ? Number(e.target.value) : undefined;
                            setNouvelleAff({ ...nouvelleAff, service: serviceId, destinataire: undefined });
                            setSelectedUsers([]); // Reset sélection utilisateurs
                          }}
                          className="w-full p-2 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-[#800020] outline-none"
                          disabled={isLoadingServices}
                        >
                          <option value="">Sélectionner un service</option>
                          {services.map((s) => {
                            const serviceIcon = getServiceIcon(s.nom);
                            return (
                              <option key={s.id} value={s.id}>
                                {serviceIcon.icon} {s.nom}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs font-medium mb-1 block">
                          Utilisateurs spécifiques (optionnel)
                        </Label>
                        {!nouvelleAff.service ? (
                          <p className="text-xs text-slate-400 py-2">Sélectionnez d'abord un service</p>
                        ) : (
                          <div className="border border-slate-300 rounded p-2 max-h-40 overflow-y-auto">
                            {users.filter(u => u.service === nouvelleAff.service).length === 0 ? (
                              <p className="text-xs text-slate-400 py-2">Aucun utilisateur dans ce service</p>
                            ) : (
                              <div className="space-y-1.5">
                                {users
                                  .filter(u => u.service === nouvelleAff.service)
                                  .map((u) => (
                                    <label
                                      key={u.id}
                                      className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(u.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedUsers([...selectedUsers, u.id]);
                                          } else {
                                            setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                                          }
                                        }}
                                        className="w-4 h-4 text-[#800020] border-slate-300 rounded focus:ring-2 focus:ring-[#800020]"
                                      />
                                      <span className="text-xs text-slate-700">
                                        {u.username}
                                      </span>
                                    </label>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          {selectedUsers.length === 0
                            ? "Aucune sélection = tout le service"
                            : `${selectedUsers.length} utilisateur(s) sélectionné(s)`}
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs font-medium mb-1 block">Action</Label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {ACTIONS.map((action) => {
                            const Icon = action.icon;
                            return (
                              <button
                                key={action.value}
                                onClick={() => setNouvelleAff({ ...nouvelleAff, action_requise: action.value })}
                                className={`p-1.5 text-left rounded border text-[11px] transition-all ${
                                  nouvelleAff.action_requise === action.value
                                    ? "border-[#800020] bg-[#800020]/5"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <Icon className={`h-3 w-3 mb-0.5 ${action.color}`} />
                                <div className="font-medium truncate">{action.label}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-medium mb-1 block">Urgence</Label>
                        <div className="flex gap-1">
                          {URGENCES.map((u) => (
                            <button
                              key={u.value}
                              onClick={() => setNouvelleAff({ ...nouvelleAff, niveau_urgence: u.value })}
                              className={`flex-1 px-1.5 py-1 rounded text-[10px] font-bold transition-all ${
                                nouvelleAff.niveau_urgence === u.value
                                  ? u.badge + " text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {u.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {modeSequentiel && (
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Numéro d'étape *</Label>
                          <input
                            type="number"
                            min="1"
                            value={nouvelleAff.etape_numero}
                            onChange={(e) => setNouvelleAff({ ...nouvelleAff, etape_numero: parseInt(e.target.value) || 1 })}
                            className="w-full p-2 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-[#800020] outline-none"
                          />
                        </div>
                      )}

                      <div>
                        <Label className="text-xs font-medium mb-1 block">Échéance</Label>
                        <input
                          type="date"
                          value={nouvelleAff.date_echeance || ""}
                          onChange={(e) => setNouvelleAff({ ...nouvelleAff, date_echeance: e.target.value })}
                          className="w-full p-2 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-[#800020] outline-none"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium mb-1 block">Note</Label>
                        <textarea
                          value={nouvelleAff.note || ""}
                          onChange={(e) => setNouvelleAff({ ...nouvelleAff, note: e.target.value })}
                          rows={2}
                          placeholder="Instructions..."
                          className="w-full p-2 text-xs rounded border border-slate-300 focus:ring-2 focus:ring-[#800020] outline-none resize-none"
                        />
                      </div>

                      <Button
                        onClick={ajouterAffectation}
                        className="w-full bg-[#800020] hover:bg-[#600018] text-white h-8"
                        size="sm"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Ajouter</span>
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <Info className="h-7 w-7 text-blue-600 mb-2" />
                    <h3 className="text-sm font-bold text-slate-900 mb-1.5">Comment ça marche ?</h3>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {!modeSequentiel ? (
                        <>
                          <li className="flex gap-1.5">
                            <GitBranch className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Simultané :</strong> Tous les services reçoivent la notification en même temps
                            </span>
                          </li>
                          <li className="flex gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>
                              Chaque service peut faire sa validation indépendamment
                            </span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex gap-1.5">
                            <GitMerge className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Séquentiel :</strong> Les étapes se déroulent dans l'ordre défini
                            </span>
                          </li>
                          <li className="flex gap-1.5">
                            <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <span>
                              Chaque étape attend la validation complète de l'étape précédente
                            </span>
                          </li>
                        </>
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
