# Arquivo: backend/main.py (VERSÃO FINAL COMPLETA)

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
from io import StringIO, BytesIO
from typing import List
from pydantic import BaseModel

from core.calculator import carregar_dados_csv, calcular_mensais, reajustar_valores, formatar_dataframe_para_csv
from models.schemas import CalculoPayload, ReajustePayload, Lote

app = FastAPI(title="Calculadora de Lotes API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Status": "API da Calculadora de Lotes está online!"}

@app.post("/api/upload")
async def handle_upload(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Tipo de arquivo inválido. Por favor, envie um .csv")
    try:
        contents = await file.read()
        string_io = StringIO(contents.decode('utf-8'))
        df = carregar_dados_csv(string_io)
        return df.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar o arquivo: {str(e)}")

@app.post("/api/reajustar")
async def handle_reajuste_preview(payload: ReajustePayload):
    try:
        df_lotes = pd.DataFrame([lote.dict() for lote in payload.lotes])
        df_preview = reajustar_valores(df_lotes, payload.coluna_alvo, payload.operacao, payload.tipo_reajuste, payload.valor_reajuste)
        return df_preview.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro durante o reajuste: {str(e)}")

@app.post("/api/calcular")
async def handle_calculo(payload: CalculoPayload):
    try:
        df_lotes = pd.DataFrame([lote.dict() for lote in payload.lotes])
        df_resultado = calcular_mensais(df_lotes, payload.prazo_anos, payload.taxa_juros_anual)
        return df_resultado.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro durante o cálculo: {str(e)}")

@app.post("/api/download_csv")
async def handle_download(payload: CalculoPayload):
    try:
        df_lotes = pd.DataFrame([lote.dict() for lote in payload.lotes])
        df_resultado = calcular_mensais(df_lotes, payload.prazo_anos, payload.taxa_juros_anual)
        df_formatado = formatar_dataframe_para_csv(df_resultado)
        
        stream = BytesIO()
        df_formatado.to_csv(stream, index=False, sep=';', encoding='utf-8-sig')
        stream.seek(0)
        
        response = StreamingResponse(stream, media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename=precificacao_calculada_{payload.prazo_anos}anos_{payload.taxa_juros_anual}juros.csv"
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar o CSV: {str(e)}")