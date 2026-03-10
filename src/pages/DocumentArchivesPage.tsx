import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  FileText,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  RotateCcw,
  Eye,
  Download,
  Trash2,
  FolderArchive,
  Clock,
  HardDrive,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import documentService from '@/services/documentService';
import type { Document } from '@/types';

interface GroupedDocs {
  [year: string]: {
    [month: string]: Document[];
  };
}

const stats = [
  { label: 'Documents archivés', value: '0', icon: FolderArchive, color: 'text-amber-600' },
  { label: 'Espace utilisé', value: '0 MB', icon: HardDrive, color: 'text-blue-600' },
  { label: 'Ce mois-ci', value: '0', icon: Clock, color: 'text-green-600' },
];

const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export default function DocumentArchivesPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groupedDocs, setGroupedDocs] = useState<GroupedDocs>({});
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(stats);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadArchives();
  }, [searchQuery]);

  const loadArchives = async () => {
    try {
      setLoading(true);
      const archivedDocs = await documentService.getArchivedDocuments();
      
      // Filtrer par recherche si nécessaire
      const filtered = searchQuery
        ? archivedDocs.filter((doc) =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : archivedDocs;

      setDocuments(filtered);
      groupDocumentsByDate(filtered);
      updateStats(filtered);
    } catch (error) {
      console.error('Erreur lors du chargement des archives:', error);
      toast.error('Erreur lors du chargement des archives');
    } finally {
      setLoading(false);
    }
  };

  const groupDocumentsByDate = (docs: Document[]) => {
    const grouped: GroupedDocs = {};

    docs.forEach((doc) => {
      if (!doc.deleted_at) return;
      
      const deletedDate = new Date(doc.deleted_at);
      const year = deletedDate.getFullYear().toString();
      const month = (deletedDate.getMonth() + 1).toString().padStart(2, '0');

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = [];
      }
      grouped[year][month].push(doc);
    });

    setGroupedDocs(grouped);
  };

  const updateStats = (docs: Document[]) => {
    const now = new Date();
    const thisMonth = docs.filter((doc) => {
      if (!doc.deleted_at) return false;
      const deletedDate = new Date(doc.deleted_at);
      return (
        deletedDate.getMonth() === now.getMonth() &&
        deletedDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const totalSize = docs.reduce((sum, doc) => sum + doc.file_size, 0);
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    setStatsData([
      { ...stats[0], value: docs.length.toString() },
      { ...stats[1], value: `${sizeMB} MB` },
      { ...stats[2], value: thisMonth.toString() },
    ]);
  };

  const toggleYear = (year: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const toggleMonth = (yearMonth: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(yearMonth)) {
      newExpanded.delete(yearMonth);
    } else {
      newExpanded.add(yearMonth);
    }
    setExpandedMonths(newExpanded);
  };

  const handleRestore = async (docId: number) => {
    try {
      await documentService.restoreDocument(docId);
      toast.success('Document restauré avec succès');
      loadArchives();
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      toast.error('Erreur lors de la restauration du document');
    }
  };

  const handleViewDetails = (docId: number) => {
    navigate(`/archives/documents/${docId}`);
  };

  const handleMonthClick = (yearMonth: string) => {
    setSelectedMonth(yearMonth);
  };

  const getSelectedMonthDocuments = () => {
    if (!selectedMonth) {
      // Si aucun mois sélectionné, afficher tous les documents
      return documents;
    }

    const [year, month] = selectedMonth.split('-');
    return groupedDocs[year]?.[month] || [];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    return FileText;
  };

  const getFileColor = (fileType: string) => {
    const colors: Record<string, string> = {
      pdf: 'text-red-600',
      word: 'text-blue-600',
      excel: 'text-green-600',
      ppt: 'text-orange-600',
      image: 'text-purple-600',
    };
    return colors[fileType] || 'text-gray-600';
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar avec arborescence */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 0 : 280 }}
        className="border-r border-border bg-background overflow-hidden"
      >
        <div className="h-full overflow-y-auto p-4">
          <div className="space-y-2">
            {Object.keys(groupedDocs).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucune archive
              </div>
            ) : (
              Object.keys(groupedDocs)
                .sort((a, b) => parseInt(b) - parseInt(a))
                .map((year) => (
                  <div key={year}>
                    {/* En-tête année */}
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expandedYears.has(year) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{year}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Object.values(groupedDocs[year]).reduce(
                          (sum, docs) => sum + docs.length,
                          0
                        )}
                      </span>
                    </button>

                    {/* Mois de l'année */}
                    <AnimatePresence>
                      {expandedYears.has(year) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-6 mt-1 space-y-1"
                        >
                          {Object.keys(groupedDocs[year])
                            .sort((a, b) => parseInt(b) - parseInt(a))
                            .map((month) => {
                              const yearMonth = `${year}-${month}`;
                              const monthName = MONTH_NAMES[parseInt(month) - 1];
                              const isSelected = selectedMonth === yearMonth;

                              return (
                                <button
                                  key={yearMonth}
                                  onClick={() => handleMonthClick(yearMonth)}
                                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                                    isSelected
                                      ? 'bg-primary/10 text-primary font-medium'
                                      : 'hover:bg-muted'
                                  }`}
                                >
                                  <span className="text-sm">{monthName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {groupedDocs[year][month].length}
                                  </span>
                                </button>
                              );
                            })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
            )}
          </div>
        </div>
      </motion.aside>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 space-y-6"
        >
          {/* En-tête avec bouton toggle sidebar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Archive className="h-6 w-6" />
                  Archives de documents
                </h1>
                <p className="text-muted-foreground text-sm">
                  {selectedMonth
                    ? `Documents archivés en ${
                        MONTH_NAMES[parseInt(selectedMonth.split('-')[1]) - 1]
                      } ${selectedMonth.split('-')[0]}`
                    : 'Tous les documents archivés'}
                </p>
              </div>
            </div>
            {selectedMonth && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(null)}>
                Voir tout
              </Button>
            )}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="stat-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Barre de recherche */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Rechercher dans les archives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Liste des documents */}
          <div className="space-y-3">
            {getSelectedMonthDocuments().length === 0 ? (
              <div className="stat-card text-center py-12">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun document trouvé</h3>
                <p className="text-muted-foreground text-sm">
                  {selectedMonth
                    ? 'Aucun document archivé pour cette période'
                    : 'Les documents supprimés apparaîtront ici'}
                </p>
              </div>
            ) : (
              getSelectedMonthDocuments().map((doc) => {
                const FileIcon = getFileIcon(doc.file_type);
                const fileColor = getFileColor(doc.file_type);

                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="stat-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1">
                        <FileIcon className={`h-8 w-8 ${fileColor}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{doc.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {doc.owner_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Trash2 className="h-3 w-3" />
                              {doc.deleted_at && new Date(doc.deleted_at).toLocaleDateString('fr-FR')}
                            </span>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(doc.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(doc.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restaurer
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
