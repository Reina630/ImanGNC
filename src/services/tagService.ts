import api from './api';
import type { Tag } from '@/types';

class TagService {
  /**
   * Récupérer tous les tags
   */
  async getTags(search?: string): Promise<Tag[]> {
    const params = search ? { search } : {};
    const response = await api.get('/tag/', { params });
    // Gérer la réponse paginée ou non
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  }

  /**
   * Créer un nouveau tag
   */
  async createTag(name: string): Promise<Tag> {
    const response = await api.post('/tag/', { name });
    return response.data;
  }

  /**
   * Créer un tag ou récupérer s'il existe déjà
   */
  async getOrCreateTag(name: string): Promise<Tag> {
    const response = await api.post('/tag/get_or_create/', { name });
    return response.data;
  }

  /**
   * Supprimer un tag
   */
  async deleteTag(id: number): Promise<void> {
    await api.delete(`/tag/${id}/`);
  }

  /**
   * Mettre à jour un tag
   */
  async updateTag(id: number, name: string): Promise<Tag> {
    const response = await api.patch(`/tag/${id}/`, { name });
    return response.data;
  }
}

export default new TagService();
