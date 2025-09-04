# Arquivo: backend/models/schemas.py (VERSÃO FINAL E COMPLETA)

from pydantic import BaseModel
from typing import List

# Define a estrutura de um único lote
class Lote(BaseModel):
    ETAPA: str
    BLOCO: str
    UNIDADE: str
    VALOR_A_VISTA: float
    ENTRADA: float

# Define a estrutura dos dados para a rota de CÁLCULO
class CalculoPayload(BaseModel):
    lotes: List[Lote]
    prazo_anos: int
    taxa_juros_anual: float

# --- A CLASSE QUE ESTAVA FALTANDO ---
# Define a estrutura dos dados para a rota de REAJUSTE
class ReajustePayload(BaseModel):
    lotes: List[Lote]
    coluna_alvo: str
    operacao: str
    tipo_reajuste: str
    valor_reajuste: float