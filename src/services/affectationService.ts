/**
 * Service API pour la gestion des circuits et affectations v2
 * Gère toutes les interactions avec la nouvelle API d'affectations
 */

import { api } from './index';
import type { CircuitV2, AffectationV2, CircuitCreateData } from '@/types';

/**
 * Service complet pour la gestion des circuits et affectations
 */
const affectationService = {
  // ============================================================================
  // CIRCUITS
  // ============================================================================

  /**
   * Récupérer tous les circuits avec filtres optionnels
   * @param params - Paramètres de filtrage (courrier, statut)
   */
  getCircuits: async (params?: {
    courrier?: number;
    statut?: string;
  }): Promise<CircuitV2[]> => {
    const response = await api.get('/affectations/circuits/', { params });
    return response.data.results || response.data;
  },

  /**
   * Récupérer un circuit par son ID
   * @param id - ID du circuit
   */
  getCircuit: async (id: number): Promise<CircuitV2> => {
    const response = await api.get(`/affectations/circuits/${id}/`);
    return response.data;
  },

  /**
   * Créer un nouveau circuit avec ses affectations
   * @param data - Données du circuit et de ses affectations
   */
  createCircuit: async (data: CircuitCreateData): Promise<CircuitV2> => {
    const response = await api.post('/affectations/circuits/', data);
    return response.data;
  },

  /**
   * Mettre à jour un circuit existant
   * @param id - ID du circuit
   * @param data - Nouvelles données du circuit
   */
  updateCircuit: async (id: number, data: Partial<CircuitV2>): Promise<CircuitV2> => {
    const response = await api.patch(`/affectations/circuits/${id}/`, data);
    return response.data;
  },

  /**
   * Annuler un circuit
   * @param id - ID du circuit à annuler
   */
  annulerCircuit: async (id: number): Promise<CircuitV2> => {
    const response = await api.post(`/affectations/circuits/${id}/annuler/`);
    return response.data;
  },

  /**
   * Récupérer la progression détaillée d'un circuit
   * @param id - ID du circuit
   */
  getProgression: async (id: number): Promise<{
    circuit_id: number;
    type_circuit: string;
    statut: string;
    etape_actuelle: number | null;
    affectations: AffectationV2[];
  }> => {
    const response = await api.get(`/affectations/circuits/${id}/progression/`);
    return response.data;
  },

  // ============================================================================
  // AFFECTATIONS
  // ============================================================================

  /**
   * Récupérer toutes les affectations avec filtres optionnels
   * @param params - Paramètres de filtrage
   */
  getAffectations: async (params?: {
    circuit?: number;
    courrier?: number;
    statut?: string;
    service?: number;
    mes_affectations?: 1 | 0;
  }): Promise<AffectationV2[]> => {
    const response = await api.get('/affectations/affectations/', { params });
    return response.data.results || response.data;
  },

  /**
   * Récupérer une affectation par son ID
   * @param id - ID de l'affectation
   */
  getAffectation: async (id: number): Promise<AffectationV2> => {
    const response = await api.get(`/affectations/affectations/${id}/`);
    return response.data;
  },

  /**
   * Créer une nouvelle affectation individuelle
   * @param data - Données de l'affectation
   */
  createAffectation: async (data: Partial<AffectationV2>): Promise<AffectationV2> => {
    const response = await api.post('/affectations/affectations/', data);
    return response.data;
  },

  /**
   * Mettre à jour une affectation existante
   * @param id - ID de l'affectation
   * @param data - Nouvelles données de l'affectation
   */
  updateAffectation: async (id: number, data: Partial<AffectationV2>): Promise<AffectationV2> => {
    const response = await api.patch(`/affectations/affectations/${id}/`, data);
    return response.data;
  },

  // ============================================================================
  // ACTIONS SUR LES AFFECTATIONS
  // ============================================================================

  /**
   * Marquer une affectation comme lue
   * @param id - ID de l'affectation
   */
  marquerLu: async (id: number): Promise<AffectationV2> => {
    const response = await api.post(`/affectations/affectations/${id}/marquer_lu/`);
    return response.data;
  },

  /**
   * Démarrer le traitement d'une affectation
   * @param id - ID de l'affectation
   */
  demarrer: async (id: number): Promise<AffectationV2> => {
    const response = await api.post(`/affectations/affectations/${id}/demarrer/`);
    return response.data;
  },

  /**
   * Valider une affectation
   * @param id - ID de l'affectation
   * @param commentaire - Commentaire de validation (optionnel)
   */
  valider: async (id: number, commentaire?: string): Promise<AffectationV2> => {
    const response = await api.post(`/affectations/affectations/${id}/valider/`, {
      commentaire: commentaire || '',
    });
    return response.data;
  },

  /**
   * Signer une affectation
   * @param id - ID de l'affectation
   * @param commentaire - Commentaire de signature (optionnel)
   */
  signer: async (id: number, commentaire?: string): Promise<AffectationV2> => {
    const response = await api.post(`/affectations/affectations/${id}/signer/`, {
      commentaire: commentaire || '',
    });
    return response.data;
  },

  /**
   * Rejeter une affectation
   * @param id - ID de l'affectation
   * @param motif - Motif du rejet (obligatoire)
   */
  rejeter: async (id: number, motif: string): Promise<AffectationV2> => {
    const response = await api.post(`/affectations/affectations/${id}/rejeter/`, {
      motif,
    });
    return response.data;
  },

  /**
   * Renvoyer une affectation au RH
   * @param id - ID de l'affectation
   * @param commentaire - Commentaire de renvoi (optionnel)
   */
  renvoyer: async (id: number, commentaire?: string): Promise<AffectationV2> => {
    const response = await api.post(`/affectations/affectations/${id}/renvoyer/`, {
      commentaire: commentaire || '',
    });
    return response.data;
  },

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Récupérer mes affectations en attente
   */
  getMesAffectationsEnAttente: async (): Promise<AffectationV2[]> => {
    return affectationService.getAffectations({
      mes_affectations: 1,
      statut: 'distribue',
    });
  },

  /**
   * Récupérer mes affectations en cours
   */
  getMesAffectationsEnCours: async (): Promise<AffectationV2[]> => {
    return affectationService.getAffectations({
      mes_affectations: 1,
      statut: 'en_traitement',
    });
  },

  /**
   * Récupérer les affectations d'un courrier
   * @param courrierId - ID du courrier
   */
  getAffectationsByCourrier: async (courrierId: number): Promise<AffectationV2[]> => {
    return affectationService.getAffectations({
      courrier: courrierId,
    });
  },

  /**
   * Récupérer le circuit d'un courrier
   * @param courrierId - ID du courrier
   */
  getCircuitByCourrier: async (courrierId: number): Promise<CircuitV2 | null> => {
    const circuits = await affectationService.getCircuits({
      courrier: courrierId,
    });
    return circuits.length > 0 ? circuits[0] : null;
  },
};

export default affectationService;
