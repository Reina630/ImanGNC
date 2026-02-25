import { useState, useEffect, useCallback } from 'react';

interface UseGlobalDragAndDropProps {
  onFilesDropped: (files: File[]) => void;
  acceptedExtensions?: string[];
}

/**
 * Hook personnalisé pour gérer le drag and drop global sur une page
 * Affiche une overlay quand des fichiers sont glissés sur la page
 */
export function useGlobalDragAndDrop({
  onFilesDropped,
  acceptedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif']
}: UseGlobalDragAndDropProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Vérifier s'il y a des fichiers dans l'événement
    if (e.dataTransfer?.types.includes('Files')) {
      setDragCounter(prev => prev + 1);
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDraggingOver(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer?.files || []);
    
    // Filtrer les fichiers selon les extensions acceptées
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return acceptedExtensions.includes(ext || '');
    });

    if (validFiles.length > 0) {
      onFilesDropped(validFiles);
    }
  }, [onFilesDropped, acceptedExtensions]);

  useEffect(() => {
    // Ajouter les événements au document
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    // Nettoyer les événements à la désinstallation
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return { isDraggingOver };
}
