# 🚀 Instruções de Deploy - Sistema de IA para Trading

## 📋 **Variáveis de Ambiente para Vercel**

Configure as seguintes variáveis de ambiente no painel do Vercel:

### 🔧 **Configurações Obrigatórias**

```env
# Supabase Configuration
SUPABASE_URL=https://lgddsslskhzxtpjathjr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws

# APIs Externas
BINANCE_API_URL=https://api.binance.com/api/v3
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Configurações do Sistema
COLLECTION_INTERVAL=60000
SIGNAL_CONFIDENCE_THRESHOLD=85
MAX_CONCURRENT_PAIRS=10
PULLBACK_ANALYSIS_DEPTH=20

# Pares para Análise
TRADING_PAIRS=SOLUSDT,ETHUSDT,BTCUSDT,ADAUSDT,DOGEUSDT

# Configurações de IA
AI_LEARNING_RATE=0.01
AI_EPOCHS=100
AI_BATCH_SIZE=32
```

## 🎯 **Passos para Deploy**

### 1. **Configurar Vercel**
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "New Project"
4. Importe o repositório `https://github.com/BR24666/revelaacor.git`

### 2. **Configurar Variáveis de Ambiente**
1. No painel do projeto, vá em "Settings" → "Environment Variables"
2. Adicione cada variável listada acima
3. Certifique-se de que todas estão marcadas para "Production"

### 3. **Configurar Build Settings**
- **Framework Preset**: Other
- **Build Command**: `npm install`
- **Output Directory**: `src`
- **Install Command**: `npm install`

### 4. **Deploy**
1. Clique em "Deploy"
2. Aguarde o build completar
3. Acesse a URL fornecida pelo Vercel

## 🗄️ **Banco de Dados Supabase**

### ✅ **Tabelas Criadas**
As seguintes tabelas foram criadas automaticamente:
- `market_data` - Dados de mercado
- `trading_signals` - Sinais gerados
- `system_performance` - Métricas de performance
- `ai_training_data` - Dados de treinamento
- `system_config` - Configurações do sistema

### 📊 **Índices de Performance**
- `idx_market_data_pair_timestamp`
- `idx_trading_signals_pair_timestamp`
- `idx_system_performance_date_pair`
- `idx_ai_training_data_pair_created`

## 🔧 **Configurações Avançadas**

### **Ajustar Confiança Mínima**
```env
SIGNAL_CONFIDENCE_THRESHOLD=90  # 90% de confiança mínima
```

### **Adicionar Novos Pares**
```env
TRADING_PAIRS=SOLUSDT,ETHUSDT,BTCUSDT,ADAUSDT,DOGEUSDT,MATICUSDT
```

### **Modificar Intervalo de Coleta**
```env
COLLECTION_INTERVAL=30000  # 30 segundos
```

## 📈 **Monitoramento**

### **Logs do Sistema**
- Acesse o painel do Vercel → "Functions" → "View Function Logs"
- Monitore os logs para verificar funcionamento

### **Métricas de Performance**
- Acesse o Supabase → "Table Editor"
- Verifique as tabelas `system_performance` e `trading_signals`

## 🚨 **Troubleshooting**

### **Erro de Build**
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme se o Node.js está na versão 16+

### **Erro de Conexão com Supabase**
- Verifique se as credenciais estão corretas
- Confirme se as tabelas foram criadas

### **Erro de API Externa**
- Verifique se as URLs das APIs estão corretas
- Confirme se não há rate limiting

## 🎯 **URLs Importantes**

- **Repositório**: https://github.com/BR24666/revelaacor.git
- **Supabase**: https://lgddsslskhzxtpjathjr.supabase.co
- **Vercel**: [Sua URL será fornecida após o deploy]

## 📞 **Suporte**

Para problemas:
1. Verifique os logs do Vercel
2. Confirme as variáveis de ambiente
3. Teste localmente com `npm test`
4. Verifique a conectividade com Supabase

---

**Sistema configurado para máxima acertividade na previsão de cor da próxima vela!** 🎯✨