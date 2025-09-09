// Arquivo: calculadora-frontend/src/components/Resultado.js (VERSÃO CORRETA COM MUI DATAGRID)
import React from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';

const formatarMoedaBRL = (valor) => { if (typeof valor !== 'number') return ""; return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };

const Resultado = ({ resultadoData, onDownloadCSV }) => {
  if (!resultadoData || !Array.isArray(resultadoData) || resultadoData.length === 0) {
    console.log('Dados inválidos ou vazios:', resultadoData);
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5">Nenhum resultado para exibir</Typography>
        <Typography color="text.secondary">Use o botão acima para gerar a simulação.</Typography>
      </Box>
    );
  }

  const columns = [
    { field: 'UNIDADE', headerName: 'Unidade', flex: 1.5, minWidth: 200 },
    { field: 'VALOR_A_VISTA', headerName: 'Valor à Vista', flex: 1, minWidth: 150, valueFormatter: (value) => formatarMoedaBRL(value) },
    { field: 'ENTRADA', headerName: 'Entrada', flex: 1, minWidth: 150, valueFormatter: (value) => formatarMoedaBRL(value) },
  ];
  
  Object.keys(resultadoData[0]).forEach(key => {
    if (key.startsWith('MENSAL ANO')) {
      columns.push({
        field: key,
        headerName: key.replace(/_/g, ' '),
        flex: 1,
        minWidth: 150,
        valueFormatter: (value) => formatarMoedaBRL(value)
      });
    }
  });

  const totalLotes = resultadoData.length;
  const valorTotal = resultadoData.reduce((sum, lote) => sum + lote.VALOR_A_VISTA, 0);
  const mediaMensal1 = resultadoData.reduce((sum, lote) => sum + lote['MENSAL ANO 01'], 0) / totalLotes;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}><Paper sx={{ p: 2, textAlign: 'center' }} elevation={2}><Typography color="text.secondary">Lotes Calculados</Typography><Typography variant="h5">{totalLotes}</Typography></Paper></Grid>
        <Grid item xs={12} sm={4}><Paper sx={{ p: 2, textAlign: 'center' }} elevation={2}><Typography color="text.secondary">Valor Total (à vista)</Typography><Typography variant="h5">{formatarMoedaBRL(valorTotal)}</Typography></Paper></Grid>
        <Grid item xs={12} sm={4}><Paper sx={{ p: 2, textAlign: 'center' }} elevation={2}><Typography color="text.secondary">Mensal Média (Ano 01)</Typography><Typography variant="h5">{formatarMoedaBRL(mediaMensal1)}</Typography></Paper></Grid>
      </Grid>
      <Button variant="contained" color="success" startIcon={<DownloadIcon />} onClick={onDownloadCSV} sx={{ mb: 2 }}>Baixar Tabela Final em CSV</Button>
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={resultadoData.map((row, index) => ({ ...row, id: row.UNIDADE || index }))}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          loading={!resultadoData}
          sx={{
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
              padding: '8px'
            }
          }}
          rows={resultadoData}
          columns={columns}
          getRowId={(row) => row.UNIDADE}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </Box>
    </Box>
  );
};
export default Resultado;