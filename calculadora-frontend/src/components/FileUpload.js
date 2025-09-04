import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function FileUpload({ onFileUpload }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.400',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.3s, background-color 0.3s',
        backgroundColor: isDragActive ? 'action.hover' : 'transparent',
      }}
    >
      <input {...getInputProps()} />
      <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
      {isDragActive ? (
        <Typography>Solte o arquivo aqui...</Typography>
      ) : (
        <Typography>Arraste e solte o arquivo CSV aqui, ou clique para selecionar</Typography>
      )}
    </Box>
  );
}