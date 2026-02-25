import { useState, useEffect } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Folder } from '@/types';

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, parentId: number | null) => Promise<void>;
  folders?: Folder[];
  defaultParentId?: number | null;
}

export default function CreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  folders,
  defaultParentId = null,
}: CreateFolderDialogProps) {
  const safefolders = Array.isArray(folders) ? folders : [];
  const [folderName, setFolderName] = useState('');
  const [selectedParent, setSelectedParent] = useState<string>(
    defaultParentId !== null ? defaultParentId.toString() : 'root'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFolderName('');
      setSelectedParent(defaultParentId !== null ? defaultParentId.toString() : 'root');
    }
  }, [open, defaultParentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) return;

    setIsSubmitting(true);
    try {
      const parentId = selectedParent === 'root' ? null : parseInt(selectedParent);
      await onSubmit(folderName.trim(), parentId);
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Créer un nouveau dossier
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau dossier pour organiser vos documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nom du dossier *</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Nom du dossier"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-folder">Emplacement</Label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger id="parent-folder">
                  <SelectValue placeholder="Sélectionner un dossier parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">📁 Racine</SelectItem>
                  {safefolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      📂 {folder.name}
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
            <Button type="submit" disabled={!folderName.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
