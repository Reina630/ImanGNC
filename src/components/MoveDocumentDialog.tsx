
import { useState, useEffect } from 'react';
import { Move, Loader2, FolderOpen, Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Document, Folder } from '@/types';
import { useToast } from '@/hooks/use-toast';
import documentService from '@/services/documentService';

interface MoveDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  folders: Folder[];
  onDocumentMoved?: () => void;
}

export function MoveDocumentDialog({
  open,
  onOpenChange,
  document,
  folders,
  onDocumentMoved,
}: MoveDocumentDialogProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>('root');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (document && open) {
      setSelectedFolder(document.folder !== null ? document.folder.toString() : 'root');
    }
  }, [document, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document) return;

    setIsSubmitting(true);
    try {
      const folderId = selectedFolder === 'root' ? null : parseInt(selectedFolder);
      await documentService.moveToFolder(document.id, folderId);
      
      toast({
        title: 'Succès',
        description: folderId ? 'Document déplacé avec succès' : 'Document déplacé à la racine',
      });
      
      onDocumentMoved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors du déplacement du document:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de déplacer le document',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="h-5 w-5 text-primary" />
            Déplacer le document
          </DialogTitle>
          <DialogDescription>
            Choisissez le dossier de destination pour "{document?.title}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="destination-folder">Dossier de destination</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger id="destination-folder">
                  <SelectValue placeholder="Sélectionner un dossier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>Racine (Aucun dossier)</span>
                    </div>
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-amber-500" />
                        <span>{folder.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Déplacement...
                </>
              ) : (
                <>
                  <Move className="mr-2 h-4 w-4" />
                  Déplacer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
