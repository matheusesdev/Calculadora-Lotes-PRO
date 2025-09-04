import { createTheme } from '@mui/material/styles';
import logoVCA from './logo.png'; // 1. IMPORTAR O LOGO AQUI

const theme = createTheme({
  palette: {
    primary: {
      main: '#00529C',
    },
    secondary: {
      main: '#66CC33',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
  typography: {
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    // 2. ADICIONAR ESTA SEÇÃO PARA USAR O LOGO
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        position: 'static',
      },
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiToolbar: {
      defaultProps: {
        disableGutters: true,
      },
      styleOverrides: {
        root: {
          padding: '0 16px',
        },
      },
    },
  },
  // 3. ADICIONAR UMA PROPRIEDADE CUSTOMIZADA PARA O LOGO
  logo: {
    src: logoVCA,
    alt: 'VCA Logo',
  },
});

export default theme;