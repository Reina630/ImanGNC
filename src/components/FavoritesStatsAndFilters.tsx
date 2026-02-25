import { useState } from "react";
import { Star, FileText, FolderOpen } from "lucide-react";

export function FavoritesStatsAndFilters({
  total,
  docCount,
  folderCount,
  filter,
  setFilter,
}: {
  total: number;
  docCount: number;
  folderCount: number;
  filter: string;
  setFilter: (f: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="stat-card flex items-center gap-3">
          <Star className="h-5 w-5 text-warning fill-warning" />
          <div>
            <p className="text-xs text-muted-foreground">Total favoris</p>
            <p className="text-xl font-bold">{total}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Documents</p>
            <p className="text-xl font-bold">{docCount}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <FolderOpen className="h-5 w-5 text-pink-400" />
          <div>
            <p className="text-xs text-muted-foreground">Dossiers</p>
            <p className="text-xl font-bold">{folderCount}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
          onClick={() => setFilter("all")}
        >
          Tout
        </button>
        <button
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === "docs" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
          onClick={() => setFilter("docs")}
        >
          Documents
        </button>
        <button
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === "folders" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
          onClick={() => setFilter("folders")}
        >
          Dossiers
        </button>
      </div>
    </>
  );
}
