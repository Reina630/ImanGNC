/**
 * Dialog pour afficher et gérer les versions d'un courrier
 */

import { useState, useEffect } from "react";
import { GitBranch, Download, Eye, Upload, X, CheckCircle2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";

interface CourrierVersionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courrier: Courrier | null;
  onVersionCreated?: () => void;
}

export function CourrierVersionsDialog({
  open,
  onOpenChange,
  courrier,
  onVersionCreated,
}: CourrierVersionsDialogProps) {
  const { toast } = useToast();
  const [versions, setVersions] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [fichier, setFichier] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && courrier) {
      loadVersions();
    }
  }, [open, courrier]);

  const loadVersions = async () => {
    if (!courrier) return;

    try {
      setLoading(true);
      const response = await courrierService.getVersions(courrier.id);
      setVersions(response.versions);
    } catch (error) {
      console.error("Erreur lors du chargement des versions:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les versions",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFichier(e.target.files[0]);
    }
  };

  const handleCreateVersion = async () => {
    if (!courrier || !fichier) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un fichier",
      });
      return;
    }

    try {
      setUploading(true);
      await courrierService.createVersion(courrier.id, fichier, notes);

      toast({
        title: "Succès",
        description: "Nouvelle version créée avec succès",
      });

      // Réinitialiser le formulaire
      setFichier(null);
      setNotes("");
      setShowUpload(false);

      // Recharger les versions
      await loadVersions();

      // Notifier le parent
      if (onVersionCreated) {
        onVersionCreated();
      }
    } catch (error) {
      console.error("Erreur lors de la création de la version:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la nouvelle version",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (version: Courrier) => {
    try {
      await courrierService.telechargerFichier(version.id, version.numero_registre);
      toast({
        title: "Téléchargement lancé",
        description: `Téléchargement de ${version.version_label}`,
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  if (!courrier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-purple-600" />
            <DialogTitle>Versions du courrier</DialogTitle>
          </div>
          <DialogDescription>
            {courrier.numero_registre} - {courrier.objet}
          </DialogDescription>
        </DialogHeader>

        {/* Bouton Nouvelle Version */}
        {!showUpload && (
          <div className="flex justify-end">
            <Button onClick={() => setShowUpload(true)} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Nouvelle version
            </Button>
          </div>
        )}

        {/* Formulaire d'upload */}
        {showUpload && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Créer une nouvelle version</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUpload(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="fichier">Fichier *</Label>
                <Input
                  id="fichier"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                {fichier && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Fichier sélectionné : {fichier.name} ({formatFileSize(fichier.size)})
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes sur cette version..."
                  rows={3}
                  disabled={uploading}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateVersion}
                  disabled={!fichier || uploading}
                  className="flex-1"
                >
                  {uploading ? "Création..." : "Créer la version"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowUpload(false)}
                  disabled={uploading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des versions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            {versions.length} version{versions.length > 1 ? "s" : ""}
          </h4>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des versions...
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune version disponible
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    version.est_version_actuelle
                      ? "border-purple-200 bg-purple-50/50"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Icône de version */}
                  <div
                    className={`p-2 rounded-lg ${
                      version.est_version_actuelle
                        ? "bg-purple-100"
                        : "bg-muted"
                    }`}
                  >
                    <GitBranch
                      className={`h-4 w-4 ${
                        version.est_version_actuelle
                          ? "text-purple-600"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {version.version_label}
                      </span>
                      {version.est_version_actuelle && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actuelle
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(version.created_at).toLocaleString("fr-FR")}
                      </div>
                      {version.enregistre_par_nom && (
                        <div>Par {version.enregistre_par_nom}</div>
                      )}
                      {version.notes && (
                        <div className="italic mt-1">{version.notes}</div>
                      )}
                      <div className="text-muted-foreground">
                        {formatFileSize(version.file_size)} · {version.file_type.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(version)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
