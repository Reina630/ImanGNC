import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, Upload, Send, Mail, Loader2, X, Camera, FileText, Inbox } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import courrierService from "@/services/courrierService";
import { useCategories } from "@/services/categoryHooks";
import { useToast } from "@/hooks/use-toast";
import DocumentScanner from "@/components/DocumentScanner";
import { CourrierCombobox } from "@/components/CourrierCombobox";

const NouveauCourrier = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();

  // Données pré-remplies via OCR (depuis RegistrePageNew upload modal)
  const locationState = location.state as { file?: File; extracted?: Record<string, string> } | null;
  const extracted = locationState?.extracted ?? {};
  const preloadedFile = locationState?.file ?? null;

  const typeFromUrl = searchParams.get("type") as "entrant" | "sortant" | "interne" | null;
  const resolvedType = (
    (extracted.type_courrier && ["entrant", "sortant", "interne"].includes(extracted.type_courrier)
      ? extracted.type_courrier
      : typeFromUrl && ["entrant", "sortant", "interne"].includes(typeFromUrl)
        ? typeFromUrl
        : "entrant")
  ) as "entrant" | "sortant" | "interne";

  const [typeCourrier, setTypeCourrier] = useState<"entrant" | "sortant" | "interne">(resolvedType);

  // Synchroniser si le param change (ex: retour arrière)
  useEffect(() => {
    if (typeFromUrl && ["entrant", "sortant", "interne"].includes(typeFromUrl)) {
      setTypeCourrier(typeFromUrl);
    }
  }, [typeFromUrl]);
  const [formData, setFormData] = useState({
    date_courrier: extracted.date_courrier || new Date().toISOString().split("T")[0],
    expediteur: extracted.expediteur || "",
    destinataire: extracted.destinataire || "",
    objet: extracted.objet || "",
    reference_structure: extracted.reference_structure || "",
    categorie: "",
    mode_envoi: "postal",
    mode_reception: "postal",
    reponse_a: null as number | null,
    notes: extracted.notes || "",
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>(preloadedFile ? [preloadedFile] : []);
  const [scannerOpen, setScannerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Charger les catégories depuis l'API (comme dans AdminPanel)
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();
  
  // Mutation pour créer le courrier
  const createMutation = useMutation({
    mutationFn: (data: FormData) => courrierService.createCourrier(data),
    onSuccess: () => {
      toast({
        title: "Succès",
        description: `Le courrier ${typeCourrier} a été enregistré avec succès`,
      });
      navigate("/courriers/suivi");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleTypeChange = (type: "entrant" | "sortant" | "interne") => {
    setTypeCourrier(type);
    // Réinitialiser les champs spécifiques
    setFormData(prev => ({
      ...prev,
      expediteur: type === "sortant" ? "" : prev.expediteur,
      destinataire: type === "entrant" ? "" : prev.destinataire,
      mode_envoi: type === "sortant" ? "courrier" : "",
      mode_reception: type === "entrant" ? "courrier" : "",
      reponse_a: prev.reponse_a, // Garder la valeur pour tous les types
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast({
        title: "Fichier trop volumineux",
        description: `${oversized.map(f => f.name).join(', ')} dépasse(nt) 10 Mo`,
        variant: "destructive",
      });
      return;
    }
    setSelectedFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...files.filter(f => !names.has(f.name))];
    });
    // Reset input for re-selection of same files
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleScanComplete = async (scannedImageUrl: string) => {
    try {
      const response = await fetch(scannedImageUrl);
      const blob = await response.blob();
      const fileName = `scan_${new Date().getTime()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      setSelectedFiles(prev => [...prev, file]);
      setScannerOpen(false);
      toast({
        title: "Document scanné",
        description: "Le document a été numérisé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter le document scanné",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const requiredField = typeCourrier === "entrant" ? formData.expediteur : formData.destinataire;
    if (!requiredField || !formData.objet) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    
    // Créer FormData EXACTEMENT comme dans AddCourrierDialog qui fonctionnait
    const data = new FormData();
    data.append('type_courrier', typeCourrier);
    data.append('objet', formData.objet);
    
    // Référence de la structure (optionnel)
    if (formData.reference_structure.trim()) {
      data.append('reference_structure', formData.reference_structure);
    }
    
    // Définir expéditeur ou destinataire selon le type
    if (typeCourrier === "entrant") {
      data.append('expediteur', formData.expediteur);
      data.append('date_reception', formData.date_courrier);
      if (formData.mode_reception) {
        data.append('mode_reception', formData.mode_reception);
      }
      // Courrier entrant peut être en réponse à un courrier sortant
      if (formData.reponse_a) {
        data.append('reponse_a', formData.reponse_a.toString());
      }
    } else if (typeCourrier === "sortant") {
      data.append('destinataire', formData.destinataire);
      data.append('date_envoi', formData.date_courrier);
      if (formData.mode_envoi) {
        data.append('mode_envoi', formData.mode_envoi);
      }
      // Courrier sortant peut être en réponse à un courrier entrant
      if (formData.reponse_a) {
        data.append('reponse_a', formData.reponse_a.toString());
      }
    } else {
      // interne
      data.append('expediteur', formData.expediteur);
      data.append('destinataire', formData.destinataire);
      data.append('date_reception', formData.date_courrier);
    }
    
    // Catégorie optionnelle
    if (formData.categorie) {
      data.append('categorie', formData.categorie);
    }
    
    // Notes / observations optionnelles
    if (formData.notes.trim()) {
      data.append('notes', formData.notes);
    }
    
    // Statut par défaut (comme dans l'ancien)
    data.append('statut', 'recu');
    
    // Ajouter les fichiers : le premier comme fichier principal, les autres comme pièces jointes
    if (selectedFiles.length > 0) {
      data.append('fichier', selectedFiles[0]);
      selectedFiles.slice(1).forEach(f => data.append('fichiers', f));
    }
    
    createMutation.mutate(data);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {typeCourrier === "entrant" ? (
              <Inbox className="h-6 w-6 text-blue-600" />
            ) : typeCourrier === "sortant" ? (
              <Send className="h-6 w-6 text-emerald-600" />
            ) : (
              <Mail className="h-6 w-6 text-purple-600" />
            )}
            <h1 className="text-2xl font-bold">Nouveau courrier</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {typeCourrier === "entrant"
              ? "Enregistrer un courrier reçu"
              : typeCourrier === "sortant"
              ? "Créer un courrier à envoyer"
              : "Créer un courrier interne"}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            typeCourrier === "entrant"
              ? "border-blue-300 text-blue-700 bg-blue-50"
              : typeCourrier === "sortant"
              ? "border-emerald-300 text-emerald-700 bg-emerald-50"
              : "border-purple-300 text-purple-700 bg-purple-50"
          }
        >
          {typeCourrier === "entrant" ? "Entrant" : typeCourrier === "sortant" ? "Sortant" : "Interne"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Formulaire principal */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations du courrier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <div className="space-y-2">
                <Label>Numéro d'ordre</Label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-muted-foreground">
                  Ex: ENT-2026-03-0001 (généré automatiquement)
                </div>
              </div> */}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="typeCourrier">Type de courrier *</Label>
                  {typeFromUrl ? (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium
                      ${typeCourrier === "entrant" ? "bg-blue-50 border-blue-200 text-blue-700"
                        : typeCourrier === "sortant" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-purple-50 border-purple-200 text-purple-700"}`}>
                      {typeCourrier === "entrant" ? <Inbox className="h-4 w-4" /> : typeCourrier === "sortant" ? <Send className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      {typeCourrier === "entrant" ? "Courrier entrant (reçu)" : typeCourrier === "sortant" ? "Courrier sortant (à envoyer)" : "Courrier interne (circulation interne)"}
                    </div>
                  ) : (
                    <Select value={typeCourrier} onValueChange={(value) => handleTypeChange(value as "entrant" | "sortant" | "interne")}>
                      <SelectTrigger id="typeCourrier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrant"><Inbox className="h-4 w-4 inline mr-1 text-blue-500" /> Courrier entrant (reçu)</SelectItem>
                        <SelectItem value="sortant"><Send className="h-4 w-4 inline mr-1 text-emerald-500" /> Courrier sortant (à envoyer)</SelectItem>
                        <SelectItem value="interne"><Mail className="h-4 w-4 inline mr-1 text-purple-500" /> Courrier interne (circulation interne)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateCourrier">
                    {typeCourrier === "entrant" || typeCourrier === "interne" ? "Date de réception" : "Date d'envoi prévue"} *
                  </Label>
                  <Input
                    id="dateCourrier"
                    type="date"
                    value={formData.date_courrier}
                    onChange={(e) => handleInputChange('date_courrier', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {typeCourrier === "interne" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="expediteur">Service émetteur *</Label>
                      <Input
                        id="expediteur"
                        placeholder="Ex: Direction RH, Comptabilité..."
                        value={formData.expediteur}
                        onChange={(e) => handleInputChange('expediteur', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destinataire">Service destinataire *</Label>
                      <Input
                        id="destinataire"
                        placeholder="Ex: Direction Générale, Juridique..."
                        value={formData.destinataire}
                        onChange={(e) => handleInputChange('destinataire', e.target.value)}
                        required
                      />
                    </div>
                  </>
                ) : typeCourrier === "entrant" ? (
                  <div className="space-y-2">
                    <Label htmlFor="expediteur">Expéditeur (organisme externe) *</Label>
                    <Input
                      id="expediteur"
                      placeholder="Ex: Ministère du Travail, CNSS, Fournisseur..."
                      value={formData.expediteur}
                      onChange={(e) => handleInputChange('expediteur', e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="destinataire">Destinataire (externe) *</Label>
                    <Input
                      id="destinataire"
                      placeholder="Ex: Inspection du Travail, Client, Tribunal..."
                      value={formData.destinataire}
                      onChange={(e) => handleInputChange('destinataire', e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie *</Label>
                  <Select value={formData.categorie} onValueChange={(value) => handleInputChange('categorie', value)} required>
                    <SelectTrigger id="categorie">
                      <SelectValue placeholder={categoriesLoading ? "Chargement..." : "Sélectionner"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesLoading ? (
                        <SelectItem value="loading" disabled>Chargement...</SelectItem>
                      ) : categoriesError ? (
                        <SelectItem value="error" disabled>Erreur de chargement</SelectItem>
                      ) : !categories || categories.length === 0 ? (
                        <SelectItem value="empty" disabled>Aucune catégorie disponible</SelectItem>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="objet">Objet du courrier *</Label>
                  <Input
                    id="objet"
                    placeholder={typeCourrier === "entrant" 
                      ? "Ex: Appel de cotisation Q1 2026" 
                      : "Ex: Déclaration annuelle effectifs"
                    }
                    value={formData.objet}
                    onChange={(e) => handleInputChange('objet', e.target.value)}
                    required
                  />
                </div>
              </div>

              {typeCourrier === "entrant" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="referenceStructure">Référence de la structure</Label>
                      <Input
                        id="referenceStructure"
                        placeholder="Ex: Réf. organisme externe"
                        value={formData.reference_structure}
                        onChange={(e) => handleInputChange('reference_structure', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Référence de la structure externe (optionnel)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modeReception">Mode de réception *</Label>
                      <Select value={formData.mode_reception} onValueChange={(value) => handleInputChange('mode_reception', value)}>
                        <SelectTrigger id="modeReception">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="postal">Courrier postal</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="fax">Fax</SelectItem>
                          <SelectItem value="main_propre">Remise en main propre</SelectItem>
                          <SelectItem value="coursier">Coursier/Huissier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reponseA">En réponse à (optionnel)</Label>
                    <CourrierCombobox
                      value={formData.reponse_a}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, reponse_a: value }))}
                      placeholder="Sélectionner un courrier..."
                      typeCourrier="sortant"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sélectionner le courrier sortant auquel vous répondez
                    </p>
                  </div>
                </div>
              )}

              {typeCourrier === "sortant" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="referenceStructure">Référence de la structure</Label>
                      <Input
                        id="referenceStructure"
                        placeholder="Ex: Réf. organisme externe"
                        value={formData.reference_structure}
                        onChange={(e) => handleInputChange('reference_structure', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Référence de la structure externe (optionnel)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modeEnvoi">Mode d'envoi *</Label>
                      <Select value={formData.mode_envoi} onValueChange={(value) => handleInputChange('mode_envoi', value)}>
                        <SelectTrigger id="modeEnvoi">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="postal">Courrier postal</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="fax">Fax</SelectItem>
                          <SelectItem value="main_propre">Remise en main propre</SelectItem>
                          <SelectItem value="coursier">Coursier/Huissier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reponseA">En réponse à (optionnel)</Label>
                    <CourrierCombobox
                      value={formData.reponse_a}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, reponse_a: value }))}
                      placeholder="Sélectionner un courrier..."
                      typeCourrier="entrant"
                    />
                    <p className="text-xs text-muted-foreground">
                      Sélectionner le courrier auquel vous répondez
                    </p>
                  </div>
                </div>
              )}

              {typeCourrier === "interne" && (
                <div className="space-y-2">
                  <Label htmlFor="referenceStructure">Référence de la structure</Label>
                  <Input
                    id="referenceStructure"
                    placeholder="Ex: Réf. organisme externe"
                    value={formData.reference_structure}
                    onChange={(e) => handleInputChange('reference_structure', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Référence de la structure externe (optionnel)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Observations</Label>
                <Textarea
                  id="notes"
                  placeholder="Observations, remarques ou informations complémentaires..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {typeCourrier === "entrant" ? "Document" : "Document à envoyer"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Liste des fichiers sélectionnés */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="border rounded-lg p-3 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} Mo
                            {index === 0 && <span className="ml-1 text-primary">(principal)</span>}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Zone d'ajout de fichiers */}
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  {selectedFiles.length === 0 ? "Glisser les documents ici" : "Ajouter d'autres fichiers"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  PDF, JPG, PNG (max 10 Mo par fichier)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Parcourir les fichiers
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setScannerOpen(true)}
              >
                <Camera className="h-4 w-4 mr-2" />
                Scanner un document
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => navigate(-1)}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {typeCourrier === "entrant" ? "Enregistrement..." : typeCourrier === "sortant" ? "Création..." : "Enregistrement..."}
                </>
              ) : (
                typeCourrier === "entrant" ? "Enregistrer" : typeCourrier === "sortant" ? "Créer le courrier" : "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
      
      {/* Scanner Modal */}
      <DocumentScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanComplete={handleScanComplete}
      />
    </>
  );
};

export default NouveauCourrier;
