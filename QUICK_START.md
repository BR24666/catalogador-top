# ⚡ Quick Start - Sistema ML Catalogador BTC/USDT

Guia rápido para colocar o sistema completo no ar em 10 minutos.

---

## 📦 Pré-requisitos

- **Node.js** 18+ (para backend e frontend)
- **Python** 3.9+ (para ML)
- **Conta Supabase** (banco de dados já configurado)

---

## 🚀 Instalação Rápida

### 1. Clone e instale dependências

```bash
# Frontend (já existente)
npm install

# Backend
cd backend
npm install
cd ..

# ML
cd ml
pip install -r requirements.txt
cd ..
```

### 2. Configure variáveis de ambiente

**Backend** (`backend/.env`):
```env
SUPABASE_URL=https://lgddsslskhzxtpjathjr.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJI...
BACKEND_PORT=3001
MODEL_SERVER_URL=http://localhost:8000
TRADE_CONFIDENCE_THRESHOLD=0.70
```

**ML** (`ml/.env`):
```env
SUPABASE_URL=https://lgddsslskhzxtpjathjr.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJI...
MODEL_PATH=./models/latest_model.joblib
ML_SERVER_PORT=8000
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://lgddsslskhzxtpjathjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

### 3. Preparar banco de dados

As tabelas `model_trades`, `model_runs` e `generated_signals` **já foram criadas** via migração Supabase.

Verifique no SQL Editor:
```sql
SELECT COUNT(*) FROM model_trades;
SELECT COUNT(*) FROM model_runs;
SELECT COUNT(*) FROM candles;
```

### 4. Treinar o modelo (IMPORTANTE)

```bash
cd ml
python train.py
```

**Aguarde a mensagem:**
```
✅ Treinamento concluído!
   Test Accuracy: 72.41%
   Modelo: ./models/latest_model.joblib
```

---

## 🎯 Iniciar o Sistema

Abra **3 terminais diferentes**:

### Terminal 1: ML Server

```bash
cd ml
python serve.py
```

**Aguarde:**
```
🚀 Servidor ML iniciando na porta 8000
```

### Terminal 2: Backend

```bash
cd backend
npm start
```

**Aguarde:**
```
🚀 Backend ML rodando na porta 3001
✅ Job de predição: a cada 3 minutos
✅ Job de feedback: a cada 1 minuto
```

### Terminal 3: Frontend

```bash
npm run dev
```

**Aguarde:**
```
▲ Next.js 14.0.4
✓ Ready in 2.3s
○ Local: http://localhost:3000
```

---

## ✅ Verificar se está funcionando

### 1. Health checks

```bash
# ML Server
curl http://localhost:8000/health

# Backend
curl http://localhost:3001/health

# Frontend
open http://localhost:3000
```

### 2. Testar predição manual

```bash
curl -X POST http://localhost:3001/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "last_close": 97234.56,
      "mean_return_10": 0.0023,
      "rsi_14": 65.4,
      "hour": 14,
      "weekday": 2
    }
  }'
```

**Resposta esperada:**
```json
{
  "direction": "UP",
  "confidence": 0.7234,
  "model_version": "20250129_143052"
}
```

### 3. Verificar status do modelo

```bash
curl http://localhost:3001/api/model/status
```

---

## 📊 Acompanhar o Sistema

### Frontend Dashboard

Acesse: **http://localhost:3000**

Você verá:
1. **Gráfico de Candles** em tempo real
2. **Métricas do Modelo ML**:
   - Acurácia geral
   - Acurácia 24h
   - Total de trades
   - Últimos trades e resultados
3. **Performance das Estratégias** (MHI, Três Soldados, etc)

### Logs do Backend

O backend mostrará a cada 3 minutos:

```
🔄 ===== CICLO DE PREDIÇÃO INICIADO =====
📊 Extraindo features para BTCUSDT...
✅ Features extraídas: 35 indicadores
🤖 Solicitando predição ao modelo ML...
📊 Predição: UP | Confiança: 72.34% | Versão: 20250129_143052
✅ Trade registrado! ID: 123
===== CICLO CONCLUÍDO =====
```

### Feedback Automático

A cada 1 minuto, o sistema verifica trades pendentes:

```
🔍 Verificando 5 trades pendentes...
✅ Trade #121 fechado: WIN (UP)
✅ Trade #122 fechado: LOSS (DOWN)
```

---

## 🎯 O Que Acontece Automaticamente

1. **A cada 3 minutos**:
   - Extrai features dos últimos 60 candles
   - Solicita predição ao modelo
   - Se confiança ≥ 70%, registra um trade PENDING

2. **A cada 1 minuto**:
   - Verifica trades PENDING
   - Se passaram 3 minutos desde a entrada, busca preço de saída
   - Atualiza resultado (WIN/LOSS)

3. **Continuamente**:
   - Frontend atualiza a cada 5 segundos
   - Métricas ML recalculadas a cada 30 segundos

---

## 🐛 Problemas Comuns

### "Modelo não carregado"

**Solução:**
```bash
cd ml
python train.py
```

### "Erro ao chamar modelo"

**Verifique se ML Server está rodando:**
```bash
curl http://localhost:8000/health
```

### "Features insuficientes"

**Aguarde o catalogador coletar pelo menos 30 candles:**
```sql
SELECT COUNT(*) FROM candles WHERE timestamp > NOW() - INTERVAL '1 hour';
```

### "Nenhum trade sendo criado"

**Possíveis causas:**
1. Confiança sempre < 70% → Reduza threshold para 0.60
2. ML Server offline → Verifique logs
3. Scheduler não iniciou → Reinicie backend

---

## 📈 Próximos Passos

1. Aguarde pelo menos 1 hora de coleta
2. Monitore acurácia no dashboard
3. Se acurácia < 60%, retreine o modelo com mais dados
4. Ajuste threshold conforme performance

---

## 🎓 Para Aprender Mais

Leia: **ML_README.md** para documentação completa

---

**Sistema pronto para uso! 🚀**

