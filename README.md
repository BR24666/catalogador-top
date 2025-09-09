# 🎯 CATALOGADOR PROBABILÍSTICO

Sistema especializado em análise probabilística de velas para identificação de **ciclos de acertividade** e **oportunidades de "surfar a onda"** das estratégias de trading.

## 🎯 OBJETIVO

Identificar **padrões temporais** e **ciclos de repetição** nas estratégias probabilísticas para detectar quando uma estratégia atinge **100% de acertividade** e quantas **repetições mínimas** são necessárias para "surfar essa onda".

## 📊 ESTRATÉGIAS ANALISADAS

### 1. **MHI (Maioria, H, Invertida)**
- Após três velas, a quarta tende a seguir a cor da maioria
- Ex: Verde, Vermelha, Verde → Maioria Verde → Entrada Call

### 2. **Estratégia da Minoria**
- Aposta na reversão da cor minoritária
- Ex: Verde, Verde, Vermelha → Minoria Vermelha → Entrada Put

### 3. **Três Soldados Brancos / Três Corvos Negros**
- Três velas consecutivas da mesma cor indicam tendência forte
- Entrada na quarta vela seguindo a tendência

### 4. **Padrão 2x2 (Alternância de Cores)**
- Duas velas de uma cor seguidas por duas de outra
- Ex: Verde, Verde, Vermelha, Vermelha → Entrada na 5ª vela

### 5. **Vela de Força Pós-Sequência**
- Após sequência de velas iguais, primeira vela oposta com corpo grande
- Indica reversão com continuidade

### 6. **Engolfo de Cor Única**
- Vela que engolfa completamente a anterior de cor oposta
- Sinaliza forte reversão

### 7. **Primeira Vela do Quadrante (M5)**
- Analisa cor da primeira vela de quadrante de 5 minutos
- Opera nas velas seguintes dentro do mesmo quadrante

### 8. **Reversão Pós-Doji**
- Doji indica indecisão
- Cor da vela seguinte sinaliza direção

### 9. **Sequência Ímpar**
- Opera contra sequências de 3, 5, 7 velas iguais
- Aposta na reversão no próximo número ímpar

### 10. **Três Vales / Três Picos**
- Padrões de reversão com análise de pavios
- Identifica exaustão de movimento

## 🚀 INSTALAÇÃO E CONFIGURAÇÃO

### 1. **Instalar Dependências**
```bash
npm install
```

### 2. **Configurar Variáveis de Ambiente**
Criar arquivo `.env`:
```env
SUPABASE_URL=https://lgddsslskhzxtpjathjr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws
```

### 3. **Executar Setup Completo**
```bash
npm run setup
```

## 📈 COLETA DE DADOS HISTÓRICOS

### **Coletar 6 meses de dados históricos**
```bash
npm run collect-historical
```

**O que faz:**
- Coleta 6 meses de dados de cada par (BTC, XRP, SOL, EURUSD)
- Timeframe: 1 minuto
- Fonte: API Binance
- Armazena no Supabase com análise temporal completa

**Tempo estimado:** 2-4 horas (dependendo da velocidade da API)

## 🔄 SISTEMA DE TEMPO REAL

### **Iniciar atualização em tempo real**
```bash
npm run start-realtime
```

**O que faz:**
- Conecta via WebSocket à Binance
- Atualiza dados em tempo real
- Executa análise das 10 estratégias
- Cria alertas de oportunidades
- Identifica ciclos de acertividade

## 🧪 TESTES

### **Executar testes de análise**
```bash
npm test
```

**O que testa:**
- Existência das tabelas
- Inserção das estratégias
- Funções de análise probabilística
- Integração com Supabase

## 📊 ESTRUTURA DO BANCO DE DADOS

### **Tabelas Principais:**

1. **`historical_candles`** - Dados históricos de velas
2. **`accuracy_cycles`** - Ciclos de acertividade identificados
3. **`probabilistic_signals`** - Sinais gerados pelas estratégias
4. **`temporal_patterns`** - Padrões temporais identificados
5. **`probabilistic_strategies`** - Configurações das estratégias
6. **`opportunity_alerts`** - Alertas de oportunidades
7. **`system_config_v2`** - Configurações do sistema

### **Funções Especializadas:**

- `analyze_all_probabilistic_strategies()` - Análise completa
- `detect_wave_surfing_opportunities()` - Detecção de oportunidades
- `get_probabilistic_system_health()` - Status do sistema
- `analyze_mhi_strategy()` - Análise MHI específica
- `analyze_minority_strategy()` - Análise de minoria
- E mais...

