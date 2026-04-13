// Pagination types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Service types
export interface Service {
  id: number;
  nom: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'rh' | 'dg' | 'collaborator' | 'client';
  is_active: boolean;
  date_joined: string;
  service?: number;
  service_nom?: string;
  signature_electronique?: string;
  signature_url?: string | null;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshTokenResponse {
  access: string;
}

// Document types
export interface DocumentShare {
  id: number;
  document: number;
  shared_with: number;
  shared_with_username: string;
  shared_with_email: string;
  shared_by: number;
  shared_by_username: string;
  permission: 'view' | 'edit';
  shared_at: string;
}

export interface ShareRequest {
  id: number;
  document: number;
  document_title: string;
  document_owner: string;
  document_owner_id: number;
  requested_by: number;
  requested_by_username: string;
  requested_by_email: string;
  requested_permission: 'view' | 'edit';
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  rejection_count: number;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  reviewed_by_username?: string;
}

export interface Document {
  file_size: number;
  file_url: any;
  id: number;
  title: string;
  file: string;
  file_type: 'pdf' | 'word' | 'excel' | 'ppt' | 'image' | 'scan';
  visibility: 'private' | 'shared' | 'public';
  owner: number;
  owner_name: string;
  folder: number | null;
  tags: number[];
  tag_list?: Tag[];  // Liste complète des tags avec id et name
  shares?: DocumentShare[];
  shared_with_count?: number;
  is_favorite: boolean;
  has_access?: boolean;
  has_pending_request?: boolean;
  access_request_rejection_count?: number;
  access_request_status?: 'pending' | 'approved' | 'rejected' | null;
  created_at: string;
  updated_at: string;
  // Champs pour les documents archivés
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: number;
}

// Folder types
export interface FolderPath {
  id: number;
  name: string;
}

export interface Folder {
  id: number;
  name: string;
  parent: number | null;
  owner: number;
  owner_name?: string;
  created_at: string;
  subfolders_count?: number;
  documents_count?: number;
  path?: FolderPath[];
  has_access?: boolean;
}

export interface FolderTree extends Folder {
  subfolders?: FolderTree[];
}

// Tag types
export interface Tag {
  id: number;
  name: string;
}

// Categorie types
export interface Categorie {
  id: number;
  name: string;
  description?: string;
  courriers_count?: number;
  created_at?: string;
}

// API Error
export interface ApiError {
  error?: string;
  detail?: string;
  message?: string;
}

// ============================================================================
// TYPES POUR LE REGISTRE DE COURRIER RH
// ============================================================================

/**
 * Type pour un courrier complet (réponse de l'API)
 */
export interface Courrier {
  id: number;
  numero_registre: string;  // Ex: "2026-0001"
  
  // Type et dates
  type_courrier: 'entrant' | 'sortant' | 'interne';
  type_courrier_display: string;  // "Courrier Entrant", "Courrier Sortant" ou "Courrier Interne"
  date_reception: string | null;  // Format ISO
  date_envoi: string | null;      // Format ISO
  date_principale: string | null; // Date principale selon le type
  
  // Parties prenantes
  expediteur: string;
  destinataire: string;
  
  // Contenu
  objet: string;
  reference: string;
  reference_structure: string;  // Référence de la structure externe
  
  // Catégorie
  categorie: number | null;
  categorie_name: string | null;
  categorie_details: Categorie | null;
  
  // Service et traitement
  service_concerne: string;
  service_concerne_display: string;
  statut: 'brouillon' | 'recu' | 'en_traitement' | 'traite' | 'archive';
  statut_display: string;  // "Reçu", "En traitement", etc.
  
  // Fichier principal
  fichier: string;  // URL du fichier
  file_type: string;
  file_size: number;  // En octets

  // Pièces jointes multiples
  pieces_jointes: PieceJointe[];
  
  // Notes
  notes: string;
  
  // Marquage urgent
  urgent: boolean;
  
  // Gestion des versions
  courrier_parent: number | null;  // ID du courrier parent
  courrier_parent_numero: string | null;  // Numéro de registre du parent
  version_number: number;  // Numéro de version (1, 2, 3...)
  version_label: string;  // Label de version ("V1", "V2", "V3"...)
  est_version_actuelle: boolean;  // Est-ce la version active/actuelle ?
  nombre_versions: number;  // Nombre total de versions
  
