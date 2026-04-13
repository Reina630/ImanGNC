/**
 * Page de révision avant archivage d'un courrier.
 * Aperçu du document à gauche, formulaire pré-rempli (OCR) à droite.
 * Statut archivé par défaut.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Archive,
  Loader2,
  X,
  Paperclip,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import type { ExtractedDocumentFields } from "@/services/scanService";
import { CourrierCombobox } from "@/components/CourrierCombobox";
import { useServices } from "@/services/serviceHooks";

type LocationState = {
  file: File;
  extracted: Partial<ExtractedDocumentFields>;
  ocr_used?: boolean;
  warning?: string;
  extracted_text?: string;
};

export default function ArchiveReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const state = location.state as LocationState | null;

  // Redirect if no file
  useEffect(() => {
    if (!state?.file) {
      navigate("/registre-new", { replace: true });
    }
  }, []);

  const file = state?.file!;
  const extracted = state?.extracted ?? {};
  const ocrUsed = state?.ocr_used ?? false;
  const ocrWarning = state?.warning;
  const extractedText = state?.extracted_text;

  // Debug: afficher les données extraites dans la console
  useEffect(() => {
    if (extracted) {
      console.log("=== OCR EXTRACTION DEBUG ===");
      console.log("Champs extraits:", extracted);
      console.log("Référence détectée:", extracted.reference_structure || "AUCUNE");
      console.log("Objet:", extracted.objet || "AUCUN");
      console.log("Expéditeur:", extracted.expediteur || "AUCUN");
      if (extractedText) {
        console.log("Texte extrait (500 premiers caractères):", extractedText);
      }
      console.log("==========================");
    }
  }, []);

  const { data: services = [] } = useServices();
  const { data: categories = [] } = useCategories();

  // Form state pre-filled from OCR
  const [typeCourrier, setTypeCourrier] = useState<"entrant" | "sortant" | "interne">(
    (extracted.type_courrier ?? "entrant") as "entrant" | "sortant" | "interne"
  );
  const [formData, setFormData] = useState({
    date_courrier: extracted.date_courrier || new Date().toISOString().split("T")[0],
    expediteur: extracted.expediteur || "",
    destinataire: extracted.destinataire || "",
    objet: extracted.objet || "",
    reference_structure: extracted.reference_structure || "",
    categorie: "",
    service_concerne: "",
    mode_reception: "postal",
    mode_envoi: "postal",
    reponse_a: null as number | null,
    notes: extracted.notes || "",
  });
  const [pieceJointes, setPiecesJointes] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const pjInputRef = useRef<HTMLInputElement>(null);

  const isPdf = file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddPJ = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.size <= 10 * 1024 * 1024);
    const oversized = Array.from(files).filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length) {
      toast({ variant: "destructive", title: "Fichier trop volumineux", description: "Max 10 Mo par fichier." });
    }
    setPiecesJointes((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...newFiles.filter((f) => !existing.has(f.name))];
    });
  };

  const handleSubmit = async () => {
    if (!formData.objet.trim()) {
      toast({ variant: "destructive", title: "Champ requis", description: "L'objet est obligatoire." });
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
      setSubmitting(true);
      const data = new FormData();
      data.append("type_courrier", typeCourrier);
      data.append("statut", "archive");
      data.append("objet", formData.objet);
      
      // Envoyer la date avec le bon nom de champ selon le type
      if (typeCourrier === "entrant" || typeCourrier === "interne") {
        data.append("date_reception", formData.date_courrier);
      } else if (typeCourrier === "sortant") {
        data.append("date_envoi", formData.date_courrier);
      }
      
      if (typeCourrier === "entrant" || typeCourrier === "interne") data.append("expediteur", formData.expediteur);
      if (typeCourrier === "sortant" || typeCourrier === "interne") data.append("destinataire", formData.destinataire);
      if (formData.categorie) data.append("categorie", formData.categorie);
      if (formData.service_concerne) data.append("service_concerne", formData.service_concerne);
      if (formData.reference_structure) data.append("reference_structure", formData.reference_structure);
      if (typeCourrier === "entrant") data.append("mode_reception", formData.mode_reception);
      if (typeCourrier === "sortant") data.append("mode_envoi", formData.mode_envoi);
      if (formData.reponse_a) data.append("reponse_a", formData.reponse_a.toString());
      if (formData.notes) data.append("notes", formData.notes);

      // Document principal
      data.append("fichier", file);

      // Pièces jointes supplémentaires
      pieceJointes.forEach((f) => data.append("pieces_jointes", f));

      await courrierService.createCourrier(data);

      toast({ title: "Archivé avec succès", description: `"${formData.objet}" a été enregistré.` });
      navigate("/registre-new");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible d'archiver le courrier.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!state?.file) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-[#800020] px-6 py-3 flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-semibold text-base">Archiver un courrier</h1>
          <p className="text-white/70 text-xs">Vérifiez les informations extraites avant de valider</p>
        </div>
        {ocrUsed && !ocrWarning && (
          <Badge className="bg-green-500/20 text-green-200 border-green-400/30 gap-1">
            <CheckCircle2 className="h-3 w-3" /> OCR appliqué
          </Badge>
        )}
        {ocrWarning && (
          <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 gap-1">
            <AlertCircle className="h-3 w-3" /> Saisie manuelle
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left: document preview ── */}
        <div className="w-1/2 border-r border-border flex flex-col bg-muted/30">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/60 shrink-0">
            <span className="text-xs font-medium truncate max-w-[60%] text-muted-foreground">{file.name}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.2).toFixed(1)))}
                className="p-1.5 rounded hover:bg-muted transition-colors"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(1)))}
                className="p-1.5 rounded hover:bg-muted transition-colors"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              {!isPdf && (
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-4">
            {isPdf ? (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg border border-border shadow"
                style={{ minHeight: "600px", transform: `scale(${zoom})`, transformOrigin: "top center" }}
                title="Aperçu PDF"
              />
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Aperçu"
                className="rounded-lg border border-border shadow object-contain"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "top center",
                  maxWidth: "100%",
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <FileText className="h-16 w-16" />
                <p className="text-sm">Aperçu non disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
              {(["entrant", "sortant", "interne"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeCourrier(t)}
                  className={`py-2 rounded-md text-sm font-medium transition-all capitalize ${
                    typeCourrier === t
                      ? "bg-[#800020] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Date + Référence */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">
                  {typeCourrier === "sortant" ? "Date d'envoi" : "Date de réception"}
                  <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.date_courrier}
                  onChange={(e) => handleChange("date_courrier", e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Référence de la structure</Label>
                <Input
                  placeholder="Ex: REF-2026-001"
                  value={formData.reference_structure}
                  onChange={(e) => handleChange("reference_structure", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Expéditeur / Destinataire selon le type */}
            {typeCourrier === "interne" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">
                    Expéditeur <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Service émetteur"
                    value={formData.expediteur}
                    onChange={(e) => handleChange("expediteur", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">
                    Destinataire <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Service destinataire"
                    value={formData.destinataire}
                    onChange={(e) => handleChange("destinataire", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {typeCourrier === "entrant" && (
                  <div className="space-y-1">
                    <Label className="text-sm">
                      Expéditeur <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Nom / organisation"
                      value={formData.expediteur}
                      onChange={(e) => handleChange("expediteur", e.target.value)}
                      className="h-9"
                    />
                  </div>
                )}
                {typeCourrier === "sortant" && (
                  <div className="space-y-1">
                    <Label className="text-sm">
                      Destinataire <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Nom / organisation"
                      value={formData.destinataire}
                      onChange={(e) => handleChange("destinataire", e.target.value)}
                      className="h-9"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-sm">Catégorie</Label>
                  <Select value={formData.categorie} onValueChange={(v) => handleChange("categorie", v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Objet */}
            <div className="space-y-1">
              <Label className="text-sm">
                Objet <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Objet du courrier"
                value={formData.objet}
                onChange={(e) => handleChange("objet", e.target.value)}
                className="h-9"
              />
            </div>

            {/* Catégorie (pour interne) + Mode */}
            <div className="grid grid-cols-2 gap-3">
              {typeCourrier === "interne" && (
                <div className="space-y-1">
                  <Label className="text-sm">Catégorie</Label>
                  <Select value={formData.categorie} onValueChange={(v) => handleChange("categorie", v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-sm">Service concerné</Label>
                <Select value={formData.service_concerne} onValueChange={(v) => handleChange("service_concerne", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service: any) => (
                      <SelectItem key={service.id} value={service.nom}>
                        {service.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {typeCourrier === "entrant" && (
                <div className="space-y-1">
                  <Label className="text-sm">Mode de réception</Label>
                  <Select value={formData.mode_reception} onValueChange={(v) => handleChange("mode_reception", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postal">Courrier postal</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="fax">Fax</SelectItem>
                      <SelectItem value="main_propre">Remise en main propre</SelectItem>
                      <SelectItem value="coursier">Coursier/Huissier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {typeCourrier === "sortant" && (
                <div className="space-y-1">
                  <Label className="text-sm">Mode d'envoi</Label>
                  <Select value={formData.mode_envoi} onValueChange={(v) => handleChange("mode_envoi", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postal">Courrier postal</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="fax">Fax</SelectItem>
                      <SelectItem value="main_propre">Remise en main propre</SelectItem>
                      <SelectItem value="coursier">Coursier/Huissier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {(typeCourrier === "entrant" || typeCourrier === "sortant") && (
                <div className="space-y-1">
                  <Label className="text-sm">En réponse à (optionnel)</Label>
                  <CourrierCombobox
                    value={formData.reponse_a}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, reponse_a: value }))}
                    placeholder="Sélectionner un courrier..."
                    typeCourrier={typeCourrier === "entrant" ? "sortant" : "entrant"}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-sm">Notes</Label>
              <Textarea
                placeholder="Informations complémentaires..."
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="resize-none text-sm"
              />
            </div>

            {/* Pièces jointes supplémentaires */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Pièces jointes</Label>
                <button
                  type="button"
                  onClick={() => pjInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-[#800020] hover:underline font-medium"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Ajouter
                </button>
              </div>
              <input
                ref={pjInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                onChange={(e) => { handleAddPJ(e.target.files); e.target.value = ""; }}
              />

              {pieceJointes.length > 0 ? (
                <div className="space-y-1.5">
                  {pieceJointes.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg border border-border text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPiecesJointes((prev) => prev.filter((_, j) => j !== i))}
                        className="ml-2 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => pjInputRef.current?.click()}
                  className="border border-dashed border-border rounded-lg px-4 py-3 text-center text-xs text-muted-foreground cursor-pointer hover:border-[#800020]/40 hover:bg-[#800020]/5 transition-all"
                >
                  Cliquer pour ajouter des pièces jointes
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="border-t border-border px-6 py-4 bg-card/60 shrink-0 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#800020] hover:bg-[#600018] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Archivage...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver le courrier
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
