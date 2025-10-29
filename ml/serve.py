"""
Servidor FastAPI para servir o modelo ML
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import os
import numpy as np
from datetime import datetime
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

MODEL_PATH = os.getenv('MODEL_PATH', './models/latest_model.joblib')

app = FastAPI(
    title="BTC Prediction API",
    description="API para predições de direção BTC/USDT",
    version="1.0.0"
)

# Carregar modelo
model_artifact = None
model = None
columns = []
version = "not_loaded"

try:
    if os.path.exists(MODEL_PATH):
        model_artifact = joblib.load(MODEL_PATH)
        model = model_artifact['model']
        columns = model_artifact.get('columns', [])
        version = model_artifact.get('trained_at', 'v0')
        print(f"✅ Modelo carregado: {version}")
        print(f"📊 Features esperadas: {len(columns)}")
    else:
        print(f"⚠️ Modelo não encontrado em {MODEL_PATH}")
        print("⚠️ Execute python ml/train.py primeiro para treinar o modelo")
except Exception as e:
    print(f"❌ Erro ao carregar modelo: {e}")


class PredictionRequest(BaseModel):
    features: Dict[str, Any]


class PredictionResponse(BaseModel):
    direction: str
    confidence: float
    model_version: str
    timestamp: str


@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "online",
        "model_loaded": model is not None,
        "model_version": version,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health():
    """Health check detalhado"""
    return {
        "status": "healthy" if model is not None else "no_model",
        "model_path": MODEL_PATH,
        "model_loaded": model is not None,
        "features_count": len(columns),
        "version": version
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predição de direção do BTC
    
    Args:
        request: Features extraídas dos candles
    
    Returns:
        Direção (UP/DOWN), confiança e versão do modelo
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo não carregado. Execute python ml/train.py para treinar."
        )
    
    try:
        features = request.features
        
        # Construir array de features na ordem correta
        x = []
        for col in columns:
            value = features.get(col, 0)
            # Converter para float
            if isinstance(value, (int, float)):
                x.append(float(value))
            else:
                x.append(0.0)
        
        # Predição
        x_array = np.array([x])
        proba = model.predict_proba(x_array)[0]
        
        # Classe 1 = UP, Classe 0 = DOWN
        confidence = float(proba[1])
        direction = 'UP' if confidence >= 0.5 else 'DOWN'
        
        print(f"📊 Predição: {direction} ({confidence*100:.2f}%)")
        
        return PredictionResponse(
            direction=direction,
            confidence=confidence,
            model_version=version,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        print(f"❌ Erro na predição: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reload")
async def reload_model():
    """Recarregar modelo (útil após retreinamento)"""
    global model, model_artifact, columns, version
    
    try:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(status_code=404, detail="Modelo não encontrado")
        
        model_artifact = joblib.load(MODEL_PATH)
        model = model_artifact['model']
        columns = model_artifact.get('columns', [])
        version = model_artifact.get('trained_at', 'v0')
        
        print(f"✅ Modelo recarregado: {version}")
        
        return {
            "ok": True,
            "version": version,
            "features_count": len(columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    import uvicorn
    
    port = int(os.getenv('ML_SERVER_PORT', 8000))
    
    print("🚀 ========================================")
    print(f"   Servidor ML iniciando na porta {port}")
    print("   ========================================")
    
    uvicorn.run(app, host='0.0.0.0', port=port)

