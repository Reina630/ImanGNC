import { useState } from "react";
import { Star, FileText, MoreHorizontal, Eye, Download, Pencil, Share2, Move, Loader2, AlertCircle, StarOff } from "lucide-react";
import { motion } from "framer-motion";
import { FavoritesStatsAndFilters } from "../components/FavoritesStatsAndFilters";
import { useDocuments, useToggleFavorite, useDownloadDocument } from "@/services";
import type { Document } from "@/types";
import { formatDate, formatFileSize, getFileIcon } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import { EditDocumentDialog } from "@/components/EditDocumentDialog";
import { ShareDocumentDialog } from "@/components/ShareDocumentDialog";
import { MoveDocumentDialog } from "@/components/MoveDocumentDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Favorites() {
  const [filter, setFilter] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isMoveDocumentOpen, setIsMoveDocumentOpen] = useState(false);

  const { toast } = useToast();

  // Récupérer les documents favoris
  const { data, isLoading, error, refetch } = useDocuments({ is_favorite: true });
  const toggleFavorite = useToggleFavorite();
  const downloadDocument = useDownloadDocument();

  const documents = data?.results || [];
  const docCount = documents.length;
  const folderCount = 0; // Les dossiers n'ont pas de favoris pour l'instant

  // Handlers
  const handleToggleFavorite = (doc: Document) => {
    toggleFavorite.mutate(doc.id, {
      onSuccess: () => {
        toast({
          title: "Retiré des favoris",
          description: `${doc.title} a été retiré de vos favoris`,
        });
        refetch();
      },
    });
  };

  const handleDownload = (doc: Document) => {
    downloadDocument.mutate({ id: doc.id, filename: doc.title });
  };

  const handlePreview = (doc: Document) => {
    setSelectedDocument(doc);
    setIsPreviewDialogOpen(true);
  };

  const handleEdit = (doc: Document) => {
    setSelectedDocument(doc);
    setIsEditDocumentOpen(true);
  };

  const handleShare = (doc: Document) => {
    setSelectedDocument(doc);
    setIsShareDialogOpen(true);
  };

  const handleMove = (doc: Document) => {
    setSelectedDocument(doc);
    setIsMoveDocumentOpen(true);
  };

  // État de chargement
  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <div>
            <h1 className="text-2xl font-bold">Favoris</h1>
            <p className="text-muted-foreground text-sm">Accédez rapidement à vos documents favoris</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </motion.div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <div>
            <h1 className="text-2xl font-bold">Favoris</h1>
            <p className="text-muted-foreground text-sm">Accédez rapidement à vos documents favoris</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">Une erreur est survenue lors du chargement des favoris</p>
          <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
        </div>
      </motion.div>
    );
  }

  // État vide
  if (documents.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <div>
            <h1 className="text-2xl font-bold">Favoris</h1>
            <p className="text-muted-foreground text-sm">Accédez rapidement à vos documents favoris</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Star className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">Aucun favori</p>
          <p className="text-sm text-muted-foreground">Ajoutez des documents à vos favoris pour les retrouver rapidement ici</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <div>
            <h1 className="text-2xl font-bold">Favoris</h1>
            <p className="text-muted-foreground text-sm">Accédez rapidement à vos documents favoris</p>
          </div>
        </div>

        <FavoritesStatsAndFilters
          total={documents.length}
          docCount={docCount}
          folderCount={folderCount}
          filter={filter}
          setFilter={setFilter}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, i) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              index={i}
              onPreview={handlePreview}
              onEdit={handleEdit}
              onShare={handleShare}
              onMove={handleMove}
              onToggleFavorite={handleToggleFavorite}
              onDownload={handleDownload}
            />
          ))}
        </div>
      </motion.div>

      {/* Dialogs */}
      {selectedDocument && (
        <>
          <DocumentPreviewDialog
            document={selectedDocument}
            open={isPreviewDialogOpen}
            onOpenChange={setIsPreviewDialogOpen}
          />
          <EditDocumentDialog
            document={selectedDocument}
            open={isEditDocumentOpen}
            onOpenChange={(open) => {
              setIsEditDocumentOpen(open);
              if (!open) refetch();
            }}
          />
          <ShareDocumentDialog
            document={selectedDocument}
            open={isShareDialogOpen}
            onOpenChange={setIsShareDialogOpen}
          />
          <MoveDocumentDialog
            document={selectedDocument}
            open={isMoveDocumentOpen}
            onOpenChange={setIsMoveDocumentOpen}
            onSuccess={refetch}
          />
        </>
      )}
    </>
  );
}

// Composant pour afficher une carte de document favori
function DocumentCard({
  document,
  index,
  onPreview,
  onEdit,
  onShare,
  onMove,
  onToggleFavorite,
  onDownload,
}: {
  document: Document;
  index: number;
  onPreview: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onShare: (doc: Document) => void;
  onMove: (doc: Document) => void;
  onToggleFavorite: (doc: Document) => void;
  onDownload: (doc: Document) => void;
}) {
  const Icon = getFileIcon(document.file_type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      onClick={() => onPreview(document)}
      className="group relative bg-card border border-border rounded-lg p-4 transition-all cursor-pointer hover:border-primary/50"
    >
      {/* Actions en haut à droite */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(document); }}
        >
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(document); }}>
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(document); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(document); }}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(document); }}>
              <Move className="h-4 w-4 mr-2" />
              Déplacer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(document); }}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(document); }}
              className="text-amber-600"
            >
              <StarOff className="h-4 w-4 mr-2" />
              Retirer des favoris
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contenu de la carte */}
      <div className="flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-medium text-sm mb-1 truncate w-full">{document.title}</h3>
        <p className="text-xs text-muted-foreground">
          {document.file_type.toUpperCase()} · {formatFileSize(document.file_size)} · {formatDate(document.created_at)}
        </p>
      </div>
    </motion.div>
  );
}
