import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const formatarMoedaBRL = (valor) => {
  if (typeof valor !== 'number') return "";
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const PreviewTable = ({ open, onClose, previewData, onConfirm }) => {
  if (!previewData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle><Typography variant="h5" component="span">Prova Real do Reajuste</Typography></DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>Por favor, confirme as alterações para os <b>{previewData.length}</b> lotes selecionados.</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Unidade</TableCell>
                <TableCell align="right">Valor Atual</TableCell>
                <TableCell align="right">Ajuste</TableCell>
                <TableCell align="right"><b>Novo Valor</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((row) => (
                <TableRow key={row.UNIDADE} hover>
                  <TableCell>{row.UNIDADE}</TableCell>
                  <TableCell align="right">{formatarMoedaBRL(row.VALOR_ATUAL)}</TableCell>
                  <TableCell align="right" sx={{ color: row.AJUSTE >= 0 ? 'success.main' : 'error.main' }}>{formatarMoedaBRL(row.AJUSTE)}</TableCell>
                  <TableCell align="right"><b>{formatarMoedaBRL(row.NOVO_VALOR)}</b></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button onClick={onConfirm} variant="contained" color="success">Confirmar e Aplicar Reajuste</Button>
      </DialogActions>
    </Dialog>
  );
};
export default PreviewTable;