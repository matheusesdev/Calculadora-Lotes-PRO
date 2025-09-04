# Arquivo: backend/core/calculator.py (VERSÃO FINAL COMPLETA)

import pandas as pd
from io import StringIO

def parse_moeda(valor_str):
    if isinstance(valor_str, (int, float)):
        return float(valor_str)
    try:
        return float(str(valor_str).replace('R$', '').strip().replace('.', '').replace(',', '.'))
    except (ValueError, TypeError):
        return 0.0

def carregar_dados_csv(file_stream: StringIO):
    df = pd.read_csv(file_stream, sep=';', skip_blank_lines=True)
    df.dropna(how='all', inplace=True)
    df.columns = [col.strip().upper() for col in df.columns]

    colunas_obrigatorias = ['ETAPA', 'BLOCO', 'UNIDADE', 'VALOR_A_VISTA']
    for col in colunas_obrigatorias:
        if col not in df.columns:
            raise ValueError(f"Coluna obrigatória não encontrada no arquivo CSV: '{col}'")

    if 'ENTRADA' not in df.columns:
        df['ENTRADA'] = 0.0
    else:
        df['ENTRADA'] = df['ENTRADA'].fillna(0).apply(parse_moeda)
    
    df['VALOR_A_VISTA'] = df['VALOR_A_VISTA'].apply(parse_moeda)
    return df

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

# --- NOVA FUNÇÃO ADICIONADA ---
def formatar_dataframe_para_csv(df):
    df_export = df.copy()
    
    if 'VALOR_A_VISTA' in df_export.columns:
        df_export.rename(columns={'VALOR_A_VISTA': 'VALOR A VISTA'}, inplace=True)
    
    colunas_moeda = [col for col in df_export.columns if 'VALOR' in col or 'ENTRADA' in col or 'MENSAL' in col]
    
    for col in colunas_moeda:
        # Formatação manual para garantir o padrão pt-BR
        df_export[col] = df_export[col].apply(
            lambda x: f'R$ {x:,.2f}'.replace(",", "X").replace(".", ",").replace("X", ".") if isinstance(x, (int, float)) else x
        )
        
    return df_export