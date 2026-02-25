import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileText, FileSpreadsheet, Image, File } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate la taille d'un fichier en octets vers un format lisible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Formate une date en format français lisible
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Retourne l'icône appropriée selon le type de fichier
 */
export function getFileIcon(fileType: string) {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return FileText;
    case 'word':
    case 'doc':
    case 'docx':
      return FileText;
    case 'excel':
    case 'xls':
    case 'xlsx':
      return FileSpreadsheet;
    case 'image':
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return Image;
    default:
      return File;
  }
}

