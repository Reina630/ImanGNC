import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import serviceService from './serviceService';
import type { Service } from './serviceService';
import { toast } from '@/hooks/use-toast';

/**
 * Hook pour récupérer la liste des services
 */
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getServices(),
  });
}

/**
 * Hook pour créer un nouveau service
 */
export function useCreateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { nom: string; description?: string }) => 
      serviceService.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Service créé",
        description: "Le service a été créé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de créer le service",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour mettre à jour un service
 */
export function useUpdateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, nom, description }: { id: number; nom: string; description?: string }) => 
      serviceService.updateService(id, { nom, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Service modifié",
        description: "Le service a été modifié avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de modifier le service",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour supprimer un service
 */
export function useDeleteService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => serviceService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: "Service supprimé",
        description: "Le service a été supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de supprimer le service",
        variant: "destructive",
      });
    },
  });
}
