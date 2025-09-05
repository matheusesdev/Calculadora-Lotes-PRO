// Arquivo: calculadora-frontend/src/api/apiService.js
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://calculadora-backend-0jqb.onrender.com/api' // Sua URL de produção
  : 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

export const uploadLotesCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const previewReajuste = (payload) => {
  return apiClient.post('/reajustar', payload);
};

export const calcularSimulacao = (payload) => {
  return apiClient.post('/calcular', payload);
};

export const downloadCSV = (payload) => {
  return apiClient.post('/download_csv', payload, {
    responseType: 'blob',
  });
};

// --- FUNÇÃO QUE ESTAVA FALTANDO ---
export const mergeEntradasCSV = (lotes, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('lotes_atuais', JSON.stringify(lotes));

  return apiClient.post('/merge_entradas', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};