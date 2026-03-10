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
  role: 'admin' | 'rh' | 'collaborator' | 'client';
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
  
  // Catégorie
  categorie: number | null;
  categorie_name: string | null;
  categorie_details: Categorie | null;
  
  // Service et traitement
  service_concerne: string;
  service_concerne_display: string;
  statut: 'recu' | 'en_traitement' | 'traite' | 'archive';
  statut_display: string;  // "Reçu", "En traitement", etc.
  
  // Fichier
  fichier: string;  // URL du fichier
  file_type: string;
  file_size: number;  // En octets
  
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
  categorie?: number;  // ID de la catégorie
  service_concerne?: string;
  statut?: 'recu' | 'en_traitement' | 'traite' | 'archive';
  fichier: File;  // Fichier à uploader
  notes?: string;
}

/**
 * Type pour les filtres de recherche de courriers
 */
export interface CourrierFilters {
  type_courrier?: 'entrant' | 'sortant' | 'interne';
  statut?: 'recu' | 'en_traitement' | 'traite' | 'archive' | 'non_archive' | 'all';
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
  entrants: number;
  sortants: number;
  internes: number;
  urgents: number;
  courriers_avec_versions: number;
  total_versions: number;
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
    };
  };
  tendances_mensuelles?: Array<{
    mois: string;
    total: number;
    entrants: number;
    sortants: number;
    internes: number;
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
 * Choix pour les statuts
 */
export const STATUT_CHOICES = [
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
