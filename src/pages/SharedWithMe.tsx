import { useState } from "react";
import {
  FileText,
  Users,
  Eye,
  Download,
  MoreHorizontal,
  Share2,
  Lock,
  Unlock,
  MessageSquare,
  Send,
  UserPlus,
  X,
  FileSpreadsheet,
  File,
  Image,
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SharedDocument {
  id: number;
  name: string;
  type: string;
  size: string;
  sharedBy?: string;
  sharedWith?: string[];
  permission: "read" | "write" | "admin";
  date: string;
  locked: boolean;
  lockedBy?: string;
  commentsCount: number;
}

interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  date: string;
}

const stats = [
  { label: "Reçus en partage", value: "12", icon: Users, color: "text-info" },
  { label: "Mes partages", value: "8", icon: Share2, color: "text-primary" },
  { label: "Documents verrouillés", value: "3", icon: Lock, color: "text-warning" },
  { label: "Total commentaires", value: "24", icon: MessageSquare, color: "text-success" },
];

const sharedWithMe: SharedDocument[] = [
  {
    id: 1,
    name: "Rapport_Financier_Q4.pdf",
    type: "PDF",
    size: "2.4 MB",
    sharedBy: "Fatou Sow",
    permission: "read",
    date: "2024-02-10 14:30",
    locked: false,
    commentsCount: 5,
  },
  {
    id: 2,
    name: "Contrat_ACME.docx",
    type: "Word",
    size: "156 KB",
    sharedBy: "Ibrahim Keita",
    permission: "write",
    date: "2024-02-09 11:15",
    locked: true,
    lockedBy: "Ibrahim Keita",
    commentsCount: 3,
  },
  {
    id: 3,
    name: "PV_AG_2024.pdf",
    type: "PDF",
    size: "1.8 MB",
    sharedBy: "Marie Kone",
    permission: "read",
    date: "2024-02-08 16:00",
    locked: false,
    commentsCount: 2,
  },
  {
    id: 4,
    name: "Budget_2025.xlsx",
    type: "Excel",
    size: "1.2 MB",
    sharedBy: "Ahmed Diallo",
    permission: "write",
    date: "2024-02-07 09:30",
    locked: true,
    lockedBy: "Marie Kone",
    commentsCount: 8,
  },
];

const sharedByMe: SharedDocument[] = [
  {
    id: 5,
    name: "Manuel_Utilisateur.pdf",
    type: "PDF",
    size: "3.2 MB",
    sharedWith: ["Fatou Sow", "Ibrahim Keita", "Ahmed Diallo"],
    permission: "read",
    date: "2024-02-11 10:00",
    locked: false,
    commentsCount: 4,
  },
  {
    id: 6,
    name: "Présentation_Stratégie.pptx",
    type: "PowerPoint",
    size: "8.4 MB",
    sharedWith: ["Marie Kone", "Youssouf Traore"],
    permission: "write",
    date: "2024-02-10 15:30",
    locked: true,
    lockedBy: "Vous",
    commentsCount: 12,
  },
  {
    id: 7,
    name: "Rapport_Annuel_2023.pdf",
    type: "PDF",
    size: "2.4 MB",
    sharedWith: ["Équipe Direction"],
    permission: "admin",
    date: "2024-02-09 14:00",
    locked: false,
    commentsCount: 7,
  },
];

const mockComments: Comment[] = [
  {
    id: 1,
    author: "Marie Kone",
    avatar: "MK",
    content: "Excellent travail sur ce rapport ! Les chiffres sont très clairs.",
    date: "2024-02-11 14:30",
  },
  {
    id: 2,
    author: "Ahmed Diallo",
    avatar: "AD",
    content: "Je suggère d'ajouter une section sur les prévisions Q1 2024.",
    date: "2024-02-11 13:15",
  },
  {
    id: 3,
    author: "Fatou Sow",
    avatar: "FS",
    content: "Quelques ajustements à faire dans le tableau page 5.",
    date: "2024-02-11 11:00",
  },
];

const availableUsers = [
  { id: "1", name: "Marie Kone", email: "marie.kone@iman.sn" },
  { id: "2", name: "Ahmed Diallo", email: "ahmed.diallo@iman.sn" },
  { id: "3", name: "Fatou Sow", email: "fatou.sow@iman.sn" },
  { id: "4", name: "Ibrahim Keita", email: "ibrahim.keita@iman.sn" },
  { id: "5", name: "Youssouf Traore", email: "youssouf.traore@iman.sn" },
];

function getTypeIcon(type: string) {
  const iconProps = "h-5 w-5";
  switch (type) {
    case "PDF":
      return <FileText className={`${iconProps} text-destructive`} />;
    case "Word":
      return <File className={`${iconProps} text-info`} />;
    case "Excel":
      return <FileSpreadsheet className={`${iconProps} text-success`} />;
    case "PowerPoint":
      return <FileText className={`${iconProps} text-warning`} />;
    case "Image":
      return <Image className={`${iconProps} text-secondary`} />;
    default:
      return <FileText className={`${iconProps} text-muted-foreground`} />;
  }
}

function getPermissionBadge(permission: string) {
  switch (permission) {
    case "read":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Lecture
        </span>
      );
    case "write":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Modification
        </span>
      );
    case "admin":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      );
    default:
      return null;
  }
}