  // Métadonnées
  enregistre_par: number;
  enregistre_par_nom: string;
  enregistre_par_details?: UserSimple;
  created_at: string;
  updated_at: string;
  
  // Archivage (soft delete)
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: number;

  // Réponse à un courrier
  reponse_a?: number | null;
  reponse_a_numero?: string | null;  // Numéro de registre du courrier parent
  reponse_a_objet?: string | null;   // Objet du courrier parent
  contenu_lettre?: string | null;

  // Statut de la dernière affectation
  derniere_affectation_statut: string | null;
  derniere_affectation_statut_display: string | null;
  derniere_affectation_echeance: string | null;
  derniere_affectation_action_requise: string | null;
  derniere_affectation_action_requise_display: string | null;

  // Informations sur le circuit d'affectation
  a_circuit: boolean;
  nombre_affectations_circuit: number;
  
  // Affectations de l'ancien système (utilisateur par utilisateur)
  affectations_list?: Array<{
    id: number;
    utilisateur: number;
    utilisateur_username: string;
    utilisateur_nom_complet: string;
    utilisateur_service: string | null;
    statut: string;
    statut_display: string;
    action_requise: string;
    action_requise_display: string;
    niveau_urgence: string;
    niveau_urgence_display: string;
    date_echeance: string | null;
    note: string;
    date_affectation: string;
    date_lecture: string | null;
    date_traitement: string | null;
  }>;

  // Affectations du nouveau système v2 (circuits)
  affectations_v2?: Array<{
    id: number;
    circuit: number;
    destinataire: number;
    destinataire_nom: string;
    service: number | null;
    service_nom: string | null;
    action_requise: string;
    niveau_urgence: string;
    statut: string;
    date_echeance: string | null;
    date_traitement: string | null;
    etape_numero: number;
    peut_traiter: boolean;
  }>;
}

/**
 * Pièce jointe d'un courrier
 */
export interface PieceJointe {
  id: number;
  fichier: string;
  fichier_url: string;
  nom_fichier: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

/**
 * Type pour la création d'un courrier (formulaire)
 */
export interface CourrierCreate {
  type_courrier: 'entrant' | 'sortant' | 'interne';
  date_reception?: string;  // Obligatoire si entrant
  date_envoi?: string;      // Obligatoire si sortant
  expediteur: string;
  destinataire: string;
  objet: string;
  reference?: string;
  reference_structure?: string;  // Référence de la structure externe
  categorie?: number;  // ID de la catégorie
  service_concerne?: string;
  statut?: 'brouillon' | 'recu' | 'en_traitement' | 'traite' | 'archive';
  fichier: File;  // Fichier à uploader
  notes?: string;
  reponse_a?: number;
  contenu_lettre?: string;
}

/**
 * Type pour les filtres de recherche de courriers
 */
export interface CourrierFilters {
  type_courrier?: 'entrant' | 'sortant' | 'interne';
  statut?: 'brouillon' | 'recu' | 'en_traitement' | 'traite' | 'archive' | 'non_archive' | 'all';
  service_concerne?: string; // Code du service (ancien système, pour rétro-compatibilité)
  service?: number; // ID du service (nouveau système avec BDD)
  search?: string;
  date_debut?: string;
  date_fin?: string;
  ordering?: string;
  urgent?: boolean;
}

/**
 * Type pour les statistiques du registre
 */
export interface CourrierStatistics {
  total: number;
  total_30j: number;
  variation_total: number;
  entrants: number;
  entrants_30j: number;
  variation_entrants: number;
  sortants: number;
  sortants_30j: number;
  variation_sortants: number;
  internes?: number;
  urgents: number;
  urgents_30j: number;
  variation_urgents: number;
  courriers_avec_versions: number;
  total_versions: number;
  
  lifecycle_flow: {
    [key: string]: {
      label: string;
      count: number;
      color: string;
    };
  };
  
  par_statut: {
    [key: string]: {
      label: string;
      count: number;
    };
  };
  
  par_service: {
    [key: string]: {
      label: string;
      count: number;
      en_traitement: number;
      pourcentage: number;
    };
  };
  
  distribution_types: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  
  urgents_details: Array<{
    id: number;
    numero_registre: string;
    objet: string;
    expediteur: string;
    service: string;
    service_key: string;
    statut: string;
    statut_key: string;
    temps_ecoule: string;
    created_at: string;
  }>;
  
