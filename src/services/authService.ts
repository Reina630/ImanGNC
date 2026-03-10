import api from './api';
import type { LoginCredentials, AuthResponse, User } from '@/types';

/**
 * Service d'authentification
 */
export const authService = {
  /**
   * Connexion d'un utilisateur
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/users/login/', credentials);
    
    // Sauvegarder les tokens et l'utilisateur
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/users/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le localStorage dans tous les cas
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken(refreshToken: string): Promise<string> {
    const response = await api.post<{ access: string }>('/users/refresh/', {
      refresh: refreshToken,
    });
    
    // Sauvegarder le nouveau token
    localStorage.setItem('access_token', response.data.access);
    
    return response.data.access;
  },

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/users/profile/');
    return response.data;
  },

  /**
   * Mettre à jour le profil
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<User>('/users/profile/', data);
    
    // Mettre à jour le localStorage
    localStorage.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Récupérer l'utilisateur depuis le localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Mettre à jour la signature électronique et le mot de passe
   */
  async updateSignature(signatureFile?: File, password?: string): Promise<User> {
    const formData = new FormData();
    
    if (signatureFile) {
      formData.append('signature_electronique', signatureFile);
    }
    
    if (password) {
      formData.append('signature_password', password);
    }
    
    const response = await api.post<User>('/users/signature/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Mettre à jour le localStorage
    localStorage.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  },

  /**
   * Vérifier le mot de passe de signature
   */
  async verifySignaturePassword(password: string): Promise<boolean> {
    try {
      const response = await api.post<{ valid: boolean }>('/users/signature/verify/', {
        password,
      });
      return response.data.valid;
    } catch (error) {
      return false;
    }
  },
};

export default authService;
