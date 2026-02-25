import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { shareService } from '@/services';
import { toast } from '@/hooks/use-toast';
import { Eye, Edit, Loader2 } from 'lucide-react';
import type { Document } from '@/types';

interface RequestAccessDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestSent?: () => void;
}

export function RequestAccessDialog({
  document,
  open,
  onOpenChange,
  onRequestSent,
}: RequestAccessDialogProps) {
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    try {
      setLoading(true);
      await shareService.createShareRequest({
        document: document.id,
        requested_permission: permission,
        message: message.trim(),
      });

      toast({
        title: 'Demande envoyée',
        description: `Votre demande d'accès a été envoyée au propriétaire du document.`,
      });

      // Reset form
      setMessage('');
      setPermission('view');
      onOpenChange(false);
      onRequestSent?.();
    } catch (error: any) {
      console.error('Erreur:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Impossible d\'envoyer la demande';
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Demander l'accès au document</DialogTitle>
            <DialogDescription>
              Envoyez une demande d'accès pour <strong>{document.title}</strong>
              <br />
              Propriétaire: <strong>{document.owner_name}</strong>
              {document.access_request_status === 'rejected' && (
                <>
                  <br />
                  <span className="text-destructive text-xs mt-1 inline-block">
                    {(document.access_request_rejection_count ?? 0) >= 3
                      ? 'Vous avez atteint le nombre maximum de tentatives (3).'
                      : `Votre demande a été refusée ${document.access_request_rejection_count} fois. Il vous reste ${3 - (document.access_request_rejection_count ?? 0)} tentative(s).`
                    }
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Permission */}
            <div className="space-y-3">
              <Label>Type d'accès demandé</Label>
              <RadioGroup value={permission} onValueChange={(v) => setPermission(v as 'view' | 'edit')}>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="view" id="view" />
                  <Label htmlFor="view" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Lecture seule</div>
                      <div className="text-xs text-muted-foreground">
                        Vous pourrez consulter le document
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="edit" id="edit" />
                  <Label htmlFor="edit" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Lecture et modification</div>
                      <div className="text-xs text-muted-foreground">
                        Vous pourrez consulter et modifier le document
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Message (optionnel)
              </Label>
              <Textarea
                id="message"
                placeholder="Expliquez pourquoi vous avez besoin d'accéder à ce document..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer la demande
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
