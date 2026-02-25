import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import categoryService from './categoryService';
import type { Categorie } from '@/types';
import { toast } from '@/hooks/use-toast';

/**
 * Hook pour récupérer la liste des catégories
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });
}

/**
 * Hook pour créer une nouvelle catégorie
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      categoryService.createCategory(data.name, data.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Catégorie créée",
        description: "La catégorie a été créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de créer la catégorie",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour mettre à jour une catégorie
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, name, description }: { id: number; name: string; description?: string }) => 
      categoryService.updateCategory(id, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Catégorie modifiée",
        description: "La catégorie a été modifiée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de modifier la catégorie",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour supprimer une catégorie
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie a été supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de supprimer la catégorie",
        variant: "destructive",
      });
    },
  });
}
