/**
 * Service API pour la gestion du registre de courrier RH
 * Gère toutes les interactions avec le backend pour les courriers
 */

import { api } from './index';
import type { Courrier, CourrierCreate, CourrierStatistics } from '@/types';

/**
 * Service complet pour la gestion des courriers
 */
const courrierService = {
  /**
   * Récupérer tous les courriers avec filtres optionnels
   * @param params - Paramètres de filtrage (type, statut, service, recherche, dates)
   */
  getCourriers: async (params?: {
    type_courrier?: string;
    statut?: string;
    service_concerne?: string;
    search?: string;
    date_debut?: string;
    date_fin?: string;
    ordering?: string;
  }): Promise<Courrier[]> => {
    const response = await api.get('/courriers/', { params });
    // L'API retourne une structure paginée {count, next, previous, results}
    return response.data.results || response.data;
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
   * @param data - Nouvelles données du courrier
   */
  updateCourrier: async (id: number, data: Partial<CourrierCreate>): Promise<Courrier> => {
    const response = await api.patch(`/courriers/${id}/`, data);
    return response.data;
  },

  /**
   * Supprimer un courrier
   * @param id - ID du courrier à supprimer
   */
  deleteCourrier: async (id: number): Promise<void> => {
    await api.delete(`/courriers/${id}/`);
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
    search?: string;
    date_debut?: string;
    date_fin?: string;
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
  telechargerExcel: async (params?: any): Promise<void> => {
    const blob = await courrierService.exportExcel(params);
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
   * Affecter un courrier à un service et envoyer par email
   * @param courrierId - ID du courrier
   * @param service - Code du service
   * @param destinataireEmail - Email du destinataire
   * @param message - Message personnalisé
   */
  affecterService: async (courrierId: number, service: string, destinataireEmail: string, message: string): Promise<{ success: boolean; message: string }> => {
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
};

export default courrierService;
