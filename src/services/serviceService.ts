/**
 * Service API pour la gestion des services de l'organisation
 */

import { api } from './index';

export interface Service {
  id: number;
  nom: string;
  description?: string;
  utilisateurs?: any[];
  nombre_utilisateurs?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Service pour la gestion des services
 */
const serviceService = {
  /**
   * Récupérer tous les services
   */
  getServices: async (): Promise<Service[]> => {
    const response = await api.get('/users/services/');
    return response.data;
  },

  /**
   * Récupérer un service par son ID
   * @param id - ID du service
   */
  getService: async (id: number): Promise<Service> => {
    const response = await api.get(`/users/services/${id}/`);
    return response.data;
  },

  /**
   * Créer un nouveau service
   * @param data - Données du service (nom, description)
   */
  createService: async (data: { nom: string; description?: string }): Promise<Service> => {
    const response = await api.post('/users/services/', data);
    return response.data;
  },

  /**
   * Mettre à jour un service
   * @param id - ID du service
   * @param data - Nouvelles données
   */
  updateService: async (id: number, data: Partial<Service>): Promise<Service> => {
    const response = await api.put(`/users/services/${id}/`, data);
    return response.data;
  },

  /**
   * Supprimer un service
   * @param id - ID du service
   */
  deleteService: async (id: number): Promise<void> => {
    await api.delete(`/users/services/${id}/`);
  },
};

export default serviceService;
