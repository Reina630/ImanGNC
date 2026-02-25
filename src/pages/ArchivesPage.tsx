/**
 * Page d'archives des courriers
 * Affiche tous les documents classés par année et mois avec une arborescence visuelle
 * Sidebar: Uniquement dossiers (années > mois)
 * Content: Cards des courriers du mois sélectionné avec menu 3 points
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  Eye,
  Inbox,
  Send,
  Search,
  FolderOpen,
  FolderClosed,
  MoreHorizontal,
  Share2,
  Pencil,
  Grid3x3,
  List,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";
import { CourrierDetailsDialog } from "@/components/CourrierDetailsDialog";
import { ShareCourrierDialog } from "@/components/ShareCourrierDialog";
import { EditCourrierDialog } from "@/components/EditCourrierDialog";
import { CourrierVersionsDialog } from "@/components/CourrierVersionsDialog";
import { cn } from "@/lib/utils";

interface ArchivesByYearMonth {
  [year: string]: {
    [month: string]: Courrier[];
  };
}

interface YearMonth {
  year: string;
  month: string;
  label: string;
  count: number;
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function ArchivesPage() {
  const { toast } = useToast();
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [selectedYearMonth, setSelectedYearMonth] = useState<YearMonth | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCourrier, setSelectedCourrier] = useState<Courrier | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);

  useEffect(() => {
    loadCourriers();
  }, []);

  /**
   * Charger tous les courriers
   */
  const loadCourriers = async () => {
    try {
      setLoading(true);
      const data = await courrierService.getCourriers({
        ordering: "-date_principale",
      });
      setCourriers(data);

      // Expand automatiquement l'année courante
      const currentYear = new Date().getFullYear().toString();
      setExpandedYears(new Set([currentYear]));
    } catch (error) {
      console.error("Erreur lors du chargement des courriers:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les archives",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Organiser les courriers par année et mois
   */
  const organizeByYearMonth = (): ArchivesByYearMonth => {
    const organized: ArchivesByYearMonth = {};

    courriers.forEach((courrier) => {
      // Utiliser date_principale (date_reception pour entrant, date_envoi pour sortant)
      const dateStr = courrier.date_principale || courrier.created_at;
      const date = new Date(dateStr);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 01-12

      if (!organized[year]) {
        organized[year] = {};
      }
      if (!organized[year][month]) {
        organized[year][month] = [];
      }
      organized[year][month].push(courrier);
    });

    return organized;
  };

  const archives = organizeByYearMonth();
  const years = Object.keys(archives).sort((a, b) => parseInt(b) - parseInt(a));

  /**
   * Toggle année
   */
  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  /**
   * Sélectionner un mois
   */
  const selectYearMonth = (year: string, month: string) => {
    const monthCourriers = archives[year]?.[month] || [];
    setSelectedYearMonth({
      year,
      month,
      label: `${MONTHS[parseInt(month) - 1]} ${year}`,
      count: monthCourriers.length
    });
  };

  /**
   * Courriers filtrés pour le mois sélectionné
   */
  const selectedCourriers = useMemo(() => {
    if (!selectedYearMonth) return [];
    
    const monthCourriers = archives[selectedYearMonth.year]?.[selectedYearMonth.month] || [];
    
    // Filtrer par recherche si nécessaire
    if (search) {
      const searchLower = search.toLowerCase();
      return monthCourriers.filter((c) =>
        c.numero_registre.toLowerCase().includes(searchLower) ||
        c.objet.toLowerCase().includes(searchLower) ||
        c.expediteur.toLowerCase().includes(searchLower) ||
        c.destinataire.toLowerCase().includes(searchLower)
      );
    }
    
    return monthCourriers;
  }, [archives, selectedYearMonth, search]);

  /**
   * Télécharger un fichier
   */
  const handleDownload = async (courrier: Courrier) => {
    try {
      await courrierService.telechargerFichier(courrier.id, courrier.numero_registre);
      toast({
        title: "Téléchargement lancé",
        description: `Téléchargement de ${courrier.numero_registre}`,
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

  /**
   * Formater la taille du fichier
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className="h-full flex">
      {/* Sidebar - Arborescence DOSSIERS uniquement (années > mois) */}
      <div className="w-80 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Archives
          </h2>
          <p className="text-xs text-muted-foreground">
            Sélectionnez une période
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-xs text-muted-foreground">Aucune archive</p>
            </div>
          ) : (
            <div className="space-y-1">
              {years.map((year) => {
                const isYearExpanded = expandedYears.has(year);
                const months = Object.keys(archives[year]).sort(
                  (a, b) => parseInt(b) - parseInt(a)
                );

                return (
                  <div key={year}>
                    {/* Année */}
                    <motion.div
                      initial={false}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleYear(year)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleYear(year);
                        }}
                        className="p-0.5 rounded hover:bg-muted transition-colors"
                      >
                        {isYearExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {isYearExpanded ? (
                        <FolderOpen className="h-4 w-4 text-amber-500" />
                      ) : (
                        <FolderClosed className="h-4 w-4 text-amber-500" />
                      )}

                      <span className="flex-1 text-sm font-semibold">{year}</span>

                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                        {months.length}
                      </span>
                    </motion.div>

                    {/* Mois - Dossiers SEULEMENT */}
                    <AnimatePresence initial={false}>
                      {isYearExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                          className="space-y-1"
                        >
                          {months.map((month) => {
                            const monthKey = `${year}-${month}`;
                            const isSelected = selectedYearMonth?.year === year && selectedYearMonth?.month === month;
                            const monthCourriers = archives[year][month];
                            const monthName = MONTHS[parseInt(month) - 1];

                            return (
                              <motion.div
                                key={monthKey}
                                initial={false}
                                animate={{ backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent' }}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                                  isSelected && "bg-primary/10 text-primary font-medium"
                                )}
                                style={{ paddingLeft: "1.5rem" }}
                                onClick={() => selectYearMonth(year, month)}
                              >
                                {isSelected ? (
                                  <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
                                ) : (
                                  <FolderClosed className="h-3.5 w-3.5 text-amber-400" />
                                )}

                                <span className="flex-1 text-xs font-medium">
                                  {monthName}
                                </span>

                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <FileText className="h-3 w-3" />
                                  <span>{monthCourriers.length}</span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content Area - Cards avec menu 3 points */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                {selectedYearMonth ? selectedYearMonth.label : "Archives des Courriers"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedYearMonth
                  ? `${selectedCourriers.length} courrier(s)`
                  : "Sélectionnez un mois dans la sidebar"}
              </p>
            </div>

            {selectedYearMonth && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {selectedYearMonth && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans ce mois..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>

        {/* Contenu : Cards avec menu 3 points */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedYearMonth ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune période sélectionnée</h3>
              <p className="text-sm text-muted-foreground">
                Sélectionnez une année et un mois dans la sidebar pour voir les courriers
              </p>
            </div>
          ) : selectedCourriers.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun courrier trouvé</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCourriers.map((courrier) => (
                <motion.div
                  key={courrier.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-all group relative"
                >
                  {/* Menu 3 points en haut à droite */}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCourrier(courrier);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Aperçu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(courrier)}>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCourrier(courrier);
                            setVersionsOpen(true);
                          }}
                        >
                          <GitBranch className="h-4 w-4 mr-2" />
                          Versions ({courrier.nombre_versions})
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCourrier(courrier);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCourrier(courrier);
                            setShareOpen(true);
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Partager
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Contenu de la card */}
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedCourrier(courrier);
                      setDetailsOpen(true);
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          courrier.type_courrier === "entrant"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {courrier.type_courrier === "entrant" ? (
                          <Inbox className="h-5 w-5" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold">
                            {courrier.numero_registre}
                          </span>
                          <Badge
                            variant={courrier.type_courrier === "entrant" ? "default" : "secondary"}
                            className="text-[10px] py-0 px-1.5"
                          >
                            {courrier.type_courrier === "entrant" ? "E" : "S"}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-2 mb-2">
                          {courrier.objet}
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">De:</span>
                        <span className="truncate">{courrier.expediteur}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">À:</span>
                        <span className="truncate">{courrier.destinataire}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span>{formatFileSize(courrier.file_size)}</span>
                        <span className="text-[10px]">
                          {new Date(courrier.date_principale).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {selectedCourriers.map((courrier) => (
                <motion.div
                  key={courrier.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:shadow-md transition-all group"
                >
                  <div
                    className="flex-1 flex items-center gap-4 cursor-pointer"
                    onClick={() => {
                      setSelectedCourrier(courrier);
                      setDetailsOpen(true);
                    }}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        courrier.type_courrier === "entrant"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {courrier.type_courrier === "entrant" ? (
                        <Inbox className="h-5 w-5" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold">
                          {courrier.numero_registre}
                        </span>
                        <Badge
                          variant={courrier.type_courrier === "entrant" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {courrier.type_courrier === "entrant" ? "Entrant" : "Sortant"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate mb-1">{courrier.objet}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>De: {courrier.expediteur}</span>
                        <span>→</span>
                        <span>À: {courrier.destinataire}</span>
                        <span>•</span>
                        <span>{formatFileSize(courrier.file_size)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu 3 points */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCourrier(courrier);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Aperçu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(courrier)}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCourrier(courrier);
                          setVersionsOpen(true);
                        }}
                      >
                        <GitBranch className="h-4 w-4 mr-2" />
                        Versions ({courrier.nombre_versions})
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCourrier(courrier);
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCourrier(courrier);
                          setShareOpen(true);
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CourrierDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        courrier={selectedCourrier}
        onStatusChanged={loadCourriers}
      />

      {shareOpen && selectedCourrier && (
        <ShareCourrierDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          courrier={selectedCourrier}
        />
      )}

      {editOpen && selectedCourrier && (
        <EditCourrierDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          courrier={selectedCourrier}
          onSuccess={() => {
            loadCourriers();
            toast({
              title: "Succès",
              description: "Courrier modifié avec succès",
            });
          }}
        />
      )}

      {/* Dialog de gestion des versions */}
      <CourrierVersionsDialog
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
        courrier={selectedCourrier}
        onVersionCreated={() => {
          loadCourriers();
          toast({
            title: "Succès",
            description: "Nouvelle version créée avec succès",
          });
        }}
      />
    </div>
  );
}
