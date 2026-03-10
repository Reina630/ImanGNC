/**
 * ============================================================================
 * PAGE DE DOCUMENTATION - Guide d'utilisation de l'application GED
 * ============================================================================
 * 
 * Cette page fournit une documentation complète de l'application de Gestion 
 * Électronique de Documents (GED) et du Registre de Courrier RH.
 * 
 * SECTIONS :
 * ----------
 * 1. Vue d'ensemble de l'application
 * 2. Gestion des documents
 * 3. Registre de courrier
 * 4. Affectations et workflow
 * 5. Partages et collaborations
 * 6. Archives
 * 7. Rôles et permissions
 * 
 * @author Équipe GED
 * @version 1.0
 * @since 2026
 */

import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  Mail,
  Users,
  Share2,
  Archive,
  Shield,
  Zap,
  Search,
  Upload,
  Download,
  Eye,
  Settings,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DocumentationPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* En-tête */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Documentation</h1>
            <p className="text-muted-foreground">
              Guide complet d'utilisation de l'application GED et Registre de Courrier
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          {/* <TabsTrigger value="documents">Documents</TabsTrigger> */}
          <TabsTrigger value="courrier">Courrier</TabsTrigger>
          <TabsTrigger value="affectations">Affectations</TabsTrigger>
          <TabsTrigger value="partages">Partages</TabsTrigger>
          <TabsTrigger value="archives">Archives</TabsTrigger>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
        </TabsList>

        {/* ============================================================================ */}
        {/* VUE D'ENSEMBLE */}
        {/* ============================================================================ */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Qu'est-ce que cette application ?
              </CardTitle>
              <CardDescription>
                Présentation générale du système de gestion documentaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cette application est un <strong>système de Gestion Électronique de Courriers (GEC)</strong> 
               . Elle permet de centraliser, organiser 
                et gérer tous les documents et courriers de votre organisation de manière sécurisée et efficace.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <FileText className="h-5 w-5" />
                    <h3>Gestion Documentaire</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                    <li>• Upload et stockage sécurisé</li>
                    <li>• Organisation par dossiers</li>
                    <li>• Gestion des versions</li>
                    <li>• Recherche avancée</li>
                    <li>• Partage collaboratif</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Mail className="h-5 w-5" />
                    <h3>Registre de Courrier</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                    <li>• Enregistrement entrants/sortants</li>
                    <li>• Numérotation automatique</li>
                    <li>• Suivi des statuts</li>
                    <li>• Affectation par service</li>
                    <li>• Export Excel</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accès rapide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Accès rapide aux fonctionnalités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: Upload, label: "Uploader un document", path: "/upload" },
                  { icon: Mail, label: "Enregistrer un courrier", path: "/courriers/nouveau" },
                  { icon: Search, label: "Rechercher", path: "/search" },
                  { icon: Bell, label: "Mes affectations", path: "/affectations" },
                  { icon: Share2, label: "Mes partages", path: "/shares" },
                  { icon: Archive, label: "Archives", path: "/archives" },
                ].map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================================ */}
        {/* GESTION DES DOCUMENTS */}
        {/* ============================================================================ */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Documents</CardTitle>
              <CardDescription>
                Comment uploader, organiser et gérer vos documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  1. Uploader un document
                </h3>
                <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                  <p>Pour ajouter un nouveau document :</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Cliquez sur le bouton <Badge variant="outline">+ Nouveau document</Badge></li>
                    <li>Remplissez le titre du document</li>
                    <li>Sélectionnez le type de fichier (PDF, Word, Excel, etc.)</li>
                    <li>Choisissez la visibilité (Privé, Partagé, Public)</li>
                    <li>Optionnel : Ajoutez des tags et choisissez un dossier</li>
                    <li>Uploadez votre fichier (glisser-déposer ou sélection)</li>
                    <li>Validez l'upload</li>
                  </ol>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <div className="flex gap-2">
                      <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-blue-900 text-xs">
                        <strong>Astuce :</strong> Vous pouvez glisser-déposer plusieurs fichiers 
                        simultanément pour un upload plus rapide.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Organisation */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  2. Organiser vos documents
                </h3>
                <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                  <p><strong>Dossiers :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Créez des dossiers pour organiser vos documents</li>
                    <li>Déplacez les documents par glisser-déposer</li>
                    <li>Créez des sous-dossiers pour une hiérarchie claire</li>
                  </ul>
                  <p className="mt-3"><strong>Tags :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Ajoutez des tags pour faciliter la recherche</li>
                    <li>Filtrez par tags dans la barre de recherche</li>
                    <li>Un document peut avoir plusieurs tags</li>
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Versions */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  3. Gestion des versions
                </h3>
                <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                  <p>Chaque document dispose d'un système de versioning automatique :</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>La première version est créée automatiquement à l'upload</li>
                    <li>Créez une nouvelle version en remplaçant le fichier</li>
                    <li>Consultez l'historique complet des versions</li>
                    <li>Téléchargez n'importe quelle version antérieure</li>
                    <li>Les métadonnées sont conservées entre versions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================================ */}
        {/* REGISTRE DE COURRIER */}
        {/* ============================================================================ */}
        <TabsContent value="courrier" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registre de Courrier</CardTitle>
              <CardDescription>
                Enregistrement et suivi des courriers entrants et sortants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enregistrement */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  1. Enregistrer un courrier
                </h3>
                <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                  <p>Pour créer une nouvelle entrée dans le registre :</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Accédez au <strong>Registre de Courrier</strong></li>
                    <li>Cliquez sur <Badge variant="outline">+ Nouveau courrier</Badge></li>
                    <li>Sélectionnez le type : <Badge>Entrant</Badge> ou <Badge>Sortant</Badge></li>
                    <li>Remplissez les informations obligatoires :
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Objet du courrier</li>
                        <li>Expéditeur (pour entrant) ou Destinataire (pour sortant)</li>
                        <li>Date de réception/envoi</li>
                      </ul>
                    </li>
                    <li>Uploadez le fichier scanné du courrier (PDF recommandé)</li>
                    <li>Optionnel : Ajoutez une référence, des notes, une catégorie</li>
                    <li>Validez : un numéro de registre unique est généré automatiquement</li>
                  </ol>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <div className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-green-900 text-xs">
                        <strong>Numérotation automatique :</strong> Chaque courrier reçoit un numéro unique 
                        au format ANNÉE-NNNN (ex: 2026-0001, 2026-0002...).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Statuts */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  2. Cycle de vie et statuts
                </h3>
                <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                  <p>Un courrier passe par plusieurs statuts :</p>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-100 text-blue-800">Reçu</Badge>
                      <span className="text-xs">→ Courrier enregistré, en attente de traitement</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-100 text-yellow-800">En traitement</Badge>
                      <span className="text-xs">→ Courrier affecté, en cours de traitement</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-800">Traité</Badge>
                      <span className="text-xs">→ Traitement terminé</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-gray-100 text-gray-800">Archivé</Badge>
                      <span className="text-xs">→ Courrier archivé pour conservation</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fonctionnalités avancées */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  3. Fonctionnalités avancées
                </h3>
                <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                  <p><strong>Marquage urgent :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Marquez un courrier comme urgent/prioritaire</li>
                    <li>Visualisez tous les courriers urgents dans la page dédiée</li>
                    <li>Les courriers urgents ont un badge jaune <Badge className="bg-yellow-100 text-yellow-800">⚡ Urgent</Badge></li>
                  </ul>
                  <p className="mt-3"><strong>Export Excel :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Exportez le registre complet en fichier Excel</li>
                    <li>Les filtres actifs sont appliqués à l'export</li>
                    <li>Nom de fichier automatique avec date et heure</li>
                  </ul>
                  <p className="mt-3"><strong>Versions de courrier :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Créez des versions successives d'un même courrier</li>
                    <li>Utile pour les corrections ou mises à jour</li>
                    <li>Historique complet accessible à tout moment</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================================ */}
        {/* AFFECTATIONS */}
        {/* ============================================================================ */}
        <TabsContent value="affectations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Affectations et Workflow</CardTitle>
              <CardDescription>
                Comment affecter et traiter les courriers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Affecter */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  1. Affecter un courrier
                </h3>
                <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                  <p>RH et Admin peuvent affecter des courriers de deux manières :</p>
                  
                  <p className="mt-3"><strong>A. Affectation via la plateforme :</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Ouvrez un courrier et cliquez sur l'icône <Badge variant="outline">🏢</Badge></li>
                    <li>Sélectionnez <Badge>Via la plateforme</Badge></li>
                    <li>Choisissez le service concerné dans la liste</li>
                    <li>Ajoutez une note (optionnel) pour les destinataires</li>
                    <li>Validez : tous les utilisateurs du service recevront une notification</li>
                  </ol>

                  <p className="mt-3"><strong>B. Affectation par email :</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Sélectionnez <Badge>Par email</Badge></li>
                    <li>Choisissez le service</li>
                    <li>Saisissez l'adresse email du destinataire</li>
                    <li>Rédigez votre message</li>
                    <li>Le courrier sera envoyé par email avec le fichier en pièce jointe</li>
                  </ol>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <div className="flex gap-2">
                      <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-blue-900 text-xs">
                        <strong>Notification automatique :</strong> Les utilisateurs affectés voient 
                        le courrier dans "Mes Courriers" et reçoivent une notification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Traiter */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  2. Traiter une affectation
                </h3>
                <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                  <p>En tant qu'utilisateur affecté, vous pouvez :</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Marquer comme lu</strong> : Le courrier passe en statut "Lu"</li>
                    <li><strong>Valider</strong> : Confirmer le traitement avec un commentaire</li>
                    <li><strong>Rejeter</strong> : Refuser avec un motif obligatoire</li>
                    <li><strong>Signer</strong> : Signature électronique pour validation officielle</li>
                    <li><strong>Commenter</strong> : Ajouter des commentaires tout au long du traitement</li>
                  </ul>
                  
                  <p className="mt-3">Accès rapide à vos affectations :</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Menu <strong>Mes Affectations</strong> : Vue détaillée de toutes vos affectations</li>
                    <li>Menu <strong>Mes Courriers</strong> : Liste simple des courriers qui vous sont affectés</li>
                    <li>Badge de notification sur l'icône 🔔 en cas de nouvelles affectations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================================ */}
        {/* PARTAGES */}
        {/* ============================================================================ */}
        <TabsContent value="partages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partages et Collaboration</CardTitle>
              <CardDescription>
                Comment partager vos documents et collaborer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" />
                  Partager un document
                </h3>
                <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                  <p>Pour partager un document avec d'autres utilisateurs :</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Ouvrez le document concerné</li>
                    <li>Cliquez sur l'icône de partage <Badge variant="outline">🔗</Badge></li>
                    <li>Sélectionnez un ou plusieurs utilisateurs</li>
                    <li>Choisissez le niveau de permission :
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li><Badge>Lecture seule</Badge> : Consultation uniquement</li>
                        <li><Badge>Lecture et modification</Badge> : Peut modifier le document</li>
                      </ul>
                    </li>
                    <li>Validez le partage</li>
                  </ol>

                  <p className="mt-3"><strong>Niveaux de visibilité :</strong></p>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Privé</Badge>
                      <span className="text-xs">→ Visible uniquement par vous</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Partagé</Badge>
                      <span className="text-xs">→ Partagé avec des utilisateurs spécifiques</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Public</Badge>
                      <span className="text-xs">→ Visible par tous les utilisateurs de l'application</span>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                      <p className="text-yellow-900 text-xs">
                        <strong>Important :</strong> Seul le propriétaire du document ou un administrateur 
                        peut partager, modifier les permissions ou retirer un partage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================================ */}
        {/* ARCHIVES */}
        {/* ============================================================================ */}
        <TabsContent value="archives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Archives</CardTitle>
              <CardDescription>
                Gestion des courriers archivés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Archive className="h-4 w-4 text-primary" />
                  Archivage de courriers
                </h3>
                <div className="ml-6 space-y-2 text-sm text-muted-foreground">
                  <p>L'archivage permet de conserver les courriers traités sans encombrer le registre actif :</p>
                  
                  <p className="mt-3"><strong>Archiver un courrier :</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Ouvrez le courrier à archiver</li>
                    <li>Changez son statut en <Badge className="bg-gray-100 text-gray-800">Archivé</Badge></li>
                    <li>Le courrier disparaît du registre principal</li>
                    <li>Il reste accessible dans la page <strong>Archives</strong></li>
                  </ol>

                  <p className="mt-3"><strong>Consulter les archives :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Accédez au menu <strong>Archives</strong></li>
                    <li>Utilisez les filtres pour rechercher un courrier archivé</li>
                    <li>Téléchargez les fichiers si nécessaire</li>
                    <li>Possibilité de restaurer un courrier (changer le statut)</li>
                  </ul>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <div className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-green-900 text-xs">
                        <strong>Conservation :</strong> Les courriers archivés sont conservés indéfiniment 
                        et restent accessibles pour consultation historique et audit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================================ */}
        {/* RÔLES ET PERMISSIONS */}
        {/* ============================================================================ */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rôles et Permissions</CardTitle>
              <CardDescription>
                Comprendre les différents niveaux d'accès
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Admin */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Administrateur</h3>
                    <Badge className="bg-purple-600">Admin</Badge>
                  </div>
                  <ul className="text-sm text-purple-900 space-y-1 ml-7">
                    <li>✓ Accès complet à toutes les fonctionnalités</li>
                    <li>✓ Gestion des utilisateurs et des services</li>
                    <li>✓ Création, modification, suppression de tous les documents et courriers</li>
                    <li>✓ Affectation de courriers à tous les services</li>
                    <li>✓ Export Excel du registre complet</li>
                    <li>✓ Consultation des statistiques globales</li>
                    <li>✓ Gestion des catégories et tags</li>
                  </ul>
                </div>

                {/* RH */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Ressources Humaines</h3>
                    <Badge className="bg-blue-600">RH</Badge>
                  </div>
                  <ul className="text-sm text-blue-900 space-y-1 ml-7">
                    <li>✓ Enregistrement de nouveaux courriers</li>
                    <li>✓ Affectation de courriers aux services</li>
                    <li>✓ Marquage urgent/prioritaire</li>
                    <li>✓ Export Excel du registre</li>
                    <li>✓ Consultation des statistiques</li>
                    <li>✓ Gestion de leurs propres documents</li>
                    <li>✓ Création et gestion des catégories</li>
                  </ul>
                </div>

                {/* Collaborateur */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Collaborateur</h3>
                    <Badge className="bg-green-600">Collaborateur</Badge>
                  </div>
                  <ul className="text-sm text-green-900 space-y-1 ml-7">
                    <li>✓ Gestion de leurs propres documents (upload, modification, suppression)</li>
                    <li>✓ Consultation des courriers qui leur sont affectés</li>
                    <li>✓ Traitement des affectations (validation, rejet, signature)</li>
                    <li>✓ Ajout de commentaires sur les affectations</li>
                    <li>✓ Partage de documents avec d'autres utilisateurs</li>
                    <li>✓ Consultation des documents publics</li>
                    <li>✗ Pas d'accès au registre complet de courrier</li>
                    <li>✗ Pas d'affectation de courriers</li>
                  </ul>
                </div>

                {/* Client */}
                <div className="border rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">Client</h3>
                    <Badge className="bg-orange-600">Client</Badge>
                  </div>
                  <ul className="text-sm text-orange-900 space-y-1 ml-7">
                    <li>✓ Consultation des documents publics</li>
                    <li>✓ Consultation des documents partagés avec eux</li>
                    <li>✓ Téléchargement des documents autorisés</li>
                    <li>✗ Pas d'upload de documents</li>
                    <li>✗ Pas d'accès au registre de courrier</li>
                    <li>✗ Pas d'affectations</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                <div className="flex gap-2">
                  <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-amber-900 text-sm">
                    <p className="font-semibold mb-1">Attribution des rôles</p>
                    <p className="text-xs">
                      Seuls les administrateurs peuvent attribuer et modifier les rôles des utilisateurs. 
                      Pour changer votre rôle ou obtenir des permissions supplémentaires, contactez votre administrateur système.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pied de page */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Besoin d'aide supplémentaire ?</h3>
                <p className="text-sm text-muted-foreground">
                  Contactez le support technique ou votre administrateur
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1">
                <Mail className="h-3 w-3" />
                support@ged.com
              </Badge>
              <Badge variant="outline" className="gap-1">
                Version 2.0
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
