import React, { useState, useMemo } from 'react';
import { Container, Typography, Box, CssBaseline, Paper, Grid, Tabs, Tab, Button, CircularProgress, TextField, Stack, Divider, InputAdornment, Badge, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import toast, { Toaster } from 'react-hot-toast';
import UndoIcon from '@mui/icons-material/Undo';
import SearchIcon from '@mui/icons-material/Search';

import FileUpload from './components/FileUpload';
import LoteTable from './components/LoteTable';
import ReajusteForm from './components/ReajusteForm';
import PreviewModal from './components/PreviewTable';
import Resultado from './components/Resultado';
import MergeUpload from './components/MergeUpload';
import { uploadLotesCSV, previewReajuste, calcularSimulacao, downloadCSV, mergeEntradasCSV } from './api/apiService';
import './App.css';

const formatarMoedaBRL = (valor) => { if (typeof valor !== 'number') return ""; return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };

function App() {
  const theme = useTheme();
  const initialState = {
    prazoAnos: 16,
    taxaJuros: 9.5,
    lotes: [],
    history: [],
    error: '',
    selectionModel: [],
    currentTab: 0,
    isLoading: false,
    colunaAlvo: 'VALOR_A_VISTA',
    operacao: 'Aumentar',
    tipoReajuste: '%',
    valorReajuste: '',
    previewData: null,
    isModalOpen: false,
    resultadoData: null,
    searchTerm: '',
    etapaFiltro: 'Todas',
    blocoFiltro: 'Todas',
    temColunaEntrada: true
  };

  const [prazoAnos, setPrazoAnos] = useState(initialState.prazoAnos);
  const [taxaJuros, setTaxaJuros] = useState(initialState.taxaJuros);
  const [lotes, setLotes] = useState(initialState.lotes);
  const [history, setHistory] = useState(initialState.history);
  const [error, setError] = useState(initialState.error);
  const [selectionModel, setSelectionModel] = useState(initialState.selectionModel);
  const [currentTab, setCurrentTab] = useState(initialState.currentTab);
  const [isLoading, setIsLoading] = useState(initialState.isLoading);
  const [colunaAlvo, setColunaAlvo] = useState(initialState.colunaAlvo);
  const [operacao, setOperacao] = useState(initialState.operacao);
  const [tipoReajuste, setTipoReajuste] = useState(initialState.tipoReajuste);
  const [valorReajuste, setValorReajuste] = useState(initialState.valorReajuste);
  const [previewData, setPreviewData] = useState(initialState.previewData);
  const [isModalOpen, setIsModalOpen] = useState(initialState.isModalOpen);
  const [resultadoData, setResultadoData] = useState(initialState.resultadoData);
  const [searchTerm, setSearchTerm] = useState(initialState.searchTerm);
  const [etapaFiltro, setEtapaFiltro] = useState(initialState.etapaFiltro);
  const [blocoFiltro, setBlocoFiltro] = useState(initialState.blocoFiltro);
  const [temColunaEntrada, setTemColunaEntrada] = useState(initialState.temColunaEntrada);

  const temColunaEtapa = useMemo(() => lotes.length > 0 && lotes[0]?.hasOwnProperty('ETAPA'), [lotes]);
  const etapasUnicas = useMemo(() => temColunaEtapa ? ['Todas', ...new Set(lotes.map(lote => lote.ETAPA))] : [], [lotes, temColunaEtapa]);
  const blocosUnicos = useMemo(() => ['Todas', ...new Set(lotes.map(lote => lote.BLOCO))], [lotes]);
  const filteredLotes = useMemo(() => { return lotes.filter(lote => { const lowerSearch = searchTerm.toLowerCase(); const atendeBusca = !searchTerm || lote.UNIDADE.toLowerCase().includes(lowerSearch) || lote.BLOCO.toLowerCase().includes(lowerSearch) || (temColunaEtapa && lote.ETAPA && lote.ETAPA.toLowerCase().includes(lowerSearch)); const atendeEtapa = !temColunaEtapa || etapaFiltro === 'Todas' || lote.ETAPA === etapaFiltro; const atendeBloco = blocoFiltro === 'Todas' || lote.BLOCO === blocoFiltro; return atendeBusca && atendeEtapa && atendeBloco; }); }, [lotes, searchTerm, etapaFiltro, blocoFiltro, temColunaEtapa]);
  const pushToHistory = (currentState) => { setHistory(prevHistory => [...prevHistory, currentState]); };
  const handleTabChange = (event, newValue) => { setCurrentTab(newValue); };
  const handleFileUpload = async (file) => {
    setIsLoading(true);
    const loadingToast = toast.loading('Carregando arquivo...');
    setError('');

    try {
      const response = await uploadLotesCSV(file);
      
      if (!response || !response.data) {
        throw new Error('Resposta inválida do servidor');
      }

      const data = response.data;
      setLotes(data);
      
      if (data.length > 0) {
        const semEntradas = data.every(l => !l.ENTRADA || l.ENTRADA === 0 || l.ENTRADA === "0,00" || l.ENTRADA === "R$ 0,00");
        setTemColunaEntrada(!semEntradas);
        
        const mensagem = semEntradas
          ? `Arquivo carregado! Para adicionar valores de entrada, use o painel opcional.`
          : `Arquivo carregado! ${data.length} lotes encontrados.`;
        
        toast.success(mensagem, { id: loadingToast, duration: 5000 });
      } else {
        throw new Error('Nenhum lote encontrado no arquivo');
      }

      setHistory([]);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || "Erro desconhecido.";
      setError(errorMessage);
      setLotes([]);
      toast.error(`Erro: ${errorMessage}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };
  const handlePreviewReajuste = async () => { const lotesParaReajustar = selectionModel.length > 0 ? lotes.filter(lote => selectionModel.includes(lote.UNIDADE)) : filteredLotes; if (lotesParaReajustar.length === 0) { toast.error("Nenhum lote para reajustar."); return; } pushToHistory(lotes); setIsLoading(true); const payload = { lotes: lotesParaReajustar, coluna_alvo: colunaAlvo, operacao, tipo_reajuste: tipoReajuste, valor_reajuste: valorReajuste || 0, }; try { const response = await previewReajuste(payload); setPreviewData(response.data); setIsModalOpen(true); } catch (err) { toast.error(err.response?.data?.detail || "Erro ao gerar preview."); } finally { setIsLoading(false); } };
  const handleConfirmReajuste = () => { pushToHistory(lotes); const lotesAtualizados = lotes.map(lote => { const reajusteInfo = previewData.find(p => p.UNIDADE === lote.UNIDADE); return reajusteInfo ? { ...lote, [colunaAlvo]: reajusteInfo.NOVO_VALOR } : lote; }); setLotes(lotesAtualizados); setIsModalOpen(false); setPreviewData(null); setSelectionModel([]); toast.success('Reajuste aplicado com sucesso!'); setCurrentTab(1); };
  const handleUndo = () => { if (history.length > 0) { const lastState = history[history.length - 1]; setLotes(lastState); setHistory(prevHistory => prevHistory.slice(0, -1)); toast.success('Última alteração desfeita!'); } };
  const handleCalcular = async () => {
    const lotesParaCalcular = selectionModel.length > 0 
      ? lotes.filter(lote => selectionModel.includes(lote.UNIDADE)) 
      : filteredLotes;

    if (lotesParaCalcular.length === 0) {
      toast.error("Nenhum lote para calcular.");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Calculando mensais...');

    try {
      const payload = {
        lotes: lotesParaCalcular,
        prazo_anos: prazoAnos,
        taxa_juros_anual: taxaJuros
      };

      const response = await calcularSimulacao(payload);
      if (response && response.data) {
        setResultadoData(response.data);
        toast.success('Cálculo concluído com sucesso!', { id: loadingToast });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err) {
      setResultadoData(null);
      const errorMessage = err.response?.data?.detail || err.message || "Erro ao calcular.";
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };
  const handleDownload = async () => { if (!resultadoData) { toast.error("Gere a simulação primeiro."); return; } const loadingToast = toast.loading('Gerando seu arquivo CSV...'); const lotesOriginaisNoResultado = resultadoData.map(({ ETAPA, BLOCO, UNIDADE, VALOR_A_VISTA, ENTRADA }) => ({ ETAPA, BLOCO, UNIDADE, VALOR_A_VISTA, ENTRADA })); const payload = { lotes: lotesOriginaisNoResultado, prazo_anos: prazoAnos, taxa_juros_anual: taxaJuros }; try { const response = await downloadCSV(payload); const url = window.URL.createObjectURL(new Blob([response.data])); const link = document.createElement('a'); link.href = url; const filename = `precificacao_calculada_${prazoAnos}anos_${taxaJuros}juros.csv`; link.setAttribute('download', filename); document.body.appendChild(link); link.click(); link.parentNode.removeChild(link); window.URL.revokeObjectURL(url); toast.success('Download iniciado!', { id: loadingToast }); } catch (err) { toast.error("Falha ao gerar o arquivo para download.", { id: loadingToast }); } };
  const handleSelectAll = () => { const allVisibleLoteIds = filteredLotes.map(lote => lote.UNIDADE); setSelectionModel(allVisibleLoteIds); };
  const handleClearSelection = () => { setSelectionModel([]); };
  const handleMergeUpload = async (file) => { setIsLoading(true); const loadingToast = toast.loading('Combinando planilhas...'); try { const response = await mergeEntradasCSV(lotes, file); pushToHistory(lotes); setLotes(response.data); setTemColunaEntrada(true); toast.success('Valores de entrada combinados com sucesso!', { id: loadingToast }); } catch (err) { const errorMessage = err.response?.data?.detail || "Erro desconhecido."; setError(errorMessage); toast.error(`Erro: ${errorMessage}`, { id: loadingToast }); } finally { setIsLoading(false); } };

  return (
    <>
      <Toaster position="top-right" />
      <CssBaseline />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}><img src={theme.logo.src} alt={theme.logo.alt} style={{ maxWidth: '180px' }} /></Box>
        {!lotes.length ? (
          <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, sm: 4 }, maxWidth: '600px', margin: 'auto', textAlign: 'center' }}><Typography variant="h5" gutterBottom>Calculadora de Precificação PRO</Typography><Typography color="text.secondary" sx={{ mb: 4 }}>Para começar, arraste e solte sua planilha de lotes ou clique abaixo.</Typography><FileUpload onFileUpload={handleFileUpload} />{isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>}</Paper>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}><Paper elevation={3} sx={{ p: 2, position: 'sticky', top: '24px' }}><Typography variant="h6" gutterBottom>Painel de Controle</Typography><Divider sx={{ my: 1 }} />{currentTab === 1 && (<><Typography variant="overline" color="text.secondary">Parâmetros de Simulação</Typography><TextField label="Prazo (Anos)" type="number" value={prazoAnos} onChange={(e) => setPrazoAnos(e.target.value ? parseInt(e.target.value, 10) : '')} fullWidth sx={{ mb: 2, mt: 1 }} size="small" error={prazoAnos <= 0} helperText={prazoAnos <= 0 ? "O prazo deve ser positivo." : ""} /><TextField label="Taxa de Juros Anual (%)" type="number" value={taxaJuros} onChange={(e) => setTaxaJuros(e.target.value ? parseFloat(e.target.value) : '')} fullWidth size="small" error={taxaJuros < 0} helperText={taxaJuros < 0 ? "A taxa não pode ser negativa." : ""} /></>)}{currentTab === 0 && (<><ReajusteForm {...{colunaAlvo, setColunaAlvo, operacao, setOperacao, tipoReajuste, setTipoReajuste, valorReajuste, setValorReajuste, onPreview: handlePreviewReajuste, isLoading}} /><Divider sx={{ my: 2 }} /><Typography variant="overline" color="text.secondary">Ações na Tabela</Typography><Stack spacing={1} sx={{ mt: 1 }}><Button variant="outlined" size="small" onClick={handleSelectAll}>Selecionar Todos (Visíveis)</Button><Button variant="outlined" size="small" onClick={handleClearSelection} disabled={selectionModel.length === 0}>Limpar Seleção</Button><Badge badgeContent={history.length} color="secondary"><Button variant="outlined" color="secondary" size="small" onClick={handleUndo} disabled={history.length === 0} startIcon={<UndoIcon />}>Desfazer Alteração</Button></Badge></Stack></>)} {!temColunaEntrada && lotes.length > 0 && currentTab === 0 && <MergeUpload onFileMerge={handleMergeUpload} />}</Paper></Grid>
            <Grid item xs={12} md={9}>
              <Paper elevation={3}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}><Tabs value={currentTab} onChange={handleTabChange} centered><Tab label="[ 1 ] Tabela & Ajustes" /><Tab label="[ 2 ] Simulação & Resultado" /></Tabs></Box>
                {currentTab === 0 && (<Box sx={{ p: 3 }}><Stack direction={{xs: 'column', sm: 'row'}} spacing={2} sx={{ mb: 2 }}>{temColunaEtapa && (<FormControl size="small" fullWidth><InputLabel>Etapa</InputLabel><Select value={etapaFiltro} label="Etapa" onChange={(e) => setEtapaFiltro(e.target.value)}>{etapasUnicas.map(etapa => <MenuItem key={etapa} value={etapa}>{etapa}</MenuItem>)}</Select></FormControl>)}<FormControl size="small" fullWidth><InputLabel>Bloco/Quadra</InputLabel><Select value={blocoFiltro} label="Bloco/Quadra" onChange={(e) => setBlocoFiltro(e.target.value)}>{blocosUnicos.map(bloco => <MenuItem key={bloco} value={bloco}>{bloco}</MenuItem>)}</Select></FormControl><TextField label="Busca Rápida..." variant="outlined" size="small" fullWidth value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>, }}/></Stack><Typography variant="h6" sx={{ mb: 2 }}>{selectionModel.length} de {filteredLotes.length} lotes selecionados</Typography><LoteTable lotes={filteredLotes} formatarMoeda={formatarMoedaBRL} selectionModel={selectionModel} setSelectionModel={setSelectionModel} /></Box>)}
                {currentTab === 1 && (
  <Box sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
      <Button 
        variant="contained" 
        size="large" 
        onClick={handleCalcular} 
        disabled={isLoading || prazoAnos <= 0 || taxaJuros < 0}
      >
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          `Calcular Simulação para ${selectionModel.length > 0 ? selectionModel.length : filteredLotes.length} Lote(s)`
        )}
      </Button>
    </Box>
    {isLoading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    ) : resultadoData ? (
      <Resultado resultadoData={resultadoData} onDownloadCSV={handleDownload} />
    ) : (
      <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed grey', borderRadius: 2 }}>
        <Typography variant="h6">Aguardando Simulação</Typography>
        <Typography color="text.secondary">Ajuste os parâmetros e use o botão para iniciar.</Typography>
      </Box>
    )}
  </Box>
)}
              </Paper>
            </Grid>
          </Grid>
        )}
        {error && <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>{error}</Typography>}
        <PreviewModal open={isModalOpen} onClose={() => setIsModalOpen(false)} previewData={previewData} onConfirm={handleConfirmReajuste}/>
      </Container>
    </>
  );
}
export default App;