# Arquivo: backend/core/calculator.py (VERSÃO COM NORMALIZAÇÃO AVANÇADA DE COLUNAS)

import pandas as pd
from io import StringIO
import unicodedata # Biblioteca para lidar com acentos

# --- DICIONÁRIO DE ALIASES ---
# A lista de nomes possíveis que o usuário pode fornecer.
# Escreva-os de forma simples, em maiúsculo, sem acentos. A normalização cuidará do resto.
# Arquivo: backend/core/calculator.py

# --- DICIONÁRIO DE ALIASES (EXPANDIDO) ---
COLUMN_ALIASES = {
    'ETAPA': ['ETAPA', 'FASE'],
    'BLOCO': ['BLOCO', 'QUADRA', 'QD'],
    'UNIDADE': ['UNIDADE', 'LOTE', 'LT', 'NUMERO DO LOTE'],
    'VALOR_A_VISTA': [
        'VALOR A VISTA', 
        'VALOR_A_VISTA', 
        'VALOR DO IMOVEL', 
        'VALOR DO LOTE',
        'VALOR TOTAL',
        'PRECO', 
        'PRECO A VISTA'
    ],
    'ENTRADA': ['ENTRADA', 'SINAL', 'ATO', 'VALOR DE ENTRADA']
}

def parse_moeda(valor_str):
    if isinstance(valor_str, (int, float)):
        return float(valor_str)
    try:
        return float(str(valor_str).replace('R$', '').strip().replace('.', '').replace(',', '.'))
    except (ValueError, TypeError):
        return 0.0

def normalize_column_name(name):
    """
    Normaliza um nome de coluna: remove acentos, converte para maiúsculo,
    substitui underscores por espaços e remove espaços extras.
    Ex: "Valor do Imóvel" -> "VALOR DO IMOVEL"
    """
    # Remove acentos
    nfkd_form = unicodedata.normalize('NFD', str(name))
    only_ascii = u"".join([c for c in nfkd_form if not unicodedata.combining(c)])
    
    # Converte para maiúsculo, troca _ por espaço e remove espaços do início/fim
    return only_ascii.replace('_', ' ').strip().upper()

def carregar_dados_csv(file_stream: StringIO):
    df = pd.read_csv(file_stream, sep=';', skip_blank_lines=True)
    df.dropna(how='all', inplace=True)
    
    # --- LÓGICA DE MAPEAMENTO E RENOMEAÇÃO APRIMORADA ---
    
    # Cria um mapa de {nome_normalizado: nome_original}
    original_columns_map = {normalize_column_name(col): col for col in df.columns}
    
    rename_map = {}
    
    # Itera sobre nossos nomes padrão (ETAPA, BLOCO, etc.)
    for standard_name, aliases in COLUMN_ALIASES.items():
        # Itera sobre os aliases conhecidos para cada nome padrão
        for alias in aliases:
            if alias in original_columns_map:
                # Se um alias for encontrado nos nomes normalizados da planilha...
                original_col_name = original_columns_map[alias]
                # ...mapeia o nome original para o nosso nome padrão.
                rename_map[original_col_name] = standard_name
                break # Encontrou, vai para o próximo nome padrão

    df.rename(columns=rename_map, inplace=True)
    
    # --- FIM DA LÓGICA DE MAPEAMENTO ---

    colunas_obrigatorias = ['BLOCO', 'UNIDADE', 'VALOR_A_VISTA']
    for col in colunas_obrigatorias:
        if col not in df.columns:
            # Mensagem de erro mais amigável
            raise ValueError(f"Não foi possível encontrar uma coluna obrigatória. Verifique se sua planilha contém uma coluna para: {col}. Variações como 'Quadra' ou 'Preço' são aceitas.")

    if 'ETAPA' not in df.columns:
        df['ETAPA'] = 'Padrão'

    if 'ENTRADA' not in df.columns:
        df['ENTRADA'] = 0.0
    else:
        df['ENTRADA'] = df['ENTRADA'].fillna(0).apply(parse_moeda)
    
    df['VALOR_A_VISTA'] = df['VALOR_A_VISTA'].apply(parse_moeda)
    
    final_columns = [col for col in ['ETAPA', 'BLOCO', 'UNIDADE', 'VALOR_A_VISTA', 'ENTRADA'] if col in df.columns]
    
    return df[final_columns]

# ... (as outras funções calcular_mensais, reajustar_valores, formatar_dataframe_para_csv continuam exatamente as mesmas) ...
def calcular_mensais(df_lotes, prazo_anos, taxa_juros_anual):
    df_resultado = df_lotes.copy()
    total_meses = prazo_anos * 12
    if total_meses <= 0:
        raise ValueError("O prazo em anos deve ser maior que zero.")
    saldo_inicial = df_resultado['VALOR_A_VISTA'] - df_resultado['ENTRADA']
    df_resultado['MENSAL ANO 01'] = (saldo_inicial / total_meses).round(2)
    mensal_anterior = df_resultado['MENSAL ANO 01']
    for ano in range(2, prazo_anos + 1):
        mensal_atual = (mensal_anterior * (1 + taxa_juros_anual / 100)).round(2)
        df_resultado[f'MENSAL ANO {ano:02d}'] = mensal_atual
        mensal_anterior = mensal_atual
    return df_resultado

def reajustar_valores(df_lotes, coluna_alvo, operacao, tipo_reajuste, valor_reajuste):
    df_preview = df_lotes[['UNIDADE', coluna_alvo]].copy()
    df_preview.rename(columns={coluna_alvo: 'VALOR_ATUAL'}, inplace=True)
    fator = 1 if operacao == "Aumentar" else -1
    if tipo_reajuste == "%":
        ajuste = (df_preview['VALOR_ATUAL'] * (valor_reajuste / 100) * fator).round(2)
    else:
        ajuste = valor_reajuste * fator
    df_preview['AJUSTE'] = ajuste
    df_preview['NOVO_VALOR'] = df_preview['VALOR_ATUAL'] + df_preview['AJUSTE']
    df_preview[coluna_alvo] = df_preview['NOVO_VALOR']
    return df_preview

def formatar_dataframe_para_csv(df):
    df_export = df.copy()
    if 'VALOR_A_VISTA' in df_export.columns:
        df_export.rename(columns={'VALOR_A_VISTA': 'VALOR A VISTA'}, inplace=True)
    colunas_moeda = [col for col in df_export.columns if 'VALOR' in col or 'ENTRADA' in col or 'MENSAL' in col]
    for col in colunas_moeda:
        df_export[col] = df_export[col].apply(lambda x: f'R$ {x:,.2f}'.replace(",", "X").replace(".", ",").replace("X", ".") if isinstance(x, (int, float)) else x)
    return df_export