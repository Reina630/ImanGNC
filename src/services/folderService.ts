import api from './api';
import type { Folder, Document } from '@/types';

/**
 * Interface pour le contenu d'un dossier
 */
export interface FolderContents {
  folder: Folder;
  subfolders: Folder[];
  documents: Document[];
}

/**
 * Interface pour l'arborescence d'un dossier
 */
export interface FolderTree extends Folder {
  subfolders?: FolderTree[];
  documents_count?: number;
}

/**
 * Interface pour le chemin d'un dossier
 */
export interface FolderPath {
  id: number;
  name: string;
}

/**
 * Service de gestion des dossiers
 */
export const folderService = {
  /**
   * Récupérer tous les dossiers (optionnellement filtrés par parent)
   */
  async getFolders(parentId?: number | null): Promise<Folder[]> {
    const params: any = {};
    if (parentId !== undefined) {
      params.parent = parentId === null ? 'null' : parentId;
    }
    const response = await api.get<Folder[]>('/folder/', { params });
    return response.data;
  },

  /**
   * Récupérer TOUS les dossiers sans filtre
   */
  async getAllFolders(): Promise<Folder[]> {
    const response = await api.get<Folder[]>('/folder/');
    return response.data;
  },

  /**
   * Récupérer un dossier par son ID
   */
  async getFolder(id: number): Promise<Folder> {
    const response = await api.get<Folder>(`/folder/${id}/`);
    return response.data;
  },

  /**
   * Créer un nouveau dossier
   */
  async createFolder(data: { name: string; parent?: number | null }): Promise<Folder> {
    const response = await api.post<Folder>('/folder/', data);
    return response.data;
  },

  /**
   * Mettre à jour un dossier
   */
  async updateFolder(id: number, data: { name?: string; parent?: number | null }): Promise<Folder> {
    const response = await api.patch<Folder>(`/folder/${id}/`, data);
    return response.data;
  },

  /**
   * Supprimer un dossier
   */
  async deleteFolder(id: number): Promise<void> {
    await api.delete(`/folder/${id}/`);
  },

  /**
   * Récupérer le contenu complet d'un dossier (sous-dossiers + documents)
   */
  async getFolderContents(id: number): Promise<FolderContents> {
    const response = await api.get<FolderContents>(`/folder/${id}/contents/`);
    return response.data;
  },

  /**
   * Récupérer le contenu de la racine (dossiers et documents sans parent)
   */
  async getRootContents(): Promise<FolderContents> {
    // Récupérer les dossiers racine
    const foldersResponse = await api.get('/folder/', { params: { parent: 'null' } });
    const folders = Array.isArray(foldersResponse.data) 
      ? foldersResponse.data 
      : foldersResponse.data.results || [];
    
    // Récupérer les documents à la racine (sans dossier)
    const documentsResponse = await api.get('/document/', { 
      params: { folder__isnull: 'true' } 
    });
    const documents = Array.isArray(documentsResponse.data)
      ? documentsResponse.data
      : documentsResponse.data.results || [];
    
    return {
      folder: {
        id: 0,
        name: 'Racine',
        parent: null,
        owner: 0,
        created_at: new Date().toISOString(),
      } as Folder,
      subfolders: folders,
      documents: documents,
    };
  },

  /**
   * Récupérer l'arborescence complète des dossiers
   */
  async getFolderTree(): Promise<FolderTree[]> {
    const response = await api.get<FolderTree[]>('/folder/tree/');
    return response.data;
  },

  /**
   * Déplacer un dossier vers un autre parent (ou la racine si parent_id = null)
   */
  async moveFolder(id: number, parentId: number | null): Promise<Folder> {
    const response = await api.post<{ folder: Folder }>(`/folder/${id}/move/`, {
      parent_id: parentId,
    });
    return response.data.folder;
  },

  /**
   * Récupérer le chemin complet d'un dossier
   */
  async getFolderPath(id: number): Promise<FolderPath[]> {
    const response = await api.get<{ path: FolderPath[] }>(`/folder/${id}/path/`);
    return response.data.path;
  },

  /**
   * Récupérer les dossiers racines (sans parent)
   */
  async getRootFolders(): Promise<Folder[]> {
    return this.getFolders(null);
  },
};

export default folderService;
