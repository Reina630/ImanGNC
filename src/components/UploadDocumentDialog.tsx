import { Upload, X, FileText, Loader2, FolderOpen, Home } from "lucide-react";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUploadDocument } from "@/services";
import { useAllFolders } from "@/hooks/useFolders";
import TagInput from "@/components/TagInput";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFiles?: File[];
  initialFolderId?: number | null;
}

export function UploadDocumentDialog({ open, onOpenChange, initialFiles, initialFolderId }: UploadDocumentDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>(initialFiles || []);
  const [fileType, setFileType] = useState("");
  const [folder, setFolder] = useState<string>("root");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadMutation = useUploadDocument();
  const { folders, refresh: refreshFolders } = useAllFolders();

  // Debug: afficher le nombre de dossiers chargés
  useEffect(() => {
    console.log('📁 Dossiers disponibles (Upload):', folders.length, folders);
  }, [folders]);

  // Rafraîchir la liste des dossiers quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      console.log('🔄 Rafraîchissement des dossiers (Upload)...');
      refreshFolders();
    }
  }, [open, refreshFolders]);

  // Pré-sélectionner le dossier si initialFolderId est fourni
  useEffect(() => {
    if (open && initialFolderId !== undefined) {
      setFolder(initialFolderId === null ? 'root' : initialFolderId.toString());
      console.log('📂 Dossier pré-sélectionné:', initialFolderId);
    }
  }, [open, initialFolderId]);

  // Mettre à jour les fichiers quand initialFiles change
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setSelectedFiles(initialFiles);
    }
  }, [initialFiles]);

  // Empêcher le comportement par défaut du navigateur pour le drag and drop
  useEffect(() => {
    if (open) {
      const preventDefaults = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };
      
      window.addEventListener('dragover', preventDefaults);
      window.addEventListener('drop', preventDefaults);
      
      return () => {
        window.removeEventListener('dragover', preventDefaults);
        window.removeEventListener('drop', preventDefaults);
      };
    }
  }, [open]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  // Gestionnaires pour le drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Vérifier que nous quittons vraiment la zone de drop, pas un enfant
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif'].includes(ext || '');
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
    }
  };

  const detectFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'doc':
      case 'docx': return 'word';
      case 'xls':
      case 'xlsx': return 'excel';
      case 'ppt':
      case 'pptx': return 'ppt';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image';
      default: return 'pdf';
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;

    // Upload chaque fichier
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, "")); // Nom sans extension
      formData.append('file_type', fileType || detectFileType(file.name));
      
      // Ajouter le dossier si sélectionné (null si root)
      if (folder && folder !== 'root') {
        formData.append('folder', folder);
      }
      
      // Ajouter les tags - envoyer comme string JSON
      if (selectedTags.length > 0) {
        console.log('Tags sélectionnés:', selectedTags);
        formData.append('tags', JSON.stringify(selectedTags));
      }

      // Log pour debug
      console.log('FormData à envoyer:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      try {
        await uploadMutation.mutateAsync(formData);
      } catch (error) {
        console.error('Erreur upload:', error);
        // Continue avec les autres fichiers
      }
    }
    
    setSelectedTags([]);
    
    // Réinitialiser et fermer
    setSelectedFiles([]);
    setFileType("");
    setFolder("root");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importer des documents</DialogTitle>
          <DialogDescription>
            Sélectionnez un ou plusieurs fichiers à importer dans votre espace documentaire
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${
              isDragging ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <p className="text-sm font-medium mb-1">
              {isDragging ? 'Déposez vos fichiers ici' : 'Cliquez pour sélectionner des fichiers'}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {isDragging ? 'Relâchez pour ajouter les fichiers' : 'ou glissez-déposez vos fichiers ici'}
            </p>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden" 
            />
            <div className="flex flex-wrap gap-2 justify-center mt-3 pt-3 border-t border-border">
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">PDF</span>
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Word</span>
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Excel</span>
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">PowerPoint</span>
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Images</span>
            </div>
          </div>

          {/* Liste des fichiers sélectionnés */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Fichiers sélectionnés ({selectedFiles.length})</label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(file.size / 1024).toFixed(1)} Ko
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="p-1 hover:bg-background rounded transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="file-type">Type de document</Label>
              <select 
                id="file-type"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              >
                <option value="">Sélectionner un type</option>
                <option value="pdf">PDF</option>
                <option value="word">Word (DOCX)</option>
                <option value="excel">Excel (XLSX)</option>
                <option value="ppt">PowerPoint (PPTX)</option>
                <option value="image">Image (JPEG, PNG)</option>
                <option value="scan">Document scanné</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder-destination">Dossier de destination</Label>
              <Select value={folder} onValueChange={setFolder}>
                <SelectTrigger id="folder-destination">
                  <SelectValue placeholder="Sélectionner un dossier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>Racine</span>
                    </div>
                  </SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-amber-500" />
                        <span>{f.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <TagInput
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={uploadMutation.isPending}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importer {selectedFiles.length > 0 && `(${selectedFiles.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}