# 🚀 Guia de Deploy - AI Trading System

## 📋 Pré-requisitos
- ✅ Conta no Vercel (https://vercel.com)
- ✅ Conta no Supabase (https://supabase.com)
- ✅ Repositório GitHub: https://github.com/BR24666/revelaacor.git

## 🔧 Configuração do Supabase

### 1. Criar Projeto no Supabase
1. Acesse https://supabase.com
2. Clique em "New Project"
3. Escolha sua organização
4. Nome do projeto: `ai-trading-system`
5. Senha do banco: (escolha uma senha forte)
6. Região: escolha a mais próxima do Brasil

### 2. Executar Script SQL
1. No painel do Supabase, vá em "SQL Editor"
2. Cole o conteúdo do arquivo `setup-database.sql`
3. Clique em "Run" para executar

### 3. Obter Credenciais
1. Vá em "Settings" > "API"
2. Copie:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)

## 🚀 Deploy no Vercel

### 1. Conectar Repositório
1. Acesse https://vercel.com
2. Clique em "New Project"
3. Conecte sua conta GitHub
4. Importe: `https://github.com/BR24666/revelaacor.git`

### 2. Configurar Variáveis de Ambiente
No painel do Vercel, vá em "Environment Variables" e adicione:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
BINANCE_API_URL=https://api.binance.com/api/v3
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COLLECTION_INTERVAL=60000
SIGNAL_CONFIDENCE_THRESHOLD=0.8
TRADING_PAIRS=["SOLUSDT","BTCUSDT","ETHUSDT"]
```

### 3. Configurações de Deploy
- **Framework Preset**: Other
- **Build Command**: `npm install`
- **Output Directory**: `.`
- **Install Command**: `npm install`

### 4. Deploy
1. Clique em "Deploy"
2. Aguarde o processo (2-3 minutos)
3. Acesse a URL fornecida

## 🔍 Verificação Pós-Deploy

### 1. Testar Endpoints
```bash
# Testar coleta de dados
GET https://sua-app.vercel.app/api/collect

# Testar análise de IA
GET https://sua-app.vercel.app/api/analyze

# Testar geração de sinais
GET https://sua-app.vercel.app/api/signals
```

### 2. Verificar Logs
1. No Vercel, vá em "Functions"
2. Clique na função
3. Verifique os logs para erros

### 3. Monitorar Supabase
1. No Supabase, vá em "Table Editor"
2. Verifique se as tabelas foram criadas:
   - `market_data`
   - `trade_signals`
   - `trade_simulations`

## 🛠️ Comandos Úteis

### Desenvolvimento Local
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Testar sistema
npm test

# Configurar banco
npm run setup-db
```

### Deploy Manual
```bash
# Build
npm run build

# Deploy via Vercel CLI
vercel --prod
```

## 📊 Monitoramento

### 1. Vercel Analytics
- Acesse o painel do Vercel
- Vá em "Analytics" para ver métricas

### 2. Supabase Dashboard
- Monitore uso do banco
- Verifique logs de queries
- Acompanhe performance

### 3. Logs de Aplicação
- Vercel Functions > Logs
- Supabase > Logs

## 🔧 Troubleshooting

### Erro: "Module not found"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente

### Erro: "Database connection failed"
- Verifique as variáveis de ambiente
- Confirme se o script SQL foi executado

### Erro: "API rate limit"
- Ajuste `COLLECTION_INTERVAL` para um valor maior
- Implemente retry logic

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Vercel
2. Confirme as variáveis de ambiente
3. Teste localmente primeiro
4. Verifique a documentação do Supabase

---

**🎯 Objetivo**: Sistema de IA que prevê a cor da próxima vela para trading na Ebinex com 100% de acurácia!
