// Arquivo: calculadora-frontend/src/components/MergeUpload.js
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper, Divider } from '@mui/material';
import MergeTypeIcon from '@mui/icons-material/MergeType';

const MergeUpload = ({ onFileMerge }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileMerge(acceptedFiles[0]);
    }
  }, [onFileMerge]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 2, mt: 3, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
      <Typography variant="overline" color="text.secondary">Opcional</Typography>
      <Typography variant="h6" gutterBottom>
        Combinar com Planilha de Entradas
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          p: 2,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
          backgroundColor: isDragActive ? 'action.hover' : 'transparent',
        }}
      >
        <input {...getInputProps()} />
        <MergeTypeIcon sx={{ fontSize: 32, color: 'grey.500', mb: 1 }} />
        <Typography>Arraste a planilha de Entradas aqui</Typography>
        <Typography variant="caption" color="text.secondary">
          (Deve conter 'UNIDADE' e 'ENTRADA')
        </Typography>
      </Box>
    </Paper>
  );
};

export default MergeUpload;