# Arquivo: backend/core/calculator.py (VERSÃO FINAL COM TODAS AS FUNÇÕES)

import pandas as pd
from io import StringIO
import unicodedata
import re

COLUMN_ALIASES = {
    'ETAPA': ['ETAPA', 'FASE'],
    'BLOCO': ['BLOCO', 'QUADRA', 'QD'],
    'UNIDADE': ['UNIDADE', 'LOTE', 'LT', 'NUMERO DO LOTE', 'COD UNIDADE', 'CODIGO DA UNIDADE'],
    'VALOR_A_VISTA': [
        'VALOR A VISTA', 'VALOR_A_VISTA', 'VALOR DO IMOVEL', 
        'VALOR DO LOTE', 'VALOR TOTAL', 'PRECO', 'PRECO A VISTA'
    ],
    'ENTRADA': [
        'ENTRADA', 'SINAL', 'ATO', 'SINAL 1', 'VALOR DE ENTRADA', 
        'VALOR DO SINAL', 'ENTRADA SINAL'
    ]
}

found_column_names = {}

def parse_moeda(valor_str):
    if isinstance(valor_str, (int, float)): return float(valor_str)
    try: return float(str(valor_str).replace('R$', '').strip().replace('.', '').replace(',', '.'))
    except (ValueError, TypeError): return 0.0

def normalize_column_name(name):
    text = str(name)
    text = re.sub(r'\(.*\)', '', text)
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4}', '', text)
    nfkd_form = unicodedata.normalize('NFD', text)
    only_ascii = u"".join([c for c in nfkd_form if not unicodedata.combining(c)])
    return only_ascii.replace('_', ' ').replace('.', '').strip().upper()

# --- FUNÇÃO QUE ESTAVA FALTANDO ---
def process_dataframe(df, is_merge_file=False):
    """Função centralizada para renomear e preparar um DataFrame."""
    global found_column_names
    if not is_merge_file:
        found_column_names.clear()

    original_columns_map = {normalize_column_name(col): col for col in df.columns}
    rename_map = {}
    
    for standard_name, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in original_columns_map:
                original_col_name = original_columns_map[alias]
                rename_map[original_col_name] = standard_name
                
                cleaned_original_name = re.sub(r'\(.*\)|(\d{1,2}/\d{1,2}/\d{2,4})', '', original_col_name).strip()
                
                if not is_merge_file or standard_name in ['UNIDADE', 'ENTRADA']:
                    found_column_names[standard_name] = cleaned_original_name
                break
    df.rename(columns=rename_map, inplace=True)
    return df
# --- FIM DA FUNÇÃO QUE FALTAVA ---

def carregar_dados_csv(file_stream: StringIO, is_merge_file=False):
    df = pd.read_csv(file_stream, sep=';', skip_blank_lines=True, dtype=str).dropna(how='all')
    df = process_dataframe(df, is_merge_file=is_merge_file)

    if not is_merge_file:
        colunas_obrigatorias = ['BLOCO', 'UNIDADE', 'VALOR_A_VISTA']
        for col in colunas_obrigatorias:
            if col not in df.columns:
                raise ValueError(f"Coluna obrigatória não encontrada: '{col}'.")
        
        if 'ETAPA' not in df.columns: found_column_names['ETAPA'] = 'ETAPA'
        
        if 'ENTRADA' not in df.columns:
            df['ENTRADA'] = 0.0
            found_column_names['ENTRADA'] = 'ENTRADA'
        else:
            df['ENTRADA'] = df['ENTRADA'].fillna('0').apply(parse_moeda)
        
        df['VALOR_A_VISTA'] = df['VALOR_A_VISTA'].apply(parse_moeda)
    
    final_columns = [col for col in ['ETAPA', 'BLOCO', 'UNIDADE', 'VALOR_A_VISTA', 'ENTRADA'] if col in df.columns]
    return df[final_columns]

def merge_entradas_df(df_principal, df_entradas_stream):
    df_entradas = pd.read_csv(df_entradas_stream, sep=';', skip_blank_lines=True, dtype=str).dropna(how='all')
    df_entradas = process_dataframe(df_entradas, is_merge_file=True)

    if 'UNIDADE' not in df_entradas.columns or 'ENTRADA' not in df_entradas.columns:
        raise ValueError("A planilha de entradas precisa conter colunas para 'UNIDADE' e 'ENTRADA'.")
    
    df_entradas_essencial = df_entradas[['UNIDADE', 'ENTRADA']].copy()
    df_entradas_essencial['ENTRADA'] = df_entradas_essencial['ENTRADA'].fillna('0').apply(parse_moeda)
    
    if 'ENTRADA' in df_principal.columns:
        df_principal = df_principal.drop(columns=['ENTRADA'])

    df_merged = pd.merge(df_principal, df_entradas_essencial, on='UNIDADE', how='left')
    df_merged['ENTRADA'] = df_merged['ENTRADA'].fillna(0)
    
    final_columns = [col for col in ['ETAPA', 'BLOCO', 'UNIDADE', 'VALOR_A_VISTA', 'ENTRADA'] if col in df_merged.columns]
    return df_merged[final_columns]

def calcular_mensais(df_lotes, prazo_anos, taxa_juros_anual):
    df_resultado = df_lotes.copy()
    total_meses = prazo_anos * 12
    if total_meses <= 0: raise ValueError("O prazo em anos deve ser maior que zero.")
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
    if tipo_reajuste == "%": ajuste = (df_preview['VALOR_ATUAL'] * (valor_reajuste / 100) * fator).round(2)
    else: ajuste = valor_reajuste * fator
    df_preview['AJUSTE'] = ajuste
    df_preview['NOVO_VALOR'] = df_preview['VALOR_ATUAL'] + df_preview['AJUSTE']
    df_preview[coluna_alvo] = df_preview['NOVO_VALOR']
    return df_preview

def formatar_dataframe_para_csv(df):
    df_export = df.copy()
    reverse_rename_map = {std_name: orig_name for std_name, orig_name in found_column_names.items() if std_name in df_export.columns}
    df_export.rename(columns=reverse_rename_map, inplace=True)
    
    colunas_moeda_nomes_originais = []
    if 'VALOR_A_VISTA' in found_column_names: colunas_moeda_nomes_originais.append(found_column_names['VALOR_A_VISTA'])
    if 'ENTRADA' in found_column_names: colunas_moeda_nomes_originais.append(found_column_names['ENTRADA'])
    colunas_moeda_nomes_originais.extend([col for col in df_export.columns if 'MENSAL' in col])

    for col in colunas_moeda_nomes_originais:
        if col in df_export.columns:
            df_export[col] = df_export[col].apply(lambda x: f'R$ {x:,.2f}'.replace(",", "X").replace(".", ",").replace("X", ".") if isinstance(x, (int, float)) else x)
            
    return df_export