from pydantic import BaseModel
from typing import List, Optional

class Lote(BaseModel):
    ETAPA: Optional[str] = None
    BLOCO: str
    UNIDADE: str
    VALOR_A_VISTA: float
    ENTRADA: float

class CalculoPayload(BaseModel):
    lotes: List[Lote]
    prazo_anos: int
    taxa_juros_anual: float

class ReajustePayload(BaseModel):
    lotes: List[Lote]
    coluna_alvo: str
    operacao: str
    tipo_reajuste: str
    valor_reajuste: float