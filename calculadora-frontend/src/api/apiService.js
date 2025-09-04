// Arquivo: calculadora-frontend/src/api/apiService.js (VERSÃO FINAL E CORRETA)
import axios from 'axios';

// 1. Define a URL base que será usada em produção.
const PROD_BASE_URL = 'https://calculadora-backend-0jqb.onrender.com/api';

// 2. Define a URL base para desenvolvimento local.
const DEV_BASE_URL = 'http://127.0.0.1:8000/api';

// 3. Verifica se a aplicação está rodando em modo de produção (pela Vercel ou outro serviço)
//    O create-react-app define NODE_ENV como 'production' automaticamente no build.
const API_URL = process.env.NODE_ENV === 'production' ? PROD_BASE_URL : DEV_BASE_URL;

const apiClient = axios.create({
  baseURL: API_URL,
});

export const uploadLotesCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // A chamada agora é para a raiz da baseURL. URL final será: http://.../api/upload
  return apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const previewReajuste = (payload) => {
  // URL final será: http://.../api/reajustar
  return apiClient.post('/reajustar', payload);
};

export const calcularSimulacao = (payload) => {
  // URL final será: http://.../api/calcular
  return apiClient.post('/calcular', payload);
};

export const downloadCSV = (payload) => {
  // URL final será: http://.../api/download_csv
  return apiClient.post('/download_csv', payload, {
    responseType: 'blob',
  });
};