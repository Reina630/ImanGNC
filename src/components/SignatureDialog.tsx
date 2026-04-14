import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSignature, Lock, Move, CheckCheck, AlertTriangle } from "lucide-react";
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

  useEffect(() => {
    if (open) {
      setStep("password");
      setPassword("");
      setSignatureSize({ width: 200, height: 80 });
    }
  }, [open]);

  useEffect(() => {
    if (step === "placement" && containerRef.current) {
      const container = containerRef.current;
      const centerX = (container.clientWidth - 200) / 2;
      setSignaturePosition({ x: centerX, y: 120 });
    }
  }, [step]);

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast.error("Veuillez entrer votre mot de passe");
      return;
    }
    setIsVerifying(true);
    try {
      const isValid = await authService.verifySignaturePassword(password);
      if (isValid) {
        setStep("placement");
      } else {
        toast.error("Mot de passe incorrect");
        setPassword("");
      }
    } catch {
      toast.error("Erreur lors de la vérification du mot de passe");
      setPassword("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmSignature = () => {
    onSign({ password, position: signaturePosition, size: signatureSize });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setPassword("");
    setStep("password");
    onOpenChange(false);
  };

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

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let w = startWidth, h = startHeight, px = startPosX, py = startPosY;

      if (corner === 'se') { w = startWidth + dx; h = startHeight + dy; }
      else if (corner === 'sw') { w = startWidth - dx; h = startHeight + dy; px = startPosX + (startWidth - w); }
      else if (corner === 'ne') { w = startWidth + dx; h = startHeight - dy; py = startPosY + (startHeight - h); }
      else if (corner === 'nw') { w = startWidth - dx; h = startHeight - dy; px = startPosX + (startWidth - w); py = startPosY + (startHeight - h); }

      w = Math.min(500, Math.max(80, w));
      h = Math.min(200, Math.max(30, h));
      setSignatureSize({ width: w, height: h });
      setSignaturePosition({ x: px, y: py });
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
      <DialogContent className={step === "placement" ? "max-w-6xl p-0 gap-0 overflow-hidden" : "max-w-md"}>
        {step === "password" ? (
          /* ── Étape 1 : mot de passe ── */
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-slate-600" />
                Authentification pour signature
              </DialogTitle>
            </DialogHeader>

            {!signatureUrl && (
              <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Signature non configurée</p>
                  <p className="text-xs text-amber-700 mt-0.5">Configurez votre signature dans vos paramètres de profil avant de continuer.</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="sig-password" className="text-sm">Mot de passe de signature</Label>
              <Input
                id="sig-password"
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                autoFocus
              />
              <p className="text-xs text-slate-500">Ce mot de passe authentifie votre signature électronique.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>Annuler</Button>
              <Button size="sm" onClick={handlePasswordSubmit} disabled={isVerifying}>
                {isVerifying ? "Vérification…" : "Continuer →"}
              </Button>
            </div>
          </div>
        ) : (
          /* ── Étape 2 : placement ── */
          <div className="flex h-[90vh]">
            {/* Document (gauche) */}
            <div
              ref={containerRef}
              className="relative flex-1 overflow-auto bg-slate-200"
            >
              <div className="relative w-full" style={{ minHeight: "1200px" }}>
                <iframe
                  src={pdfUrl}
                  className="w-full absolute inset-0 pointer-events-none"
                  style={{ height: "1200px" }}
                  title="Document à signer"
                />

                {signatureUrl ? (
                  <Draggable
                    position={signaturePosition}
                    onDrag={(_, data) => { setSignaturePosition({ x: data.x, y: data.y }); setIsDragging(true); }}
                    onStop={() => setIsDragging(false)}
                    disabled={isResizing}
                  >
                    <div
                      ref={signatureRef}
                      className="absolute z-10"
                      style={{
                        width: `${signatureSize.width}px`,
                        height: `${signatureSize.height}px`,
                        cursor: isResizing ? 'crosshair' : 'move',
                      }}
                    >
                      {/* Bordure de sélection */}
                      <div
                        className="w-full h-full rounded border-2 border-dashed border-blue-500 bg-blue-50/20 flex items-center justify-center"
                        style={{ opacity: isDragging ? 0.75 : 1 }}
                      >
                        <img
                          src={signatureUrl}
                          alt="Signature"
                          className="max-w-full max-h-full object-contain pointer-events-none select-none"
                          draggable={false}
                        />
                      </div>

                      {/* Poignées de redimensionnement — toujours visibles */}
                      {(['nw','ne','sw','se'] as const).map((corner) => {
                        const posStyle: React.CSSProperties = {
                          position: 'absolute',
                          width: 10, height: 10,
                          background: '#3b82f6',
                          border: '2px solid white',
                          borderRadius: 2,
                          zIndex: 20,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          ...(corner.includes('n') ? { top: -5 } : { bottom: -5 }),
                          ...(corner.includes('w') ? { left: -5 } : { right: -5 }),
                          cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
                        };
                        return (
                          <div
                            key={corner}
                            style={posStyle}
                            onMouseDown={(e) => handleResizeStart(e, corner)}
                          />
                        );
                      })}
                    </div>
                  </Draggable>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-center">
                      <FileSignature className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-amber-800">Aucune signature configurée</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Panneau latéral droit */}
            <div className="w-64 shrink-0 flex flex-col border-l border-slate-200 bg-white">
              <div className="p-4 border-b border-slate-100">
                <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileSignature className="h-4 w-4 text-slate-600" />
                  Placement de la signature
                </DialogTitle>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Aperçu signature */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Aperçu</p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-2" style={{ height: 80 }}>
                    {signatureUrl
                      ? <img src={signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                      : <p className="text-xs text-slate-400">Non configurée</p>
                    }
                  </div>
                </div>

                {/* Instructions */}
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-700 text-xs font-medium">
                    <Move className="h-3.5 w-3.5" /> Déplacer
                  </div>
                  <p className="text-xs text-blue-600">Faites glisser la signature sur le document.</p>
                  <div className="flex items-center gap-1.5 text-blue-700 text-xs font-medium mt-1">
                    <span className="text-[10px] font-bold">⤡</span> Redimensionner
                  </div>
                  <p className="text-xs text-blue-600">Utilisez les coins bleus pour ajuster la taille.</p>
                </div>

                {/* Taille actuelle */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Taille</p>
                  <p className="text-xs text-slate-600">{Math.round(signatureSize.width)} × {Math.round(signatureSize.height)} px</p>
                </div>
              </div>

              {/* Boutons */}
              <div className="p-4 border-t border-slate-100 space-y-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleConfirmSignature}
                  disabled={!signatureUrl}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Valider et signer
                </Button>
                <Button variant="outline" className="w-full" size="sm" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
