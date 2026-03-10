import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Nouveau prefixe Render (prod)
//const API_URL = import.meta.env.VITE_API_URL || 'https://backgnc.onrender.com/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Créer l'instance axios centrale
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token d'accès à chaque requête
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer le refresh du token automatiquement
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si erreur 401 et qu'on n'a pas déjà tenté de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // Pas de refresh token, rediriger vers login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Tenter de rafraîchir le token
        const response = await axios.post(`${API_URL}/users/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;

        // Sauvegarder le nouveau token
        localStorage.setItem('access_token', access);

        // Réessayer la requête originale avec le nouveau token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Le refresh a échoué, déconnecter l'utilisateur
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
