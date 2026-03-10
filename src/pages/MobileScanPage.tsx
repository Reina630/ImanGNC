/**
 * Interface Mobile Complète - Scanner + Enregistrement + Liste
 * Tout intégré sur la page, pas de modals, 100% responsive
 */

import { useState, useEffect, useRef } from "react";
import { Camera, List, LogOut, RefreshCw, Mail, Calendar, Building2, ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import courrierService from "@/services/courrierService";
import categoryService from "@/services/categoryService";
import scanService from "@/services/scanService";
import type { Courrier, Categorie } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function MobileScanPage() {
  const { toast } = useToast();
  const { logout, user } = useAuth();
  
  const [view, setView] = useState<"scan" | "list">("scan");
  const [scanStep, setScanStep] = useState<"camera" | "form">("camera");
  
  // États caméra et scan
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scannedImage, setScannedImage] = useState<string>("");
  const [scannedFile, setScannedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // États formulaire
  const [formData, setFormData] = useState({
    type_courrier: "entrant" as "entrant" | "sortant",
    date_reception: new Date().toISOString().split("T")[0],
    date_envoi: "",
    nom: "",
    objet: "",
    reference: "",
    categorie: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Categorie[]>([]);
  
  // États liste
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les catégories
  useEffect(() => {
    loadCategories();
  }, []);

  // Démarrer la caméra quand on est sur l'étape camera
  useEffect(() => {
    if (view === "scan" && scanStep === "camera") {
      startCamera();
    }
    return () => stopCamera();
  }, [view, scanStep]);

  // Charger les courriers quand on affiche la liste
  useEffect(() => {
    if (view === "list") {
      loadCourriers();
    }
  }, [view]);

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getCategories();
      setCategories(cats || []);
    } catch (error) {
      console.error('Erreur catégories:', error);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur caméra',
        description: 'Impossible d\'accéder à la caméra. Vérifiez les permissions.',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      stopCamera();
      setProcessing(true);

      try {
        // Détecter et scanner le document
        const detectResult = await scanService.detectCorners(file);
        const warpResult = await scanService.warpDocument(file, detectResult.corners);
        
        setScannedImage(warpResult.image);
        setScannedFile(file);
        setScanStep("form");
        
        toast({
          title: "Document scanné",
          description: "Remplissez les informations ci-dessous",
        });
      } catch (error: any) {
        console.error('Erreur scan:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur de scan',
          description: 'Impossible de scanner le document. Réessayez.',
        });
        startCamera();
      } finally {
        setProcessing(false);
      }
    }, 'image/jpeg', 0.95);
  };

  const cancelScan = () => {
    setScannedImage("");
    setScannedFile(null);
    setScanStep("camera");
    setFormData({
      type_courrier: "entrant",
      date_reception: new Date().toISOString().split("T")[0],
      date_envoi: "",
      nom: "",
      objet: "",
      reference: "",
      categorie: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.objet.trim() || !formData.nom.trim() || !scannedFile) {
      toast({
        variant: "destructive",
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
      });
      return;
    }

    try {
      setSubmitting(true);

      const data = new FormData();
      data.append("type_courrier", formData.type_courrier);
      data.append("objet", formData.objet);
      data.append("fichier", scannedFile);
      
      if (formData.type_courrier === "entrant") {
        data.append("expediteur", formData.nom);
        data.append("date_reception", formData.date_reception);
      } else {
        data.append("destinataire", formData.nom);
        data.append("date_envoi", formData.date_envoi);
      }
      
      if (formData.reference) data.append("reference", formData.reference);
      if (formData.categorie) data.append("categorie", formData.categorie);
      data.append("statut", "recu");

      const courrier = await courrierService.createCourrier(data);

      toast({
        title: "Courrier enregistré",
        description: `${courrier.numero_registre} créé avec succès`,
      });

      cancelScan();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de créer le courrier",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const loadCourriers = async () => {
    try {
      setLoading(true);
      const data = await courrierService.getCourriers({ 
        ordering: "-created_at",
        type_courrier: "entrant" as any
      });
      setCourriers(data.slice(0, 20));
    } catch (error) {
      console.error("Erreur lors du chargement des courriers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "recu": "secondary",
      "en_traitement": "default",
      "traite": "outline",
      "archive": "outline",
    };
    return <Badge variant={variants[statut] || "default"}>{statut}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Scanner Courrier</h1>
            <p className="text-xs opacity-90">{user?.username || "Utilisateur"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs - Cachés quand on est en mode formulaire */}
      {scanStep === "camera" && (
        <div className="flex bg-background border-b sticky top-[73px] z-10">
          <button
            onClick={() => setView("scan")}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-all ${
              view === "scan"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground"
            }`}
          >
            <Camera className="h-5 w-5" />
            Scanner
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-all ${
              view === "list"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground"
            }`}
          >
            <List className="h-5 w-5" />
            Courriers
          </button>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Vue Caméra */}
        {view === "scan" && scanStep === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-[calc(100vh-137px)]"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-between p-6">
              <div className="w-full max-w-md">
                <div className="bg-black/50 text-white rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-sm text-center">
                    Positionnez le document dans le cadre et appuyez pour capturer
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                {processing && (
                  <div className="bg-black/70 text-white px-6 py-3 rounded-full flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Scan en cours...</span>
                  </div>
                )}
                
                {!processing && (
                  <Button
                    onClick={capturePhoto}
                    size="lg"
                    className="h-16 w-16 rounded-full bg-white hover:bg-gray-100 shadow-xl"
                  >
                    <Camera className="h-8 w-8 text-primary" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Vue Formulaire */}
        {view === "scan" && scanStep === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 space-y-4 pb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelScan}
                disabled={submitting}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">Enregistrer le courrier</h2>
            </div>

            <div className="rounded-xl overflow-hidden border">
              <img
                src={scannedImage}
                alt="Document scanné"
                className="w-full h-auto"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type de courrier *</Label>
                <Select
                  value={formData.type_courrier}
                  onValueChange={(value) =>
                    setFormData({ 
                      ...formData, 
                      type_courrier: value as "entrant" | "sortant",
                      nom: "",
                    })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrant">Courrier Entrant</SelectItem>
                    <SelectItem value="sortant">Courrier Sortant</SelectItem>
                    <SelectItem value="interne">Courrier Interne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.type_courrier === "entrant" 
                    ? "Date de réception" 
                    : formData.type_courrier === "sortant"
                    ? "Date d'envoi"
                    : "Date du courrier"} *
                </Label>
                <Input
                  type="date"
                  value={formData.type_courrier === "entrant" ? formData.date_reception : formData.date_envoi}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [formData.type_courrier === "entrant" ? "date_reception" : "date_envoi"]: e.target.value,
                    })
                  }
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.type_courrier === "entrant" ? "Expéditeur" : "Destinataire"} *
                </Label>
                <Input
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder={formData.type_courrier === "entrant" ? "Nom de l'expéditeur" : "Nom du destinataire"}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Objet *</Label>
                <Input
                  value={formData.objet}
                  onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                  placeholder="Objet du courrier"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Référence</Label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Référence (optionnel)"
                  disabled={submitting}
                />
              </div>

              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={formData.categorie}
                    onValueChange={(value) => setFormData({ ...formData, categorie: value })}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelScan}
                  disabled={submitting}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Vue Liste */}
        {view === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Derniers Courriers</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={loadCourriers}
                disabled={loading}
              >
                <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3" />
                <p>Chargement...</p>
              </div>
            ) : courriers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun courrier pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courriers.map((courrier) => (
                  <motion.div
                    key={courrier.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl p-4 shadow-md border"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{courrier.objet}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          N° {courrier.numero_registre}
                        </p>
                      </div>
                      {getStatutBadge(courrier.statut)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {courrier.date_reception && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {format(new Date(courrier.date_reception), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      )}
                      {courrier.expediteur && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{courrier.expediteur}</span>
                        </div>
                      )}
                      {courrier.service_concerne && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{courrier.service_concerne}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
