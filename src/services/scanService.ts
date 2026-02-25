import { api } from './index';

export interface DetectResponse {
  corners: number[][];
  width: number;
  height: number;
}

export interface WarpResponse {
  image: string; // Image en base64
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
};

export default scanService;