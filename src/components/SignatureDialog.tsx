import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSignature, Lock, MoveHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import Draggable from "react-draggable";
import { authService } from "@/services/authService";

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  signatureUrl?: string | null;
  userName?: string;
  onSign: (signatureData: {
    password: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }) => void;
}

export function SignatureDialog({ open, onOpenChange, pdfUrl, signatureUrl, userName, onSign }: SignatureDialogProps) {
  const [step, setStep] = useState<"password" | "placement">("password");
  const [password, setPassword] = useState("");
  const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 });
  const [signatureSize, setSignatureSize] = useState({ width: 200, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);

  // Reset quand on ouvre le dialogue
  useEffect(() => {
    if (open) {
      setStep("password");
      setPassword("");
      setSignatureSize({ width: 200, height: 80 });
    }
  }, [open]);

  // Centrer la signature quand on passe à l'étape placement
  useEffect(() => {
    if (step === "placement" && containerRef.current) {
      const container = containerRef.current;
      const centerX = (container.clientWidth - signatureSize.width) / 2;
      const centerY = 100; // Position un peu plus haute pour être visible sans scroll
      setSignaturePosition({ x: centerX, y: centerY });
    }
  }, [step, signatureSize]);

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast.error("Veuillez entrer votre mot de passe");
      return;
    }

    setIsVerifying(true);
    try {
      // Vérifier le mot de passe avec l'API
      const isValid = await authService.verifySignaturePassword(password);
      
      if (isValid) {
        // Passer à l'étape de placement
        setStep("placement");
      } else {
        toast.error("Mot de passe incorrect");
        setPassword("");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      toast.error("Erreur lors de la vérification du mot de passe");
      setPassword("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmSignature = () => {
    onSign({
      password,
      position: signaturePosition,
      size: signatureSize,
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setPassword("");
    setStep("password");
    onOpenChange(false);
  };

  // Gestion du redimensionnement
  const handleResizeStart = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = signatureSize.width;
    const startHeight = signatureSize.height;
    const startPosX = signaturePosition.x;
    const startPosY = signaturePosition.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newPosX = startPosX;
      let newPosY = startPosY;

      // Calculer les nouvelles dimensions selon le coin
      if (corner === 'se') {
        // Coin bas-droit
        newWidth = Math.max(100, startWidth + deltaX);
        newHeight = Math.max(40, startHeight + deltaY);
      } else if (corner === 'sw') {
        // Coin bas-gauche
        newWidth = Math.max(100, startWidth - deltaX);
        newHeight = Math.max(40, startHeight + deltaY);
        newPosX = startPosX + (startWidth - newWidth);
      } else if (corner === 'ne') {
        // Coin haut-droit
        newWidth = Math.max(100, startWidth + deltaX);
        newHeight = Math.max(40, startHeight - deltaY);
        newPosY = startPosY + (startHeight - newHeight);
      } else if (corner === 'nw') {
        // Coin haut-gauche
        newWidth = Math.max(100, startWidth - deltaX);
        newHeight = Math.max(40, startHeight - deltaY);
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY + (startHeight - newHeight);
      }

      // Limiter les dimensions maximales
      newWidth = Math.min(500, newWidth);
      newHeight = Math.min(200, newHeight);

      setSignatureSize({ width: newWidth, height: newHeight });
      setSignaturePosition({ x: newPosX, y: newPosY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            {step === "password" ? "Authentification pour signature" : "Placement de la signature"}
          </DialogTitle>
        </DialogHeader>

        {step === "password" ? (
          <div className="space-y-4 py-4">
            {!signatureUrl && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-amber-800">Signature non configurée</h3>
                    <p className="mt-1 text-sm text-amber-700">
                      Vous n'avez pas encore enregistré votre signature électronique. 
                      Veuillez contacter l'administrateur ou configurer votre signature dans vos paramètres de profil.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Mot de passe de signature
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Ce mot de passe authentifie votre signature électronique
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button onClick={handlePasswordSubmit} disabled={isVerifying}>
                {isVerifying ? "Vérification..." : "Continuer"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <MoveHorizontal className="h-4 w-4" />
                Déplacez et redimensionnez votre signature sur le document (glissez les coins pour redimensionner)
              </p>
            </div>

            <div
              ref={containerRef}
              className="relative bg-slate-100 rounded-lg border-2 border-slate-300 overflow-y-auto"
              style={{ height: "70vh", maxHeight: "800px" }}
            >
              {/* PDF en fond - conteneur scrollable */}
              <div className="relative w-full" style={{ minHeight: "1200px" }}>
                <iframe
                  src={pdfUrl}
                  className="w-full absolute inset-0 pointer-events-none"
                  style={{ height: "1200px" }}
                  title="Document à signer"
                />

                {/* Signature draggable - toujours au-dessus du PDF */}
                {signatureUrl ? (
                  <Draggable
                    position={signaturePosition}
                    onDrag={(e, data) => {
                      setSignaturePosition({ x: data.x, y: data.y });
                      setIsDragging(true);
                    }}
                    onStop={() => setIsDragging(false)}
                    disabled={isResizing}
                  >
                    <div
                      ref={signatureRef}
                      className={`absolute z-10 ${
                        isDragging || isResizing ? "opacity-90" : "opacity-100"
                      }`}
                      style={{
                        width: `${signatureSize.width}px`,
                        height: `${signatureSize.height}px`,
                        cursor: isResizing ? 'nwse-resize' : 'move',
                      }}
                    >
                      {/* Conteneur de la signature */}
                      <div className="w-full h-full bg-transparent border border-transparent group-hover:border-blue-400 group-hover:border-dashed rounded flex items-center justify-center p-3 relative">
                        {/* Indicateur de déplacement/redimensionnement */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white rounded px-3 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-lg pointer-events-none">
                          {isResizing ? '⇔ Redimensionner' : '↕ Déplacer'}
                        </div>

                        {/* Image de signature */}
                        <img 
                          src={signatureUrl} 
                          alt="Signature électronique"
                          className="max-w-full max-h-full object-contain pointer-events-none"
                          draggable={false}
                        />

                        {/* Poignées de redimensionnement fonctionnelles */}
                        <div 
                          className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-nw-resize z-20"
                          onMouseDown={(e) => handleResizeStart(e, 'nw')}
                          title="Redimensionner"
                        />
                        <div 
                          className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-ne-resize z-20"
                          onMouseDown={(e) => handleResizeStart(e, 'ne')}
                          title="Redimensionner"
                        />
                        <div 
                          className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-sw-resize z-20"
                          onMouseDown={(e) => handleResizeStart(e, 'sw')}
                          title="Redimensionner"
                        />
                        <div 
                          className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-se-resize z-20"
                          onMouseDown={(e) => handleResizeStart(e, 'se')}
                          title="Redimensionner"
                        />
                      </div>
                    </div>
                  </Draggable>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 shadow-lg max-w-md">
                      <FileSignature className="h-8 w-8 text-amber-600 mb-2 mx-auto" />
                      <p className="text-sm text-amber-800 text-center font-medium">
                        Aucune signature électronique configurée
                      </p>
                      <p className="text-xs text-amber-700 text-center mt-1">
                        Veuillez configurer votre signature dans vos paramètres
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button 
                onClick={handleConfirmSignature} 
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!signatureUrl}
              >
                <FileSignature className="h-4 w-4 mr-2" />
                Valider et signer le document
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
