import { motion } from 'framer-motion';
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Presentation,
  ScanLine,
  MoreHorizontal,
  Download,
  Eye,
  Pencil,
  Trash2,
  Share2,
  Star,
  Lock,
  Globe,
  Users as UsersIcon,
  Copy,
  Move,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Document as DocumentType } from '@/types';

// Helpers
const typeIcon = (type: string) => {
  const fileType = type.toUpperCase();
  switch (fileType) {
    case 'PDF':
      return <FileText className="h-5 w-5 text-primary" />;
    case 'WORD':
      return <File className="h-5 w-5 text-info" />;
    case 'EXCEL':
      return <FileSpreadsheet className="h-5 w-5 text-success" />;
    case 'PPT':
      return <Presentation className="h-5 w-5 text-orange-500" />;
    case 'IMAGE':
      return <Image className="h-5 w-5 text-warning" />;
    case 'SCAN':
      return <ScanLine className="h-5 w-5 text-purple-500" />;
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 Ko';
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Interfaces
export interface DocViewProps {
  docs: DocumentType[];
  onEdit: (doc: DocumentType) => void;
  onPreview: (doc: DocumentType) => void;
  onShare: (doc: DocumentType) => void;
  onMove: (doc: DocumentType) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDownload: (id: number, filename: string) => void;
  onToggleFavorite: (id: number) => void;
  onRequestAccess?: (doc: DocumentType) => void;
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

// Document Menu Component
function DocMenu({
  doc,
  onEdit,
  onPreview,
  onShare,
  onMove,
  onDelete,
  onDuplicate,
  onDownload,
}: DocMenuProps) {
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

// Grid View Component
export function GridView({
  docs,
  onEdit,
  onPreview,
  onShare,
  onMove,
  onDelete,
  onDuplicate,
  onDownload,
  onToggleFavorite,
  onRequestAccess,
}: DocViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {docs.map((doc, i) => {
        const filename = doc.file.split('/').pop() || doc.title;
        const hasAccess = doc.has_access !== false;
        return (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-lg border border-border bg-card p-4 group ${
              hasAccess ? 'cursor-pointer hover:border-primary/20' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-muted">{typeIcon(doc.file_type)}</div>
              <div className="flex items-center gap-1">
                {doc.visibility === 'public' && (
                  <div title="Public">
                    <Globe className="h-3.5 w-3.5 text-info" />
                  </div>
                )}
                {doc.visibility === 'shared' && doc.shared_with_count && doc.shared_with_count > 0 && (
                  <div
                    className="flex items-center gap-0.5 text-xs text-muted-foreground"
                    title={`Partagé avec ${doc.shared_with_count} utilisateur(s)`}
                  >
                    <UsersIcon className="h-3.5 w-3.5" />
                    <span>{doc.shared_with_count}</span>
                  </div>
                )}
                {doc.visibility === 'private' && (
                  <div title="Privé">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                {hasAccess && (
                  <button
                    onClick={() => onToggleFavorite(doc.id)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        doc.is_favorite ? 'text-warning fill-warning' : 'text-muted-foreground'
                      }`}
                    />
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
            <h4 className="text-sm font-medium truncate mb-1" title={doc.title}>
              {doc.title}
            </h4>
            {/* Tags */}
            {doc.tag_list && doc.tag_list.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {doc.tag_list.slice(0, 3).map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-xs px-1.5 py-0">
                    {tag.name}
                  </Badge>
                ))}
                {doc.tag_list.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    +{doc.tag_list.length - 3}
                  </Badge>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {formatFileSize(doc.file_size)} · {formatDate(doc.created_at)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Par {doc.owner_name}</p>
            
            {/* Bouton demander l'accès si pas d'accès */}
            {!hasAccess && onRequestAccess && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestAccess(doc);
                }}
                disabled={doc.has_pending_request}
                className="mt-3 w-full py-1.5 px-3 text-xs font-medium rounded-md border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="h-3 w-3 inline mr-1" />
                {doc.has_pending_request ? 'Demande en attente' : 'Demander l\'accès'}
              </button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// List View Component
export function ListView({
  docs,
  onEdit,
  onPreview,
  onShare,
  onMove,
  onDelete,
  onDuplicate,
  onDownload,
  onToggleFavorite,
  onRequestAccess,
}: DocViewProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="text-left p-3 font-medium">Nom</th>
            <th className="text-left p-3 font-medium hidden sm:table-cell">Type</th>
            <th className="text-left p-3 font-medium hidden lg:table-cell">Tags</th>
            <th className="text-left p-3 font-medium hidden md:table-cell">Taille</th>
            <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
            <th className="text-left p-3 font-medium hidden lg:table-cell">Propriétaire</th>
            <th className="p-3 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const filename = doc.file.split('/').pop() || doc.title;
            const hasAccess = doc.has_access !== false;
            return (
              <tr
                key={doc.id}
                className={`border-b border-border/50 transition-colors ${
                  hasAccess ? 'hover:bg-muted/30 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
              >
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
                    {doc.visibility === 'shared' &&
                      doc.shared_with_count &&
                      doc.shared_with_count > 0 && (
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
                        <Star
                          className={`h-3 w-3 ${
                            doc.is_favorite ? 'text-warning fill-warning' : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell uppercase">
                  {doc.file_type}
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {doc.tag_list && doc.tag_list.length > 0 ? (
                      <>
                        {doc.tag_list.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {doc.tag_list.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{doc.tag_list.length - 2}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">
                  {formatFileSize(doc.file_size)}
                </td>
                <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                  {formatDate(doc.created_at)}
                </td>
                <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                  {doc.owner_name}
                </td>
                <td className="p-3">
                  {hasAccess ? (
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
                  ) : onRequestAccess ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestAccess(doc);
                      }}
                      disabled={doc.has_pending_request}
                      className="text-xs font-medium py-1 px-2 rounded border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <Lock className="h-3 w-3 inline mr-1" />
                      {doc.has_pending_request ? 'En attente' : 'Accès'}
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
