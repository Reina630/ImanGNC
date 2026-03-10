/**
 * Page de détails d'un courrier archivé (statut='archive')
 * Affiche le courrier en lecture seule avec viewer PDF, métadonnées et historique des versions
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Mail,
  Send,
  Inbox,
  Building2,
  Archive,
  Clock,
  Download,
  Eye,
  GitBranch,
  AlertCircle,
  CheckCircle,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import courrierService from '@/services/courrierService';
import type { Courrier } from '@/types';

export default function ArchivedCourrierDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courrier, setCourrier] = useState<Courrier | null>(null);
  const [versions, setVersions] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadCourrierDetails();
      loadVersions();
    }
  }, [id]);

  const loadCourrierDetails = async () => {
    try {
      setLoading(true);
      if (!id) return;
      
      const data = await courrierService.getCourrier(parseInt(id));
      setCourrier(data);
      setSelectedVersionId(data.id);
    } catch (error) {
      console.error('Erreur lors du chargement du courrier:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger le courrier',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      if (!id) return;
      
      const versionsList = await courrierService.getCourrierVersions(parseInt(id));
      setVersions(versionsList);
    } catch (error) {
      console.error('Erreur lors du chargement des versions:', error);
    }
  };

  const handleDownload = async () => {
    if (!courrier) return;
    
    try {
      await courrierService.telechargerFichier(courrier.id, courrier.numero_registre);
      toast({
        title: 'Téléchargement réussi',
        description: `Fichier ${courrier.numero_registre} téléchargé`,
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de télécharger le fichier',
      });
    }
  };

  const handleViewVersion = (version: Courrier) => {
    setSelectedVersionId(version.id);
    setCourrier(version);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const getStatutBadge = (statut: string) => {
    const statutConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      recu: { variant: 'outline', label: 'Reçu' },
      en_traitement: { variant: 'secondary', label: 'En traitement' },
      traite: { variant: 'default', label: 'Traité' },
      archive: { variant: 'outline', label: 'Archivé' },
    };
    const config = statutConfig[statut] || { variant: 'default' as const, label: statut };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'entrant' ? (
      <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">
        <Inbox className="h-3 w-3 mr-1" />
        Entrant
      </Badge>
    ) : (
      <Badge className="bg-green-500/10 text-green-600 border-green-200">
        <Send className="h-3 w-3 mr-1" />
        Sortant
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!courrier) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">Courrier non trouvé</p>
        <Button onClick={() => navigate('/archives')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux archives
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/archives')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">{courrier.numero_registre}</h1>
                {courrier.urgent && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Urgent
                  </Badge>
                )}
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
                  <Archive className="h-3 w-3 mr-1" />
                  Archivé
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{courrier.objet}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - PDF Viewer */}
        <div className="flex-1 bg-muted/30 p-6 overflow-auto">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-[8.5/11] bg-white rounded-lg overflow-hidden">
                {courrier.fichier ? (
                  <iframe
                    src={courrier.fichier}
                    className="w-full h-full"
                    title="Aperçu du courrier"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucun fichier disponible</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Details & Versions */}
        <div className="w-96 border-l border-border overflow-auto">
          <Tabs defaultValue="details" className="h-full">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="details" className="flex-1">Détails</TabsTrigger>
              <TabsTrigger value="versions" className="flex-1">
                <GitBranch className="h-4 w-4 mr-1" />
                Versions ({versions.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab: Détails */}
            <TabsContent value="details" className="p-4 space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Type:</span>
                    {getTypeBadge(courrier.type_courrier)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Statut:</span>
                    {getStatutBadge(courrier.statut)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Référence:</span>
                    <span className="text-sm">{courrier.reference || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Catégorie:</span>
                    <span className="text-sm">{courrier.categorie_name || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Parties prenantes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Expéditeur</span>
                    </div>
                    <p className="text-sm ml-6">{courrier.expediteur || '-'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Send className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Destinataire</span>
                    </div>
                    <p className="text-sm ml-6">{courrier.destinataire || '-'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Service</span>
                    </div>
                    <p className="text-sm ml-6">{courrier.service_concerne || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {courrier.date_reception && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Réception:</span>
                      <span className="text-sm">{formatDate(courrier.date_reception)}</span>
                    </div>
                  )}
                  {courrier.date_envoi && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Envoi:</span>
                      <span className="text-sm">{formatDate(courrier.date_envoi)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Enregistré:</span>
                    <span className="text-sm">{formatDate(courrier.created_at)}</span>
                  </div>
                </CardContent>
              </Card>

              {courrier.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {courrier.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fichier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{courrier.file_type?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatFileSize(courrier.file_size || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Versions */}
            <TabsContent value="versions" className="p-4 space-y-3 m-0">
              {versions.length === 0 ? (
                <div className="text-center py-12">
                  <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Aucune version disponible</p>
                </div>
              ) : (
                versions.map((version) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all ${
                        selectedVersionId === version.id 
                          ? 'border-primary ring-1 ring-primary' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleViewVersion(version)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={version.est_version_actuelle ? 'default' : 'outline'}>
                              V{version.version_number}
                            </Badge>
                            {version.est_version_actuelle && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Actuelle
                              </Badge>
                            )}
                          </div>
                          {selectedVersionId === version.id && (
                            <Eye className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(version.created_at)}
                          </p>
                          {version.enregistre_par_nom && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.enregistre_par_nom}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
