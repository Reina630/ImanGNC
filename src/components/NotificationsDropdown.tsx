import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Mail, FileText, MessageSquare, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import notificationService, { type Notification } from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nonLuesCount, setNonLuesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    }
  };

  // Charger le compteur de notifications non lues
  const loadNonLuesCount = async () => {
    try {
      const count = await notificationService.getNotificationsNonLues();
      setNonLuesCount(count);
    } catch (error) {
      console.error("Erreur lors du chargement du compteur:", error);
    }
  };

  // Charger au montage et toutes les 30 secondes
  useEffect(() => {
    loadNonLuesCount();
    const interval = setInterval(loadNonLuesCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Charger les notifications quand le dropdown s'ouvre
  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const handleMarquerLue = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.marquerCommeLue(notification.id);
      await loadNotifications();
      await loadNonLuesCount();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleMarquerToutesLues = async () => {
    try {
      setLoading(true);
      await notificationService.marquerToutesLues();
      await loadNotifications();
      await loadNonLuesCount();
      toast({
        title: "Notifications marquées comme lues",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de marquer les notifications comme lues",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSupprimer = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.supprimerNotification(id);
      await loadNotifications();
      await loadNonLuesCount();
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleNavigate = async (notification: Notification) => {
    // Marquer comme lue
    if (!notification.lue) {
      try {
        await notificationService.marquerCommeLue(notification.id);
        await loadNonLuesCount();
      } catch (error) {
        console.error("Erreur:", error);
      }
    }

    // Naviguer selon le type de notification
    if (notification.type === 'courrier_affecte' || notification.type === 'commentaire') {
      // Courriers affectés et commentaires redirigent vers "Mes Courriers"
      navigate("/mes-courriers");
    } else if (notification.type === 'document_partage') {
      // Documents partagés redirigent vers "Documents"
      navigate("/documents");
    } else if (notification.courrier_id) {
      // Autres notifications liées aux courriers -> Mes Courriers (par défaut pour les utilisateurs)
      navigate("/mes-courriers");
    } else if (notification.document_id) {
      navigate("/documents");
    }

    setOpen(false);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'courrier_affecte':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'document_partage':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'commentaire':
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    } catch {
      return "";
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
          <Bell className="h-4 w-4" />
          {nonLuesCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
          )}
          {nonLuesCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {nonLuesCount > 9 ? '9+' : nonLuesCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {nonLuesCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarquerToutesLues}
              disabled={loading}
              className="h-8 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNavigate(notification)}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.lue ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.lue ? 'font-semibold' : 'font-medium'}`}>
                          {notification.titre}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.lue && (
                            <button
                              onClick={(e) => handleMarquerLue(notification, e)}
                              className="p-1 hover:bg-muted rounded transition-colors"
                              title="Marquer comme lu"
                            >
                              <Check className="h-3 w-3 text-muted-foreground" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleSupprimer(notification.id, e)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Supprimer"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">{formatDate(notification.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
