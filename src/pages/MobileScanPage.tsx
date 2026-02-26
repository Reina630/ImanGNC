/**
 * Interface Mobile Simplifiée - Scanner + Liste des Courriers
 * Optimisée pour la numérisation rapide de documents
 */

import { useState, useEffect } from "react";
import { Camera, List, LogOut, RefreshCw, Mail, Calendar, Building2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DocumentScanner from "@/components/DocumentScanner";
import { AddCourrierDialog } from "@/components/AddCourrierDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Convertit une image base64 en File
 */
const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default function MobileScanPage() {
  const { toast } = useToast();
  const { logout, user } = useAuth();
  
  const [view, setView] = useState<"scan" | "list">("scan");
  const [scanning, setScanning] = useState(false); // État pour scanner en plein écran
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [scannedFile, setScannedFile] = useState<File | null>(null);
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les courriers récents
  const loadCourriers = async () => {
    try {
      setLoading(true);
      const data = await courrierService.getCourriers({ 
        ordering: "-created_at",
        type_courrier: "entrant" as any
      });
      setCourriers(data.slice(0, 20)); // Limiter aux 20 derniers
    } catch (error) {
      console.error("Erreur lors du chargement des courriers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "list") {
      loadCourriers();
    }
  }, [view]);

  const handleScanComplete = (scannedImage: string) => {
    const file = base64ToFile(scannedImage, `scan_${Date.now()}.jpg`);
    setScannedFile(file);
    setScanning(false); // Fermer le scanner plein écran
    setOpenUploadDialog(true);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "en_attente": "secondary",
      "traite": "default",
      "archive": "outline",
    };
    return <Badge variant={variants[statut] || "default"}>{statut}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Scanner en plein écran sur mobile */}
      {scanning && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground p-4 shadow-lg z-10 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScanning(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Scanner un document</h2>
          </div>
          <div className="h-full pt-[73px]">
            <DocumentScanner
              open={true}
              onClose={() => setScanning(false)}
              onScanComplete={handleScanComplete}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg sticky top-0 z-10">
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

      {/* Navigation Tabs */}
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

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === "scan" ? (
          <motion.div
            key="scan"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 space-y-4"
          >
            {/* Bouton Scanner Principal */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setScanning(true)}
              className="w-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center gap-4 active:shadow-lg transition-all"
            >
              <div className="bg-white/20 p-6 rounded-full">
                <Camera className="h-12 w-12" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">Scanner un Document</p>
                <p className="text-sm opacity-90 mt-1">Appuyez pour démarrer</p>
              </div>
            </motion.button>

            {/* Instructions */}
            <div className="bg-card rounded-xl p-6 shadow-md space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Comment scanner ?
              </h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Appuyez sur "Scanner un Document"</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Autorisez l'accès à la caméra</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Photographiez le document</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Remplissez les informations et validez</span>
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Camera className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Positionnez-vous au-dessus du document pour une meilleure qualité. 
                  La caméra arrière sera utilisée automatiquement.
                </span>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 space-y-4"
          >
            {/* Header Liste */}
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

            {/* Liste des Courriers */}
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
                    className="bg-card rounded-xl p-4 shadow-md border border-border"
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

      {/* Upload Dialog */}
      <AddCourrierDialog
        open={openUploadDialog}
        onOpenChange={setOpenUploadDialog}
        initialFile={scannedFile}
        onSuccess={() => {
          setOpenUploadDialog(false);
          setScannedFile(null);
          toast({
            title: "Courrier enregistré",
            description: "Le document a été scanné et enregistré avec succès.",
          });
          // Recharger la liste si on est sur la vue liste
          if (view === "list") {
            loadCourriers();
          }
        }}
      />
    </div>
  );
}
