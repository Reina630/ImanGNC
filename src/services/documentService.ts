import api from './api';
import type { Document, DocumentShare, User } from '@/types';

/**
 * Paramètres de filtrage pour les documents
 */
export interface DocumentFilters {
  search?: string;
  file_type?: string;
  folder?: number;
  is_favorite?: boolean;
  date_from?: string;
  date_to?: string;
  tags__name?: string;
  ordering?: string;
  page?: number;
}

/**
 * Réponse paginée de l'API
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Service de gestion des documents
 */
export const documentService = {
  /**
   * Récupérer la liste des documents avec filtres optionnels
   */
  async getDocuments(filters?: DocumentFilters): Promise<PaginatedResponse<Document>> {
    const response = await api.get<PaginatedResponse<Document>>('/document/', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Récupérer un document par son ID
   */
  async getDocument(id: number): Promise<Document> {
    const response = await api.get<Document>(`/document/${id}/`);
    return response.data;
  },

  /**
   * Uploader un nouveau document
   */
  async uploadDocument(data: FormData): Promise<Document> {
    const response = await api.post<Document>('/document/upload/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Mettre à jour les métadonnées d'un document
   */
  async updateDocument(id: number, data: Partial<Document>): Promise<Document> {
    const response = await api.patch<Document>(`/document/${id}/`, data);
    return response.data;
  },

  /**
   * Supprimer un document
   */
  async deleteDocument(id: number): Promise<void> {
    await api.delete(`/document/${id}/`);
  },

  /**
   * Télécharger un document
   */
  async downloadDocument(id: number): Promise<Blob> {
    const response = await api.get(`/document/${id}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Dupliquer un document
   */
  async duplicateDocument(id: number): Promise<Document> {
    const response = await api.post<Document>(`/document/${id}/duplicate/`);
    return response.data;
  },

  /**
   * Toggle favori (à implémenter côté backend)
   */
  async toggleFavorite(id: number): Promise<Document> {
    const response = await api.post<Document>(`/document/${id}/toggle_favorite/`);
    return response.data;
  },

  /**
   * Partager un document avec des utilisateurs
   */
  async shareDocument(id: number, userIds: number[], permission: 'view' | 'edit' = 'view'): Promise<{ message: string; shares: DocumentShare[] }> {
    const response = await api.post(`/document/${id}/share/`, { 
      user_ids: userIds,
      permission 
    });
    return response.data;
  },

  /**
   * Retirer le partage pour un utilisateur
   */
  async unshareDocument(id: number, userId: number): Promise<{ message: string }> {
    const response = await api.post(`/document/${id}/unshare/`, { user_id: userId });
    return response.data;
  },

  /**
   * Mettre à jour la visibilité d'un document
   */
  async updateVisibility(id: number, visibility: 'private' | 'shared' | 'public'): Promise<Document> {
    const response = await api.patch<Document>(`/document/${id}/update_visibility/`, { visibility });
    return response.data;
  },

  /**
   * Récupérer les documents partagés avec moi
   */
  async getSharedWithMe(): Promise<Document[]> {
    const response = await api.get<Document[]>('/document/shared_with_me/');
    return response.data;
  },

  /**
   * Récupérer la liste des utilisateurs disponibles pour le partage
   */
  async getAvailableUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/document/available_users/');
    return response.data;
  },

  /**
   * Déplacer un document vers un dossier
   */
  async moveToFolder(id: number, folderId: number | null): Promise<{ message: string; document: Document }> {
    const response = await api.post(`/document/${id}/move_to_folder/`, { folder_id: folderId });
    return response.data;
  },

  /**
   * Recherche avancée
   */
  async advancedSearch(filters: DocumentFilters): Promise<PaginatedResponse<Document>> {
    const response = await api.get<PaginatedResponse<Document>>('/document/advanced-search/', {
      params: filters,
    });
    return response.data;
  },
};

export default documentService;
