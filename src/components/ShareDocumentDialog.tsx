import { useState, useEffect } from "react";
import { X, UserPlus, Trash2, Eye, Edit, Globe, Lock, Users as UsersIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";
import type { Document, DocumentShare, User } from "@/types";

interface ShareDocumentDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUpdated?: () => void;
}

export function ShareDocumentDialog({
  document,
  open,
  onOpenChange,
  onDocumentUpdated,
}: ShareDocumentDialogProps) {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPermission, setSelectedPermission] = useState<"view" | "edit">("view");
  const [visibility, setVisibility] = useState<"private" | "shared" | "public">("private");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && document) {
      setVisibility(document.visibility || "private");
      loadAvailableUsers();
    }
  }, [open, document]);

  const loadAvailableUsers = async () => {
    try {
      const users = await documentService.getAvailableUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger la liste des utilisateurs",
      });
    }
  };

  const handleShare = async () => {
    if (!document || !selectedUserId) return;

    setIsLoading(true);
    try {
      await documentService.shareDocument(
        document.id,
        [parseInt(selectedUserId)],
        selectedPermission
      );

      toast({
        title: "Succès",
        description: "Document partagé avec succès",
      });

      setSelectedUserId("");
      onDocumentUpdated?.();
    } catch (error) {
      console.error("Erreur lors du partage:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de partager le document",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnshare = async (userId: number) => {
    if (!document) return;

    try {
      await documentService.unshareDocument(document.id, userId);

      toast({
        title: "Succès",
        description: "Partage retiré avec succès",
      });

      onDocumentUpdated?.();
    } catch (error) {
      console.error("Erreur lors du retrait du partage:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de retirer le partage",
      });
    }
  };

  const handleVisibilityChange = async (newVisibility: "private" | "shared" | "public") => {
    if (!document) return;

    try {
      await documentService.updateVisibility(document.id, newVisibility);
      setVisibility(newVisibility);

      toast({
        title: "Succès",
        description: "Visibilité mise à jour avec succès",
      });

      onDocumentUpdated?.();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la visibilité:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour la visibilité",
      });
    }
  };

  if (!document) return null;

  const getVisibilityIcon = (vis: string) => {
    switch (vis) {
      case "public":
        return <Globe className="h-4 w-4" />;
      case "shared":
        return <UsersIcon className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getVisibilityLabel = (vis: string) => {
    switch (vis) {
      case "public":
        return "Public";
      case "shared":
        return "Partagé";
      default:
        return "Privé";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Partager "{document.title}"</DialogTitle>
          <DialogDescription>
            Gérez qui peut accéder à ce document et leurs permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visibilité du document */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Visibilité du document</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={visibility === "private" ? "default" : "outline"}
                className="justify-start"
                onClick={() => handleVisibilityChange("private")}
              >
                <Lock className="h-4 w-4 mr-2" />
                Privé
              </Button>
              <Button
                variant={visibility === "shared" ? "default" : "outline"}
                className="justify-start"
                onClick={() => handleVisibilityChange("shared")}
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Partagé
              </Button>
              <Button
                variant={visibility === "public" ? "default" : "outline"}
                className="justify-start"
                onClick={() => handleVisibilityChange("public")}
              >
                <Globe className="h-4 w-4 mr-2" />
                Public
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {visibility === "private" && "Seulement vous pouvez voir ce document"}
              {visibility === "shared" && "Partagé avec des utilisateurs spécifiques"}
              {visibility === "public" && "Tous les utilisateurs peuvent voir ce document"}
            </p>
          </div>

          {/* Partager avec des utilisateurs spécifiques */}
          {visibility === "shared" && (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium">Ajouter des personnes</label>
                <div className="flex gap-2">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sélectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers
                        .filter(
                          (user) =>
                            !document.shares?.some((share) => share.shared_with === user.id)
                        )
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} ({user.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedPermission} onValueChange={(v: "view" | "edit") => setSelectedPermission(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Lecture
                        </div>
                      </SelectItem>
                      <SelectItem value="edit">
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Édition
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleShare}
                    disabled={!selectedUserId || isLoading}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </div>

              {/* Liste des personnes avec qui c'est partagé */}
              {document.shares && document.shares.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Partagé avec ({document.shares.length})
                  </label>
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {document.shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-3 hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{share.shared_with_username}</p>
                          <p className="text-xs text-muted-foreground">{share.shared_with_email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={share.permission === "edit" ? "default" : "secondary"}>
                            {share.permission === "edit" ? (
                              <>
                                <Edit className="h-3 w-3 mr-1" />
                                Édition
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Lecture
                              </>
                            )}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnshare(share.shared_with)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
