/**
 * Page dédiée aux courriers archivés.
 * Contrairement au registre, cette page :
 *  - Navigue vers /archives/:id (lecture seule) et non vers /courriers/:id (avec tracker)
 *  - Permet de distinguer les courriers "archivés directement" (sans traitement) de ceux
 *    "archivés après traitement" (ont eu des affectations/circuit)
 *  - N'expose aucune action du flux de traitement (affecter, changer statut, relancer)
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  Building2,
  User,
  Send,
  Inbox,
  Archive,
  MoreHorizontal,
  Eye,
  Download,
  X,
  ChevronDown,
  ChevronRight,
  Grid3x3,
  List,
  SlidersHorizontal,
  FolderOpen,
  FolderClosed,
  AlertCircle,
  FileText,
  GitBranch,
  Zap,
  RotateCcw,
  Plus,
  Upload,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";
import { ExportExcelDialog, type ExportFilters } from "@/components/ExportExcelDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import scanService from "@/services/scanService";

// ─── Types locaux ────────────────────────────────────────────────────────────

interface YearMonth {
  year: string;
  month: string;
  label: string;
  count: number;
}

interface ArchivesByYearMonth {
  [year: string]: {
    [month: string]: Courrier[];
  };
}

type ModeArchivage = "all" | "direct" | "apres_traitement";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const TYPE_COLORS: Record<string, string> = {
  entrant: "bg-blue-100 text-blue-700",
  sortant: "bg-green-100 text-green-700",
  interne: "bg-amber-100 text-amber-700",
};

// ─── Utilitaires ─────────────────────────────────────────────────────────────

/**
 * Détermine si un courrier a été archivé directement (sans avoir subi de traitement).
 * Critère : aucun circuit ni affectation enregistrés.
 */
