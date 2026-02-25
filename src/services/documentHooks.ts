import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService, type DocumentFilters } from '@/services';
import type { Document } from '@/types';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook pour récupérer la liste des documents
 */
export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentService.getDocuments(filters),
  });
}

/**
 * Hook pour récupérer un document spécifique
 */
export function useDocument(id: number) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentService.getDocument(id),
    enabled: !!id,
  });
}

/**
 * Hook pour uploader un document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (formData: FormData) => documentService.uploadDocument(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Document uploadé',
        description: 'Le document a été ajouté avec succès',
      });
    },
    onError: (error: any) => {
      console.error('Erreur upload complète:', error);
      console.error('Réponse:', error.response);
      
      // Extraire le message d'erreur
      let errorMessage = 'Une erreur est survenue';
      if (error.response?.data) {
        // Si c'est un objet d'erreurs de validation
        if (typeof error.response.data === 'object') {
          const errors = Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          errorMessage = errors || errorMessage;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Erreur d\'upload',
        description: errorMessage,
      });
    },
  });
}

/**
 * Hook pour mettre à jour un document
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Document> }) =>
      documentService.updateDocument(id, data),
    onSuccess: (updatedDoc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', updatedDoc.id] });
      toast({
        title: 'Document modifié',
        description: 'Les modifications ont été enregistrées',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur de modification',
        description: error.response?.data?.error || 'Une erreur est survenue',
      });
    },
  });
}

/**
 * Hook pour supprimer un document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Document supprimé',
        description: 'Le document a été supprimé définitivement',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur de suppression',
        description: error.response?.data?.error || 'Une erreur est survenue',
      });
    },
  });
}

/**
 * Hook pour dupliquer un document
 */
export function useDuplicateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => documentService.duplicateDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Document dupliqué',
        description: 'Une copie du document a été créée',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur de duplication',
        description: error.response?.data?.error || 'Une erreur est survenue',
      });
    },
  });
}

/**
 * Hook pour télécharger un document
 */
export function useDownloadDocument() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, filename }: { id: number; filename: string }) => {
      const blob = await documentService.downloadDocument(id);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: 'Téléchargement démarré',
        description: 'Le document est en cours de téléchargement',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur de téléchargement',
        description: error.response?.data?.error || 'Une erreur est survenue',
      });
    },
  });
}

/**
 * Hook pour toggle favoris
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => documentService.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Une erreur est survenue',
      });
    },
  });
}
