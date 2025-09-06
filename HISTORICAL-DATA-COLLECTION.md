# 📊 Coleta de Dados Históricos

Este script coleta dados históricos de mais 2 meses (Outubro e Novembro 2025) e adiciona na tabela `historical_candle_data` do Supabase.

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
npm install @supabase/supabase-js
```

### 2. Executar o Script
```bash
node collect-historical-data.js
```

## 📋 O que o Script Faz

- **Coleta dados** da Binance API para SOLUSDT
- **Timeframes**: 1m, 5m, 15m
- **Períodos**: Outubro 2025 e Novembro 2025
- **Salva** na tabela `historical_candle_data`
- **Não interfere** no projeto principal

## 📊 Dados Coletados

- **Outubro 2025**: 31 dias
- **Novembro 2025**: 30 dias
- **Total**: 61 dias de dados históricos

### Estimativa de Candles:
- **1m**: ~87,840 candles (61 dias × 24h × 60min)
- **5m**: ~17,568 candles (61 dias × 24h × 12 períodos)
- **15m**: ~5,856 candles (61 dias × 24h × 4 períodos)

## ⚠️ Importante

- O script é **independente** do projeto principal
- **Não altera** nenhum arquivo do projeto
- **Adiciona apenas** dados na tabela histórica
- **Pode ser executado** quantas vezes quiser (usa upsert)

## 🔧 Configuração

As credenciais do Supabase já estão configuradas no script. Se necessário, altere:

```javascript
const supabaseUrl = 'SUA_URL_AQUI'
const supabaseKey = 'SUA_CHAVE_AQUI'
```

## 📈 Monitoramento

O script mostra logs detalhados:
- ✅ Candles coletados
- 💾 Dados salvos
- ❌ Erros (se houver)
- 📊 Total final

## 🎯 Resultado

Após a execução, você terá dados históricos adicionais para análise na aba "Análise Histórica" do projeto principal.
