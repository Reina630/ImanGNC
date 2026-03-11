import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import type { CommentaireCourrier } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface CommentairesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectationId: number | null;
  courrierNumero?: string;
}

export function CommentairesDialog({ 
  open, 
  onOpenChange, 
  affectationId,
  courrierNumero 
}: CommentairesDialogProps) {
  const { toast } = useToast();
  const [commentaires, setCommentaires] = useState<CommentaireCourrier[]>([]);
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && affectationId) {
      chargerCommentaires();
    }
  }, [open, affectationId]);

  const chargerCommentaires = async () => {
    if (!affectationId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/affectations/${affectationId}/commentaires/`);
      setCommentaires(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des commentaires:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les commentaires.",
      });
    } finally {
      setLoading(false);
    }
  };

  const ajouterCommentaire = async () => {
    if (!affectationId || !nouveauCommentaire.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/affectations/${affectationId}/commentaires/`, {
        contenu: nouveauCommentaire.trim(),
      });

      setCommentaires([response.data, ...commentaires]);
      setNouveauCommentaire("");
      
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitiales = (nom: string) => {
    const parts = nom.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nom.substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Commentaires {courrierNumero && `- ${courrierNumero}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : commentaires.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucun commentaire pour le moment</p>
                <p className="text-xs text-muted-foreground mt-1">Soyez le premier à commenter</p>
              </div>
            ) : (
              <div className="space-y-4">
                {commentaires.map((commentaire) => (
                  <div key={commentaire.id} className="flex gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitiales(commentaire.auteur_nom_complet || commentaire.auteur_username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm">{commentaire.auteur_nom_complet || commentaire.auteur_username}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(commentaire.date_creation), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                        {commentaire.contenu}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <Textarea
            placeholder="Écrivez votre commentaire..."
            value={nouveauCommentaire}
            onChange={(e) => setNouveauCommentaire(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={submitting}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Fermer
            </Button>
            <Button 
              onClick={ajouterCommentaire} 
              disabled={submitting || !nouveauCommentaire.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publier
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