  tendances_mensuelles?: Array<{
    mois: string;
    count: number;
    total: number;
    entrants: number;
    sortants: number;
    internes?: number;
  }>;
  
  partages_total?: number;
  partages_email?: number;
  partages_whatsapp?: number;
  partages_cette_semaine?: number;
}

/**
 * Type simplifié pour l'utilisateur (dans les détails du courrier)
 */
export interface UserSimple {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Type pour les résultats de recherche de courriers (liste déroulante)
 */
export interface CourrierSearchResult {
  id: number;
  numero_registre: string;
  objet: string;
  type_courrier: 'entrant' | 'sortant' | 'interne';
  type_courrier_display: string;
  date_principale: string | null;
  expediteur: string;
  destinataire: string;
}

/**
 * Choix pour les services (à synchroniser avec le backend)
 */
export const SERVICE_CHOICES = [
  { value: 'rh', label: 'Ressources Humaines' },
  { value: 'comptabilite', label: 'Comptabilité' },
  { value: 'direction', label: 'Direction' },
  { value: 'technique', label: 'Service Technique' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'juridique', label: 'Juridique' },
  { value: 'informatique', label: 'Informatique' },
  { value: 'logistique', label: 'Logistique' },
  { value: 'autre', label: 'Autre' },
] as const;

/**
 * Choix pour les modes de réception/envoi
 */
export const MODE_CHOICES = [
  { value: 'postal', label: 'Courrier postal' },
  { value: 'email', label: 'Email' },
  { value: 'fax', label: 'Fax' },
  { value: 'main_propre', label: 'Remise en main propre' },
  { value: 'coursier', label: 'Coursier' },
  { value: 'autre', label: 'Autre' },
] as const;

/**
 * Choix pour les statuts
 */
export const STATUT_CHOICES = [
  { value: 'brouillon', label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
  { value: 'recu', label: 'Reçu', color: 'bg-blue-100 text-blue-800' },
  { value: 'en_traitement', label: 'En traitement', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'traite', label: 'Traité', color: 'bg-green-100 text-green-800' },
  { value: 'archive', label: 'Archivé', color: 'bg-gray-100 text-gray-800' },
] as const;

// ============================================================================
// TYPES POUR LES AFFECTATIONS DE COURRIERS
// ============================================================================

/**
 * Type pour une affectation de courrier
 */
export interface AffectationCourrier {
  id: number;
  courrier: number;
  courrier_numero: string;
  courrier_objet: string;
  utilisateur: number;
  utilisateur_username: string;
  utilisateur_nom_complet: string;
  utilisateur_service: string;
  affecte_par: number;
  affecte_par_username: string;
  affecte_par_nom_complet: string;
  note: string;
  statut: 'en_attente' | 'lu' | 'en_traitement' | 'valide' | 'rejete' | 'signe';
  statut_display: string;
  commentaire_traitement: string;
  motif_rejet: string;
  nb_commentaires: number;
  date_affectation: string;
  date_lecture: string | null;
  date_traitement: string | null;
}

/**
 * Type pour un commentaire d'affectation
 */
export interface CommentaireCourrier {
  id: number;
  affectation: number;
  auteur: number;
  auteur_username: string;
  auteur_nom_complet: string;
  contenu: string;
  date_creation: string;
}

/**
 * Choix pour les statuts d'affectation
 */
export const AFFECTATION_STATUT_CHOICES = [
  { value: 'en_attente', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'lu', label: 'Lu', color: 'bg-blue-100 text-blue-800' },
  { value: 'en_traitement', label: 'En traitement', color: 'bg-orange-100 text-orange-800' },
  { value: 'valide', label: 'Validé', color: 'bg-green-100 text-green-800' },
  { value: 'rejete', label: 'Rejeté', color: 'bg-red-100 text-red-800' },
  { value: 'signe', label: 'Signé', color: 'bg-purple-100 text-purple-800' },
] as const;

// ============================================================================
// NOUVEAU SYSTÈME : CIRCUITS & AFFECTATIONS V2
// ============================================================================

/**
 * Utilisateur mini (pour les détails dans Circuit/Affectation)
 */
export interface UserMini {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  nom_complet: string;
  email: string;
  role: string;
}

/**
 * Service mini (pour les détails dans Affectation)
 */
export interface ServiceMini {
  id: number;
  nom: string;
}

/**
 * Affectation V2 (nouveau système)
 */
export interface AffectationV2 {
  id: number;
  circuit: number;
  courrier: number;
  courrier_numero: string;
  courrier_objet: string;
  destinataire: number;
  destinataire_detail: UserMini;
  service: number | null;
  service_detail: ServiceMini | null;
  affecte_par: number | null;
  affecte_par_detail: UserMini | null;
  
  // Configuration
  action_requise: 'informatif' | 'a_signer' | 'accusation_reception' | 'a_repondre' | 'a_valider' | 'a_annoter';
  note_instruction: string;
  niveau_urgence: 'faible' | 'normal' | 'eleve' | 'critique';
  date_echeance: string | null;
  etape_numero: number;
  
  // Traitement
  statut: 'distribue' | 'vu' | 'en_traitement' | 'valide' | 'signe' | 'rejete' | 'renvoye';
  commentaire_traitement: string;
  motif_rejet: string;
  
  // Dates
  date_affectation: string;
  date_lecture: string | null;
  date_traitement: string | null;
  
  // Métadonnées
  metadata: Record<string, any>;
  peut_traiter: boolean;
}

/**
 * Circuit V2 (nouveau système)
 */
export interface CircuitV2 {
  id: number;
  courrier: number;
  courrier_numero: string;
  courrier_objet: string;
  
  type_circuit: 'simultane' | 'sequentiel';
  statut: 'en_cours' | 'termine' | 'annule';
  titre: string;
  instructions_generales: string;
  
  cree_par: number | null;
  cree_par_detail: UserMini | null;
  
  date_creation: string;
  date_modification: string;
  
  metadata: Record<string, any>;
  etape_actuelle: number | null;
  progress: {
    total: number;
    terminees: number;
    pourcentage: number;
  };
  
  affectations: AffectationV2[];
}

/**
 * Données pour créer un circuit
 */
export interface CircuitCreateData {
  courrier: number;
  type_circuit: 'simultane' | 'sequentiel';
  titre?: string;
  instructions_generales?: string;
  affectations: Array<{
    service: number; // OBLIGATOIRE
    destinataire?: number; // OPTIONNEL - si absent, tous les users du service
    action_requise: string;
    note_instruction?: string;
    niveau_urgence?: string;
    date_echeance?: string;
    etape_numero?: number;
    metadata?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Choix pour les actions requises
 */
export const ACTION_REQUISE_CHOICES = [
  { value: 'informatif', label: 'À titre informatif', icon: 'Info' },
  { value: 'a_signer', label: 'À signer', icon: 'PenLine' },
  { value: 'accusation_reception', label: 'À accuser de réception', icon: 'MailCheck' },
  { value: 'a_repondre', label: 'À répondre', icon: 'MessageSquareReply' },
  { value: 'a_valider', label: 'À valider', icon: 'CheckCircle' },
  { value: 'a_annoter', label: 'À annoter', icon: 'Edit3' },
] as const;

/**
 * Choix pour les niveaux d'urgence
 */
export const NIVEAU_URGENCE_CHOICES = [
  { value: 'faible', label: 'Faible', color: 'bg-gray-100 text-gray-700' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 'eleve', label: 'Élevé', color: 'bg-orange-100 text-orange-700' },
  { value: 'critique', label: 'Critique', color: 'bg-red-100 text-red-700' },
] as const;

/**
 * Choix pour les statuts d'affectation v2
 */
export const AFFECTATION_V2_STATUT_CHOICES = [
  { value: 'distribue', label: 'Distribué', color: 'bg-slate-100 text-slate-700' },
  { value: 'vu', label: 'Vu', color: 'bg-blue-100 text-blue-700' },
  { value: 'en_traitement', label: 'En traitement', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'valide', label: 'Validé', color: 'bg-green-100 text-green-700' },
  { value: 'signe', label: 'Signé', color: 'bg-purple-100 text-purple-700' },
  { value: 'rejete', label: 'Rejeté', color: 'bg-red-100 text-red-700' },
  { value: 'renvoye', label: 'Renvoyé', color: 'bg-orange-100 text-orange-700' },
] as const;
