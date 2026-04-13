/**
 * Page d'historique des échanges avec une entité spécifique
 * Affiche tous les courriers entrants et sortants avec cette entité
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Inbox,
  Send,
  Calendar,
  Building2,
  Zap,
  Eye,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";
import { STATUT_CHOICES } from "@/types";

export default function HistoriqueEntite() {
  const { nom } = useParams<{ nom: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [typeCourrier, setTypeCourrier] = useState<string>("all");

  // Décoder le nom de l'URL
  const nomEntite = decodeURIComponent(nom || "");

  useEffect(() => {
    if (nomEntite) {
      loadCourriers();
    }
  }, [nomEntite]);

  const loadCourriers = async () => {
    try {
      setLoading(true);
      // Chercher dans tous les courriers où l'entité est expéditeur OU destinataire
      const data = await courrierService.getCourriers({
        search: nomEntite,
        ordering: "-date_reception,-date_envoi",
      });
      
      // Filtrer pour ne garder que ceux où le nom correspond exactement
      const filtered = data.filter(c => 
        c.expediteur === nomEntite || c.destinataire === nomEntite
      );
      
      setCourriers(filtered);
    } catch (error) {
      console.error("Erreur lors du chargement des courriers:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger l'historique",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatutBadge = (statut: string) => {
    const statusData = STATUT_CHOICES.find((s) => s.value === statut);
    if (!statusData) return null;

    return (
      <Badge
        variant="outline"
        style={{
          borderColor: statusData.color,
          backgroundColor: `${statusData.color}15`,
          color: statusData.color,
        }}
        className="text-xs"
      >
        {statusData.label}
      </Badge>
    );
  };

  // Filtrer les courriers selon les critères
  const courriersFiltres = courriers.filter(c => {
    // Filtre par type
    if (typeCourrier !== "all") {
      if (typeCourrier === "entrant" && c.type_courrier !== "entrant") return false;
      if (typeCourrier === "sortant" && c.type_courrier !== "sortant") return false;
    }

    // Filtre par date début
    if (dateDebut) {
      const dateC = new Date(c.date_principale || c.created_at);
      const dateD = new Date(dateDebut);
      if (dateC < dateD) return false;
    }

    // Filtre par date fin
    if (dateFin) {
      const dateC = new Date(c.date_principale || c.created_at);
      const dateF = new Date(dateFin);
      if (dateC > dateF) return false;
    }

    return true;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/courriers/suivi")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">{nomEntite}</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              {courriersFiltres.length} courrier(s) trouvé(s)
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => navigate("/courriers/nouveau")}>
          <Mail className="h-4 w-4 mr-2" />
          Nouveau courrier
        </Button>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="stat-card"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Filtres</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={typeCourrier} onValueChange={setTypeCourrier}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="entrant">Courriers reçus</SelectItem>
              <SelectItem value="sortant">Courriers envoyés</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Du :</label>
            <Input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-[140px] h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Au :</label>
            <Input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-[140px] h-9"
            />
          </div>

          {(dateDebut || dateFin || typeCourrier !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateDebut("");
                setDateFin("");
                setTypeCourrier("all");
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </motion.div>

      {/* Liste des courriers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="stat-card">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          ) : courriersFiltres.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Aucun courrier trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      N° Registre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Objet
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {courriersFiltres.map((courrier) => (
                    <tr
                      key={courrier.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        courrier.urgent ? "bg-amber-50/50 border-l-4 border-amber-500" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {courrier.urgent && (
                            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                          )}
                          <span className="font-mono text-sm font-medium">
                            {courrier.numero_registre}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(courrier.date_principale)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            courrier.type_courrier === "entrant" ? "default" : "secondary"
                          }
                          className="gap-1"
                        >
                          {courrier.type_courrier === "entrant" ? (
                            <Inbox className="h-3 w-3" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          {courrier.type_courrier === "entrant" ? "Reçu" : "Envoyé"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[300px] truncate">
                        {courrier.objet}
                      </td>
                      <td className="px-4 py-3">
                        {getStatutBadge(courrier.statut)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/courriers/${courrier.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
