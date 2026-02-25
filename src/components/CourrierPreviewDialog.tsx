/**
 * Dialog pour prévisualiser le fichier scanné d'un courrier
 * Affiche le PDF ou l'image directement dans un dialogue
 */

import { useState, useEffect } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";

interface CourrierPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrier: Courrier | null;
}

export function CourrierPreviewDialog({
  open,
  onOpenChange,
  courrier,
}: CourrierPreviewDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!courrier) return null;

  // Réinitialiser le zoom et la rotation quand le dialogue s'ouvre
  useEffect(() => {
    if (open) {
      setZoom(100);
      setRotation(0);
    }
  }, [open]);

  // Télécharger le fichier
  const handleDownload = async () => {
    try {
      setDownloading(true);
      await courrierService.telechargerFichier(courrier.id, courrier.numero_registre);
      toast({
        title: "Téléchargement réussi",
        description: `Le fichier ${courrier.numero_registre} a été téléchargé`,
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
      });
    } finally {
      setDownloading(false);
    }
  };

  // Zoom in/out
  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 200));
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 50));
  const handleRotate = () => setRotation((rotation + 90) % 360);

  // Déterminer le type de fichier
  const isPDF = courrier.file_type === 'pdf' || courrier.fichier?.toLowerCase().endsWith('.pdf');
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(courrier.file_type?.toLowerCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0">
        {/* Header avec titre et actions */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Aperçu du courrier
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {courrier.numero_registre} - {courrier.objet}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Contrôles de zoom (seulement pour images) */}
              {isImage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    title="Dézoomer"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    title="Zoomer"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRotate}
                    title="Rotation"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                disabled={downloading}
                title="Télécharger"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Contenu de prévisualisation */}
        <div className="overflow-auto bg-muted/30" style={{ height: 'calc(95vh - 100px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          ) : isPDF ? (
            // Affichage PDF via iframe
            <iframe
              src={courrier.fichier}
              title={`Aperçu de ${courrier.numero_registre}`}
              className="w-full h-full border-0"
              style={{ minHeight: '600px' }}
            />
          ) : isImage ? (
            // Affichage image avec zoom et rotation
            <div className="flex items-center justify-center h-full p-8">
              <img
                src={courrier.fichier}
                alt={courrier.objet}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                }}
                className="object-contain"
              />
            </div>
          ) : (
            // Type de fichier non supporté pour la prévisualisation
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Prévisualisation non disponible pour ce type de fichier
                </p>
                <Button onClick={handleDownload} disabled={downloading}>
                  <Download className="h-4 w-4 mr-2" />
                  {downloading ? "Téléchargement..." : "Télécharger le fichier"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
