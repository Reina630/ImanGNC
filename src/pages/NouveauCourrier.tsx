import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Send, Mail, Loader2, X, Camera, FileText } from "lucide-react";
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

const NouveauCourrier = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [typeCourrier, setTypeCourrier] = useState<"entrant" | "sortant">("entrant");
  const [formData, setFormData] = useState({
    date_courrier: new Date().toISOString().split("T")[0],
    expediteur: "",
    destinataire: "",
    objet: "",
    categorie: "",
    mode_envoi: "courrier",
    reponse_a: "",
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
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
        description: `Le courrier ${typeCourrier} a été ${typeCourrier === 'entrant' ? 'enregistré' : 'créé'} avec succès`,
      });
      navigate("/courriers");
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
      reponse_a: type === "sortant" ? prev.reponse_a : "",
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (10 Mo max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale autorisée est de 10 Mo",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      
      // Créer un aperçu pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };
  
  const handleScanComplete = async (scannedImageUrl: string) => {
    try {
      // Convertir l'image scannée en File
      const response = await fetch(scannedImageUrl);
      const blob = await response.blob();
      const fileName = `scan_${new Date().getTime()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      setSelectedFile(file);
      setFilePreview(scannedImageUrl);
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
    
    // Définir expéditeur ou destinataire selon le type
    if (typeCourrier === "entrant") {
      data.append('expediteur', formData.expediteur);
      data.append('date_reception', formData.date_courrier);
    } else {
      data.append('destinataire', formData.destinataire);
      data.append('date_envoi', formData.date_courrier);
      if (formData.mode_envoi) {
        data.append('mode_envoi', formData.mode_envoi);
      }
      if (formData.reponse_a) {
        data.append('reponse_a', formData.reponse_a);
      }
    }
    
    // Catégorie optionnelle
    if (formData.categorie) {
      data.append('categorie', formData.categorie);
    }
    
    // Statut par défaut (comme dans l'ancien)
    data.append('statut', 'recu');
    
    // Ajouter le fichier si présent
    if (selectedFile) {
      data.append('fichier', selectedFile);
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
              <Mail className="h-6 w-6 text-blue-600" />
            ) : (
              <Send className="h-6 w-6 text-emerald-600" />
            )}
            <h1 className="text-2xl font-bold">Nouveau courrier</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {typeCourrier === "entrant" ? "Enregistrer un courrier reçu" : "Créer un courrier à envoyer"}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={typeCourrier === "entrant" 
            ? "border-blue-300 text-blue-700 bg-blue-50" 
            : "border-emerald-300 text-emerald-700 bg-emerald-50"
          }
        >
          {typeCourrier === "entrant" ? "Entrant" : "Sortant"}
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
              <div className="space-y-2">
                <Label>Référence</Label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-muted-foreground">
                  Sera générée automatiquement lors de l'enregistrement
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="typeCourrier">Type de courrier *</Label>
                  <Select value={typeCourrier} onValueChange={(value) => handleTypeChange(value as "entrant" | "sortant" | "interne")}>
                    <SelectTrigger id="typeCourrier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrant"> Courrier entrant (reçu)</SelectItem>
                      <SelectItem value="sortant"> Courrier sortant (à envoyer)</SelectItem>
                      <SelectItem value="interne"> Courrier interne (circulation interne)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateCourrier">
                    {typeCourrier === "entrant" ? "Date de réception" : "Date d'envoi prévue"} *
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
                {typeCourrier === "entrant" ? (
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

              {typeCourrier === "sortant" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modeEnvoi">Mode d'envoi *</Label>
                    <Select value={formData.mode_envoi} onValueChange={(value) => handleInputChange('mode_envoi', value)}>
                      <SelectTrigger id="modeEnvoi">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="courrier">Courrier postal</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="fax">Fax</SelectItem>
                        <SelectItem value="main">Remise en main propre</SelectItem>
                        <SelectItem value="huissier">Huissier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reponseA">En réponse au courrier</Label>
                    <Input
                      id="reponseA"
                      placeholder="Ex: CE-2026-045 (optionnel)"
                      value={formData.reponse_a}
                      onChange={(e) => handleInputChange('reponse_a', e.target.value)}
                    />
                  </div>
                </div>
              )}
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
              {selectedFile ? (
                <div className="space-y-3">
                  {filePreview ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img 
                        src={filePreview} 
                        alt="Aperçu" 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-slate-50 rounded-lg border">
                      <FileText className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="border rounded-lg p-3 bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Glisser le document ici</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {typeCourrier === "entrant" ? "PDF, JPG, PNG (max 10 Mo)" : "PDF, DOCX, JPG (max 10 Mo)"}
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
                      accept={typeCourrier === "entrant" ? ".pdf,.jpg,.jpeg,.png" : ".pdf,.doc,.docx,.jpg,.jpeg,.png"}
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
                </div>
              )}
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
                  {typeCourrier === "entrant" ? "Enregistrement..." : "Création..."}
                </>
              ) : (
                typeCourrier === "entrant" ? "Enregistrer" : "Créer le courrier"
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
