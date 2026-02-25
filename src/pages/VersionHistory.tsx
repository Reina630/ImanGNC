import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  Download,
  Eye,
  RotateCcw,
  Filter,
  ChevronDown,
  ChevronUp,
  History,
  User,
  Calendar,
  HardDrive,
  FileCheck,
  Upload,
  Pencil,
  Share2,
  Trash2,
  FolderPlus,
  Image,
  FileSpreadsheet,
  File,
  Scan,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const stats = [
  { label: "Documents versionnés", value: "24", icon: FileCheck, color: "text-primary" },
  { label: "Total versions", value: "89", icon: History, color: "text-info" },
  { label: "Versions aujourd'hui", value: "6", icon: Clock, color: "text-success" },
  { label: "Espace versions", value: "2.8 GB", icon: HardDrive, color: "text-warning" },
];

const documentsWithVersions = [
  {
    id: 1,
    name: "Rapport_Annuel_2023.pdf",
    type: "PDF",
    icon: FileText,
    iconColor: "text-destructive",
    currentVersion: "3.2",
    versions: [
      { version: "3.2", date: "2024-02-11 14:30", author: "Marie Kone", size: "2.4 MB", changes: "Ajout des graphiques financiers Q4", downloads: 12 },
      { version: "3.1", date: "2024-02-11 10:15", author: "Ahmed Diallo", size: "2.3 MB", changes: "Correction des tableaux de données", downloads: 8 },
      { version: "3.0", date: "2024-02-10 16:00", author: "Marie Kone", size: "2.2 MB", changes: "Mise à jour majeure - Refonte complète", downloads: 24 },
      { version: "2.5", date: "2024-02-09 11:30", author: "Fatou Sow", size: "1.9 MB", changes: "Ajout section RH", downloads: 15 },
      { version: "2.0", date: "2024-02-08 09:00", author: "Ahmed Diallo", size: "1.8 MB", changes: "Version initiale approuvée", downloads: 32 },
    ],
  },
  {
    id: 2,
    name: "Budget_2024.xlsx",
    type: "Excel",
    icon: FileSpreadsheet,
    iconColor: "text-success",
    currentVersion: "2.1",
    versions: [
      { version: "2.1", date: "2024-02-11 14:15", author: "Ahmed Diallo", size: "1.2 MB", changes: "Ajustement prévisions Q1", downloads: 5 },
      { version: "2.0", date: "2024-02-10 13:00", author: "Ibrahim Keita", size: "1.1 MB", changes: "Validation finale du budget", downloads: 18 },
      { version: "1.5", date: "2024-02-09 15:30", author: "Marie Kone", size: "1.0 MB", changes: "Ajout des dépenses marketing", downloads: 12 },
    ],
  },
  {
    id: 3,
    name: "Contrat_Client_XYZ.docx",
    type: "Word",
    icon: File,
    iconColor: "text-info",
    currentVersion: "1.3",
    versions: [
      { version: "1.3", date: "2024-02-11 11:00", author: "Youssouf Traore", size: "156 KB", changes: "Révision juridique finale", downloads: 3 },
      { version: "1.2", date: "2024-02-10 14:20", author: "Fatou Sow", size: "148 KB", changes: "Modification conditions de paiement", downloads: 7 },
      { version: "1.1", date: "2024-02-09 10:00", author: "Youssouf Traore", size: "142 KB", changes: "Ajout annexes techniques", downloads: 5 },
    ],
  },
  {
    id: 4,
    name: "Présentation_Stratégie.pptx",
    type: "PowerPoint",
    icon: FileText,
    iconColor: "text-warning",
    currentVersion: "4.0",
    versions: [
      { version: "4.0", date: "2024-02-11 09:30", author: "Marie Kone", size: "8.4 MB", changes: "Ajout slides roadmap produit", downloads: 14 },
      { version: "3.5", date: "2024-02-10 17:45", author: "Ahmed Diallo", size: "7.9 MB", changes: "Mise à jour chiffres clés", downloads: 22 },
      { version: "3.0", date: "2024-02-10 12:00", author: "Marie Kone", size: "7.2 MB", changes: "Refonte design et branding", downloads: 28 },
    ],
  },
];

const activityLog = [
  { icon: Upload, bgColor: "bg-success/15", iconColor: "text-success", user: "Marie Kone", initials: "MK", action: "a créé la version", target: "Rapport_Annuel_2023.pdf v3.2", detail: "Ajout des graphiques financiers Q4", time: "2024-02-11 14:30" },
  { icon: Pencil, bgColor: "bg-warning/15", iconColor: "text-warning", user: "Ahmed Diallo", initials: "AD", action: "a créé la version", target: "Budget_2024.xlsx v2.1", detail: "Ajustement prévisions Q1", time: "2024-02-11 14:15" },
  { icon: RotateCcw, bgColor: "bg-info/15", iconColor: "text-info", user: "Ibrahim Keita", initials: "IK", action: "a restauré", target: "Contrat_Client_XYZ.docx v1.2", detail: "Restauration depuis v1.3", time: "2024-02-11 13:00" },
  { icon: Download, bgColor: "bg-primary/15", iconColor: "text-primary", user: "Fatou Sow", initials: "FS", action: "a téléchargé", target: "Rapport_Annuel_2023.pdf v3.1", detail: "Version précédente", time: "2024-02-11 12:45" },
  { icon: Eye, bgColor: "bg-secondary/15", iconColor: "text-secondary", user: "Youssouf Traore", initials: "YT", action: "a consulté", target: "Budget_2024.xlsx v2.0", detail: "Comparaison de versions", time: "2024-02-11 11:30" },
  { icon: Upload, bgColor: "bg-success/15", iconColor: "text-success", user: "Marie Kone", initials: "MK", action: "a créé la version", target: "Présentation_Stratégie.pptx v4.0", detail: "Ajout slides roadmap produit", time: "2024-02-11 09:30" },
  { icon: Pencil, bgColor: "bg-warning/15", iconColor: "text-warning", user: "Ahmed Diallo", initials: "AD", action: "a modifié", target: "Rapport_Annuel_2023.pdf v3.1", detail: "Correction des tableaux", time: "2024-02-11 10:15" },
  { icon: RotateCcw, bgColor: "bg-info/15", iconColor: "text-info", user: "Marie Kone", initials: "MK", action: "a restauré", target: "Budget_2024.xlsx v1.5", detail: "Retour à la version précédente", time: "2024-02-10 18:00" },
];

