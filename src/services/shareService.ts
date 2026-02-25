import api from './api';
import type { DocumentShare, ShareRequest } from '@/types';

export interface CreateShareData {
  document: number;
  shared_with: number;
  permission: 'view' | 'edit';
}

export interface CreateShareRequestData {
  document: number;
  requested_permission: 'view' | 'edit';
  message?: string;
}

const shareService = {
  // --- Partages de documents ---
  
  // Récupérer tous les partages (filtré par backend selon permissions)
  getShares: async (): Promise<DocumentShare[]> => {
    const response = await api.get('/share/');
    return response.data;
  },

  // Partages que j'ai créés
  getMyShares: async (): Promise<DocumentShare[]> => {
    const response = await api.get('/share/my_shares/');
    return response.data;
  },

  // Partages reçus (documents partagés avec moi)
  getSharedWithMe: async (): Promise<DocumentShare[]> => {
    const response = await api.get('/share/shared_with_me/');
    return response.data;
  },

  // Créer un partage
  createShare: async (data: CreateShareData): Promise<DocumentShare> => {
    const response = await api.post('/share/', data);
    return response.data;
  },

  // Supprimer un partage
  deleteShare: async (shareId: number): Promise<void> => {
    await api.delete(`/share/${shareId}/`);
  },

  // Modifier les permissions d'un partage
  updateShare: async (shareId: number, permission: 'view' | 'edit'): Promise<DocumentShare> => {
    const response = await api.patch(`/share/${shareId}/`, { permission });
    return response.data;
  },

  // --- Demandes d'accès ---

  // Récupérer toutes les demandes (filtré par backend)
  getShareRequests: async (): Promise<ShareRequest[]> => {
    const response = await api.get('/share-request/');
    return response.data;
  },

  // Mes demandes d'accès
  getMyRequests: async (): Promise<ShareRequest[]> => {
    const response = await api.get('/share-request/my_requests/');
    return response.data;
  },

  // Demandes en attente pour mes documents
  getPendingForMyDocuments: async (): Promise<ShareRequest[]> => {
    const response = await api.get('/share-request/pending_for_my_documents/');
    return response.data;
  },

  // Créer une demande d'accès
  createShareRequest: async (data: CreateShareRequestData): Promise<ShareRequest> => {
    const response = await api.post('/share-request/', data);
    return response.data;
  },

  // Approuver une demande
  approveRequest: async (requestId: number): Promise<ShareRequest> => {
    const response = await api.post(`/share-request/${requestId}/approve/`);
    return response.data;
  },

  // Rejeter une demande
  rejectRequest: async (requestId: number): Promise<ShareRequest> => {
    const response = await api.post(`/share-request/${requestId}/reject/`);
    return response.data;
  },

  // Supprimer une demande
  deleteRequest: async (requestId: number): Promise<void> => {
    await api.delete(`/share-request/${requestId}/`);
  },
};

export default shareService;
