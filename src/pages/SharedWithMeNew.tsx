import { useEffect, useState } from "react";
import { FileText, Users, Download, Eye, MoreHorizontal, Globe, Lock, Share2, Star } from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import type { Document as ApiDocument } from "@/types";

const typeIcon = (type: string) => {
  const fileType = type.toUpperCase();
  switch (fileType) {
    case "PDF": return <FileText className="h-5 w-5 text-primary" />;
    case "WORD": return <FileText className="h-5 w-5 text-info" />;
    case "EXCEL": return <FileText className="h-5 w-5 text-success" />;
    case "PPT": return <FileText className="h-5 w-5 text-orange-500" />;
    case "IMAGE": return <FileText className="h-5 w-5 text-warning" />;
    case "SCAN": return <FileText className="h-5 w-5 text-purple-500" />;
    default: return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getVisibilityBadge = (visibility: string) => {
  switch (visibility) {
    case "public":
      return (
        <Badge variant="outline" className="gap-1">
          <Globe className="h-3 w-3" />
          Public
        </Badge>
      );
    case "shared":
      return (
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          Partagé
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <Lock className="h-3 w-3" />
          Privé
        </Badge>
      );
  }
};

export default function SharedWithMePage() {
  const [sharedDocs, setSharedDocs] = useState<ApiDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<ApiDocument | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSharedDocuments();
  }, []);

  const loadSharedDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await documentService.getSharedWithMe();
      setSharedDocs(docs);
    } catch (error) {
      console.error("Erreur lors du chargement des documents partagés:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les documents partagés",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (doc: ApiDocument) => {
    try {
      const blob = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le document",
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Partagés avec moi</h1>
        <p className="text-muted-foreground text-sm">
          Documents que d'autres utilisateurs ont partagé avec vous
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total partagés</p>
              <p className="text-2xl font-bold mt-1">{sharedDocs.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Publics</p>
              <p className="text-2xl font-bold mt-1">
                {sharedDocs.filter(d => d.visibility === 'public').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-info/10">
              <Globe className="h-5 w-5 text-info" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Partagés avec moi</p>
              <p className="text-2xl font-bold mt-1">
                {sharedDocs.filter(d => d.visibility === 'shared').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10">
              <Users className="h-5 w-5 text-warning" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Avec permissions</p>
              <p className="text-2xl font-bold mt-1">
                {sharedDocs.filter(d => d.shares && d.shares.length > 0).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <Lock className="h-5 w-5 text-success" />
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="stat-card p-12 text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      ) : sharedDocs.length === 0 ? (
        <div className="stat-card p-12 text-center">
          <Share2 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun document partagé</h3>
          <p className="text-sm text-muted-foreground">
            Aucun document n'a été partagé avec vous pour le moment
          </p>
        </div>
      ) : (
        <div className="stat-card !p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-3 font-medium">Document</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Type</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Visibilité</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Partagé par</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
                <th className="p-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sharedDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {typeIcon(doc.file_type)}
                      <div>
                        <p className="text-sm font-medium">{doc.title}</p>
                        {doc.shares && doc.shares.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {doc.shares.length} partage{doc.shares.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className="text-xs uppercase font-medium text-muted-foreground">
                      {doc.file_type}
                    </span>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {getVisibilityBadge(doc.visibility)}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                    {doc.owner_name}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                    {formatDate(doc.created_at)}
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewDoc(doc)}>
                          <Eye className="h-4 w-4 mr-2" /> Aperçu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4 mr-2" /> Télécharger
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Dialog */}
      <DocumentPreviewDialog
        document={previewDoc}
        open={!!previewDoc}
        onOpenChange={() => setPreviewDoc(null)}
      />
    </motion.div>
  );
}
