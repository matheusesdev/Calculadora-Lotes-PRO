// Arquivo: calculadora-frontend/src/components/LoteTable.js (VERSÃO CORRETA COM MUI DATAGRID)
import React from 'react';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const LoteTable = ({ lotes, formatarMoeda, selectionModel, setSelectionModel }) => {
  const columns = [
    { field: 'ETAPA', headerName: 'Etapa', flex: 1, minWidth: 150 },
    { field: 'BLOCO', headerName: 'Bloco/Quadra', flex: 1, minWidth: 150 },
    { field: 'UNIDADE', headerName: 'Unidade', flex: 1.5, minWidth: 200 },
    { field: 'VALOR_A_VISTA', headerName: 'Valor à Vista', type: 'number', flex: 1, minWidth: 150, valueFormatter: (value) => formatarMoeda(value) },
    { field: 'ENTRADA', headerName: 'Entrada', type: 'number', flex: 1, minWidth: 150, valueFormatter: (value) => formatarMoeda(value) },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={lotes}
        columns={columns}
        getRowId={(row) => row.UNIDADE}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection
        onRowSelectionModelChange={(newSelectionModel) => { setSelectionModel(newSelectionModel); }}
        rowSelectionModel={selectionModel}
        disableRowSelectionOnClick
      />
    </Box>
  );
};
export default LoteTable;