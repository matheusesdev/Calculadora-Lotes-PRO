import React from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, RadioGroup, FormControlLabel, Radio, TextField, Button, CircularProgress, InputAdornment } from '@mui/material';
import { NumericFormat } from 'react-number-format';

const CurrencyInputAdapter = React.forwardRef(function CurrencyInputAdapter(props, ref) {
  const { onChange, ...other } = props;
  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => { onChange({ target: { name: props.name, value: values.floatValue } }); }}
      thousandSeparator="."
      decimalSeparator=","
      valueIsNumericString
      prefix="R$ "
    />
  );
});

const PercentageInputAdapter = React.forwardRef(function PercentageInputAdapter(props, ref) {
  const { onChange, ...other } = props;
  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => { onChange({ target: { name: props.name, value: values.floatValue } }); }}
      decimalScale={2}
      decimalSeparator=","
      suffix=" %"
    />
  );
});

const ReajusteForm = ({
  colunaAlvo, setColunaAlvo,
  operacao, setOperacao,
  tipoReajuste, setTipoReajuste,
  valorReajuste, setValorReajuste,
  onPreview,
  isLoading
}) => {
  const handleSubmit = (event) => { event.preventDefault(); onPreview(); };
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Configurar Reajuste</Typography>
      <FormControl fullWidth size="small">
        <InputLabel>Ajustar Valor de</InputLabel>
        <Select value={colunaAlvo} label="Ajustar Valor de" onChange={(e) => setColunaAlvo(e.target.value)}>
          <MenuItem value="VALOR_A_VISTA">Valor à Vista</MenuItem>
          <MenuItem value="ENTRADA">Entrada</MenuItem>
        </Select>
      </FormControl>
      <FormControl><RadioGroup row value={operacao} onChange={(e) => setOperacao(e.target.value)}><FormControlLabel value="Aumentar" control={<Radio />} label="Aumentar" /><FormControlLabel value="Diminuir" control={<Radio />} label="Diminuir" /></RadioGroup></FormControl>
      <FormControl><RadioGroup row value={tipoReajuste} onChange={(e) => setTipoReajuste(e.target.value)}><FormControlLabel value="%" control={<Radio />} label="Percentual (%)" /><FormControlLabel value="R$" control={<Radio />} label="Valor Fixo (R$)" /></RadioGroup></FormControl>
      {tipoReajuste === '%' ? (
        <TextField label="Valor do Reajuste" value={valorReajuste} onChange={(e) => setValorReajuste(e.target.value === undefined ? '' : e.target.value)} placeholder="Ex: 10,5" InputProps={{ inputComponent: PercentageInputAdapter }} fullWidth required size="small" />
      ) : (
        <TextField label="Valor do Reajuste" value={valorReajuste} onChange={(e) => setValorReajuste(e.target.value === undefined ? '' : e.target.value)} placeholder="Ex: 10000" InputProps={{ inputComponent: CurrencyInputAdapter }} fullWidth required size="small" />
      )}
      <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
        {isLoading ? <CircularProgress size={24} /> : 'Pré-visualizar Reajuste'}
      </Button>
    </Box>
  );
};
export default ReajusteForm;