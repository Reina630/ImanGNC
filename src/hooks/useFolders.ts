import { useState, useEffect, useCallback } from 'react';
import folderService, { FolderTree, FolderContents } from '@/services/folderService';
import type { Folder } from '@/types';
import { useToast } from './use-toast';

/**
 * Hook personnalisé pour gérer les dossiers
 */
export function useFolders(parentId?: number | null) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await folderService.getFolders(parentId);
      setFolders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des dossiers';
      setError(errorMsg);
      setFolders([]); // Réinitialiser à un tableau vide en cas d'erreur
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [parentId, toast]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (name: string, parent?: number | null) => {
    try {
      const newFolder = await folderService.createFolder({ name, parent });
      setFolders((prev) => [...(Array.isArray(prev) ? prev : []), newFolder]);
      toast({
        title: 'Succès',
        description: 'Dossier créé avec succès',
      });
      return newFolder;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la création du dossier';
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMsg,
      });
      throw err;
    }
  };

  const updateFolder = async (id: number, data: { name?: string; parent?: number | null }) => {
    try {
      const updated = await folderService.updateFolder(id, data);
      setFolders((prev) => (Array.isArray(prev) ? prev : []).map((f) => (f.id === id ? updated : f)));
      toast({
        title: 'Succès',
        description: 'Dossier mis à jour avec succès',
      });
      return updated;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la mise à jour du dossier';
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMsg,
      });
      throw err;
    }
  };

  const deleteFolder = async (id: number) => {
    try {
      await folderService.deleteFolder(id);
      setFolders((prev) => (Array.isArray(prev) ? prev : []).filter((f) => f.id !== id));
      toast({
        title: 'Succès',
        description: 'Dossier supprimé avec succès',
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erreur lors de la suppression du dossier';
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMsg,
      });
      throw err;
    }
  };

  const moveFolder = async (id: number, parentId: number | null) => {
    try {
      const moved = await folderService.moveFolder(id, parentId);
      await fetchFolders(); // Recharger pour mettre à jour la liste
      toast({
        title: 'Succès',
        description: 'Dossier déplacé avec succès',
      });
      return moved;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du déplacement du dossier';
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMsg,
      });
      throw err;
    }
  };

  return {
    folders,
    loading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
  };
}

/**
 * Hook simplifié pour récupérer TOUS les dossiers (pour les selects)
 */
export function useAllFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAllFolders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await folderService.getAllFolders();
      console.log('✅ Tous les dossiers chargés:', data.length, data);
      setFolders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('❌ Erreur chargement dossiers:', err);
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement des dossiers';
      setFolders([]);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllFolders();
  }, [fetchAllFolders]);

  return {
    folders,
    loading,
    refresh: fetchAllFolders,
  };
}

/**
 * Hook pour gérer l'arborescence complète des dossiers
 */
export function useFolderTree() {
  const [tree, setTree] = useState<FolderTree[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await folderService.getFolderTree();
      setTree(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement de l\'arborescence';
      setError(errorMsg);
      setTree([]); // Réinitialiser à un tableau vide en cas d'erreur
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return {
    tree,
    loading,
    error,
    refreshTree: fetchTree,
  };
}

/**
 * Hook pour gérer le contenu d'un dossier spécifique
 */
export function useFolderContents(folderId: number | null) {
  const [contents, setContents] = useState<FolderContents | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: FolderContents;
      if (folderId === null) {
        // Charger le contenu de la racine
        data = await folderService.getRootContents();
      } else {
        // Charger le contenu du dossier spécifique
        data = await folderService.getFolderContents(folderId);
      }
      setContents(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du chargement du contenu';
      setError(errorMsg);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [folderId, toast]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  return {
    contents,
    loading,
    error,
    refreshContents: fetchContents,
  };
}
