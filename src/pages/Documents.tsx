import { useState, useMemo } from "react";
import {
  FileText,
  Grid3X3,
  List,
  Upload,
  Plus,
  Filter,
  MoreHorizontal,
  Download,
  Eye,
  Pencil,
  Trash2,
  Share2,
  Star,
  Lock,
  Image,
  FileSpreadsheet,
  File,
  Copy,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Presentation,
  ScanLine,
  Loader2,
  AlertCircle,
  Globe,
  Users as UsersIcon,
  Move,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { UploadDocumentDialog } from "@/components/UploadDocumentDialog";
import { EditDocumentDialog } from "@/components/EditDocumentDialog";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import { ShareDocumentDialog } from "@/components/ShareDocumentDialog";
import { MoveDocumentDialog } from "@/components/MoveDocumentDialog";
import { DragDropOverlay } from "@/components/DragDropOverlay";
import { useDocuments, useDeleteDocument, useDuplicateDocument, useDownloadDocument, useToggleFavorite } from "@/services";
import type { Document as DocumentType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useGlobalDragAndDrop } from "@/hooks/useGlobalDragAndDrop";

type ViewMode = "grid" | "list";

const typeIcon = (type: string) => {
  const fileType = type.toUpperCase();
  switch (fileType) {
    case "PDF": return <FileText className="h-5 w-5 text-primary" />;
    case "WORD": return <File className="h-5 w-5 text-info" />;
    case "EXCEL": return <FileSpreadsheet className="h-5 w-5 text-success" />;
    case "PPT": return <Presentation className="h-5 w-5 text-orange-500" />;
    case "IMAGE": return <Image className="h-5 w-5 text-warning" />;
    case "SCAN": return <ScanLine className="h-5 w-5 text-purple-500" />;
    default: return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
};

// Helper pour formater la taille
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "0 Ko";
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
};

// Helper pour formater la date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Documents() {
  const [view, setView] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editDoc, setEditDoc] = useState<DocumentType | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentType | null>(null);
  const [shareDoc, setShareDoc] = useState<DocumentType | null>(null);
  const [moveDoc, setMoveDoc] = useState<DocumentType | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const itemsPerPage = 10;

  // Drag and drop global
  const { isDraggingOver } = useGlobalDragAndDrop({
    onFilesDropped: (files) => {
      setUploadFiles(files);
      setShowUpload(true);
    }
  });

  // Récupérer les documents depuis l'API
  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    file_type: selectedType !== "all" ? selectedType : undefined,
    page: currentPage,
    ordering: '-created_at',
  }), [searchQuery, selectedType, currentPage]);

  const { data, isLoading, error, refetch } = useDocuments(filters);
  
  // Hooks pour les actions
  const deleteMutation = useDeleteDocument();
  const duplicateMutation = useDuplicateDocument();
  const downloadMutation = useDownloadDocument();
  const toggleFavoriteMutation = useToggleFavorite();

  const documents = data?.results || [];
  const totalPages = data ? Math.ceil(data.count / itemsPerPage) : 1;

  return (
    <>
      <DragDropOverlay isVisible={isDraggingOver} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground text-sm">{data?.count || 0} documents</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Upload className="h-4 w-4" /> Importer
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Plus className="h-4 w-4" /> Nouveau dossier
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors ${showFilters ? "bg-muted" : ""}`}
          >
            <Filter className="h-4 w-4" /> Filtres
          </button>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="stat-card overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Filtres avancés</h3>
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Type de fichier</label>
                <select 
                  value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1); // Reset page
                }}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="pdf">PDF</option>
                <option value="word">Word (DOCX)</option>
                <option value="excel">Excel (XLSX)</option>
                <option value="ppt">PowerPoint (PPTX)</option>
                <option value="image">Images (JPEG, PNG)</option>
                <option value="scan">Documents scannés</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Période</label>
                <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm">
                  <option>Toutes les dates</option>
                  <option>Aujourd'hui</option>
                  <option>Cette semaine</option>
                  <option>Ce mois</option>
                  <option>Cette année</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Taille</label>
                <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm">
                  <option>Toutes les tailles</option>
                  <option>&lt; 1 Mo</option>
                  <option>1-10 Mo</option>
                  <option>&gt; 10 Mo</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Statut</label>
                <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm">
                  <option>Tous</option>
                  <option>Favoris</option>
                  <option>Partagés</option>
                  <option>Verrouillés</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Chargement des documents...</p>
          </div>
        </div>
      ) : error ? (
        <div className="stat-card p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-sm text-muted-foreground">
            Impossible de charger les documents. Veuillez réessayer.
          </p>
        </div>
      ) : documents.length === 0 ? (
        <div className="stat-card p-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun document</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery || selectedType !== "all" 
              ? "Aucun document ne correspond à vos critères de recherche"
              : "Commencez par importer vos premiers documents"}
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Importer un document
          </button>
        </div>
      ) : view === "grid" ? (
        <GridView 
          docs={documents} 
          onEdit={setEditDoc} 
          onPreview={setPreviewDoc}
          onShare={setShareDoc}
          onMove={setMoveDoc}
          onDelete={(id) => deleteMutation.mutate(id)}
          onDuplicate={(id) => duplicateMutation.mutate(id)}
          onDownload={(id, filename) => downloadMutation.mutate({ id, filename })}
          onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
        />
      ) : (
        <ListView 
          docs={documents} 
          onEdit={setEditDoc} 
          onPreview={setPreviewDoc}
          onShare={setShareDoc}
          onMove={setMoveDoc}
          onDelete={(id) => deleteMutation.mutate(id)}
          onDuplicate={(id) => duplicateMutation.mutate(id)}
          onDownload={(id, filename) => downloadMutation.mutate({ id, filename })}
          onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <UploadDocumentDialog 
        open={showUpload} 
        onOpenChange={(open) => {
          setShowUpload(open);
          if (!open) setUploadFiles([]);
        }}
        initialFiles={uploadFiles}
      />

      {/* Edit Metadata Dialog */}
      <EditDocumentDialog 
        document={editDoc} 
        open={!!editDoc} 
        onOpenChange={() => setEditDoc(null)}
        onDocumentUpdated={() => refetch()}
      />

      {/* Preview Dialog */}
      <DocumentPreviewDialog document={previewDoc} open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)} />

      {/* Share Dialog */}
      <ShareDocumentDialog 
        document={shareDoc} 
        open={!!shareDoc} 
        onOpenChange={() => setShareDoc(null)}
        onDocumentUpdated={() => refetch()}
      />

      {/* Move Dialog */}
      <MoveDocumentDialog 
        document={moveDoc} 
        open={!!moveDoc} 
        onOpenChange={() => setMoveDoc(null)}
        onDocumentMoved={() => refetch()}
      />
    </motion.div>
    </>
  );
}

interface DocViewProps {
  docs: DocumentType[];
  onEdit: (doc: DocumentType) => void;
  onPreview: (doc: DocumentType) => void;
  onShare: (doc: DocumentType) => void;
  onMove: (doc: DocumentType) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDownload: (id: number, filename: string) => void;
  onToggleFavorite: (id: number) => void;
}

function GridView({ docs, onEdit, onPreview, onShare, onMove, onDelete, onDuplicate, onDownload, onToggleFavorite }: DocViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {docs.map((doc, i) => {
        const filename = doc.file.split('/').pop() || doc.title;
        const hasAccess = doc.has_access !== false; // Par défaut true si non défini
        return (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`stat-card group ${hasAccess ? 'cursor-pointer hover:border-primary/20' : 'opacity-50 cursor-not-allowed'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-muted">{typeIcon(doc.file_type)}</div>
              <div className="flex items-center gap-1">
                {doc.visibility === 'public' && <div title="Public"><Globe className="h-3.5 w-3.5 text-info" /></div>}
                {doc.visibility === 'shared' && doc.shared_with_count && doc.shared_with_count > 0 && (
                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground" title={`Partagé avec ${doc.shared_with_count} utilisateur(s)`}>
                    <UsersIcon className="h-3.5 w-3.5" />
                    <span>{doc.shared_with_count}</span>
                  </div>
                )}
                {doc.visibility === 'private' && <div title="Privé"><Lock className="h-3.5 w-3.5 text-muted-foreground" /></div>}
                {hasAccess && (
                  <button 
                    onClick={() => onToggleFavorite(doc.id)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <Star className={`h-3.5 w-3.5 ${doc.is_favorite ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                  </button>
                )}
                {hasAccess && (
                  <DocMenu 
                    doc={doc} 
                    onEdit={onEdit} 
                    onPreview={onPreview}
                    onShare={onShare}
                    onMove={onMove}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onDownload={() => onDownload(doc.id, filename)}
                  />
                )}
              </div>
            </div>
            <h4 className="text-sm font-medium truncate mb-1" title={doc.title}>{doc.title}</h4>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(0)} · {formatDate(doc.created_at)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Par {doc.owner_name}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

function ListView({ docs, onEdit, onPreview, onShare, onMove, onDelete, onDuplicate, onDownload, onToggleFavorite }: DocViewProps) {
  return (
    <div className="stat-card !p-0 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="text-left p-3 font-medium">Nom</th>
            <th className="text-left p-3 font-medium hidden sm:table-cell">Type</th>
            <th className="text-left p-3 font-medium hidden md:table-cell">Taille</th>
            <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
            <th className="text-left p-3 font-medium hidden lg:table-cell">Propriétaire</th>
            <th className="p-3 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const filename = doc.file.split('/').pop() || doc.title;
            const hasAccess = doc.has_access !== false; // Par défaut true si non défini
            return (
              <tr key={doc.id} className={`border-b border-border/50 transition-colors ${hasAccess ? 'hover:bg-muted/30 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {typeIcon(doc.file_type)}
                    <span className="text-sm font-medium truncate max-w-[200px]" title={doc.title}>
                      {doc.title}
                    </span>
                    {doc.visibility === 'public' && (
                      <Badge variant="outline" className="gap-1">
                        <Globe className="h-3 w-3" />
                        Public
                      </Badge>
                    )}
                    {doc.visibility === 'shared' && doc.shared_with_count && doc.shared_with_count > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <UsersIcon className="h-3 w-3" />
                        {doc.shared_with_count}
                      </Badge>
                    )}
                    {hasAccess && (
                      <button 
                        onClick={() => onToggleFavorite(doc.id)}
                        className="p-1 rounded hover:bg-muted transition-colors shrink-0"
                      >
                        <Star className={`h-3 w-3 ${doc.is_favorite ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell uppercase">{doc.file_type}</td>
                <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{formatFileSize(0)}</td>
                <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{formatDate(doc.created_at)}</td>
                <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{doc.owner_name}</td>
                <td className="p-3">
                  {hasAccess && (
                    <DocMenu 
                      doc={doc} 
                      onEdit={onEdit} 
                      onPreview={onPreview}
                      onShare={onShare}
                      onMove={onMove}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onDownload={() => onDownload(doc.id, filename)}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface DocMenuProps {
  doc: DocumentType;
  onEdit: (doc: DocumentType) => void;
  onPreview: (doc: DocumentType) => void;
  onShare: (doc: DocumentType) => void;
  onMove: (doc: DocumentType) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDownload: () => void;
}

function DocMenu({ doc, onEdit, onPreview, onShare, onMove, onDelete, onDuplicate, onDownload }: DocMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 rounded hover:bg-muted transition-colors">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onPreview(doc)}>
          <Eye className="h-4 w-4 mr-2" /> Aperçu
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" /> Télécharger
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onShare(doc)}>
          <Share2 className="h-4 w-4 mr-2" /> Partager
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(doc)}>
          <Move className="h-4 w-4 mr-2" /> Déplacer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(doc)}>
          <Pencil className="h-4 w-4 mr-2" /> Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(doc.id)}>
          <Copy className="h-4 w-4 mr-2" /> Dupliquer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(doc.id)}>
          <Trash2 className="h-4 w-4 mr-2" /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
