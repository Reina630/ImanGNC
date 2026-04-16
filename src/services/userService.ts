import api from './api';
import type { User } from '@/types';

/**
 * Service de gestion des utilisateurs (admin)
 */
export const userService = {
  /**
   * Récupérer tous les utilisateurs (admin uniquement)
   */
  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users/');
    return response.data;
  },

  /**
   * Récupérer un utilisateur par son ID
   */
  async getUser(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}/`);
    return response.data;
  },

  /**
   * Créer un nouvel utilisateur (admin uniquement)
   */
  async createUser(data: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'collaborator' | 'client' | 'rh' | 'dg';
  }): Promise<User> {
    const response = await api.post<User>('/users/', data);
    return response.data;
  },

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await api.put<User>(`/users/${id}/`, data);
    return response.data;
  },

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}/`);
  },

  /**
   * Désactiver/activer un utilisateur
   */
  async toggleUserStatus(id: number): Promise<User> {
    const user = await this.getUser(id);
    return this.updateUser(id, { is_active: !user.is_active });
  },

  /**
   * Récupérer la liste des services
   */
  async getServices(): Promise<{ id: number; nom: string }[]> {
    const response = await api.get<{ id: number; nom: string }[]>('/users/services/');
    return response.data;
  },
};

export default userService;
