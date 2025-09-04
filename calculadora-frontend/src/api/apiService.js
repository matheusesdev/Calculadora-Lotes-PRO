// Arquivo: calculadora-frontend/src/api/apiService.js
import axios from 'axios';

// A URL do backend agora é dinâmica
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// ... (o resto do arquivo continua igual) ...

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