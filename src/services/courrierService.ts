/**
 * Service API pour la gestion du registre de courrier RH
 * Gère toutes les interactions avec le backend pour les courriers
 */

import { api } from './index';
import type { Courrier, CourrierCreate, CourrierStatistics, CourrierFilters } from '@/types';

/**
 * Service complet pour la gestion des courriers
 */
const courrierService = {
  /**
   * Récupérer tous les courriers avec filtres optionnels
   * @param params - Paramètres de filtrage (type, statut, service, recherche, dates)
   */
  getCourriers: async (params?: CourrierFilters): Promise<Courrier[]> => {
    const response = await api.get('/courriers/', { params });
    // L'API retourne une structure paginée {count, next, previous, results}
    return response.data.results || response.data;
  },

  /**
   * Récupérer mes courriers (seulement ceux affectés à l'utilisateur connecté)
   * @param params - Paramètres de filtrage (recherche, ordre)
   */
  getMesCourriers: async (params?: {
    search?: string;
    ordering?: string;
  }): Promise<Courrier[]> => {
    const response = await api.get('/courriers/mes_courriers/', { params });
    return response.data;
  },

  /**
   * Récupérer un courrier par son ID
   * @param id - ID du courrier
   */
  getCourrier: async (id: number): Promise<Courrier> => {
    const response = await api.get(`/courriers/${id}/`);
    return response.data;
  },

  /**
   * Créer un nouveau courrier avec fichier
   * @param data - Données du courrier (fichier inclus via FormData)
   */
  createCourrier: async (data: FormData): Promise<Courrier> => {
    const response = await api.post('/courriers/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Mettre à jour un courrier existant
   * @param id - ID du courrier
   * @param data - Nouvelles données du courrier (peut être JSON ou FormData avec fichier)
   */
  updateCourrier: async (id: number, data: Partial<CourrierCreate> | FormData): Promise<Courrier> => {
    const isFormData = data instanceof FormData;
    const response = await api.patch(`/courriers/${id}/`, data, 
      isFormData ? { headers: { 'Content-Type': undefined } } : undefined
    );
    return response.data;
  },

  /**
   * Archiver un courrier (soft delete)
   * @param id - ID du courrier à archiver
   */
  deleteCourrier: async (id: number): Promise<void> => {
    await api.delete(`/courriers/${id}/`);
  },

  /**
   * Récupérer les courriers archivés (is_deleted=True - Corbeille)
   */
  getArchivedCourriers: async (): Promise<Courrier[]> => {
    const response = await api.get<Courrier[]>('/courriers/archives/');
    return response.data;
  },

  /**
   * Récupérer les courriers archivés par statut (statut='archive' - Courriers traités et classés)
   */
  getArchivedCourriersByStatus: async (params?: {
    search?: string;
    ordering?: string;
  }): Promise<Courrier[]> => {
    const response = await api.get<Courrier[]>('/courriers/archives-status/', { params });
    return response.data;
  },

  /**
   * Restaurer un courrier archivé (de la corbeille)
   * @param id - ID du courrier à restaurer
   */
  restoreCourrier: async (id: number): Promise<Courrier> => {
    const response = await api.post<{ message: string; courrier: Courrier }>(`/courriers/${id}/restore/`);
    return response.data.courrier;
  },

  /**
   * Récupérer toutes les versions d'un courrier (nouveau endpoint simplifié)
   * @param id - ID du courrier
   */
  getCourrierVersions: async (id: number): Promise<Courrier[]> => {
    const response = await api.get<Courrier[]>(`/courriers/${id}/versions/`);
    return response.data;
  },

  /**
   * Changer le statut d'un courrier
   * @param id - ID du courrier
   * @param statut - Nouveau statut (recu, en_traitement, traite, archive)
   */
  changerStatut: async (id: number, statut: string): Promise<Courrier> => {
    const response = await api.patch(`/courriers/${id}/changer_statut/`, { statut });
    return response.data;
  },

  /**
   * Marquer/Démarquer un courrier comme urgent
   * @param id - ID du courrier
   * @returns Courrier mis à jour
   */
  toggleUrgent: async (id: number): Promise<Courrier> => {
    const response = await api.post(`/courriers/${id}/toggle_urgent/`);
    return response.data;
  },

  /**
   * Obtenir les statistiques du registre de courrier
   * @returns Statistiques (total, entrants, sortants, par statut, par service)
   */
  getStatistiques: async (): Promise<CourrierStatistics> => {
    const response = await api.get('/courriers/statistiques/');
    return response.data;
  },

  /**
   * Exporter le registre au format Excel
   * @param params - Paramètres de filtrage pour l'export
   * @returns Blob du fichier Excel
   */
  exportExcel: async (params?: {
    type_courrier?: string;
    statut?: string;
    service_concerne?: string;
    service?: number;
    search?: string;
    date_debut?: string;
    date_fin?: string;
    urgent?: boolean;
    fields?: string; // colonnes séparées par des virgules
  }): Promise<Blob> => {
    const response = await api.get('/courriers/export_excel/', {
      params,
      responseType: 'blob',  // Important pour recevoir un fichier
    });
    return response.data;
  },

  /**
   * Télécharger le fichier scanné d'un courrier
   * @param id - ID du courrier
   * @returns Blob du fichier
   */
  downloadFichier: async (id: number): Promise<Blob> => {
    const response = await api.get(`/courriers/${id}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Helper pour télécharger un fichier avec un nom approprié
   * @param id - ID du courrier
   * @param numeroRegistre - Numéro de registre pour le nom du fichier
   */
  telechargerFichier: async (id: number, numeroRegistre: string): Promise<void> => {
    const blob = await courrierService.downloadFichier(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `courrier_${numeroRegistre}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Helper pour télécharger l'export Excel avec un nom de fichier approprié
   */
  telechargerExcel: async (params?: any, fields?: string[]): Promise<void> => {
    const exportParams = { ...params };
    if (fields && fields.length > 0) {
      exportParams.fields = fields.join(',');
    }
    const blob = await courrierService.exportExcel(exportParams);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.download = `registre_courrier_${date}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Ajouter des pièces jointes à un courrier existant
   */
  ajouterPiecesJointes: async (courrierId: number, fichiers: File[]): Promise<any[]> => {
    const formData = new FormData();
    fichiers.forEach((f) => formData.append('fichiers', f));
    const response = await api.post(`/courriers/${courrierId}/pieces_jointes/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Supprimer une pièce jointe d'un courrier
   */
  supprimerPieceJointe: async (courrierId: number, pjId: number): Promise<void> => {
    await api.delete(`/courriers/${courrierId}/pieces_jointes/${pjId}/`);
  },

  /**
   * Créer une nouvelle version d'un courrier
   * @param id - ID du courrier
   * @param fichier - Nouveau fichier
   * @param notes - Notes sur cette version (optionnel)
   */
  createVersion: async (id: number, fichier: File, notes?: string): Promise<{ message: string; version: Courrier }> => {
    const formData = new FormData();
    formData.append('fichier', fichier);
    if (notes) {
      formData.append('notes', notes);
    }

    const response = await api.post(`/courriers/${id}/creer_version/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Récupérer toutes les versions d'un courrier
   * @param id - ID du courrier
   */
  getVersions: async (id: number): Promise<{ nombre_versions: number; version_actuelle: number | null; versions: Courrier[] }> => {
    const response = await api.get(`/courriers/${id}/versions/`);
    return response.data;
  },

  /**
   * Affecter un courrier à un service et envoyer par email (externe)
   * @param courrierId - ID du courrier
   * @param service - Code du service
   * @param destinataireEmail - Email du destinataire
   * @param message - Message personnalisé
   */
  affecterServiceParEmail: async (courrierId: number, service: string, destinataireEmail: string, message: string): Promise<{ success: boolean; message: string }> => {
    // 1. Mettre à jour le service concerné
    await api.patch(`/courriers/${courrierId}/`, { service_concerne: service });
    
    // 2. Envoyer par email avec le document
    const response = await api.post('/partages/send_email/', {
      courrier_id: courrierId,
      destinataire: destinataireEmail,
      message: message,
    });
    
    return response.data;
  },

  /**
   * Affecter un courrier à un service via la plateforme
   * Crée une affectation pour chaque utilisateur du service
   * @param courrierId - ID du courrier
   * @param serviceId - ID du service
   * @param note - Note optionnelle pour les utilisateurs
   * @param niveauUrgence - Niveau d'urgence: faible, normal, eleve, critique
   * @param dateEcheance - Date d'échéance pour le traitement (format YYYY-MM-DD)
   */
  affecterServicePlateforme: async (
    courrierId: number, 
    serviceId: number, 
    note?: string,
    niveauUrgence?: string,
    dateEcheance?: string,
    actionRequise?: string
  ): Promise<{ success: boolean; message: string; nombre_affectations: number }> => {
    const response = await api.post(`/courriers/${courrierId}/affecter_service/`, {
      service_id: serviceId,
      note: note || '',
      niveau_urgence: niveauUrgence || 'normal',
      date_echeance: dateEcheance || null,
      action_requise: actionRequise || 'informatif',
    });
    
    return {
      success: true,
      message: response.data.message,
      nombre_affectations: response.data.utilisateurs_affectes
    };
  },

  /**
   * Affecter un courrier à un utilisateur via la plateforme
   * @param courrierId - ID du courrier
   * @param utilisateurId - ID de l'utilisateur
   * @param note - Note optionnelle pour l'utilisateur
   */
  affecterUtilisateur: async (courrierId: number, utilisateurId: number, note?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/affectations/', {
      courrier: courrierId,
      utilisateur: utilisateurId,
      note: note || '',
    });
    
    return {
      success: true,
      message: 'Affectation créée avec succès'
    };
  },

  /**
   * Récupérer les courriers affectés à l'utilisateur connecté
   * @param statut - Filtre optionnel par statut (en_attente, lu, valide, rejete, signe)
   */
  getMesAffectations: async (statut?: string): Promise<any[]> => {
    const params = statut ? { statut } : undefined;
    const response = await api.get('/courriers/mes_affectations/', { params });
    return response.data;
  },

  /**
   * Récupérer la liste des services disponibles pour l'affectation
   */
  getServicesDisponibles: async (): Promise<any[]> => {
    const response = await api.get('/courriers/services_disponibles/');
    return response.data;
  },

  /**
   * Marquer une affectation comme lue
   * @param affectationId - ID de l'affectation
   */
  marquerAffectationLue: async (affectationId: number): Promise<void> => {
    await api.post(`/affectations/affectations/${affectationId}/marquer_lu/`);
  },

  /**
   * Commencer le traitement d'une affectation (passer de 'lu' ou 'en_attente' à 'en_traitement')
   * @param affectationId - ID de l'affectation
   */
  commencerTraitement: async (affectationId: number): Promise<void> => {
    await api.post(`/affectations/affectations/${affectationId}/demarrer/`);
  },

  /**
   * Traiter une affectation de courrier (valider, rejeter ou signer)
   * @param affectationId - ID de l'affectation
   * @param action - Action à effectuer (valider, rejeter, signer)
   * @param commentaire - Commentaire optionnel
   * @param motifRejet - Motif de rejet (requis si action = rejeter)
   * @param position - Position de la signature (pour action = signer)
   * @param size - Taille de la signature (pour action = signer)
   */
  traiterAffectation: async (
    affectationId: number,
    action: 'valider' | 'rejeter' | 'signer',
    commentaire?: string,
    motifRejet?: string,
    position?: { x: number; y: number },
    size?: { width: number; height: number }
  ): Promise<{ message: string; statut: string }> => {
    let response;
    
    switch (action) {
      case 'valider':
        response = await api.post(`/affectations/affectations/${affectationId}/valider/`, {
          commentaire: commentaire || '',
        });
        break;
      case 'rejeter':
        response = await api.post(`/affectations/affectations/${affectationId}/rejeter/`, {
          motif: motifRejet || '',
        });
        break;
      case 'signer':
        response = await api.post(`/affectations/affectations/${affectationId}/signer/`, {
          commentaire: commentaire || '',
          position: position || { x: 100, y: 100 },
          size: size || { width: 200, height: 80 },
        });
        break;
    }
    
    return {
      message: 'Action effectuée avec succès',
      statut: response.data.statut
    };
  },

  /**
   * Ajouter un commentaire à une affectation de courrier
   * @param affectationId - ID de l'affectation
   * @param contenu - Contenu du commentaire
   */
  commenterAffectation: async (affectationId: number, contenu: string): Promise<{ message: string; commentaire: any }> => {
    const response = await api.post(`/affectations/affectations/${affectationId}/commentaires/`, {
      contenu,
    });
    
    return {
      message: 'Commentaire ajouté avec succès',
      commentaire: response.data
    };
  },

  /**
   * Accuser réception d'une affectation (action_requise = 'accusation_reception')
   */
  accuserReception: async (affectationId: number, commentaire?: string): Promise<void> => {
    await api.post(`/affectations/affectations/${affectationId}/valider/`, {
      commentaire: commentaire || '',
    });
  },

  /**
   * Répondre à un courrier (action_requise = 'a_repondre')
   */
  repondreAffectation: async (affectationId: number, commentaire?: string): Promise<void> => {
    await api.post(`/affectations/affectations/${affectationId}/valider/`, {
      commentaire: commentaire || '',
    });
  },

  /**
   * Renvoyer un courrier
   */
  renvoyerAffectation: async (affectationId: number, commentaire?: string): Promise<void> => {
    await api.post(`/affectations/affectations/${affectationId}/renvoyer/`, {
      commentaire: commentaire || '',
    });
  },

  /**
   * Réaffecter un courrier à un autre service
   * @param affectationId - ID de l'affectation à transférer
   * @param data - Données de réaffectation (service_id, mode)
   */
  reaffecterCourrier: async (
    affectationId: number,
    data: { service_id: number; mode?: string }
  ): Promise<{ message: string; nb_affectations?: number; service?: string }> => {
    const response = await api.post(`/affectations/affectations/${affectationId}/renvoyer/`, data);
    return response.data;
  },

  /**
   * Rechercher des courriers pour la liste déroulante
   * @param params - Paramètres de recherche (q: texte, type: entrant/sortant/interne, exclude: id à exclure)
   */
  searchCourriers: async (params?: {
    q?: string;
    type?: 'entrant' | 'sortant' | 'interne';
    exclude?: number;
  }): Promise<import('@/types').CourrierSearchResult[]> => {
    const response = await api.get('/courriers/search-courriers/', { params });
    return response.data;
  },
};

export default courrierService;
