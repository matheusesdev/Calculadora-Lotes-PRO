import streamlit as st
import pandas as pd
from io import StringIO

# --- Configurações Iniciais da Página e Funções Auxiliares ---

st.set_page_config(layout="wide", page_title="Calculadora PRO de Lotes")

def formatar_moeda_brl(valor):
    """Formata um número para o padrão de moeda brasileiro (R$ 1.234,56) de forma manual."""
    if pd.isna(valor) or not isinstance(valor, (int, float)):
        return ""
    valor_formatado = f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {valor_formatado}"

def parse_moeda(valor_str):
    """Converte uma string de moeda brasileira para um float."""
    if isinstance(valor_str, (int, float)):
        return float(valor_str)
    try:
        return float(str(valor_str).replace('R$', '').strip().replace('.', '').replace(',', '.'))
    except (ValueError, TypeError):
        return 0.0

@st.cache_data
def carregar_dados(arquivo_upado):
    """Lê e prepara o arquivo CSV enviado pelo usuário."""
    if arquivo_upado is None:
        return None
    try:
        arquivo_upado.seek(0)
        stringio = StringIO(arquivo_upado.getvalue().decode("utf-8"))
        df = pd.read_csv(stringio, sep=';', skip_blank_lines=True)
        df.dropna(how='all', inplace=True)
        df.columns = [col.strip().upper() for col in df.columns]
        colunas_obrigatorias = ['ETAPA', 'BLOCO', 'UNIDADE', 'VALOR_A_VISTA']
        for col in colunas_obrigatorias:
            if col not in df.columns:
                st.error(f"Coluna obrigatória não encontrada no arquivo: '{col}'.")
                return None
        if 'ENTRADA' not in df.columns:
            df['ENTRADA'] = 0.0
        else:
            df['ENTRADA'] = df['ENTRADA'].fillna(0).apply(parse_moeda)
        df['VALOR_A_VISTA'] = df['VALOR_A_VISTA'].apply(parse_moeda)
        return df
    except Exception as e:
        st.error(f"Erro ao processar o arquivo CSV: {e}")
        return None

def para_csv_download(df):
    """Converte o DataFrame para um formato CSV para download com formatação de moeda completa."""
    df_export = df.copy()
    if 'VALOR_A_VISTA' in df_export.columns:
        df_export.rename(columns={'VALOR_A_VISTA': 'VALOR A VISTA'}, inplace=True)
    colunas_moeda = [col for col in df_export.columns if 'VALOR' in col or 'ENTRADA' in col or 'MENSAL' in col]
    for col in colunas_moeda:
        df_export[col] = df_export[col].apply(formatar_moeda_brl)
    return df_export.to_csv(index=False, sep=';').encode('utf-8-sig')

# --- Interface Principal (Título e Sidebar) ---
st.title("📊 Calculadora PRO de Lotes")

with st.sidebar:
    st.image("https://streamlit.io/images/brand/streamlit-logo-secondary-colormark-darktext.png", width=250) # Exemplo de logo
    st.header("1. Carregar Tabela")
    arquivo_csv = st.file_uploader("Selecione o arquivo CSV", type="csv")

    st.header("2. Parâmetros de Cálculo")
    prazo_anos = st.number_input("Prazo (Anos)", min_value=1, max_value=40, value=16, step=1)
    taxa_juros_anual = st.number_input("Taxa de Juros Anual (%)", min_value=0.0, value=9.5, step=0.01, format="%.2f")

# --- Lógica de Estado da Sessão ---
if arquivo_csv is not None:
    if 'df' not in st.session_state or st.session_state.get('nome_arquivo') != arquivo_csv.name:
        st.session_state.df = carregar_dados(arquivo_csv)
        st.session_state.nome_arquivo = arquivo_csv.name
        # Limpa resultados antigos ao carregar um novo arquivo
        if 'df_resultado' in st.session_state:
            del st.session_state.df_resultado

