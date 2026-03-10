import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  HardDrive,
  Trash2,
  RotateCcw,
  Download,
  Eye,
  History,
  Clock,
  Folder,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import documentService from '@/services/documentService';

interface DocumentVersion {
  id: number;
  version_number: number;
  created_at: string;
  updated_by: string;
  file_url: string;
  file_name: string;
}

interface ArchivedDocument {
  id: number;
  title: string;
  file_type: string;
  file_size: number;
  owner: any;
  folder: any | null;
  tags: any[];
  deleted_at: string;
  deleted_by: any;
  created_at: string;
  updated_at: string;
  visibility: string;
}

export default function ArchivedDocumentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<ArchivedDocument | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreVersionDialogOpen, setRestoreVersionDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);

  useEffect(() => {
    loadDocumentDetails();
    loadVersions();
  }, [id]);

  const loadDocumentDetails = async () => {
    try {
      setLoading(true);
      if (!id) return;
      
      const doc = await documentService.getDocument(parseInt(id));
      setDocument(doc as ArchivedDocument);
    } catch (error) {
      console.error('Erreur lors du chargement du document:', error);
      toast.error('Erreur lors du chargement du document');
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      if (!id) return;
      
      const versionsList = await documentService.getDocumentVersions(parseInt(id));
      setVersions(versionsList);
    } catch (error) {
      console.error('Erreur lors du chargement des versions:', error);
      toast.error('Erreur lors du chargement des versions');
    }
  };

  const handleRestore = async () => {
    try {
      if (!id) return;
      
      await documentService.restoreDocument(parseInt(id));
      toast.success('Document restauré avec succès');
      navigate('/documents');
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      toast.error('Erreur lors de la restauration du document');
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    try {
      if (!id) return;
      
      await documentService.restoreDocumentVersion(parseInt(id), versionId);
      toast.success('Version restaurée avec succès');
      loadDocumentDetails();
      loadVersions();
      setRestoreVersionDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la restauration de la version:', error);
      toast.error('Erreur lors de la restauration de la version');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !document) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/archives/documents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux archives
          </Button>
        </div>
        <Button onClick={() => setRestoreDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurer le document
        </Button>
      </div>

      {/* Bannière d'avertissement */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Trash2 className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-900">Document archivé</h3>
            <p className="text-sm text-amber-700 mt-1">
              Ce document a été supprimé le {formatDate(document.deleted_at)} par{' '}
              {document.deleted_by.first_name} {document.deleted_by.last_name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails du document */}
          <div className="stat-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations du document
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Titre</label>
                <p className="text-lg font-medium mt-1">{document.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Propriétaire
                  </label>
                  <p className="mt-1">
                    {document.owner.first_name} {document.owner.last_name}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    Taille
                  </label>
                  <p className="mt-1">{formatFileSize(document.file_size)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date de création
                  </label>
                  <p className="mt-1">{formatDate(document.created_at)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Dernière modification
                  </label>
                  <p className="mt-1">{formatDate(document.updated_at)}</p>
                </div>
              </div>

              {document.folder && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    Dossier
                  </label>
                  <p className="mt-1">{document.folder.name}</p>
                </div>
              )}

              {document.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2">
                    <Tag className="h-3 w-3" />
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Historique des versions */}
          <div className="stat-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des versions ({versions.length})
            </h2>

            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`p-4 rounded-lg border ${
                    index === 0 ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          index === 0
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        v{version.version_number}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{version.file_name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {version.updated_by}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(version.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {index !== 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVersion(version);
                            setRestoreVersionDialogOpen(true);
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restaurer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barre latérale - Actions rapides */}
        <div className="space-y-4">
          <div className="stat-card">
            <h3 className="font-semibold mb-3">Actions</h3>
            <div className="space-y-2">
              <Button
                onClick={() => setRestoreDialogOpen(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurer le document
              </Button>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="font-semibold mb-3">Visibilité</h3>
            <p className="text-sm text-muted-foreground">
              {document.visibility === 'private' && 'Privé'}
              {document.visibility === 'shared' && 'Partagé'}
              {document.visibility === 'public' && 'Public'}
            </p>
          </div>
        </div>
      </div>

      {/* Dialog de confirmation de restauration du document */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurer le document ?</DialogTitle>
            <DialogDescription>
              Le document "{document.title}" sera restauré et redeviendra accessible dans vos
              documents.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRestore} className="bg-green-600 hover:bg-green-700">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de restauration de version */}
      <Dialog open={restoreVersionDialogOpen} onOpenChange={setRestoreVersionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurer cette version ?</DialogTitle>
            <DialogDescription>
              La version {selectedVersion?.version_number} sera restaurée comme nouvelle version du
              document. L'historique sera conservé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreVersionDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => selectedVersion && handleRestoreVersion(selectedVersion.id)}
              className="bg-primary"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurer cette version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
