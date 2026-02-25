import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { shareService } from '@/services';
import type { DocumentShare, ShareRequest } from '@/types';
import { Share2, FileText, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function SharesPage() {
  const { user } = useAuth();
  const [myShares, setMyShares] = useState<DocumentShare[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<DocumentShare[]>([]);
  const [myRequests, setMyRequests] = useState<ShareRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ShareRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRevokeAnimation, setShowRevokeAnimation] = useState(false);
  const [revokedUserName, setRevokedUserName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shares, received, requests, pending] = await Promise.all([
        shareService.getMyShares(),
        shareService.getSharedWithMe(),
        shareService.getMyRequests(),
        shareService.getPendingForMyDocuments(),
      ]);
      setMyShares(shares);
      setSharedWithMe(received);
      setMyRequests(requests);
      setPendingRequests(pending);
    } catch (error) {
      console.error('Erreur lors du chargement des partages:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les partages',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShare = async (shareId: number, userName: string) => {
    try {
      await shareService.deleteShare(shareId);
      
      // Afficher l'animation de retrait d'accès
      setRevokedUserName(userName);
      setShowRevokeAnimation(true);
      setTimeout(() => setShowRevokeAnimation(false), 2000);
      
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de retirer l\'accès',
      });
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    try {
      await shareService.approveRequest(requestId);
      toast({
        title: 'Succès',
        description: 'Demande approuvée et partage créé',
      });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'approuver la demande',
      });
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await shareService.rejectRequest(requestId);
      toast({
        title: 'Succès',
        description: 'Demande rejetée',
      });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de rejeter la demande',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50"><CheckCircle className="h-3 w-3 mr-1" />Approuvée</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50"><XCircle className="h-3 w-3 mr-1" />Rejetée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPermissionBadge = (permission: string) => {
    return permission === 'edit' ? (
      <Badge variant="outline"><Edit className="h-3 w-3 mr-1" />Édition</Badge>
    ) : (
      <Badge variant="outline"><Eye className="h-3 w-3 mr-1" />Lecture</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Animation de retrait d'accès */}
      {showRevokeAnimation && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            className="bg-background/95 backdrop-blur-sm border-2 border-destructive rounded-2xl p-8 shadow-2xl"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1,
              ease: "easeInOut",
              times: [0, 0.5, 1],
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, 0],
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut",
                }}
              >
                <UserX 
                  className="h-24 w-24 text-destructive" 
                  strokeWidth={1.5}
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.5))',
                  }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center"
              >
                <p className="text-xl font-bold text-foreground mb-1">
                  Accès retiré
                </p>
                <p className="text-lg text-muted-foreground">
                  Vous avez retiré l'accès à <span className="font-semibold text-destructive">{revokedUserName}</span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Share2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gestion des Partages</h1>
          <p className="text-muted-foreground">Gérez vos partages et demandes d'accès</p>
        </div>
      </div>

      <Tabs defaultValue="shared-by-me" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shared-by-me">
            Mes partages
            {myShares.length > 0 && (
              <Badge className="ml-2" variant="secondary">{myShares.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="shared-with-me">
            Partagés avec moi
            {sharedWithMe.length > 0 && (
              <Badge className="ml-2" variant="secondary">{sharedWithMe.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-requests">
            Mes demandes
            {myRequests.length > 0 && (
              <Badge className="ml-2" variant="secondary">{myRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending-requests">
            Demandes reçues
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-yellow-500">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Onglet: Mes partages */}
        <TabsContent value="shared-by-me" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents que j'ai partagés</CardTitle>
              <CardDescription>
                Liste des documents que vous avez partagés avec d'autres utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myShares.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Share2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Vous n'avez partagé aucun document pour le moment</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Partagé avec</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myShares.map((share) => (
                      <TableRow key={share.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Document #{share.document}</span>
                          </div>
                        </TableCell>
                        <TableCell>{share.shared_with_username}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {share.shared_with_email}
                        </TableCell>
                        <TableCell>{getPermissionBadge(share.permission)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(share.shared_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteShare(share.id, share.shared_with_username)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Retirer l'accès
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet: Partagés avec moi */}
        <TabsContent value="shared-with-me" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents partagés avec moi</CardTitle>
              <CardDescription>
                Documents auxquels d'autres utilisateurs vous ont donné accès
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sharedWithMe.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Share2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucun document n'a été partagé avec vous</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Partagé par</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sharedWithMe.map((share) => (
                      <TableRow key={share.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Document #{share.document}</span>
                          </div>
                        </TableCell>
                        <TableCell>{share.shared_by_username}</TableCell>
                        <TableCell>{getPermissionBadge(share.permission)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(share.shared_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet: Mes demandes */}
        <TabsContent value="my-requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mes demandes d'accès</CardTitle>
              <CardDescription>
                Demandes d'accès que vous avez faites pour accéder à des documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Vous n'avez fait aucune demande d'accès</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Propriétaire</TableHead>
                      <TableHead>Permission demandée</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{request.document_title}</div>
                              {request.message && (
                                <div className="text-xs text-muted-foreground italic">
                                  "{request.message}"
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{request.document_owner}</TableCell>
                        <TableCell>{getPermissionBadge(request.requested_permission)}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(request.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet: Demandes reçues */}
        <TabsContent value="pending-requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Demandes d'accès reçues</CardTitle>
              <CardDescription>
                Demandes en attente pour vos documents - Approuvez ou rejetez
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune demande en attente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Demandeur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{request.document_title}</div>
                              {request.message && (
                                <div className="text-xs text-muted-foreground italic max-w-xs">
                                  "{request.message}"
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{request.requested_by_username}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {request.requested_by_email}
                        </TableCell>
                        <TableCell>{getPermissionBadge(request.requested_permission)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRequest(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
