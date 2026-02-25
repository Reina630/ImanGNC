import api from './api';
import type { Categorie } from '@/types';

class CategoryService {
  /**
   * Récupérer toutes les catégories
   */
  async getCategories(search?: string): Promise<Categorie[]> {
    const params = search ? { search } : {};
    const response = await api.get('/categories/', { params });
    // Gérer la réponse paginée ou non
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  }

  /**
   * Créer une nouvelle catégorie
   */
  async createCategory(name: string, description?: string): Promise<Categorie> {
    const response = await api.post('/categories/', { name, description });
    return response.data;
  }

  /**
   * Créer une catégorie ou récupérer si elle existe déjà
   */
  async getOrCreateCategory(name: string, description?: string): Promise<Categorie> {
    const response = await api.post('/categories/get_or_create/', { name, description });
    return response.data;
  }

  /**
   * Supprimer une catégorie
   */
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}/`);
  }

  /**
   * Mettre à jour une catégorie
   */
  async updateCategory(id: number, name: string, description?: string): Promise<Categorie> {
    const response = await api.patch(`/categories/${id}/`, { name, description });
    return response.data;
  }
}

export default new CategoryService();
