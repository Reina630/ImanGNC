import { useState } from 'react';
import { FolderOpen, FolderClosed, ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderTree as FolderTreeType } from '@/types';
import { cn } from '@/lib/utils';

interface FolderTreeViewProps {
  folders: FolderTreeType[];
  selectedFolderId?: number | null;
  onFolderSelect?: (folder: FolderTreeType) => void;
  level?: number;
}

export default function FolderTreeView({
  folders,
  selectedFolderId,
  onFolderSelect,
  level = 0,
}: FolderTreeViewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  const toggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFolderClick = (folder: FolderTreeType, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolder(folder.id);
    onFolderSelect?.(folder);
  };

  return (
    <div className="space-y-1">
      {folders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolderId === folder.id;
        const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;
        const hasAccess = folder.has_access !== false; // Par défaut true si non défini

        return (
          <div key={folder.id}>
            <motion.div
              initial={false}
              animate={{ backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent' }}
              className={cn(
                'group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                hasAccess ? 'hover:bg-muted/50' : 'opacity-50 cursor-not-allowed',
                isSelected && 'bg-primary/10 text-primary font-medium'
              )}
              style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
              onClick={(e) => hasAccess && handleFolderClick(folder, e)}
            >
              {/* Chevron pour expand/collapse */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasAccess) toggleFolder(folder.id);
                }}
                className={cn(
                  'p-0.5 rounded hover:bg-muted transition-colors',
                  !hasSubfolders && 'invisible',
                  !hasAccess && 'cursor-not-allowed'
                )}
                disabled={!hasAccess}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {/* Icône du dossier */}
              {isExpanded ? (
                <FolderOpen className={cn("h-4 w-4 flex-shrink-0", hasAccess ? "text-amber-500" : "text-gray-400")} />
              ) : (
                <FolderClosed className={cn("h-4 w-4 flex-shrink-0", hasAccess ? "text-amber-500" : "text-gray-400")} />
              )}

              {/* Nom du dossier */}
              <span className="flex-1 text-sm truncate">{folder.name}</span>

              {/* Compteurs */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {folder.documents_count !== undefined && folder.documents_count > 0 && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{folder.documents_count}</span>
                  </div>
                )}
                {hasSubfolders && (
                  <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                    {folder.subfolders!.length}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Sous-dossiers */}
            <AnimatePresence initial={false}>
              {isExpanded && hasSubfolders && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <FolderTreeView
                    folders={folder.subfolders!}
                    selectedFolderId={selectedFolderId}
                    onFolderSelect={onFolderSelect}
                    level={level + 1}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
