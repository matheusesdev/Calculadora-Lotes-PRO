# Arquivo: backend/models/schemas.py (VERSÃO COM ETAPA OPCIONAL)

from pydantic import BaseModel
from typing import List, Optional # 1. Importar Optional

# Define a estrutura de um único lote
class Lote(BaseModel):
    # --- ALTERAÇÃO AQUI ---
    ETAPA: Optional[str] = None # 2. Marcar como opcional e com valor padrão None
    # --- FIM DA ALTERAÇÃO ---
    
    BLOCO: str
    UNIDADE: str
    VALOR_A_VISTA: float
    ENTRADA: float

# Define a estrutura dos dados para a rota de CÁLCULO
class CalculoPayload(BaseModel):
    lotes: List[Lote]
    prazo_anos: int
    taxa_juros_anual: float

# Define a estrutura dos dados para a rota de REAJUSTE
class ReajustePayload(BaseModel):
    lotes: List[Lote]
    coluna_alvo: str
    operacao: str
    tipo_reajuste: str
    valor_reajuste: float