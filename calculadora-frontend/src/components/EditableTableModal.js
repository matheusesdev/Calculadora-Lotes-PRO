import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { AgGridReact } from '@ag-grid-community/react';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';

const formatarMoedaBRL = (valor) => { if (typeof valor !== 'number') return ""; return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };
const numberParser = params => { const value = params.newValue; if (value === null || value === undefined || value === '') return null; return Number(String(value).replace(/[^0-9,-]+/g, "").replace(",", ".")); };

const EditableTableModal = ({ open, onClose, lotesSelecionados, onSave }) => {
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);

  useEffect(() => { if (lotesSelecionados) { setRowData(lotesSelecionados.map(lote => ({...lote}))); } }, [lotesSelecionados]);

  const [columnDefs] = useState([
    { field: 'UNIDADE', headerName: 'Unidade', editable: false, flex: 1.5 },
    { field: 'VALOR_A_VISTA', headerName: 'Valor à Vista', editable: true, flex: 1, valueFormatter: p => formatarMoedaBRL(p.value), valueParser: numberParser },
    { field: 'ENTRADA', headerName: 'Entrada', editable: true, flex: 1, valueFormatter: p => formatarMoedaBRL(p.value), valueParser: numberParser },
  ]);

  const onGridReady = useCallback((params) => { setGridApi(params.api); }, []);
  const handleSaveChanges = () => { if (gridApi) gridApi.stopEditing(); onSave(rowData); onClose(); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle><Typography variant="h5" component="span">Ajuste Individual de Lotes</Typography></DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>Clique duas vezes em uma célula para editar seu valor.</Typography>
        <div className="ag-theme-alpine" style={{ height: 400, width: '100%', marginTop: '16px' }}>
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{ flex: 1, minWidth: 150, resizable: true }}
            onGridReady={onGridReady}
            onCellValueChanged={(event) => {
              const updatedData = [...rowData];
              const index = updatedData.findIndex(row => row.UNIDADE === event.data.UNIDADE);
              if (index > -1) { updatedData[index] = event.data; setRowData(updatedData); }
            }}
          />
        </div>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button onClick={handleSaveChanges} variant="contained" color="primary">Salvar Alterações</Button>
      </DialogActions>
    </Dialog>
  );
};
export default EditableTableModal;