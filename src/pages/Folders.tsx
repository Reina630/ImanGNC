import { useState, useMemo } from 'react';
import {
  FolderPlus,
  Home,
  Search,
  Grid3x3,
  List,
  MoreHorizontal,
  Pencil,
  Trash2,
  Move,
  FileText,
  Download,
  Eye,
  Star,
  StarOff,
  Share2,
  Upload,
  FolderOpen,
  Users,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useFolderTree, useFolders, useFolderContents } from '@/hooks/useFolders';
import { useDocuments, useDeleteDocument, useDuplicateDocument, useDownloadDocument, useToggleFavorite } from '@/services';
import FolderTreeView from '@/components/FolderTreeView';
import { formatFileSize, formatDate, getFileIcon } from '@/lib/utils';
import CreateFolderDialog from '@/components/CreateFolderDialog';
import EditFolderDialog from '@/components/EditFolderDialog';
import MoveFolderDialog from '@/components/MoveFolderDialog';
import { Folder, FolderTree as FolderTreeType, Document } from '@/types';
import { useToast } from '@/hooks/use-toast';
import documentService from '@/services/documentService';
import { ShareDocumentDialog } from '@/components/ShareDocumentDialog';
import { DocumentPreviewDialog } from '@/components/DocumentPreviewDialog';
import { EditDocumentDialog } from '@/components/EditDocumentDialog';
import { MoveDocumentDialog } from '@/components/MoveDocumentDialog';
import { UploadDocumentDialog } from '@/components/UploadDocumentDialog';
import { RequestAccessDialog } from '@/components/RequestAccessDialog';
import { DragDropOverlay } from '@/components/DragDropOverlay';
import { useGlobalDragAndDrop } from '@/hooks/useGlobalDragAndDrop';

