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
import { Folder } from '@/types';

interface MoveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: Folder | null;
  folders: Folder[];
  onSubmit: (id: number, newParentId: number | null) => Promise<void>;
}

export default function MoveFolderDialog({
  open,
  onOpenChange,
  folder,
  folders,
  onSubmit,
}: MoveFolderDialogProps) {
  const [selectedParent, setSelectedParent] = useState<string>('root');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrer les dossiers pour exclure le dossier actuel et ses sous-dossiers
  const safefolders = Array.isArray(folders) ? folders : [];
  const availableFolders = safefolders.filter((f) => {
    if (!folder) return true;
    // Exclure le dossier lui-même
    if (f.id === folder.id) return false;
    // Exclure ses sous-dossiers (on pourrait améliorer ça avec une vérification récursive)
    if (f.parent === folder.id) return false;
    return true;
  });

  useEffect(() => {
    if (folder && open) {
      setSelectedParent(folder.parent !== null ? folder.parent.toString() : 'root');
    }
  }, [folder, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folder) return;

    setIsSubmitting(true);
    try {
      const newParentId = selectedParent === 'root' ? null : parseInt(selectedParent);
      await onSubmit(folder.id, newParentId);
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors du déplacement du dossier:', error);
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
            Déplacer le dossier
          </DialogTitle>
          <DialogDescription>
            Choisissez le nouvel emplacement pour le dossier "{folder?.name}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="destination-folder">Dossier de destination</Label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger id="destination-folder">
                  <SelectValue placeholder="Sélectionner un dossier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>Racine</span>
                    </div>
                  </SelectItem>
                  {availableFolders.map((f) => (
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
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Déplacer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
