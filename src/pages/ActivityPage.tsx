import { Upload, Share2, MessageSquare, Pencil, Trash2, FolderPlus, Clock, Filter, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const stats = [
  { label: "Aujourd'hui", value: "8" },
  { label: "Total activités", value: "8" },
  { label: "Uploads", value: "1", color: "text-success" },
  { label: "Modifications", value: "1", color: "text-destructive" },
];

const activities = [
  { icon: Upload, bgColor: "bg-success/15", iconColor: "text-success", user: "Marie Kone", initials: "MK", action: "a uploadé", target: "Rapport_Q4_2023.pdf", detail: "dans Documents/Rapports", time: "2024-02-11 14:30" },
  { icon: Pencil, bgColor: "bg-warning/15", iconColor: "text-warning", user: "Ahmed Diallo", initials: "AD", action: "a modifié", target: "Budget_2024.xlsx", detail: "Version 2.1", time: "2024-02-11 14:15" },
  { icon: MessageSquare, bgColor: "bg-destructive/15", iconColor: "text-destructive", user: "Fatou Sow", initials: "FS", action: "a commenté", target: "Rapport_Annuel_2023.pdf", detail: '"Excellent travail sur ce rapport"', time: "2024-02-11 13:45" },
  { icon: Share2, bgColor: "bg-info/15", iconColor: "text-info", user: "Youssouf Traore", initials: "YT", action: "a partagé", target: "Contrat_Client_XYZ.docx", detail: "avec Ahmed Diallo", time: "2024-02-11 12:30" },
  { icon: FolderPlus, bgColor: "bg-secondary/15", iconColor: "text-secondary", user: "Marie Kone", initials: "MK", action: "a créé le dossier", target: "Archives_2023", detail: "dans Documents", time: "2024-02-11 11:00" },
  { icon: Trash2, bgColor: "bg-destructive/15", iconColor: "text-destructive", user: "Ibrahim Keita", initials: "IK", action: "a supprimé", target: "Brouillon_Note.docx", detail: "depuis Corbeille", time: "2024-02-10 17:00" },
  { icon: Upload, bgColor: "bg-success/15", iconColor: "text-success", user: "Fatou Sow", initials: "FS", action: "a uploadé", target: "Tableau_RH_Janvier.xlsx", detail: "dans Documents/RH", time: "2024-02-10 10:30" },
  { icon: Share2, bgColor: "bg-info/15", iconColor: "text-info", user: "Ahmed Diallo", initials: "AD", action: "a partagé", target: "Manuel_Utilisateur.pdf", detail: "avec Marie Kone", time: "2024-02-09 16:00" },
];

export default function ActivityPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Journal d'activité</h1>
        <p className="text-muted-foreground text-sm">Suivez toutes les actions effectuées sur vos documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color || "text-foreground"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Filtres</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type d'activité</label>
            <Select defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les activités</SelectItem>
                <SelectItem value="upload">Uploads</SelectItem>
                <SelectItem value="edit">Modifications</SelectItem>
                <SelectItem value="share">Partages</SelectItem>
                <SelectItem value="comment">Commentaires</SelectItem>
                <SelectItem value="delete">Suppressions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Utilisateur</label>
            <Select defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                <SelectItem value="marie">Marie Kone</SelectItem>
                <SelectItem value="ahmed">Ahmed Diallo</SelectItem>
                <SelectItem value="fatou">Fatou Sow</SelectItem>
                <SelectItem value="youssouf">Youssouf Traore</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Période</label>
            <Select defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Activity list */}
      <div className="stat-card">
        <h3 className="font-semibold mb-4">Activités récentes ({activities.length})</h3>
        <div className="space-y-0">
          {activities.map((a, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-border/50 last:border-0">
              {/* Icon */}
              <div className={`p-2.5 rounded-lg shrink-0 ${a.bgColor}`}>
                <a.icon className={`h-4 w-4 ${a.iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{a.user}</span>{" "}
                  <span className="text-muted-foreground">{a.action}</span>{" "}
                  <FileText className="inline h-3.5 w-3.5 text-muted-foreground mx-0.5 -mt-0.5" />
                  <span className="font-medium">{a.target}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
              </div>

              {/* Time + Avatar */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {a.time}
                </span>
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  {a.initials}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
