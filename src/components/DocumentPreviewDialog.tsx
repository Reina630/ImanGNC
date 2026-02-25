import { X, Download, FileText, Image as ImageIcon, FileSpreadsheet, File, Presentation, ScanLine, ExternalLink, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Document } from "@/types";
import documentService from "@/services/documentService";
import { useState, useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";
import * as XLSX from 'xlsx';
import '@/styles/document-preview.css';
import { RequestAccessDialog } from './RequestAccessDialog';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentPreviewDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper pour formater la taille
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "0 Ko";
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
};

// Helper pour formater la date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Construire l'URL du fichier media
const getFileUrl = (filePath: string) => {
  // Si le chemin est déjà une URL complète, la retourner telle quelle
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  // Enlever /api de la fin si présent
  const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '');
  
  // Enlever le préfixe /media/ du filePath s'il existe déjà
  const cleanFilePath = filePath.replace(/^\/media\//, '');
  
  return `${cleanBaseUrl}/media/${cleanFilePath}`;
};

export function DocumentPreviewDialog({ document, open, onOpenChange }: DocumentPreviewDialogProps) {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [excelHtml, setExcelHtml] = useState<string>('');
  const [wordLoading, setWordLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [requestAccessOpen, setRequestAccessOpen] = useState(false);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  // Nettoyer quand le dialog se ferme
  useEffect(() => {
    if (!open) {
      setWordLoading(false);
      setExcelLoading(false);
      setExcelHtml('');
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = '';
      }
    }
  }, [open]);

  // Charger et rendre le fichier Word
  useEffect(() => {
    const loadWordFile = async () => {
      if (document?.file_type === 'word' && open && docxContainerRef.current) {
        try {
          setWordLoading(true);
          console.log('Début du chargement du document Word...');
          const fileUrl = getFileUrl(document.file);
          console.log('URL du fichier:', fileUrl);
          
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          console.log('Blob chargé, taille:', blob.size, 'bytes');
          
          // Nettoyer le container
          docxContainerRef.current.innerHTML = '';
          console.log('Container nettoyé, début du rendu...');
          
          await renderAsync(blob, docxContainerRef.current, undefined, {
            className: 'docx-preview',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
          });
          
          console.log('Rendu terminé avec succès!');
          console.log('Contenu du container:', docxContainerRef.current.innerHTML.substring(0, 200));
          
          setWordLoading(false);
        } catch (error) {
          console.error('Erreur lors du chargement du fichier Word:', error);
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-red-500 text-sm p-4">Erreur lors du chargement du document Word</p></div>';
          }
          setWordLoading(false);
        }
      }
    };
    
    loadWordFile();
  }, [document?.file_type, document?.file, open]);

  // Charger et rendre le fichier Excel
  useEffect(() => {
    const loadExcelFile = async () => {
      if (document?.file_type === 'excel' && open) {
        try {
          setExcelLoading(true);
          console.log('Début du chargement du fichier Excel...');
          const fileUrl = getFileUrl(document.file);
          console.log('URL du fichier:', fileUrl);
          
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          console.log('ArrayBuffer chargé, taille:', arrayBuffer.byteLength, 'bytes');
          
          const workbook = XLSX.read(arrayBuffer);
          console.log('Workbook chargé, feuilles:', workbook.SheetNames);
          
          let html = '';
          workbook.SheetNames.forEach((sheetName, index) => {
            const worksheet = workbook.Sheets[sheetName];
            html += `<div class="mb-4">
              <h3 class="text-sm font-semibold mb-2 px-2 py-1 bg-muted rounded">${sheetName}</h3>
              ${XLSX.utils.sheet_to_html(worksheet, { id: `sheet-${index}` })}
            </div>`;
          });
          
          console.log('HTML généré, longueur:', html.length);
          setExcelHtml(html);
          setExcelLoading(false);
        } catch (error) {
          console.error('Erreur lors du chargement du fichier Excel:', error);
          setExcelHtml('<p class="text-red-500 text-sm p-4">Erreur lors du chargement du fichier</p>');
          setExcelLoading(false);
        }
      }
    };
    loadExcelFile();
  }, [document?.file_type, document?.file, open]);

  if (!document) return null;

  const fileUrl = getFileUrl(document.file);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.title;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    } finally {
      setDownloading(false);
    }
  };

  const renderPreview = () => {
    switch (document.file_type) {
      case "pdf":
        return (
          <div className="h-[600px] bg-muted/30 rounded-lg overflow-hidden">
            <iframe
              src={fileUrl}
              className="w-full h-full"
              title={document.title}
            />
          </div>
        );
      case "image":
        return (
          <div className="flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden">
            <img
              src={fileUrl}
              alt={document.title}
              className="max-h-[600px] w-auto object-contain"
            />
          </div>
        );
      case "word":
        return (
          <div className="h-[600px] bg-white rounded-lg overflow-auto p-4 relative">
            <div 
              ref={docxContainerRef}
              className="docx-wrapper"
              style={{ minHeight: '500px' }}
            />
            {wordLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="animate-pulse flex flex-col items-center">
                  <File className="h-12 w-12 text-info mb-2" />
                  <p className="text-sm text-muted-foreground">Chargement du document...</p>
                </div>
              </div>
            )}
          </div>
        );
      case "excel":
        return (
          <div className="h-[600px] bg-white rounded-lg overflow-auto p-4 relative">
            {excelHtml && (
              <div 
                dangerouslySetInnerHTML={{ __html: excelHtml }}
                className="excel-preview"
              />
            )}
            {excelLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="animate-pulse flex flex-col items-center">
                  <FileSpreadsheet className="h-12 w-12 text-success mb-2" />
                  <p className="text-sm text-muted-foreground">Chargement de la feuille...</p>
                </div>
              </div>
            )}
          </div>
        );
      case "ppt":
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-lg">
            <Presentation className="h-20 w-20 text-orange-500 mb-4" />
            <p className="text-sm font-medium mb-2">Présentation PowerPoint</p>
            <p className="text-xs text-muted-foreground mb-4">
              Aperçu non disponible pour les présentations
            </p>
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Téléchargement...' : 'Télécharger pour ouvrir'}
            </Button>
          </div>
        );
      case "scan":
        return (
          <div className="flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden">
            <img
              src={fileUrl}
              alt={document.title}
              className="max-h-[600px] w-auto object-contain"
            />
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-muted/30 rounded-lg">
            <FileText className="h-20 w-20 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">Aperçu non disponible</p>
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Téléchargement...' : 'Télécharger'}
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{document.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {document.file_type.toUpperCase()} · {formatFileSize(document.file_size)} · {formatDate(document.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {/* Afficher le bouton de demande d'accès si l'utilisateur n'a pas accès */}
              {!document.has_access && user?.id !== document.owner && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setRequestAccessOpen(true)}
                  disabled={document.has_pending_request}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {document.has_pending_request ? 'Demande en attente' : 'Demander l\'accès'}
                </Button>
              )}
              
              <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading}>
                <Download className="h-4 w-4 mr-2" />
                {downloading ? 'Téléchargement...' : 'Télécharger'}
              </Button>
              {(document.file_type === 'pdf' || document.file_type === 'image') && (
                <Button size="sm" variant="outline" asChild>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {renderPreview()}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Propriétaire : {document.owner_name}</p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {document.tag_list && document.tag_list.length > 0 && document.tag_list.map((tag) => (
                <span key={tag.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Dialog de demande d'accès */}
      <RequestAccessDialog
        document={document}
        open={requestAccessOpen}
        onOpenChange={setRequestAccessOpen}
        onRequestSent={() => {
          // On pourrait recharger le document pour mettre à jour has_pending_request
          // Mais pour simplifier, on ferme juste le dialog
        }}
      />
    </Dialog>
  );
}