## 🎯 COMO USAR

### **1. Coleta Inicial (Uma vez)**
```bash
# Instalar dependências
npm install

# Coletar dados históricos (6 meses)
npm run collect-historical

# Testar sistema
npm test
```

### **2. Operação Contínua**
```bash
# Iniciar sistema de tempo real
npm run start-realtime
```

### **3. Monitoramento**
- Acesse o Supabase Dashboard
- Verifique tabelas `opportunity_alerts` para oportunidades
- Monitore `accuracy_cycles` para ciclos identificados
- Use `get_probabilistic_system_health()` para status

## 📈 ANÁLISE DE RESULTADOS

### **Identificar Oportunidades:**
```sql
-- Buscar oportunidades ativas
SELECT * FROM detect_wave_surfing_opportunities('BTCUSDT', 80.0, 3);

-- Verificar ciclos de acertividade
SELECT * FROM identify_accuracy_cycles('BTCUSDT', '1m', 'MHI_Majority', 85.0, 10);

-- Analisar padrões temporais
SELECT * FROM analyze_temporal_patterns('BTCUSDT', 'MHI_Majority', 30);
```

### **Métricas Importantes:**
- **Confiança**: 0-100% (quanto maior, melhor)
- **Probabilidade de Sucesso**: Baseada em dados históricos
- **Wins Consecutivos**: Quantas vezes seguidas deu certo
- **Padrões Temporais**: Melhor dia/hora para cada estratégia

## 🚨 ALERTAS E OPORTUNIDADES

### **Tipos de Onda:**
- **MEGA_WAVE**: Confiança ≥90% + Acurácia ≥85%
- **BIG_WAVE**: Confiança ≥85% + Acurácia ≥80%
- **MEDIUM_WAVE**: Confiança ≥80% + Acurácia ≥75%
- **SMALL_WAVE**: Demais casos

### **Recomendações:**
- **RIDE_THE_MEGA_WAVE**: Oportunidade máxima
- **RIDE_THE_BIG_WAVE**: Oportunidade alta
- **RIDE_THE_MEDIUM_WAVE**: Oportunidade média
- **CAUTION_SMALL_WAVE**: Cuidado, onda pequena

## 🔧 CONFIGURAÇÕES AVANÇADAS

### **Ajustar Thresholds:**
```sql
-- Atualizar configurações
UPDATE system_config_v2 
SET config_value = '{"min_accuracy": 85, "min_consecutive_wins": 5, "confidence_level": 80}'
WHERE config_key = 'alert_thresholds';
```

### **Adicionar Novos Pares:**
```sql
-- Adicionar par
UPDATE system_config_v2 
SET config_value = '["BTCUSDT", "XRPUSDT", "SOLUSDT", "EURUSD", "ADAUSDT"]'
WHERE config_key = 'trading_pairs';
```

## 📊 DASHBOARD E MONITORAMENTO

### **Status do Sistema:**
```sql
-- Verificar saúde do sistema
SELECT * FROM get_probabilistic_system_health();
```

### **Métricas de Performance:**
```sql
-- Estatísticas de ciclos
SELECT * FROM calculate_cycle_statistics('BTCUSDT', 'MHI_Majority', 30);
```

## 🛠️ TROUBLESHOOTING

### **Problemas Comuns:**

1. **Erro de Conexão Supabase**
   - Verificar chaves de API
   - Verificar URL do projeto

2. **Erro de Rate Limit Binance**
   - Aguardar 1 minuto
   - Verificar conexão de internet

3. **Dados não atualizando**
   - Verificar WebSocket
   - Reiniciar sistema de tempo real

4. **Análises não funcionando**
   - Executar `npm test`
   - Verificar logs de erro

### **Logs e Debug:**
```bash
# Ver logs detalhados
DEBUG=* npm run start-realtime

# Verificar status da coleta
SELECT * FROM get_collection_status();
```

## 📞 SUPORTE

Para problemas ou dúvidas:
1. Verificar logs de erro
2. Executar testes: `npm test`
3. Verificar status: `get_probabilistic_system_health()`
4. Consultar documentação do Supabase

## 🎯 PRÓXIMOS PASSOS

1. **Coletar dados históricos** (6 meses)
2. **Iniciar sistema de tempo real**
3. **Monitorar oportunidades**
4. **Ajustar thresholds** conforme necessário
5. **Analisar padrões temporais**
6. **Otimizar estratégias** baseado nos dados

---

**🎉 Sistema pronto para identificar e surfar as ondas das estratégias probabilísticas!**