function DocumentVersionCard({ doc }: { doc: typeof documentsWithVersions[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [restoreVersion, setRestoreVersion] = useState<typeof doc.versions[0] | null>(null);
  const [previewVersion, setPreviewVersion] = useState<typeof doc.versions[0] | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card hover:shadow-md transition-all"
    >
      {/* Document Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2.5 rounded-lg bg-muted ${doc.iconColor}`}>
            <doc.icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{doc.name}</h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <History className="h-3 w-3" />
                Version actuelle: {doc.currentVersion}
              </span>
              <span>{doc.versions.length} versions</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Versions List */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 space-y-2 pl-14"
        >
          {doc.versions.map((version, idx) => (
            <div
              key={version.version}
              className={`p-3 rounded-lg border transition-colors ${
                idx === 0
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-muted/30 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`font-semibold text-sm ${idx === 0 ? "text-primary" : ""}`}>
                      v{version.version}
                      {idx === 0 && (
                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          Actuelle
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {version.date}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {version.author}
                    </span>
                    <span className="text-xs text-muted-foreground">{version.size}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {version.downloads} téléchargements
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">{version.changes}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewVersion(version)}
                    className="h-8"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {idx !== 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRestoreVersion(version)}
                      className="h-8 text-info hover:text-info"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Restore Dialog */}
      <Dialog open={!!restoreVersion} onOpenChange={() => setRestoreVersion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurer la version {restoreVersion?.version}</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir restaurer cette version ? Une nouvelle version sera créée à
              partir de celle-ci.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span className="font-semibold">v{restoreVersion?.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{restoreVersion?.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auteur:</span>
                <span>{restoreVersion?.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taille:</span>
                <span>{restoreVersion?.size}</span>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Modifications:</span>
              <p className="mt-1 italic">{restoreVersion?.changes}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRestoreVersion(null)}>
              Annuler
            </Button>
            <Button onClick={() => setRestoreVersion(null)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {doc.name} - Version {previewVersion?.version}
            </DialogTitle>
            <DialogDescription>
              Aperçu de la version créée le {previewVersion?.date}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Auteur:</span>
                <span className="font-medium">{previewVersion?.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Taille:</span>
                <span className="font-medium">{previewVersion?.size}</span>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-1">Modifications:</p>
              <p className="text-sm italic text-muted-foreground">{previewVersion?.changes}</p>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/30">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Aperçu du document version {previewVersion?.version}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Le contenu du document s'afficherait ici
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewVersion(null)}>
              Fermer
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default function VersionHistory() {
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterUser, setFilterUser] = useState("all");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-7 w-7 text-primary" />
          Historique & Versions
        </h1>
        <p className="text-muted-foreground text-sm">
          Gérez les versions de vos documents et consultez l'historique complet des modifications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="versions" className="space-y-4">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="versions">Versions des documents</TabsTrigger>
          <TabsTrigger value="activity">Journal d'activité</TabsTrigger>
        </TabsList>

        {/* Versions Tab */}
        <TabsContent value="versions" className="space-y-4">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Filtres</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Période</label>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les périodes</SelectItem>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Type de document</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="word">Word</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="powerpoint">PowerPoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            {documentsWithVersions.map((doc, idx) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <DocumentVersionCard doc={doc} />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Filtres</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Période</label>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les périodes</SelectItem>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Utilisateur</label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    <SelectItem value="mk">Marie Kone</SelectItem>
                    <SelectItem value="ad">Ahmed Diallo</SelectItem>
                    <SelectItem value="fs">Fatou Sow</SelectItem>
                    <SelectItem value="yt">Youssouf Traore</SelectItem>
                    <SelectItem value="ik">Ibrahim Keita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Type d'action</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les actions</SelectItem>
                    <SelectItem value="create">Création version</SelectItem>
                    <SelectItem value="restore">Restauration</SelectItem>
                    <SelectItem value="download">Téléchargement</SelectItem>
                    <SelectItem value="view">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="stat-card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Journal d'activité
            </h2>
            <div className="space-y-3">
              {activityLog.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2.5 rounded-lg shrink-0 h-fit ${activity.bgColor}`}>
                    <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                            {activity.initials}
                          </div>
                          <span className="font-medium text-sm">{activity.user}</span>
                          <span className="text-sm text-muted-foreground">{activity.action}</span>
                        </div>
                        <p className="text-sm font-semibold text-primary">{activity.target}</p>
                        <p className="text-xs text-muted-foreground italic mt-0.5">
                          {activity.detail}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
