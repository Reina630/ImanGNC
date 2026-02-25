import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, Check, RotateCw, Loader2, Crop } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import scanService from '../services/scanService';

interface DocumentScannerProps {
  open: boolean;
  onClose: () => void;
  onScanComplete: (scannedImage: string) => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({
  open,
  onClose,
  onScanComplete,
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'camera' | 'processing' | 'edit' | 'result'>('camera');
  const [loading, setLoading] = useState(false);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scannedImage, setScannedImage] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [corners, setCorners] = useState<number[][]>([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const editImageRef = useRef<HTMLImageElement>(null);

  // Démarrer la caméra quand le dialog s'ouvre
  useEffect(() => {
    if (open && step === 'camera') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, step]);

  // Mettre à jour les dimensions de l'image affichée en mode édition
  useEffect(() => {
    if (step === 'edit' && editImageRef.current) {
      const updateSize = () => {
        if (editImageRef.current) {
          setDisplaySize({
            width: editImageRef.current.clientWidth,
            height: editImageRef.current.clientHeight
          });
        }
      };
      
      // Attendre que l'image soit chargée
      if (editImageRef.current.complete) {
        updateSize();
      } else {
        editImageRef.current.onload = updateSize;
      }
      
      // Mettre à jour au redimensionnement
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [step, capturedImage]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Caméra arrière sur mobile
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

  // Capturer une photo et scanner automatiquement
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    // Convertir en File et en data URL
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      setOriginalFile(file);
      setCapturedImage(dataUrl);
      
      stopCamera();
      setStep('processing');
      setLoading(true);

      try {
        // Détecter les coins
        const detectResult = await scanService.detectCorners(file);
        setCorners(detectResult.corners);
        setImageSize({ width: detectResult.width, height: detectResult.height });
        
        // Scanner automatiquement avec les coins détectés
        const warpResult = await scanService.warpDocument(file, detectResult.corners);
        
        setScannedImage(warpResult.image);
        setStep('result');
      } catch (error: any) {
        console.error('Erreur scan:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur de scan',
          description: error.response?.data?.error || 'Impossible de scanner le document',
        });
        setStep('camera');
        startCamera();
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg', 0.95);
  };

  // Passer en mode édition manuelle des coins
  const editCorners = () => {
    console.log('Edit corners clicked', {
      capturedImage: !!capturedImage,
      corners: corners.length,
      imageSize
    });
    setStep('edit');
    // Réinitialiser displaySize pour forcer le recalcul
    setDisplaySize({ width: 0, height: 0 });
  };

  // Re-scanner avec les coins ajustés manuellement
  const rescanWithEditedCorners = async () => {
    if (!originalFile) return;

    setLoading(true);
    setStep('processing');

    try {
      const warpResult = await scanService.warpDocument(originalFile, corners);
      setScannedImage(warpResult.image);
      setStep('result');
      toast({
        title: 'Scan mis à jour',
        description: 'Le document a été re-scanné avec vos ajustements',
      });
    } catch (error: any) {
      console.error('Erreur scan:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur de scan',
        description: error.response?.data?.error || 'Impossible de scanner le document',
      });
      setStep('edit');
    } finally {
      setLoading(false);
    }
  };

  // Gestion du drag des poignées
  const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingIndex(index);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIndex === null || !editImageRef.current) return;

    const imgRect = editImageRef.current.getBoundingClientRect();
    
    // Position relative à l'image affichée
    let x = e.clientX - imgRect.left;
    let y = e.clientY - imgRect.top;

    // Limiter dans l'image
    x = Math.max(0, Math.min(x, imgRect.width));
    y = Math.max(0, Math.min(y, imgRect.height));

    // Convertir en coordonnées réelles
    const scaleX = imageSize.width / imgRect.width;
    const scaleY = imageSize.height / imgRect.height;

    const newCorners = [...corners];
    newCorners[draggingIndex] = [x * scaleX, y * scaleY];
    setCorners(newCorners);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingIndex !== null) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
    setDraggingIndex(null);
  };

  // Valider et utiliser le scan
  const handleValidate = () => {
    if (scannedImage) {
      onScanComplete(scannedImage);
      handleClose();
      toast({
        title: 'Scan validé',
        description: 'Le document a été scanné avec succès',
      });
    }
  };

  // Reprendre le scan
  const retakeScan = () => {
    setScannedImage('');
    setCapturedImage('');
    setOriginalFile(null);
    setCorners([]);
    setStep('camera');
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setStep('camera');
    setScannedImage('');
    setCapturedImage('');
    setOriginalFile(null);
    setCorners([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner un document
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Étape 1 : Caméra */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', maxHeight: '60vh' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex justify-center pt-2">
                <Button
                  size="lg"
                  onClick={captureAndScan}
                  disabled={!stream}
                  className="min-w-[200px]"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Prendre une photo
                </Button>
              </div>
            </div>
          )}

          {/* Étape 2 : Traitement en cours */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium text-lg">Traitement en cours...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Détection et amélioration du document
                </p>
              </div>
            </div>
          )}

          {/* Étape 3 : Édition manuelle des coins */}
          {step === 'edit' && (
            <div className="space-y-4">
              {(!capturedImage || corners.length !== 4) ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Erreur : Données manquantes pour l'édition
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Image: {capturedImage ? '✓' : '✗'} | 
                    Coins: {corners.length}/4 | 
                    Taille: {imageSize.width}x{imageSize.height}
                  </p>
                  <Button onClick={retakeScan} className="mt-4">
                    Reprendre
                  </Button>
                </div>
              ) : (
                <>
                  <div 
                    ref={imageContainerRef}
                    className="relative bg-muted rounded-lg overflow-hidden"
                    style={{ touchAction: 'none', userSelect: 'none' }}
                  >
                    <img
                      ref={editImageRef}
                      src={capturedImage}
                      alt="Photo capturée"
                      className="w-full h-auto max-h-[60vh] object-contain mx-auto block"
                      draggable={false}
                      onLoad={() => {
                        if (editImageRef.current) {
                          const newDisplaySize = {
                            width: editImageRef.current.clientWidth,
                            height: editImageRef.current.clientHeight
                          };
                          console.log('Image loaded, display size:', newDisplaySize);
                          setDisplaySize(newDisplaySize);
                        }
                      }}
                    />
                    
                    {/* Overlay pour capturer les événements */}
                    <div 
                      className="absolute inset-0"
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      style={{ touchAction: 'none' }}
                    >
                      {/* SVG Overlay avec polygon */}
                      {displaySize.width > 0 && (
                        <svg 
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%'
                          }}
                        >
                          <polygon
                            points={corners.map(pt => {
                              const x = (pt[0] / imageSize.width) * displaySize.width;
                              const y = (pt[1] / imageSize.height) * displaySize.height;
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="rgba(16, 185, 129, 0.3)"
                            stroke="#10b981"
                            strokeWidth="3"
                          />
                        </svg>
                      )}

                      {/* Poignées draggables */}
                      {displaySize.width > 0 && corners.map((pt, i) => {
                        const x = (pt[0] / imageSize.width) * displaySize.width;
                        const y = (pt[1] / imageSize.height) * displaySize.height;
                        
                        return (
                          <div
                            key={i}
                            onPointerDown={handlePointerDown(i)}
                            className="absolute w-9 h-9 bg-white border-4 border-emerald-500 rounded-full cursor-move shadow-lg hover:scale-110 active:scale-125 transition-transform"
                            style={{
                              left: `${x}px`,
                              top: `${y}px`,
                              transform: 'translate(-50%, -50%)',
                              zIndex: 50,
                              touchAction: 'none',
                              pointerEvents: 'auto'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-center pt-2">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={retakeScan}
                      className="min-w-[140px]"
                    >
                      <RotateCw className="h-5 w-5 mr-2" />
                      Reprendre
                    </Button>
                    
                    <Button
                      size="lg"
                      onClick={rescanWithEditedCorners}
                      disabled={loading}
                      className="min-w-[200px]"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Valider le recadrage
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Étape 4 : Résultat du scan */}
          {step === 'result' && scannedImage && (
            <div className="space-y-4">
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={scannedImage}
                  alt="Document scanné"
                  className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                />
              </div>
              
              <div className="flex gap-3 justify-center pt-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={retakeScan}
                  className="min-w-[130px]"
                >
                  <RotateCw className="h-5 w-5 mr-2" />
                  Reprendre
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={editCorners}
                  className="min-w-[130px]"
                >
                  <Crop className="h-5 w-5 mr-2" />
                  Recadrer
                </Button>
                
                <Button
                  size="lg"
                  onClick={handleValidate}
                  className="min-w-[180px]"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Utiliser ce scan
                </Button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default DocumentScanner;