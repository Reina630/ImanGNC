import { api } from './api';

export interface AffectationServiceData {
  id?: number;
  circuit?: number;
  service: number; // ID du service
  service_id?: number;
  service_nom?: string;
  service_description?: string;
  action_requise: string;
  action_requise_display?: string;
  niveau_urgence: string;
  niveau_urgence_display?: string;
  etape_numero: number;
  type_traitement: 'parallele' | 'sequentiel';
  statut?: string;
  statut_display?: string;
  date_echeance?: string;
  note?: string;
  commentaire_traitement?: string;
  motif_rejet?: string;
  date_creation?: string;
  date_lecture?: string;
  date_traitement?: string;
  peut_etre_traitee?: boolean;
}

export interface CircuitAffectationData {
  id?: number;
  courrier: number;
  courrier_numero?: string;
  courrier_objet?: string;
  cree_par?: number;
  cree_par_username?: string;
  cree_par_nom_complet?: string;
  type_circuit: 'simultane' | 'sequentiel';
  type_circuit_display?: string;
  date_creation?: string;
  date_modification?: string;
  affectations_service?: AffectationServiceData[];
  est_termine?: boolean;
  etape_actuelle?: number | null;
}

export interface CreateCircuitData {
  courrier_id: number;
  type_circuit: 'simultane' | 'sequentiel';
  affectations: Omit<AffectationServiceData, 'id' | 'circuit'>[];
}

class CircuitAffectationService {
  /**
   * Récupérer tous les circuits d'affectation
   */
  async getCircuits(): Promise<CircuitAffectationData[]> {
    const response = await api.get('/circuits-affectation/');
    return response.data;
  }

  /**
   * Récupérer un circuit spécifique
   */
  async getCircuit(id: number): Promise<CircuitAffectationData> {
    const response = await api.get(`/circuits-affectation/${id}/`);
    return response.data;
  }

  /**
   * Créer un nouveau circuit d'affectation
   */
  async createCircuit(data: CreateCircuitData): Promise<CircuitAffectationData> {
    const response = await api.post('/circuits-affectation/', data);
    return response.data;
  }

  /**
   * Récupérer toutes les affectations d'un circuit
   */
  async getAffectationsCircuit(circuitId: number): Promise<AffectationServiceData[]> {
    const response = await api.get(`/circuits-affectation/${circuitId}/affectations/`);
    return response.data;
  }

  /**
   * Récupérer l'état d'un circuit
   */
  async getEtatCircuit(circuitId: number): Promise<{
    circuit_id: number;
    type_circuit: string;
    est_termine: boolean;
    etape_actuelle: number | null;
    nombre_affectations: number;
    affectations_terminees: number;
  }> {
    const response = await api.get(`/circuits-affectation/${circuitId}/etat/`);
    return response.data;
  }

  /**
   * Supprimer un circuit
   */
  async deleteCircuit(id: number): Promise<void> {
    await api.delete(`/circuits-affectation/${id}/`);
  }

  // ============================================================================
  // MÉTHODES POUR LES AFFECTATIONS DE SERVICE
  // ============================================================================

  /**
   * Récupérer les affectations de service (avec filtres optionnels)
   */
  async getAffectationsService(params?: {
    circuit?: number;
    service?: string;
  }): Promise<AffectationServiceData[]> {
    const response = await api.get('/affectations-service/', { params });
    return response.data;
  }

  /**
   * Récupérer une affectation de service spécifique
   */
  async getAffectationService(id: number): Promise<AffectationServiceData> {
    const response = await api.get(`/affectations-service/${id}/`);
    return response.data;
  }

  /**
   * Marquer une affectation comme vue
   */
  async marquerVu(id: number): Promise<{ message: string; statut: string }> {
    const response = await api.post(`/affectations-service/${id}/marquer_vu/`, {});
    return response.data;
  }

  /**
   * Démarrer le traitement d'une affectation
   */
  async traiter(id: number): Promise<{ message: string; statut: string }> {
    const response = await api.post(`/affectations-service/${id}/traiter/`, {});
    return response.data;
  }

  /**
   * Valider une affectation
   */
  async valider(
    id: number,
    commentaire?: string
  ): Promise<{ message: string; statut: string; circuit_termine: boolean }> {
    const response = await api.post(`/affectations-service/${id}/valider/`, { commentaire });
    return response.data;
  }

  /**
   * Signer une affectation
   */
  async signer(
    id: number,
    commentaire?: string
  ): Promise<{ message: string; statut: string; circuit_termine: boolean }> {
    const response = await api.post(`/affectations-service/${id}/signer/`, { commentaire });
    return response.data;
  }

  /**
   * Rejeter une affectation
   */
  async rejeter(
    id: number,
    motif: string
  ): Promise<{ message: string; statut: string; circuit_termine: boolean }> {
    const response = await api.post(`/affectations-service/${id}/rejeter/`, { motif });
    return response.data;
  }

  /**
   * Modifier une affectation existante (nouveau système v2)
   * PATCH /api/affectations/affectations/{id}/
   */
  async updateAffectation(id: number, data: {
    service?: number;
    action_requise?: string;
    niveau_urgence?: string;
    date_echeance?: string | null;
    note_instruction?: string;
  }): Promise<AffectationServiceData> {
    const response = await api.patch(`/affectations/affectations/${id}/`, data);
    return response.data;
  }
}

export default new CircuitAffectationService();