# --- Estrutura de Abas ---
if 'df' in st.session_state and st.session_state.df is not None:
    df_original = st.session_state.df

    tab1, tab2 = st.tabs(["[ 1 ]  Tabela & Ajustes", "[ 2 ]  Simulação & Resultado"])

    # --- ABA 1: TABELA E AJUSTES ---
    with tab1:
        st.header("Gestão da Tabela de Lotes")
        
        # --- FILTROS INTERATIVOS ---
        st.subheader("Filtros")
        col_filtro1, col_filtro2 = st.columns(2)
        with col_filtro1:
            etapas_unicas = ['Todas'] + sorted(df_original['ETAPA'].unique().tolist())
            etapa_selecionada = st.selectbox("Filtrar por Etapa:", etapas_unicas)
        with col_filtro2:
            blocos_unicos = ['Todos'] + sorted(df_original['BLOCO'].unique().tolist())
            bloco_selecionado = st.selectbox("Filtrar por Bloco/Quadra:", blocos_unicos)

        # Aplica os filtros
        df_filtrado = df_original.copy()
        if etapa_selecionada != 'Todas':
            df_filtrado = df_filtrado[df_filtrado['ETAPA'] == etapa_selecionada]
        if bloco_selecionado != 'Todos':
            df_filtrado = df_filtrado[df_filtrado['BLOCO'] == bloco_selecionado]

        # --- REAJUSTE DE VALORES (DENTRO DE UM FORMULÁRIO) ---
        with st.expander("💰 Reajuste de Valores (Antes e Depois)"):
            with st.form("form_reajuste"):
                st.write("Selecione os lotes na tabela abaixo e configure o reajuste aqui.")
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    coluna_alvo = st.selectbox("Ajustar Valor de:", ["VALOR_A_VISTA", "ENTRADA"])
                with col2:
                    operacao = st.radio("Operação:", ["Aumentar", "Diminuir"], horizontal=True)
                with col3:
                    tipo_reajuste = st.radio("Tipo:", ["%", "R$"], horizontal=True)
                with col4:
                    valor_reajuste = st.number_input("Valor:", min_value=0.0, value=10.0, step=0.5)
                
                preview_submitted = st.form_submit_button("Pré-visualizar Reajuste")

        # Tabela principal para seleção
        st.subheader("Tabela de Lotes")
        st.info("Use a primeira coluna para selecionar os lotes. Se nenhum for selecionado, a operação será aplicada a todos os lotes visíveis (filtrados).")
        
        df_para_editar = df_filtrado.copy()
        df_para_editar.insert(0, "SELECIONAR", False)
        
        df_editado = st.data_editor(
            df_para_editar,
            column_config={
                "VALOR_A_VISTA": st.column_config.NumberColumn(format="R$ %.2f"),
                "ENTRADA": st.column_config.NumberColumn(format="R$ %.2f"),
            },
            use_container_width=True, key="data_editor", disabled=df_filtrado.columns
        )
        indices_selecionados = df_editado[df_editado['SELECIONAR']].index
        
        if len(indices_selecionados) == 0:
            lotes_selecionados_df = df_filtrado.copy()
            st.session_state.indices_para_operacao = lotes_selecionados_df.index
        else:
            lotes_selecionados_df = df_filtrado.loc[indices_selecionados].copy()
            st.session_state.indices_para_operacao = lotes_selecionados_df.index
        
        if preview_submitted:
            df_preview = lotes_selecionados_df[['UNIDADE', coluna_alvo]].copy()
            df_preview.rename(columns={coluna_alvo: 'VALOR ATUAL'}, inplace=True)
            fator = 1 if operacao == "Aumentar" else -1
            ajuste = (df_preview['VALOR ATUAL'] * (valor_reajuste / 100) * fator).round(2) if tipo_reajuste == "%" else valor_reajuste * fator
            df_preview['AJUSTE'] = ajuste
            df_preview['NOVO VALOR'] = df_preview['VALOR ATUAL'] + df_preview['AJUSTE']
            st.session_state.df_preview = df_preview
            st.session_state.reajuste_info = {"coluna_alvo": coluna_alvo, "novos_valores": df_preview['NOVO VALOR']}

        if 'df_preview' in st.session_state:
            st.subheader("Prova Real do Reajuste")
            df_preview_formatado = st.session_state.df_preview.copy()
            for col in ['VALOR ATUAL', 'AJUSTE', 'NOVO VALOR']:
                df_preview_formatado[col] = df_preview_formatado[col].apply(formatar_moeda_brl)
            st.dataframe(df_preview_formatado, use_container_width=True)
            
            if st.button("✅ Confirmar e Aplicar Reajuste", type="primary"):
                info = st.session_state.reajuste_info
                indices_reajuste = st.session_state.indices_para_operacao
                st.session_state.df.loc[indices_reajuste, info["coluna_alvo"]] = info["novos_valores"]
                st.toast(f"Reajuste em '{info['coluna_alvo']}' aplicado com sucesso!", icon="🎉")
                del st.session_state.df_preview
                st.rerun()

    # --- ABA 2: SIMULAÇÃO E RESULTADO ---
    with tab2:
        st.header("Simulação de Financiamento")
        
        with st.form("form_calculo"):
            st.write("Os parâmetros de cálculo são definidos na barra lateral. Clique abaixo para gerar a tabela final para os lotes selecionados na Aba 1.")
            calcular_submitted = st.form_submit_button("Gerar Tabela de Mensais", type="primary")

        if calcular_submitted:
            # Pega os indices dos lotes selecionados na Aba 1
            indices_calculo = st.session_state.get('indices_para_operacao', df_original.index)
            lotes_para_calcular = df_original.loc[indices_calculo].copy()

            with st.spinner("Calculando..."):
                total_meses = prazo_anos * 12
                if total_meses <= 0:
                    st.error("O prazo em anos deve ser maior que zero.")
                else:
                    saldo_inicial = lotes_para_calcular['VALOR_A_VISTA'] - lotes_para_calcular['ENTRADA']
                    lotes_para_calcular['MENSAL ANO 01'] = (saldo_inicial / total_meses).round(2)
                    mensal_anterior = lotes_para_calcular['MENSAL ANO 01']
                    for ano in range(2, prazo_anos + 1):
                        mensal_atual = (mensal_anterior * (1 + taxa_juros_anual / 100)).round(2)
                        lotes_para_calcular[f'MENSAL ANO {ano:02d}'] = mensal_atual
                        mensal_anterior = mensal_atual
                st.session_state.df_resultado = lotes_para_calcular

        if 'df_resultado' in st.session_state:
            st.subheader("Resultado do Cálculo")
            df_resultado_final = st.session_state.df_resultado

            # --- PAINEL DE RESUMO (DASHBOARD) ---
            st.subheader("Resumo da Simulação")
            col_resumo1, col_resumo2, col_resumo3 = st.columns(3)
            col_resumo1.metric("Lotes Calculados", len(df_resultado_final))
            col_resumo2.metric("Valor Total (à vista)", formatar_moeda_brl(df_resultado_final['VALOR_A_VISTA'].sum()))
            col_resumo3.metric("Mensal Média (Ano 01)", formatar_moeda_brl(df_resultado_final['MENSAL ANO 01'].mean()))

            # --- TABELA DE RESULTADOS ---
            colunas_moeda = [col for col in df_resultado_final.columns if 'VALOR' in col or 'ENTRADA' in col or 'MENSAL' in col]
            st.dataframe(df_resultado_final.style.format(formatter=formatar_moeda_brl, subset=colunas_moeda), use_container_width=True)
            
            # --- BOTÃO DE DOWNLOAD ---
            csv_final = para_csv_download(df_resultado_final)
            st.download_button(
                label="📥 Baixar Tabela Final em CSV",
                data=csv_final,
                file_name=f"precificacao_calculada_{prazo_anos}anos_{taxa_juros_anual}juros.csv",
                mime="text/csv",
            )

else:
    st.info("⬅️ Comece fazendo o upload do seu arquivo CSV na barra lateral para habilitar as funcionalidades.")