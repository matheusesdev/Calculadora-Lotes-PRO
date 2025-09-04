import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
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