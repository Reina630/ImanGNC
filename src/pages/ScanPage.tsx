import { Camera, FileText, Crop, Download, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState } from 'react';
import DocumentScanner from '../components/DocumentScanner';
import { AddCourrierDialog } from '@/components/AddCourrierDialog';

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

export default function ScanPage() {
  const [openScanner, setOpenScanner] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [scannedFile, setScannedFile] = useState<File | null>(null);

  const handleScanComplete = (scannedImage: string) => {
    // Convertir l'image base64 en File
    const file = base64ToFile(scannedImage, `scan_${Date.now()}.jpg`);
    setScannedFile(file);
    
    // Ouvrir le dialogue d'upload avec le fichier pré-rempli
    setOpenUploadDialog(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Scanner un document</h1>
        <p className="text-muted-foreground text-sm">Numérisez vos documents papier et enregistrez-les dans le registre</p>
      </div>

      {/* Bouton principal de scan */}
      <button
        className="stat-card flex items-center justify-center gap-4 cursor-pointer hover:border-primary/20 w-full py-8"
        onClick={() => setOpenScanner(true)}
      >
        <div className="p-4 rounded-lg bg-primary/10">
          <Camera className="h-8 w-8 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-lg font-medium">Scanner un document</p>
          <p className="text-sm text-muted-foreground">Caméra ou image existante</p>
        </div>
      </button>

      {/* Instructions */}
      <div className="stat-card space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Comment ça marche
        </h3>
        <ol className="text-sm text-muted-foreground space-y-2 ml-6 list-decimal">
          <li>Cliquez sur "Scanner un document" ci-dessus</li>
          <li>La caméra s'ouvrira automatiquement (autorisez l'accès si demandé)</li>
          <li>Prenez une photo du document à scanner</li>
          <li>Le document sera détecté, redressé et amélioré automatiquement</li>
          <li>Remplissez les informations du courrier et validez</li>
        </ol>
        <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Sur mobile, positionnez-vous au-dessus du document pour une meilleure qualité. 
            L'application utilisera automatiquement la caméra arrière.
          </p>
        </div>
      </div>

      {/* Scanner Dialog */}
      <DocumentScanner
        open={openScanner}
        onClose={() => setOpenScanner(false)}
        onScanComplete={handleScanComplete}
      />

      {/* Upload Dialog */}
      <AddCourrierDialog
        open={openUploadDialog}
        onOpenChange={setOpenUploadDialog}
        initialFile={scannedFile}
        onSuccess={() => {
          setOpenUploadDialog(false);
          setScannedFile(null);
        }}
      />
    </motion.div>
  );
}