export default function Folders() {
  const [activeTab, setActiveTab] = useState<'folders' | 'all' | 'my-docs' | 'shared' | 'favorites'>('folders');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolder, setSelectedFolder] = useState<FolderTreeType | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Dialogs state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<number | null>(null);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);
  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [folderToMove, setFolderToMove] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  
  // Document dialogs
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false);
  const [isMoveDocumentOpen, setIsMoveDocumentOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isRequestAccessOpen, setIsRequestAccessOpen] = useState(false);
  const [showFavoriteAnimation, setShowFavoriteAnimation] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  const { toast } = useToast();

  // Drag and drop global
  const { isDraggingOver } = useGlobalDragAndDrop({
    onFilesDropped: (files) => {
      setUploadFiles(files);
      setIsUploadDialogOpen(true);
    }
  });

  // Hooks
  const { tree, loading: treeLoading, refreshTree } = useFolderTree();
  const { folders: allFolders, createFolder, updateFolder, deleteFolder, moveFolder } = useFolders();
  const { contents, loading: contentsLoading, refreshContents } = useFolderContents(
    activeTab === 'folders' ? (selectedFolder?.id ?? null) : null
  );

  // Document hooks - filtres dynamiques selon l'onglet
  const documentFilters = useMemo(() => {
    const baseFilters: any = {
      search: searchQuery || undefined,
      page: currentPage,
      ordering: '-created_at',
    };

    switch (activeTab) {
      case 'my-docs':
        baseFilters.owned_by_me = true;
        break;
      case 'shared':
        baseFilters.shared_with_me = true;
        break;
      case 'favorites':
        baseFilters.is_favorite = true;
        break;
    }

    return baseFilters;
  }, [activeTab, searchQuery, currentPage]);

  const { data: documentsData, isLoading: documentsLoading, error: documentsError, refetch: refetchDocuments } = useDocuments(
    activeTab !== 'folders' ? documentFilters : {}
  );

  // Document mutations
  const deleteMutation = useDeleteDocument();
  const duplicateMutation = useDuplicateDocument();
  const downloadMutation = useDownloadDocument();
  const toggleFavoriteMutation = useToggleFavorite();

  const documents = documentsData?.results || [];
  const totalPages = documentsData ? Math.ceil(documentsData.count / itemsPerPage) : 1;

  const handleCreateFolder = async (name: string, parentId: number | null) => {
    await createFolder(name, parentId);
    await refreshTree();
    await refreshContents();
  };

  const handleEditFolder = async (id: number, name: string) => {
    await updateFolder(id, { name });
    await refreshTree();
    await refreshContents();
  };

  const handleMoveFolder = async (id: number, parentId: number | null) => {
    await moveFolder(id, parentId);
    await refreshTree();
    await refreshContents();
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    
    try {
      await deleteFolder(folderToDelete.id);
      await refreshTree();
      await refreshContents();
      setIsDeleteFolderOpen(false);
      setFolderToDelete(null);
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  const handleToggleFavorite = async (document: Document) => {
    try {
      const wasNotFavorite = !document.is_favorite;
      await documentService.toggleFavorite(document.id);
      await refreshContents();
      
      // Déclencher l'animation si on vient d'ajouter aux favoris
      if (wasNotFavorite) {
        setShowFavoriteAnimation(true);
        setTimeout(() => setShowFavoriteAnimation(false), 1500);
      }
      
      toast({
        title: 'Succès',
        description: document.is_favorite ? 'Document retiré des favoris' : 'Document ajouté aux favoris',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la modification du favori',
      });
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.title;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors du téléchargement',
      });
    }
  };

  // Filtrer les documents selon la recherche
  const filteredDocuments = contents?.documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const filteredSubfolders = contents?.subfolders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  return (
    <>
      <DragDropOverlay isVisible={isDraggingOver} />
      
      {/* Animation de favori */}
      {showFavoriteAnimation && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: 1,
              ease: "easeInOut",
              times: [0, 0.5, 0.8, 1],
            }}
          >
            <Star 
              className="h-32 w-32 fill-amber-400 text-amber-400 drop-shadow-2xl" 
              style={{
                filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.8))',
              }}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute mt-48 text-2xl font-bold text-amber-400"
            style={{
              textShadow: '0 0 20px rgba(251, 191, 36, 0.6)',
            }}
          >
            ⭐ Ajouté aux favoris !
          </motion.div>
        </motion.div>
      )}
      
      <div className="h-full flex">
      {/* Sidebar - Arborescence */}
      <div className="w-80 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-3">Dossiers</h2>
          <Button
            onClick={() => {
              setCreateFolderParentId(selectedFolder?.id ?? null);
              setIsCreateFolderOpen(true);
            }}
            size="sm"
            className="w-full gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            Nouveau dossier
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Racine */}
          <div
            onClick={() => setSelectedFolder(null)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer mb-2 transition-colors ${
              selectedFolder === null
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-muted/50'
            }`}
          >
            <Home className="h-4 w-4" />
            <span className="text-sm">Racine</span>
          </div>

          {/* Arborescence */}
          {treeLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <FolderTreeView
              folders={tree}
              selectedFolderId={selectedFolder?.id}
              onFolderSelect={setSelectedFolder}
            />
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                {selectedFolder ? selectedFolder.name : 'Tous les dossiers'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedFolder
                  ? `${filteredSubfolders.length} sous-dossier(s) · ${filteredDocuments.length} document(s)`
                  : `${tree.length} dossier(s) racine`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                size="sm"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importer un document
              </Button>
              {selectedFolder && (
                <Button
                  onClick={() => {
                    setCreateFolderParentId(selectedFolder.id);
                    setIsCreateFolderOpen(true);
                  }}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  Nouveau sous-dossier
                </Button>
              )}
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {contentsLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? 'h-32' : 'h-16'} />
              ))}
            </div>
          ) : (
            <>
              {/* Sous-dossiers */}
              {filteredSubfolders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Dossiers</h3>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}>
                    {filteredSubfolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        viewMode={viewMode}
                        onSelect={() => setSelectedFolder(folder as FolderTreeType)}
                        onCreateSubfolder={() => {
                          setCreateFolderParentId(folder.id);
                          setIsCreateFolderOpen(true);
                        }}
                        onEdit={() => {
                          setFolderToEdit(folder);
                          setIsEditFolderOpen(true);
                        }}
                        onMove={() => {
                          setFolderToMove(folder);
                          setIsMoveFolderOpen(true);
                        }}
                        onDelete={() => {
                          setFolderToDelete(folder);
                          setIsDeleteFolderOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {filteredDocuments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Documents</h3>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}>
                    {filteredDocuments.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        viewMode={viewMode}
                        onPreview={() => {
                          setSelectedDocument(doc);
                          setIsPreviewDialogOpen(true);
                        }}
                        onEdit={() => {
                          setSelectedDocument(doc);
                          setIsEditDocumentOpen(true);
                        }}
                        onShare={() => {
                          setSelectedDocument(doc);
                          setIsShareDialogOpen(true);
                        }}
                        onMove={() => {
                          setSelectedDocument(doc);
                          setIsMoveDocumentOpen(true);
                        }}
                        onToggleFavorite={() => handleToggleFavorite(doc)}
                        onDownload={() => handleDownloadDocument(doc)}
                        onRequestAccess={() => {
                          setSelectedDocument(doc);
                          setIsRequestAccessOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {filteredSubfolders.length === 0 && filteredDocuments.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun contenu</h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? 'Aucun résultat pour votre recherche'
                      : 'Ce dossier est vide'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        onSubmit={handleCreateFolder}
        folders={allFolders}
        defaultParentId={createFolderParentId}
      />

      <EditFolderDialog
        open={isEditFolderOpen}
        onOpenChange={setIsEditFolderOpen}
        folder={folderToEdit}
        onSubmit={handleEditFolder}
      />

      <MoveFolderDialog
        open={isMoveFolderOpen}
        onOpenChange={setIsMoveFolderOpen}
        folder={folderToMove}
        folders={allFolders}
        onSubmit={handleMoveFolder}
      />

      <AlertDialog open={isDeleteFolderOpen} onOpenChange={setIsDeleteFolderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le dossier "{folderToDelete?.name}" ? Cette action est
              irréversible et supprimera également tous les sous-dossiers et documents contenus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedDocument && (
        <>
          <ShareDocumentDialog
            document={selectedDocument}
            open={isShareDialogOpen}
            onOpenChange={setIsShareDialogOpen}
            onDocumentUpdated={refreshContents}
          />

          <DocumentPreviewDialog
            document={selectedDocument}
            open={isPreviewDialogOpen}
            onOpenChange={setIsPreviewDialogOpen}
          />

          <EditDocumentDialog
            document={selectedDocument}
            open={isEditDocumentOpen}
            onOpenChange={setIsEditDocumentOpen}
            onDocumentUpdated={refreshContents}
          />

          <MoveDocumentDialog
            document={selectedDocument}
            folders={allFolders}
            open={isMoveDocumentOpen}
            onOpenChange={setIsMoveDocumentOpen}
            onDocumentMoved={refreshContents}
          />

          <RequestAccessDialog
            document={selectedDocument}
            open={isRequestAccessOpen}
            onOpenChange={setIsRequestAccessOpen}
            onRequestSent={() => {
              // Optionnel: recharger les documents pour mettre à jour has_pending_request
              refreshContents();
            }}
          />
        </>
      )}

      {/* Upload Dialog */}
      <UploadDocumentDialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) {
            setUploadFiles([]);
            // Rafraîchir le contenu quand le dialog se ferme
            refreshContents();
          }
        }}
        initialFolderId={selectedFolder?.id ?? null}
        initialFiles={uploadFiles}
      />
    </div>
    </>
  );
}

// Composant pour afficher une carte de dossier
function FolderCard({
  folder,
  viewMode,
  onSelect,
  onCreateSubfolder,
  onEdit,
  onMove,
  onDelete,
}: {
  folder: Folder;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
  onCreateSubfolder: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const hasAccess = folder.has_access !== false; // Par défaut true si non défini

  if (viewMode === 'grid') {
    return (
      <motion.div
        whileHover={hasAccess ? { y: -2 } : {}}
        onClick={hasAccess ? onSelect : undefined}
        className={`group relative bg-card border border-border rounded-lg p-4 transition-all ${
          hasAccess ? 'cursor-pointer hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
        }`}
      >
        {hasAccess && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateSubfolder(); }}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Créer un sous-dossier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Renommer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
                  <Move className="h-4 w-4 mr-2" />
                  Déplacer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
            <svg className="h-10 w-10 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
          </div>
          <h3 className="font-medium text-sm mb-1 truncate w-full">{folder.name}</h3>
          <p className="text-xs text-muted-foreground">
            {folder.documents_count ?? 0} document(s)
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      onClick={hasAccess ? onSelect : undefined}
      className={`group flex items-center gap-3 p-3 bg-card border border-border rounded-lg transition-all ${
        hasAccess ? 'cursor-pointer hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="h-10 w-10 rounded bg-amber-500/10 flex items-center justify-center flex-shrink-0">
        <svg className="h-6 w-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{folder.name}</h3>
        <p className="text-xs text-muted-foreground">
          {folder.documents_count ?? 0} document(s)
        </p>
      </div>

      {hasAccess && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateSubfolder(); }}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Créer un sous-dossier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Renommer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
              <Move className="h-4 w-4 mr-2" />
              Déplacer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// Composant pour afficher une carte de document
function DocumentCard({
  document,
  viewMode,
  onPreview,
  onEdit,
  onShare,
  onMove,
  onToggleFavorite,
  onDownload,
  onRequestAccess,
}: {
  document: Document;
  viewMode: 'grid' | 'list';
  onPreview: () => void;
  onEdit: () => void;
  onShare: () => void;
  onMove: () => void;
  onToggleFavorite: () => void;
  onDownload: () => void;
  onRequestAccess?: () => void;
}) {
  const Icon = getFileIcon(document.file_type);
  const hasAccess = document.has_access !== false; // Par défaut true si non défini

  if (viewMode === 'grid') {
    return (
      <motion.div
        whileHover={hasAccess ? { y: -2 } : {}}
        onClick={hasAccess ? onPreview : undefined}
        className={`group relative bg-card border border-border rounded-lg p-4 transition-all ${
          hasAccess ? 'cursor-pointer hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
        }`}
      >
        {hasAccess && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            >
              {document.is_favorite ? (
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(); }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Aperçu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
                  <Move className="h-4 w-4 mr-2" />
                  Déplacer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-medium text-sm mb-1 truncate w-full">{document.title}</h3>
          <p className="text-xs text-muted-foreground">
            {document.owner_name || 'Inconnu'} · {formatDate(document.created_at)}
          </p>
          
          {/* Bouton demander l'accès si pas d'accès */}
          {!hasAccess && onRequestAccess && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestAccess();
              }}
              disabled={document.has_pending_request || (document.access_request_rejection_count ?? 0) >= 3}
              className={`mt-3 w-full py-1.5 px-3 text-xs font-medium rounded-md border transition-colors ${
                (document.access_request_rejection_count ?? 0) >= 3
                  ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed'
                  : document.access_request_status === 'rejected'
                  ? 'border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10'
                  : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Lock className="h-3 w-3 inline mr-1" />
              {(document.access_request_rejection_count ?? 0) >= 3
                ? 'Accès bloqué (3 rejets)'
                : document.has_pending_request 
                ? 'Demande en attente' 
                : document.access_request_status === 'rejected'
                ? `Redemander (${3 - (document.access_request_rejection_count ?? 0)} restantes)`
                : 'Demander l\'accès'
              }
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div
      onClick={hasAccess ? onPreview : undefined}
      className={`group flex items-center gap-3 p-3 bg-card border border-border rounded-lg transition-all ${
        hasAccess ? 'cursor-pointer hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{document.title}</h3>
          {document.is_favorite && <Star className="h-3 w-3 fill-amber-500 text-amber-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground">
          {document.owner_name || 'Inconnu'} · {formatDate(document.created_at)}
        </p>
      </div>

      {hasAccess ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(); }}>
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(); }}>
              <Move className="h-4 w-4 mr-2" />
              Déplacer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : onRequestAccess ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRequestAccess();
          }}
          disabled={document.has_pending_request || (document.access_request_rejection_count ?? 0) >= 3}
          className={`text-xs font-medium py-1.5 px-3 rounded-md border transition-colors whitespace-nowrap flex-shrink-0 ${
            (document.access_request_rejection_count ?? 0) >= 3
              ? 'border-muted bg-muted text-muted-foreground cursor-not-allowed'
              : document.access_request_status === 'rejected'
              ? 'border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10'
              : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Lock className="h-3 w-3 inline mr-1" />
          {(document.access_request_rejection_count ?? 0) >= 3
            ? 'Bloqué'
            : document.has_pending_request 
            ? 'En attente' 
            : document.access_request_status === 'rejected'
            ? `Refusé (${3 - (document.access_request_rejection_count ?? 0)})`
            : 'Accès'
          }
        </button>
      ) : null}
    </div>
  );
}
