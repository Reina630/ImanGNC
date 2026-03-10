import api from './api';

export interface Notification {
  id: number;
  type: 'courrier_affecte' | 'document_partage' | 'commentaire' | 'tache' | 'system';
  titre: string;
  message: string;
  lue: boolean;
  courrier_id?: number;
  document_id?: number;
  created_at: string;
  lue_at?: string;
}

const notificationService = {
  /**
   * Récupérer toutes les notifications de l'utilisateur connecté
   */
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/users/notifications/');
    return response.data;
  },

  /**
   * Récupérer le nombre de notifications non lues
   */
  getNotificationsNonLues: async (): Promise<number> => {
    const response = await api.get('/users/notifications/non-lues/');
    return response.data.count;
  },

  /**
   * Marquer une notification comme lue
   */
  marquerCommeLue: async (id: number): Promise<Notification> => {
    const response = await api.post(`/users/notifications/${id}/lue/`);
    return response.data;
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  marquerToutesLues: async (): Promise<void> => {
    await api.post('/users/notifications/marquer-toutes-lues/');
  },

  /**
   * Supprimer une notification
   */
  supprimerNotification: async (id: number): Promise<void> => {
    await api.delete(`/users/notifications/${id}/`);
  },
};

export default notificationService;