export default function SharedWithMe() {
  const [activeDoc, setActiveDoc] = useState<SharedDocument | null>(null);
  const [commentsDialog, setCommentsDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sharePermission, setSharePermission] = useState<"read" | "write" | "admin">("read");

  const handleToggleLock = (doc: SharedDocument) => {
    console.log(doc.locked ? "Unlock" : "Lock", doc.name);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    console.log("Add comment:", newComment, "to", activeDoc?.name);
    setNewComment("");
    setCommentsDialog(false);
  };

  const handleShare = () => {
    console.log("Share document with users:", selectedUsers, "permission:", sharePermission);
    setShareDialog(false);
    setSelectedUsers([]);
    setSharePermission("read");
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Share2 className="h-7 w-7 text-primary" />
          Collaboration & Partage
        </h1>
        <p className="text-muted-foreground text-sm">
          Gérez vos documents partagés et collaborez avec votre équipe
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
      <Tabs defaultValue="received" className="space-y-4">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="received">Partagés avec moi</TabsTrigger>
          <TabsTrigger value="shared">Mes partages</TabsTrigger>
        </TabsList>

        {/* Shared With Me Tab */}
        <TabsContent value="received">
          <div className="stat-card !p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left p-3 font-medium">Document</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Partagé par</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Permission</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Statut</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sharedWithMe.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">{getTypeIcon(doc.type)}</div>
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{doc.size}</span>
                            {doc.commentsCount > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {doc.commentsCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                          {doc.sharedBy?.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-muted-foreground">{doc.sharedBy}</span>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">{getPermissionBadge(doc.permission)}</td>
                    <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                      {doc.date}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {doc.locked ? (
                        <span className="flex items-center gap-1 text-xs text-warning">
                          <Lock className="h-3.5 w-3.5" />
                          Verrouillé par {doc.lockedBy}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveDoc(doc);
                              setCommentsDialog(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" /> Commentaires ({doc.commentsCount})
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" /> Aperçu
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" /> Télécharger
                          </DropdownMenuItem>
                          {doc.permission === "write" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleLock(doc)}>
                                {doc.locked ? (
                                  <>
                                    <Unlock className="h-4 w-4 mr-2" /> Déverrouiller
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-4 w-4 mr-2" /> Verrouiller
                                  </>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Shared By Me Tab */}
        <TabsContent value="shared">
          <div className="stat-card !p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left p-3 font-medium">Document</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Partagé avec</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Permission</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Statut</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sharedByMe.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">{getTypeIcon(doc.type)}</div>
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{doc.size}</span>
                            {doc.commentsCount > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {doc.commentsCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {doc.sharedWith?.[0]}
                          {doc.sharedWith && doc.sharedWith.length > 1 && (
                            <span className="ml-1 text-xs">+{doc.sharedWith.length - 1}</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">{getPermissionBadge(doc.permission)}</td>
                    <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                      {doc.date}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {doc.locked ? (
                        <span className="flex items-center gap-1 text-xs text-warning">
                          <Lock className="h-3.5 w-3.5" />
                          Verrouillé par {doc.lockedBy}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveDoc(doc);
                              setCommentsDialog(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" /> Commentaires ({doc.commentsCount})
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveDoc(doc);
                              setShareDialog(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-2" /> Gérer les accès
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" /> Aperçu
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" /> Télécharger
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleLock(doc)}>
                            {doc.locked ? (
                              <>
                                <Unlock className="h-4 w-4 mr-2" /> Déverrouiller
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 mr-2" /> Verrouiller
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Comments Dialog */}
      <Dialog open={commentsDialog} onOpenChange={setCommentsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Commentaires - {activeDoc?.name}</DialogTitle>
            <DialogDescription>
              {mockComments.length} commentaires sur ce document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Comments List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {mockComments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {comment.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {comment.date}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-2 block">Ajouter un commentaire</label>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Votre commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCommentsDialog(false)}>
              Fermer
            </Button>
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Publier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialog} onOpenChange={setShareDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gérer les accès - {activeDoc?.name}</DialogTitle>
            <DialogDescription>
              Partagez ce document avec d'autres utilisateurs et définissez leurs permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Current Shares */}
            <div>
              <label className="text-sm font-medium mb-2 block">Utilisateurs actuels</label>
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                {activeDoc?.sharedWith?.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                        {user.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-sm">{user}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPermissionBadge(activeDoc.permission)}
                      <Button variant="ghost" size="sm">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Users */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ajouter des utilisateurs</label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto p-3 border rounded-lg">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(user.id) ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                        {user.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {selectedUsers.includes(user.id) && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Permission Level */}
            <div>
              <label className="text-sm font-medium mb-2 block">Niveau de permission</label>
              <Select
                value={sharePermission}
                onValueChange={(v) => setSharePermission(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-info" />
                      <div>
                        <p className="font-medium">Lecture</p>
                        <p className="text-xs text-muted-foreground">
                          Peut voir et télécharger
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="write">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-success" />
                      <div>
                        <p className="font-medium">Modification</p>
                        <p className="text-xs text-muted-foreground">
                          Peut modifier et commenter
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">Administration</p>
                        <p className="text-xs text-muted-foreground">
                          Contrôle total sur le document
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShareDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleShare} disabled={selectedUsers.length === 0}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager ({selectedUsers.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
