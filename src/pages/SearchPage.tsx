import { useState } from "react";
import { Search, Filter, FileText, Calendar, User, Tag, FolderOpen, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

const savedSearches = [
  "Rapports financiers 2024",
  "Contrats partenaires",
  "Factures impayées",
  "PV assemblée générale",
];

const suggestions = [
  { label: "Rapport", count: 45 },
  { label: "Contrat", count: 23 },
  { label: "Facture", count: 67 },
  { label: "Budget", count: 12 },
  { label: "PV", count: 8 },
];

const filters = [
  { icon: FileText, label: "Type de fichier", options: ["PDF", "DOCX", "XLSX", "Image"] },
  { icon: Calendar, label: "Période", options: ["Aujourd'hui", "Cette semaine", "Ce mois", "Cette année"] },
  { icon: User, label: "Auteur", options: ["Amadou D.", "Fatou S.", "Ibrahim K.", "Marie L."] },
  { icon: FolderOpen, label: "Dossier", options: ["Finance", "RH", "Direction", "Juridique"] },
  { icon: Tag, label: "Tags", options: ["Urgent", "Confidentiel", "Validé", "En cours"] },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recherche avancée</h1>
        <p className="text-muted-foreground text-sm">Trouvez rapidement vos documents</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, contenu, tag..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 h-14 text-base bg-card border-border shadow-sm rounded-xl"
        />
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => setQuery(s.label)}
            className="px-3 py-1.5 rounded-full text-sm border border-border hover:bg-muted hover:border-primary/20 transition-colors"
          >
            {s.label} <span className="text-muted-foreground ml-1">({s.count})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filters.map((f) => (
            <div key={f.label}>
              <label className="flex items-center gap-2 text-sm font-medium mb-2 text-muted-foreground">
                <f.icon className="h-4 w-4" /> {f.label}
              </label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="">Tous</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Saved searches */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Recherches sauvegardées</h3>
        </div>
        <div className="space-y-2">
          {savedSearches.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 text-sm transition-colors"
            >
              <Search className="h-3.5 w-3.5 inline mr-2 text-muted-foreground" />
              {s}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
