# 🤖 Sistema de Machine Learning - Catalogador BTC/USDT

Sistema completo de predição de direção BTC/USDT usando Machine Learning (LightGBM) integrado ao catalogador de candles.

---

## 📋 Índice

1. [Arquitetura](#arquitetura)
2. [Instalação](#instalação)
3. [Configuração](#configuração)
4. [Uso](#uso)
5. [API Reference](#api-reference)
6. [Fluxo de Dados](#fluxo-de-dados)
7. [Monitoramento](#monitoramento)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         │ HTTP
         ↓
┌─────────────────┐     ┌──────────────────┐
│  Backend Node   │────→│  ML Server       │
│  (Express)      │     │  (FastAPI)       │
│                 │     │                  │
│  - Scheduler    │     │  - LightGBM      │
│  - Features     │     │  - Predictions   │
│  - Feedback     │     └──────────────────┘
└────────┬────────┘
         │
         │ PostgreSQL
         ↓
┌─────────────────┐
│   Supabase      │
│                 │
│  - candles      │
│  - model_trades │
│  - model_runs   │
└─────────────────┘
```

---

## 💻 Instalação

### 1. Backend (Node.js)

```bash
cd backend
npm install
```

### 2. ML Server (Python)

```bash
cd ml
pip install -r requirements.txt
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto `backend/`:

```env
# Supabase
SUPABASE_URL=https://lgddsslskhzxtpjathjr.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Backend
BACKEND_PORT=3001
MODEL_SERVER_URL=http://localhost:8000
TRADE_CONFIDENCE_THRESHOLD=0.70

# ML
NODE_ENV=development
```

Para Python (`ml/.env`):

```env
SUPABASE_URL=https://lgddsslskhzxtpjathjr.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
MODEL_PATH=./models/latest_model.joblib
ML_SERVER_PORT=8000
```

---

## 🚀 Uso

### Passo 1: Treinar o Modelo

```bash
cd ml
python train.py
```

**Saída esperada:**
```
🚀 ========================================
   TREINAMENTO DO MODELO ML
   ========================================

📊 Carregando últimos 10000 candles...
✅ 10000 candles carregados
🔨 Construindo dataset com lookback=30...
✅ Dataset construído: 9969 amostras, 35 features
📊 Distribuição de classes: UP=5124, DOWN=4845

🤖 Treinando modelo...
📊 Train: 7975 | Test: 1994

📊 RESULTADOS:
   Train Accuracy: 85.23%
   Test Accuracy: 72.41%

✅ Modelo salvo!
✅ Modelo registrado no Supabase
```

### Passo 2: Iniciar ML Server

```bash
cd ml
python serve.py
```

**Servidor rodará em:** `http://localhost:8000`

### Passo 3: Iniciar Backend

```bash
cd backend
npm start
```

**Servidor rodará em:** `http://localhost:3001`

### Passo 4: Iniciar Frontend

```bash
npm run dev
```

**Frontend rodará em:** `http://localhost:3000`

---

## 📡 API Reference

### Backend Endpoints

#### POST /api/predict
Solicita predição ao modelo ML

**Request:**
```json
{
  "features": {
    "last_close": 97234.56,
    "mean_return_10": 0.0023,
    "rsi_14": 65.4,
    ...
  }
}
```

**Response:**
```json
{
  "direction": "UP",
  "confidence": 0.7234,
  "model_version": "20250129_143052",
  "timestamp": "2025-01-29T14:30:52.123Z"
}
```

#### POST /api/trade
Registra um novo trade

**Request:**
```json
{
  "symbol": "BTCUSDT",
  "entry_time": "2025-01-29T14:30:00Z",
  "entry_price": 97234.56,
  "predicted_direction": "UP",
  "predicted_confidence": 0.7234,
  "features": {...},
  "model_version": "20250129_143052"
}
```

#### POST /api/feedback
Atualiza resultado de um trade

**Request:**
```json
{
  "trade_id": 123,
  "exit_price": 97456.78,
  "exit_time": "2025-01-29T14:33:00Z"
}
```

#### GET /api/model/status
Retorna métricas do modelo

**Response:**
```json
{
  "rolling_accuracy": 0.7241,
  "accuracy_24h": 0.7513,
  "total_trades": 452,
  "wins": 327,
  "losses": 125,
  "max_win_streak": 12,
  "avg_win_streak": 3.4,
  "recent": [...]
}
```

### ML Server Endpoints

#### GET /
Health check

#### POST /predict
Predição de direção

#### POST /reload
Recarregar modelo após retreinamento

---

## 🔄 Fluxo de Dados

### 1. Coleta de Candles (Contínuo)
```
Binance API → BTCCollector → Supabase (candles)
```

### 2. Ciclo de Predição (A cada 3 minutos)
```
Scheduler → Feature Extractor → ML Server → Predição
    ↓
Se confiança >= 70% → Registrar trade (PENDING)
```

### 3. Feedback Automático (A cada 1 minuto)
```
Verificar trades PENDING → Buscar preço de saída → Calcular resultado
    ↓
Atualizar trade (WIN/LOSS)
```

### 4. Retreinamento (Manual)
```
python ml/train.py → Novo modelo → joblib → model_runs
    ↓
POST /reload → ML Server recarrega modelo
```

---

## 📊 Monitoramento

### Métricas Principais

1. **Acurácia Geral (Rolling)**: Baseada nos últimos 500 trades
2. **Acurácia 24h**: Performance nas últimas 24 horas
3. **Sequência Máxima de Wins**: Melhor sequência consecutiva
4. **Distribuição de Trades**: UP vs DOWN

### Dashboard

Acesse: `http://localhost:3000`

O frontend mostra:
- Gráfico de candles em tempo real
- Métricas do modelo ML
- Últimos trades e resultados
- Performance das estratégias

---

## 🐛 Troubleshooting

### Problema: "Modelo não carregado"

**Solução:**
```bash
cd ml
python train.py  # Treinar modelo primeiro
python serve.py  # Depois iniciar servidor
```

### Problema: "Erro ao chamar modelo"

**Causa:** ML Server não está rodando

**Solução:**
```bash
cd ml
python serve.py
```

Verifique: `http://localhost:8000/health`

### Problema: "Features insuficientes"

**Causa:** Não há candles suficientes no banco

**Solução:**
1. Certifique-se de que o catalogador está coletando
2. Aguarde pelo menos 30 candles (30 minutos no timeframe 1m)
3. Verifique no Supabase: `SELECT COUNT(*) FROM candles;`

### Problema: "Confiança sempre abaixo do threshold"

**Causa:** Modelo pode estar com baixa confiança

**Ajuste o threshold:**
```env
TRADE_CONFIDENCE_THRESHOLD=0.60  # Reduzir de 0.70 para 0.60
```

### Problema: "Acurácia muito baixa (<55%)"

**Ações:**
1. Coletar mais dados (mínimo 10.000 candles)
2. Ajustar hiperparâmetros do modelo
3. Adicionar mais features técnicas
4. Verificar distribuição de classes (deve estar balanceada)

---

## 🎯 Próximos Passos

1. **Walk-Forward Validation**: Implementar retreinamento incremental
2. **Feature Engineering**: Adicionar mais indicadores técnicos
3. **Ensemble Methods**: Combinar múltiplos modelos
4. **Real-time WebSocket**: Predições em tempo real
5. **Alertas**: Notificações quando confiança > 90%
6. **Backtesting**: Sistema de teste histórico

---

## 📚 Recursos

- **LightGBM**: https://lightgbm.readthedocs.io/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Supabase**: https://supabase.com/docs
- **Binance API**: https://binance-docs.github.io/apidocs/

---

## ⚠️ Avisos Importantes

1. **Não use em produção real sem validação extensiva**
2. **Acurácia de 97% é extremamente rara - seja realista**
3. **Monitore overfitting constantemente**
4. **Use apenas para paper trading/educação**
5. **Nunca invista mais do que pode perder**

---

**Desenvolvido para fins educacionais e de pesquisa** 🎓

