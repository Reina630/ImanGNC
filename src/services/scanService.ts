
import { api } from './index';

export interface DetectResponse {
  corners: number[][];
  width: number;
  height: number;
}

export interface WarpResponse {
  image: string; // Image en base64
}

export interface ExtractedDocumentFields {
  objet: string;
  expediteur: string;
  destinataire: string;
  date_courrier: string;
  reference_structure: string;
  type_courrier: 'entrant' | 'sortant' | 'interne';
  notes: string;
}

export interface ExtractResponse {
  fields: ExtractedDocumentFields;
  ocr_used: boolean;
  text_length: number;
  warning?: string;
  extracted_text?: string;  // Pour debug
}

const scanService = {
  // Détecte automatiquement les coins d'un document
  detectCorners: async (file: File): Promise<DetectResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/scan/detect/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Redresse et améliore le document
  warpDocument: async (file: File, points: number[][]): Promise<WarpResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('points', JSON.stringify(points));

    const response = await api.post('/scan/warp/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Extrait les informations d'un document via OCR (Tesseract)
  extractDocumentInfo: async (file: File): Promise<ExtractResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/scan/extract/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default scanService;