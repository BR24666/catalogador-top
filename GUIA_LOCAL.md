# 🖥️ GUIA PARA RODAR LOCALMENTE

Siga este guia passo a passo para rodar o sistema ML completo na sua máquina.

---

## ✅ PASSO 1: VERIFICAR PRÉ-REQUISITOS

### 1.1 Node.js
Abra o terminal e digite:
```bash
node --version
```

**Deve retornar:** `v18.x.x` ou superior

❌ **Se não tiver**, baixe em: https://nodejs.org/ (escolha a versão LTS)

### 1.2 Python
```bash
python --version
```

**Deve retornar:** `Python 3.9.x` ou superior

❌ **Se não tiver**, baixe em: https://www.python.org/downloads/

---

## 📦 PASSO 2: INSTALAR DEPENDÊNCIAS

### 2.1 Configurar ambiente (EXECUTE PRIMEIRO)

Clique 2x no arquivo:
```
setup-env.bat
```

Isso criará os arquivos `.env` necessários automaticamente.

### 2.2 Instalar dependências do Frontend
```bash
npm install
```

### 2.3 Instalar dependências do Backend
```bash
cd backend
npm install
cd ..
```

### 2.4 Instalar dependências do ML
```bash
cd ml
pip install -r requirements.txt
cd ..
```

**Se der erro**, tente:
```bash
python -m pip install -r requirements.txt
```

---

## 🤖 PASSO 3: TREINAR O MODELO (IMPORTANTE!)

Antes de iniciar o sistema, você precisa treinar o modelo:

```bash
cd ml
python train.py
```

**Aguarde a mensagem:**
```
✅ TREINAMENTO CONCLUÍDO!
   Test Accuracy: XX.XX%
   Modelo: ./models/latest_model.joblib
```

Isso pode levar de **2 a 5 minutos** dependendo da quantidade de dados no banco.

---

## 🚀 PASSO 4: INICIAR O SISTEMA

### OPÇÃO A: Automático (Recomendado)

Clique 2x no arquivo:
```
START_ML_SYSTEM.bat
```

Isso abrirá **3 terminais automaticamente**:
- 🐍 ML Server (Python FastAPI)
- 🟢 Backend (Node.js Express)
- ⚛️ Frontend (Next.js)

### OPÇÃO B: Manual (3 terminais separados)

#### Terminal 1: ML Server
```bash
cd ml
python serve.py
```

**Aguarde:**
```
🚀 Servidor ML iniciando na porta 8000
INFO: Uvicorn running on http://0.0.0.0:8000
```

#### Terminal 2: Backend
```bash
cd backend
npm start
```

**Aguarde:**
```
🚀 Backend ML rodando na porta 3001
⏰ Scheduler iniciado (a cada 3 minutos)
```

#### Terminal 3: Frontend
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

## 🌐 PASSO 5: ACESSAR O SISTEMA

Abra seu navegador em:

### **http://localhost:3000**

Você verá:

1. **Catalogador de Velas** 
   - Gráfico em tempo real
   - Últimas 60 velas
   - Vela atual "em formação"

2. **Métricas do Modelo ML**
   - Acurácia geral
   - Acurácia 24h
   - Total de trades
   - Wins/Losses
   - Sequência máxima

3. **Performance das Estratégias**
   - MHI
   - Três Soldados Brancos
   - Minoria
   - Vela de Força

---

## 🔍 PASSO 6: VERIFICAR SE ESTÁ FUNCIONANDO

### 6.1 Verificar ML Server
Abra em outra aba:
```
http://localhost:8000
```

Deve retornar:
```json
{
  "status": "online",
  "model_loaded": true,
  "model_version": "..."
}
```

### 6.2 Verificar Backend
```
http://localhost:3001/health
```

Deve retornar:
```json
{
  "ok": true,
  "timestamp": "..."
}
```

### 6.3 Verificar Status do Modelo
```
http://localhost:3001/api/model/status
```

Deve retornar:
```json
{
  "rolling_accuracy": 0.72,
  "total_trades": 15,
  "wins": 11,
  "losses": 4,
  ...
}
```

---

## 📊 O QUE ACONTECE AUTOMATICAMENTE

### A cada 3 minutos:
1. Backend extrai 35+ features dos últimos 60 candles
2. Envia para ML Server
3. Recebe predição (UP/DOWN) + confiança
4. Se confiança ≥ 70%, registra trade como PENDING

