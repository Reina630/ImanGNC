/**
 * Service pour gérer l'historique et les logs de toutes les activités
 */

import api from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface PartageLog {
  id: number;
  courrier: number;
  courrier_numero: string;
  courrier_objet: string;
  type_partage: 'email' | 'whatsapp';
  destinataire: string;
  message: string;
  partage_par: number;
  partage_par_nom: string;
  created_at: string;
}

export interface AffectationLog {
  id: number;
  courrier: number;
  courrier_numero: string;
  courrier_objet: string;
  utilisateur: number;
  utilisateur_nom: string;
  affecte_par: number;
  affecte_par_nom: string;
  note: string;
  statut: 'en_attente' | 'lu' | 'en_traitement' | 'valide' | 'rejete' | 'signe';
  niveau_urgence: 'faible' | 'normal' | 'eleve' | 'critique';
  date_affectation: string;
  date_lecture: string | null;
  date_traitement: string | null;
  date_echeance: string | null;
}

export interface CourrierLog {
  id: number;
  numero_registre: string;
  type_courrier: 'entrant' | 'sortant' | 'interne';
  objet: string;
  expediteur: string;
  destinataire: string;
  statut: 'non_traite' | 'en_cours' | 'traite' | 'archive';
  urgent: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_nom: string;
}

export interface CommentaireLog {
  id: number;
  affectation: number;
  courrier_numero: string;
  courrier_objet: string;
  auteur: number;
  auteur_nom: string;
  contenu: string;
  date_creation: string;
}

export type ActionType =
  | 'courrier_create' | 'courrier_update' | 'courrier_delete' | 'courrier_restore' | 'courrier_archive'
  | 'affectation_create' | 'affectation_accuse' | 'affectation_start' | 'affectation_validate' | 'affectation_reject' | 'affectation_sign'
  | 'partage_email' | 'partage_whatsapp'
  | 'commentaire_add'
  | 'document_create' | 'document_update' | 'document_delete' | 'document_share'
  | 'user_login' | 'user_logout' | 'user_create' | 'user_update' | 'user_delete'
  | 'urgent_mark' | 'urgent_unmark';

export interface ActionLog {
  id: number;
  action_type: ActionType;
  action_type_display: string;
  description: string;
  utilisateur: number | null;
  utilisateur_username: string;
  utilisateur_nom_complet: string;
  utilisateur_info: {
    id: number | null;
    username: string;
    nom_complet: string;
  };
  courrier: number | null;
  courrier_numero: string;
  document: number | null;
  document_nom: string;
  affectation: number | null;
  timestamp: string;
  ip_address: string | null;
  metadata: Record<string, any>;
}

