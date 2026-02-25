import { useState, useEffect } from "react";
import { Pencil, Loader2, FolderOpen, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/hooks/useFolders";
import documentService from "@/services/documentService";
import TagInput from "@/components/TagInput";
import type { Document } from "@/types";

interface EditDocumentDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUpdated?: () => void;
}

export function EditDocumentDialog({ document, open, onOpenChange, onDocumentUpdated }: EditDocumentDialogProps) {
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState<string>("root");
  const [tags, setTags] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { folders } = useFolders();

  useEffect(() => {
    if (document && open) {
      setTitle(document.title);
      setTags(document.tags || []);
      setFolder(document.folder ? document.folder.toString() : "root");
    }
  }, [document, open]);

  const handleSubmit = async () => {
    if (!document || !title.trim()) return;

    setIsSubmitting(true);
    try {
      await documentService.updateDocument(document.id, {
        title: title.trim(),
        tags: tags,
        folder: folder === "root" ? null : parseInt(folder),
      });

      toast({
        title: "Succès",
        description: "Document mis à jour avec succès",
      });

      onDocumentUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la mise à jour du document",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Modifier le document
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations du document
          </DialogDescription>
        </DialogHeader>
        
        {document && (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="document-title">Nom du document *</Label>
                <Input 
                  id="document-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nom du document"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-folder">Dossier</Label>
                <Select value={folder} onValueChange={setFolder}>
                  <SelectTrigger id="document-folder">
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

              {/* Tags */}
              <TagInput
                selectedTags={tags}
                onChange={setTags}
              />
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
              <Button type="submit" disabled={!title.trim() || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