### A cada 1 minuto:
1. Sistema verifica trades PENDING
2. Se passaram 3 minutos, busca preço de saída
3. Calcula resultado (WIN/LOSS)
4. Atualiza no banco

### No Frontend:
1. Atualiza velas a cada 5 segundos
2. Atualiza métricas ML a cada 30 segundos
3. Mostra trades em tempo real

---

## 🐛 PROBLEMAS COMUNS

### Problema 1: "Modelo não carregado"

**Causa:** Modelo não foi treinado

**Solução:**
```bash
cd ml
python train.py
```

### Problema 2: "ModuleNotFoundError: No module named 'lightgbm'"

**Causa:** Dependências Python não instaladas

**Solução:**
```bash
cd ml
pip install -r requirements.txt
```

### Problema 3: "Port 3000 already in use"

**Causa:** Porta já está em uso

**Solução:**
```bash
# Parar processo na porta 3000
npx kill-port 3000

# Ou usar outra porta
PORT=3002 npm run dev
```

### Problema 4: "Cannot find module '@supabase/supabase-js'"

**Causa:** Dependências Node não instaladas

**Solução:**
```bash
npm install
cd backend
npm install
```

### Problema 5: "Features insuficientes"

**Causa:** Não há candles suficientes no banco

**Solução:**
1. Aguarde o catalogador coletar pelo menos 30 candles (30 minutos)
2. Ou ajuste o código para usar menos candles no lookback

### Problema 6: "Confiança sempre < 70%"

**Causa:** Modelo com baixa confiança nas predições

**Solução:**
Edite `backend/.env` e reduza o threshold:
```env
TRADE_CONFIDENCE_THRESHOLD=0.60
```

---

## 📈 MONITORAMENTO

### Logs do ML Server (Terminal 1)
```
✅ Modelo carregado: 20250129_143052
📊 Features esperadas: 35
📊 Predição: UP (72.34%)
```

### Logs do Backend (Terminal 2)
```
🔄 ===== CICLO DE PREDIÇÃO INICIADO =====
📊 Extraindo features para BTCUSDT...
✅ Features extraídas: 35 indicadores
🤖 Solicitando predição ao modelo ML...
📊 Predição: UP | Confiança: 72.34%
✅ Trade registrado! ID: 123
===== CICLO CONCLUÍDO =====
```

### Logs do Feedback (Terminal 2)
```
🔍 Verificando 5 trades pendentes...
✅ Trade #121 fechado: WIN (UP)
✅ Trade #122 fechado: LOSS (DOWN)
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Aguarde 1 hora** para coleta de dados
2. **Monitore a acurácia** no dashboard
3. **Se acurácia < 60%**, retreine com mais dados:
   ```bash
   cd ml
   python train.py
   ```
4. **Ajuste o threshold** conforme performance
5. **Experimente** com diferentes features e parâmetros

---

## 🛑 PARAR O SISTEMA

### Se usou START_ML_SYSTEM.bat:
Feche os 3 terminais que foram abertos.

### Se iniciou manualmente:
Pressione `Ctrl + C` em cada terminal (3 vezes).

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **ML_README.md** - Documentação técnica completa
- **QUICK_START.md** - Guia rápido
- **README.md** - Visão geral do projeto

---

## 💡 DICAS

1. **Mantenha os 3 terminais abertos** enquanto usar o sistema
2. **Aguarde dados suficientes** antes de avaliar acurácia (mínimo 50 trades)
3. **Retreine periodicamente** com mais dados para melhorar
4. **Monitore overfitting** (se train >> test accuracy)
5. **Use apenas para educação/pesquisa** - não em dinheiro real

---

## ✅ CHECKLIST

- [ ] Node.js 18+ instalado
- [ ] Python 3.9+ instalado
- [ ] Dependências npm instaladas
- [ ] Dependências pip instaladas
- [ ] Arquivos .env configurados (setup-env.bat)
- [ ] Modelo treinado (ml/train.py)
- [ ] ML Server rodando (porta 8000)
- [ ] Backend rodando (porta 3001)
- [ ] Frontend rodando (porta 3000)
- [ ] Dashboard acessível em http://localhost:3000

---

**Sistema pronto para uso! 🚀**

Em caso de dúvidas, verifique os logs nos terminais ou consulte ML_README.md