export interface StatistiquesHistorique {
  partages: {
    total: number;
    par_type: {
      email: number;
      whatsapp: number;
    };
  };
  affectations: {
    total: number;
    par_statut: {
      en_attente: number;
      lu: number;
      en_traitement: number;
      valide: number;
      rejete: number;
      signe: number;
    };
  };
  courriers: {
    total: number;
    par_type: {
      entrant: number;
      sortant: number;
      interne: number;
    };
  };
  commentaires: {
    total: number;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

const historiqueService = {
  // ========================================
  // PARTAGES
  // ========================================
  
  /**
   * Récupérer tous les logs de partages
   */
  getPartages: async (params?: {
    type_partage?: 'email' | 'whatsapp';
    search?: string;
    ordering?: string;
  }): Promise<PartageLog[]> => {
    const response = await api.get('/partages/', { params });
    // L'API retourne un objet paginé, extraire results
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  /**
   * Récupérer un log de partage spécifique
   */
  getPartage: async (id: number): Promise<PartageLog> => {
    const response = await api.get(`/partages/${id}/`);
    return response.data;
  },

  // ========================================
  // AFFECTATIONS
  // ========================================
  
  /**
   * Récupérer tous les logs d'affectations
   */
  getAffectations: async (params?: {
    statut?: string;
    utilisateur?: number;
    search?: string;
    ordering?: string;
  }): Promise<AffectationLog[]> => {
    const response = await api.get('/affectations/', { params });
    // L'API retourne un objet paginé, extraire results
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  /**
   * Récupérer une affectation spécifique
   */
  getAffectation: async (id: number): Promise<AffectationLog> => {
    const response = await api.get(`/affectations/${id}/`);
    return response.data;
  },

  // ========================================
  // COURRIERS
  // ========================================
  
  /**
   * Récupérer tous les logs de courriers
   */
  getCourriers: async (params?: {
    type_courrier?: 'entrant' | 'sortant' | 'interne';
    statut?: string;
    search?: string;
    ordering?: string;
  }): Promise<CourrierLog[]> => {
    const response = await api.get('/courriers/', { params });
    // L'API retourne un objet paginé, extraire results
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  /**
   * Récupérer un courrier spécifique
   */
  getCourrier: async (id: number): Promise<CourrierLog> => {
    const response = await api.get(`/courriers/${id}/`);
    return response.data;
  },

  // ========================================
  // COMMENTAIRES
  // ========================================
  
  /**
   * Récupérer tous les logs de commentaires
   */
  getCommentaires: async (params?: {
    affectation?: number;
    auteur?: number;
    search?: string;
    ordering?: string;
  }): Promise<CommentaireLog[]> => {
    const response = await api.get('/commentaires-courriers/', { params });
    // L'API retourne un objet paginé, extraire results
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  /**
   * Récupérer un commentaire spécifique
   */
  getCommentaire: async (id: number): Promise<CommentaireLog> => {
    const response = await api.get(`/commentaires-courriers/${id}/`);
    return response.data;
  },

  // ========================================
  // STATISTIQUES
  // ========================================
  
  /**
   * Récupérer les statistiques globales de l'historique
   */
  getStatistiques: async (): Promise<StatistiquesHistorique> => {
    // Récupérer les stats de partages
    const partagesStats = await api.get('/partages/statistiques/');
    
    // Compter les affectations par statut
    const affectations = await api.get('/affectations/', {
      params: { page_size: 1000 }
    });
    
    // Compter les courriers par type
    const courriers = await api.get('/courriers/', {
      params: { page_size: 1000 }
    });
    
    // Compter les commentaires
    const commentaires = await api.get('/commentaires-courriers/', {
      params: { page_size: 1000 }
    });

    const affectationsData = affectations.data.results || affectations.data;
    const courriersData = courriers.data.results || courriers.data;
    const commentairesData = commentaires.data.results || commentaires.data;

    return {
      partages: partagesStats.data,
      affectations: {
        total: affectationsData.length,
        par_statut: {
          en_attente: affectationsData.filter((a: any) => a.statut === 'en_attente').length,
          lu: affectationsData.filter((a: any) => a.statut === 'lu').length,
          en_traitement: affectationsData.filter((a: any) => a.statut === 'en_traitement').length,
          valide: affectationsData.filter((a: any) => a.statut === 'valide').length,
          rejete: affectationsData.filter((a: any) => a.statut === 'rejete').length,
          signe: affectationsData.filter((a: any) => a.statut === 'signe').length,
        },
      },
      courriers: {
        total: courriersData.length,
        par_type: {
          entrant: courriersData.filter((c: any) => c.type_courrier === 'entrant').length,
          sortant: courriersData.filter((c: any) => c.type_courrier === 'sortant').length,
          interne: courriersData.filter((c: any) => c.type_courrier === 'interne').length,
        },
      },
      commentaires: {
        total: commentairesData.length,
      },
    };
  },

  // ========================================
  // ACTION LOGS (JOURNAL D'AUDIT)
  // ========================================
  
  /**
   * Récupérer tous les logs d'actions
   */
  getActionLogs: async (params?: {
    action_type?: ActionType;
    utilisateur?: number;
    search?: string;
    ordering?: string;
  }): Promise<ActionLog[]> => {
    const response = await api.get('/action-logs/', { params });
    // L'API retourne un objet paginé, extraire results
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  /**
   * Récupérer un log d'action spécifique
   */
  getActionLog: async (id: number): Promise<ActionLog> => {
    const response = await api.get(`/action-logs/${id}/`);
    return response.data;
  },

  /**
   * Récupérer les actions de l'utilisateur connecté
   */
  getMesActions: async (): Promise<ActionLog[]> => {
    const response = await api.get('/action-logs/mes_actions/');
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  /**
   * Récupérer les statistiques des action logs
   */
  getActionLogsStatistiques: async (): Promise<{
    total_actions: number;
    actions_par_type: Record<string, { count: number; label: string }>;
    actions_7_derniers_jours: number;
    actions_aujourdhui: number;
    top_utilisateurs: Array<{ utilisateur_username: string; utilisateur_nom_complet: string; count: number }>;
  }> => {
    const response = await api.get('/action-logs/statistiques/');
    return response.data;
  },

  /**
   * Récupérer les logs pour un courrier spécifique
   */
  getActionLogsParCourrier: async (courrierId: number): Promise<ActionLog[]> => {
    const response = await api.get('/action-logs/par_courrier/', {
      params: { courrier_id: courrierId }
    });
    return response.data;
  },

  /**
   * Récupérer les logs pour un utilisateur spécifique (RH/Admin)
   */
  getActionLogsParUtilisateur: async (utilisateurId: number): Promise<ActionLog[]> => {
    const response = await api.get('/action-logs/par_utilisateur/', {
      params: { utilisateur_id: utilisateurId }
    });
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  // ========================================
  // EXPORT
  // ========================================
  
  /**
   * Exporter l'historique en CSV
   */
  exportHistorique: async (type: 'partages' | 'affectations' | 'courriers' | 'commentaires'): Promise<Blob> => {
    const endpoints = {
      partages: '/partages/export/',
      affectations: '/affectations/export/',
      courriers: '/courriers/export/',
      commentaires: '/commentaires-courriers/export/',
    };

    const response = await api.get(endpoints[type], {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default historiqueService;