function isArchiveDirect(c: Courrier): boolean {
  const hasCircuit = c.a_circuit === true;
  const hasAffectationsV2 = Array.isArray(c.affectations_v2) && c.affectations_v2.length > 0;
  const hasAffectationsList = Array.isArray(c.affectations_list) && c.affectations_list.length > 0;
  return !hasCircuit && !hasAffectationsV2 && !hasAffectationsList;
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function ArchivesCourriersPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isRH, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── État principal
  const [allCourriers, setAllCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ── Filtres
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [modeArchivage, setModeArchivage] = useState<ModeArchivage>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [urgentFilter, setUrgentFilter] = useState<string>("all");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [contactFilter, setContactFilter] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── Sidebar année/mois
  const [expandedYears, setExpandedYears] = useState<Set<string>>(
    new Set([new Date().getFullYear().toString()])
  );
  const [selectedYearMonth, setSelectedYearMonth] = useState<YearMonth | null>(null);

  // ── Chargement initial
  useEffect(() => {
    const fetchCourriers = async () => {
      try {
        setLoading(true);
        const data = await courrierService.getArchivedCourriersByStatus();
        setAllCourriers(data);
      } catch {
        toast({
          title: "Erreur",
          description: "Impossible de charger les courriers archivés.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCourriers();
  }, []);

  // ── Organisation par année/mois
  const archivesByYearMonth = useMemo<ArchivesByYearMonth>(() => {
    const organized: ArchivesByYearMonth = {};
    allCourriers.forEach((c) => {
      const dateStr = c.date_principale || c.date_reception || c.date_envoi;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const year = d.getFullYear().toString();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      if (!organized[year]) organized[year] = {};
      if (!organized[year][month]) organized[year][month] = [];
      organized[year][month].push(c);
    });
    return organized;
  }, [allCourriers]);

  const yearMonthList = useMemo<YearMonth[]>(() => {
    const list: YearMonth[] = [];
    Object.keys(archivesByYearMonth)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .forEach((year) => {
        Object.keys(archivesByYearMonth[year])
          .sort((a, b) => parseInt(b) - parseInt(a))
          .forEach((month) => {
            const monthIndex = parseInt(month) - 1;
            list.push({
              year,
              month,
              label: `${MONTHS[monthIndex]} ${year}`,
              count: archivesByYearMonth[year][month].length,
            });
          });
      });
    return list;
  }, [archivesByYearMonth]);

  // Auto-sélectionner le premier mois
  useEffect(() => {
    if (!selectedYearMonth && yearMonthList.length > 0) {
      setSelectedYearMonth(yearMonthList[0]);
    }
  }, [yearMonthList, selectedYearMonth]);

  // ── Contacts uniques (pour les suggestions)
  const allContacts = useMemo(() => {
    const s = new Set<string>();
    allCourriers.forEach((c) => {
      if (c.expediteur) s.add(c.expediteur);
      if (c.destinataire) s.add(c.destinataire);
    });
    return Array.from(s).sort();
  }, [allCourriers]);

  const suggestions = useMemo(() => {
    if (!search || search.length < 2) return { contacts: [], courriers: [] };
    const q = search.toLowerCase();
    return {
      contacts: allContacts.filter((c) => c.toLowerCase().includes(q)).slice(0, 5),
      courriers: allCourriers
        .filter(
          (c) =>
            c.objet?.toLowerCase().includes(q) ||
            c.numero_registre?.toLowerCase().includes(q)
        )
        .slice(0, 3),
    };
  }, [search, allContacts, allCourriers]);

  // ── Filtrage principal
  const filteredCourriers = useMemo(() => {
    const hasActiveFilters =
      search ||
      typeFilter !== "all" ||
      modeArchivage !== "all" ||
      serviceFilter !== "all" ||
      categorieFilter !== "all" ||
      urgentFilter !== "all" ||
      dateDebut ||
      dateFin ||
      contactFilter;

    let filtered =
      !hasActiveFilters && selectedYearMonth
        ? archivesByYearMonth[selectedYearMonth.year]?.[selectedYearMonth.month] ?? []
        : [...allCourriers];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.objet?.toLowerCase().includes(q) ||
          c.expediteur?.toLowerCase().includes(q) ||
          c.destinataire?.toLowerCase().includes(q) ||
          c.numero_registre?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") filtered = filtered.filter((c) => c.type_courrier === typeFilter);
    if (modeArchivage === "direct") filtered = filtered.filter(isArchiveDirect);
    if (modeArchivage === "apres_traitement") filtered = filtered.filter((c) => !isArchiveDirect(c));
    if (serviceFilter !== "all") filtered = filtered.filter((c) => c.service_concerne_display === serviceFilter);
    if (categorieFilter !== "all") filtered = filtered.filter((c) => c.categorie_name === categorieFilter);
    if (urgentFilter !== "all") filtered = filtered.filter((c) => c.urgent === (urgentFilter === "true"));
    if (dateDebut) {
      const d = new Date(dateDebut);
      filtered = filtered.filter((c) => {
        const ds = c.date_principale || c.date_reception || c.date_envoi;
        return ds && new Date(ds) >= d;
      });
    }
    if (dateFin) {
      const d = new Date(dateFin);
      filtered = filtered.filter((c) => {
        const ds = c.date_principale || c.date_reception || c.date_envoi;
        return ds && new Date(ds) <= d;
      });
    }
    if (contactFilter) {
      filtered = filtered.filter(
        (c) => c.expediteur === contactFilter || c.destinataire === contactFilter
      );
    }
    return filtered;
  }, [
    allCourriers,
    selectedYearMonth,
    archivesByYearMonth,
    search,
    typeFilter,
    modeArchivage,
    serviceFilter,
    categorieFilter,
    urgentFilter,
    dateDebut,
    dateFin,
    contactFilter,
  ]);

  // ── Stats globales (basées sur allCourriers)
  const globalStats = useMemo(() => ({
    total: allCourriers.length,
    direct: allCourriers.filter(isArchiveDirect).length,
    apresTraitement: allCourriers.filter((c) => !isArchiveDirect(c)).length,
    urgents: allCourriers.filter((c) => c.urgent).length,
  }), [allCourriers]);

  // ── Contacts pour l'export
  const contactsList = useMemo(
    () =>
      Array.from(
        new Set(allCourriers.flatMap((c) => [c.expediteur, c.destinataire]).filter(Boolean))
      ).sort(),
    [allCourriers]
  );

  // ── Helpers UI
  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });
  };

  const getTypeIcon = (type: string) => {
    if (type === "entrant") return <Inbox className="h-4 w-4" />;
    if (type === "sortant") return <Send className="h-4 w-4" />;
    if (type === "interne") return <Building2 className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatDate = (c: Courrier) => {
    const ds = c.date_principale || c.date_reception || c.date_envoi;
    return ds ? new Date(ds).toLocaleDateString("fr-FR") : "—";
  };

  // ── Actions
  const handleViewCourrier = (id: number) => navigate(`/archives/${id}`);

  const handleDownload = async (courrier: Courrier) => {
    try {
      await courrierService.telechargerFichier(courrier.id, courrier.numero_registre);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de télécharger le fichier." });
    }
  };

  const handleRestaurer = async (courrier: Courrier) => {
    if (!isRH && !isAdmin) {
      toast({ variant: "destructive", title: "Accès refusé", description: "Seule la RH peut restaurer des courriers archivés." });
      return;
    }
    try {
      await courrierService.changerStatut(courrier.id, "traite");
      const data = await courrierService.getArchivedCourriersByStatus();
      setAllCourriers(data);
      toast({ title: "Courrier restauré", description: `${courrier.numero_registre} remis dans le flux actif.` });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de restaurer le courrier." });
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await scanService.extractDocumentInfo(file);
      navigate("/archives/nouveau", {
        state: { file, extracted: result.fields ?? {}, ocr_used: result.ocr_used, warning: result.warning },
      });
    } catch {
      navigate("/archives/nouveau", { state: { file, extracted: {}, ocr_used: false } });
    } finally {
      setUploading(false);
      setUploadOpen(false);
    }
  };

  const handleExport = async (exportFilters: ExportFilters, fields: string[]) => {
    try {
      setExporting(true);
      const apiFilters: Record<string, unknown> = { statut: "archive" };
      if (exportFilters.date_debut) apiFilters.date_debut = exportFilters.date_debut;
      if (exportFilters.date_fin) apiFilters.date_fin = exportFilters.date_fin;
      if (exportFilters.type_courrier) apiFilters.type_courrier = exportFilters.type_courrier;
      if (exportFilters.service) apiFilters.service = exportFilters.service;
      if (exportFilters.urgent !== undefined) apiFilters.urgent = exportFilters.urgent;
      await courrierService.telechargerExcel(apiFilters, fields);
      toast({ title: "Export réussi", description: "Les archives ont été exportées en Excel." });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'exporter les archives." });
    } finally {
      setExporting(false);
    }
  };

  const hasActiveFilters =
    typeFilter !== "all" ||
    modeArchivage !== "all" ||
    serviceFilter !== "all" ||
    categorieFilter !== "all" ||
    urgentFilter !== "all" ||
    !!dateDebut ||
    !!dateFin ||
    !!contactFilter;

  const activeFilterCount = [
    typeFilter !== "all",
    modeArchivage !== "all",
    serviceFilter !== "all",
    categorieFilter !== "all",
    urgentFilter !== "all",
    dateDebut,
    dateFin,
    contactFilter,
  ].filter(Boolean).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f9fb] flex">
      {/* ──── Chargement ──── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020]" />
            <p className="mt-4 text-sm text-slate-600">Chargement des archives…</p>
          </div>
        </div>
      ) : (
        <>
          {/* ──── Sidebar Années / Mois ──── */}
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Archive className="h-4 w-4 text-[#800020]" />
                Archives des courriers
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {allCourriers.length} courrier{allCourriers.length !== 1 ? "s" : ""} au total
              </p>
            </div>

            {/* Compteurs rapides */}
            <div className="px-3 py-2 grid grid-cols-2 gap-2 border-b border-slate-100">
              <button
                onClick={() => setModeArchivage(modeArchivage === "direct" ? "all" : "direct")}
                className={cn(
                  "rounded-lg p-2 text-left transition-all border",
                  modeArchivage === "direct"
                    ? "border-[#800020] bg-[#800020]/5"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <p className={cn("text-base font-bold", modeArchivage === "direct" ? "text-[#800020]" : "text-slate-800")}>
                  {globalStats.direct}
                </p>
                <p className="text-[9px] text-slate-500 leading-tight mt-0.5">Archivés directement</p>
              </button>
              <button
                onClick={() => setModeArchivage(modeArchivage === "apres_traitement" ? "all" : "apres_traitement")}
                className={cn(
                  "rounded-lg p-2 text-left transition-all border",
                  modeArchivage === "apres_traitement"
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <p className={cn("text-base font-bold", modeArchivage === "apres_traitement" ? "text-emerald-700" : "text-slate-800")}>
                  {globalStats.apresTraitement}
                </p>
                <p className="text-[9px] text-slate-500 leading-tight mt-0.5">Après traitement</p>
              </button>
            </div>

            {/* Arborescence Année / Mois */}
            <div className="flex-1 overflow-y-auto p-3">
              {Object.keys(archivesByYearMonth)
                .sort((a, b) => parseInt(b) - parseInt(a))
                .map((year) => (
                  <div key={year} className="mb-1">
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {expandedYears.has(year) ? (
                          <FolderOpen className="h-3.5 w-3.5 text-yellow-500" />
                        ) : (
                          <FolderClosed className="h-3.5 w-3.5 text-yellow-500" />
                        )}
                        <span>{year}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 leading-none">
                          {Object.values(archivesByYearMonth[year]).reduce(
                            (sum, arr) => sum + arr.length,
                            0
                          )}
                        </Badge>
                        {expandedYears.has(year) ? (
                          <ChevronDown className="h-3 w-3 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-slate-400" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedYears.has(year) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="ml-3 mt-0.5 space-y-0.5"
                        >
                          {Object.keys(archivesByYearMonth[year])
                            .sort((a, b) => parseInt(b) - parseInt(a))
                            .map((month) => {
                              const monthIndex = parseInt(month) - 1;
                              const courriers = archivesByYearMonth[year][month];
                              const isSelected =
                                selectedYearMonth?.year === year &&
                                selectedYearMonth?.month === month;

                              return (
                                <button
                                  key={month}
                                  onClick={() =>
                                    setSelectedYearMonth({
                                      year,
                                      month,
                                      label: `${MONTHS[monthIndex]} ${year}`,
                                      count: courriers.length,
                                    })
                                  }
                                  className={cn(
                                    "w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition-all",
                                    isSelected
                                      ? "bg-[#800020]/10 text-[#800020] font-semibold"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                  )}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className={cn("h-3 w-3", isSelected ? "text-[#800020]" : "text-slate-400")} />
                                    {MONTHS[monthIndex]}
                                  </span>
                                  <Badge
                                    className={cn(
                                      "text-[9px] px-1 py-0 h-4 leading-none border-0",
                                      isSelected
                                        ? "bg-[#800020]/10 text-[#800020]"
                                        : "bg-slate-100 text-slate-500"
                                    )}
                                  >
                                    {courriers.length}
                                  </Badge>
                                </button>
                              );
                            })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

              {Object.keys(archivesByYearMonth).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Archive className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">Aucune archive</p>
                </div>
              )}
            </div>
          </aside>

          {/* ──── Contenu principal ──── */}
          <main className="flex-1 flex flex-col">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Archive className="h-5 w-5 text-[#800020]" />
                    {modeArchivage === "direct"
                      ? "Archivés directement (sans traitement)"
                      : modeArchivage === "apres_traitement"
                      ? "Archivés après traitement"
                      : selectedYearMonth
                      ? selectedYearMonth.label
                      : "Toutes les archives"}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {filteredCourriers.length} courrier{filteredCourriers.length !== 1 ? "s" : ""}
                    {modeArchivage === "direct" && (
                      <span className="ml-2 text-amber-600 font-medium">
                        — Aucun circuit de traitement
                      </span>
                    )}
                    {modeArchivage === "apres_traitement" && (
                      <span className="ml-2 text-emerald-600 font-medium">
                        — Circuit de traitement complété
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {contactFilter && (
                    <Badge
                      className="gap-1.5 pl-2 pr-1 py-1 bg-[#800020]/10 text-[#800020] border border-[#800020]/20 cursor-pointer"
                      onClick={() => setContactFilter("")}
                    >
                      <User className="h-3 w-3" />
                      <span className="text-xs">{contactFilter}</span>
                      <X className="h-3 w-3" />
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                    className="border-slate-300"
                  >
                    {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setExportDialogOpen(true)}
                    disabled={exporting}
                    className="gap-2 bg-[#800020] hover:bg-[#600018] text-white"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {exporting ? "Export…" : "Exporter"}
                  </Button>
                </div>
              </div>
            </header>

            {/* Barre de filtres */}
            <div className="bg-white border-b border-slate-200 px-6 py-3">
              <div className="flex items-center gap-3">
                {/* Recherche avec suggestions */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un contact, objet, numéro…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="pl-10"
                  />
                  <AnimatePresence>
                    {showSuggestions &&
                      search.length >= 2 &&
                      (suggestions.contacts.length > 0 || suggestions.courriers.length > 0) && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                        >
                          {suggestions.contacts.length > 0 && (
                            <div className="p-2">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase px-2 pb-1">Contacts</p>
                              {suggestions.contacts.map((contact, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => { setContactFilter(contact); setSearch(""); setShowSuggestions(false); }}
                                  className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <User className="h-4 w-4 text-slate-400" />
                                  <span className="text-sm text-slate-700">{contact}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {suggestions.courriers.length > 0 && (
                            <div className="p-2 border-t border-slate-100">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase px-2 pb-1">Courriers</p>
                              {suggestions.courriers.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => { handleViewCourrier(c.id); setShowSuggestions(false); }}
                                  className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 group"
                                >
                                  <p className="text-sm text-slate-900 font-medium truncate">{c.objet}</p>
                                  <p className="text-xs text-slate-500">{c.numero_registre} • {formatDate(c)}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>

                {/* Filtre mode archivage rapide */}
                <Select value={modeArchivage} onValueChange={(v) => setModeArchivage(v as ModeArchivage)}>
                  <SelectTrigger className="w-52 border-slate-300">
                    <Archive className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    <SelectValue placeholder="Mode d'archivage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modes</SelectItem>
                    <SelectItem value="direct">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        Archivés directement
                      </div>
                    </SelectItem>
                    <SelectItem value="apres_traitement">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Après traitement
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtres avancés */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "gap-2 border-slate-300",
                        hasActiveFilters && "border-[#800020] text-[#800020] bg-[#800020]/5"
                      )}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtres
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[9px] font-bold">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-h-[520px] overflow-y-auto" align="end">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Filtres avancés</h4>

                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1.5 block">Type</label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les types</SelectItem>
                            <SelectItem value="entrant">Entrant</SelectItem>
                            <SelectItem value="sortant">Sortant</SelectItem>
                            <SelectItem value="interne">Interne</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1.5 block">Service</label>
                        <Select value={serviceFilter} onValueChange={setServiceFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les services</SelectItem>
                            <SelectItem value="Ressources Humaines">Ressources Humaines</SelectItem>
                            <SelectItem value="Comptabilité">Comptabilité</SelectItem>
                            <SelectItem value="Informatique">Informatique</SelectItem>
                            <SelectItem value="Direction Générale">Direction Générale</SelectItem>
                            <SelectItem value="Service Client">Service Client</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1.5 block">Priorité</label>
                        <Select value={urgentFilter} onValueChange={setUrgentFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Priorité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="true">Urgents</SelectItem>
                            <SelectItem value="false">Non urgents</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1.5 block">Date début</label>
                        <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1.5 block">Date fin</label>
                        <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                      </div>

                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTypeFilter("all");
                            setModeArchivage("all");
                            setServiceFilter("all");
                            setCategorieFilter("all");
                            setUrgentFilter("all");
                            setDateDebut("");
                            setDateFin("");
                            setContactFilter("");
                          }}
                          className="w-full gap-2 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                          Réinitialiser
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {search && (
                  <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* ──── Liste / Grille ──── */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredCourriers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Archive className="h-16 w-16 text-slate-200 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-1">Aucun courrier trouvé</h3>
                  <p className="text-sm text-slate-400">
                    {selectedYearMonth && !hasActiveFilters
                      ? "Aucun courrier archivé pour cette période."
                      : "Aucun courrier ne correspond à vos critères."}
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCourriers.map((courrier) => {
                    const direct = isArchiveDirect(courrier);
                    return (
                      <motion.div
                        key={courrier.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all group cursor-pointer"
                        onClick={() => handleViewCourrier(courrier.id)}
                      >
                        <div className="p-4 border-b border-slate-100">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn("p-2 rounded-lg", TYPE_COLORS[courrier.type_courrier])}>
                                {getTypeIcon(courrier.type_courrier)}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <Badge variant="outline" className="text-[9px] font-bold px-1 py-0 h-4 leading-none w-fit">
                                  {courrier.numero_registre}
                                </Badge>
                                {courrier.urgent && (
                                  <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 leading-none w-fit">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); handleViewCourrier(courrier.id); }}>
                                  <Eye className="h-4 w-4" /> Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled className="gap-2 text-slate-400 cursor-not-allowed">
                                  <RotateCcw className="h-4 w-4" /> Restaurer dans le flux
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2">
                            {courrier.objet}
                          </h3>

                          {/* Badge mode archivage */}
                          <Badge
                            className={cn(
                              "text-[9px] px-1.5 py-0 h-4 leading-none font-medium border-0",
                              direct
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            )}
                          >
                            {direct ? (
                              <><Clock className="h-2.5 w-2.5 mr-1" />Archivé directement</>
                            ) : (
                              <><CheckCircle2 className="h-2.5 w-2.5 mr-1" />Après traitement</>
                            )}
                          </Badge>
                        </div>

                        <div className="p-4 space-y-1.5 text-xs text-slate-600">
                          {courrier.expediteur && (
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-medium">De :</span>
                              <span className="truncate">{courrier.expediteur}</span>
                            </div>
                          )}
                          {courrier.destinataire && (
                            <div className="flex items-center gap-2">
                              <Send className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-medium">À :</span>
                              <span className="truncate">{courrier.destinataire}</span>
                            </div>
                          )}
                          {courrier.service_concerne_display && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate">{courrier.service_concerne_display}</span>
                            </div>
                          )}
                        </div>

                        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(courrier)}
                          </div>
                          {courrier.fichier && (
                            <FileText className="h-3.5 w-3.5 text-[#800020]" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                /* ──── Vue liste ──── */
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Numéro</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Objet</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Expéditeur / Dest.</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Mode archivage</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCourriers.map((courrier) => {
                        const direct = isArchiveDirect(courrier);
                        return (
                          <tr
                            key={courrier.id}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => handleViewCourrier(courrier.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{courrier.numero_registre}</span>
                                {courrier.urgent && <AlertCircle className="h-4 w-4 text-red-500" />}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium", TYPE_COLORS[courrier.type_courrier])}>
                                {getTypeIcon(courrier.type_courrier)}
                                <span className="capitalize">{courrier.type_courrier}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900 truncate max-w-xs">{courrier.objet}</p>
                              {courrier.categorie_name && (
                                <Badge variant="secondary" className="mt-0.5 text-[9px] px-1 h-4">{courrier.categorie_name}</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]">
                              {courrier.expediteur || courrier.destinataire || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(courrier)}</td>
                            <td className="px-4 py-3">
                              <Badge
                                className={cn(
                                  "text-[9px] px-1.5 py-0 h-5 leading-none font-medium border-0",
                                  direct ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                )}
                              >
                                {direct ? (
                                  <><Clock className="h-2.5 w-2.5 mr-1" />Direct</>
                                ) : (
                                  <><CheckCircle2 className="h-2.5 w-2.5 mr-1" />Traité</>
                                )}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2" onClick={() => handleViewCourrier(courrier.id)}>
                                    <Eye className="h-4 w-4" /> Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem disabled className="gap-2 text-slate-400 cursor-not-allowed">
                                    <RotateCcw className="h-4 w-4" /> Restaurer dans le flux
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* ──── Dialogs ──── */}
      <ExportExcelDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        contacts={contactsList}
        onExport={handleExport}
      />

      {/* FAB - Archiver un nouveau courrier */}
      <button
        onClick={() => setUploadOpen(true)}
        title="Archiver un nouveau courrier"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#800020] hover:bg-[#600018] text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f);
          e.target.value = "";
        }}
      />

      {/* Dialog upload + OCR */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!uploading) setUploadOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#800020]" />
              Archiver un nouveau courrier
            </DialogTitle>
          </DialogHeader>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileUpload(f);
            }}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all",
              dragOver ? "border-[#800020] bg-[#800020]/5" : "border-slate-300"
            )}
          >
            <Archive className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Glissez un document ici
            </p>
            <p className="text-xs text-slate-400 mb-4">PDF, JPG, PNG, TIFF</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#800020] border-t-transparent" />Analyse en cours…</>
              ) : (
                <><Upload className="h-4 w-4" />Choisir un fichier</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
