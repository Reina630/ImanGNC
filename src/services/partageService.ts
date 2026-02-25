/**
 * Service API pour la gestion des partages de courriers
 */

import { api } from './index';

export interface PartageLog {
  id: number;
  courrier: number;
  courrier_numero: string;
  courrier_objet: string;
  courrier_type: 'entrant' | 'sortant';
  courrier_type_display: string;
  type_partage: 'email' | 'whatsapp';
  type_partage_display: string;
  destinataire: string;
  message: string;
  partage_par: number;
  partage_par_nom: string;
  partage_par_email: string;
  created_at: string;
}

export interface PartageCreate {
  courrier: number;
  type_partage: 'email' | 'whatsapp';
  destinataire: string;
  message?: string;
}

export interface PartageStatistics {
  total: number;
  par_type: {
    [key: string]: {
      label: string;
      count: number;
    };
  };
  par_utilisateur: Array<{
    partage_par__username: string;
    partage_par__email: string;
    count: number;
  }>;
  courriers_populaires: Array<{
    courrier__numero_registre: string;
    courrier__objet: string;
    courrier__type_courrier: string;
    count: number;
  }>;
}

const partageService = {
  /**
   * Récupérer tous les partages avec filtres
   */
  getPartages: async (params?: {
    type_partage?: string;
    courrier?: number;
    date_debut?: string;
    date_fin?: string;
    search?: string;
    ordering?: string;
  }): Promise<PartageLog[]> => {
    const response = await api.get('/partages/', { params });
    return response.data.results || response.data;
  },

  /**
   * Récupérer les partages d'un utilisateur
   */
  getMesPartages: async (): Promise<PartageLog[]> => {
    const response = await api.get('/partages/mes_partages/');
    return response.data.results || response.data;
  },

  /**
   * Créer un nouveau partage
   */
  createPartage: async (data: PartageCreate): Promise<PartageLog> => {
    const response = await api.post('/partages/', data);
    return response.data;
  },

  /**
   * Obtenir les statistiques des partages
   */
  getStatistiques: async (): Promise<PartageStatistics> => {
    const response = await api.get('/partages/statistiques/');
    return response.data;
  },

  /**
   * Générer le lien WhatsApp pour partager un courrier
   */
  generateWhatsAppLink: (phoneNumber: string, message: string, fileUrl?: string): string => {
    // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    
    // Construire le message
    let fullMessage = message;
    if (fileUrl) {
      fullMessage += `\n\nLien du document : ${fileUrl}`;
    }
    
    // Encoder le message pour l'URL
    const encodedMessage = encodeURIComponent(fullMessage);
    
    // Retourner le lien WhatsApp
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  },

  /**
   * Générer le sujet et corps d'email pour partager un courrier
   */
  generateEmailData: (courrierNumero: string, courrierObjet: string, message: string, fileUrl?: string) => {
    const subject = `Partage de courrier - ${courrierNumero}`;
    let body = `Bonjour,\n\n${message}\n\n`;
    body += `Courrier: ${courrierNumero}\n`;
    body += `Objet: ${courrierObjet}\n\n`;
    
    if (fileUrl) {
      body += `Lien du document : ${fileUrl}\n\n`;
    }
    
    body += `Cordialement`;
    
    return {
      subject: encodeURIComponent(subject),
      body: encodeURIComponent(body),
    };
  },

  /**
   * Envoyer un courrier par email via le backend
   */
  sendEmail: async (data: {
    courrier_id: number;
    destinataire: string;
    message?: string;
  }): Promise<{ success: boolean; message: string; partage_id?: number }> => {
    const response = await api.post('/partages/send_email/', data);
    return response.data;
  },
};

export default partageService;
