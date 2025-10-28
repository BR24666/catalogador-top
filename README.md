# ₿ Catalogador BTC/USDT

Sistema completo de catalogação e análise de velas BTC/USDT em tempo real com análise de estratégias probabilísticas.

## 🎯 Funcionalidades

### 📊 Coleta de Dados
- Coleta contínua de candles BTC/USDT via API Binance (timeframe 1 minuto)
- Atualização em tempo real a cada 5 segundos
- Histórico de até 500 velas carregadas automaticamente
- Persistência automática no Supabase

### 📈 Visualização
- Gráfico de candles interativo em tempo real
- Indicador visual de vela em formação (aguardando fechamento)
- Últimas 60 velas exibidas
- Informações detalhadas (Open, High, Low, Close, Volume)

### 🎯 Análise de Estratégias

#### 1. MHI (Maioria-Minoria Inversa)
- Analisa 3 velas anteriores
- Se 2 ou 3 forem da mesma cor, entra na direção oposta
- Taxa de acerto, melhor hora e dia da semana

#### 2. Três Soldados Brancos
- Detecta 3 velas consecutivas de alta/baixa forte
- Opera na 4ª vela na mesma direção
- Identifica padrões de continuação

#### 3. Minoria
- Analisa grupo de 4 velas
- Identifica a cor que apareceu menos
- Entra na direção da minoria na próxima vela

#### 4. Vela de Força
- Identifica velas de corpo grande e pavios pequenos
- Entra na direção da força na próxima vela
- Detecta movimentos fortes do mercado

### 📊 Métricas de Performance

Para cada estratégia:
- **Taxa de Acerto (%)** - Percentual de sinais corretos
- **Total de Sinais** - Quantidade de operações realizadas
- **Vitórias/Derrotas** - Contagem de acertos e erros
- **Sequência Máxima** - Maior sequência de vitórias consecutivas
- **Média de Sequências** - Média de vitórias em sequência
- **Melhor Hora** - Hora do dia com melhor desempenho
- **Melhor Dia** - Dia da semana com melhor desempenho

### 🎨 Interface

- Design moderno e responsivo
- Tema escuro otimizado para análise
- Atualização em tempo real
- Indicadores visuais de status
- Cores semafóricas para níveis de risco

## 🗄️ Estrutura do Banco de Dados

### Tabela `candles`
```sql
- id (SERIAL PRIMARY KEY)
- timestamp (TIMESTAMPTZ) - Data/hora da vela
- open (NUMERIC) - Preço de abertura
- high (NUMERIC) - Preço máximo
- low (NUMERIC) - Preço mínimo
- close (NUMERIC) - Preço de fechamento
- volume (NUMERIC) - Volume negociado
- direction (VARCHAR) - bullish, bearish ou neutral (auto-gerado)
- status (VARCHAR) - 'finalizada' ou 'em formação'
```

### Tabela `strategies`
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR) - Nome da estratégia
- description (TEXT) - Descrição
```

### Tabela `performance_metrics`
```sql
- id (SERIAL PRIMARY KEY)
- strategy_id (INTEGER) - FK para strategies
- accuracy (NUMERIC) - Taxa de acerto (%)
- total_signals (INTEGER) - Total de sinais
- total_wins (INTEGER) - Total de vitórias
- total_losses (INTEGER) - Total de derrotas
- max_win_streak (INTEGER) - Sequência máxima de vitórias
- avg_win_streak (NUMERIC) - Média de sequências
- best_hour (INTEGER) - Melhor hora do dia
- best_day (VARCHAR) - Melhor dia da semana
```

## 🚀 Como Usar

### 1. Iniciar Coleta
- Clique no botão **"Iniciar Coleta"**
- O sistema carregará automaticamente as últimas 500 velas
- A coleta continuará em tempo real

### 2. Monitorar Candles
- Visualize o gráfico de candles em tempo real
- Velas finalizadas em verde (bullish) ou vermelho (bearish)
- Vela atual em amarelo com indicador "aguardando fechamento"

### 3. Analisar Performance
- Painel de performance atualizado a cada 30 segundos
- Métricas calculadas com base nas últimas 100 velas finalizadas
- Indicadores de risco por estratégia:
  - **Verde**: Acerto ≥ 70% (Risco Baixo)
  - **Amarelo**: Acerto 50-69% (Risco Médio)
  - **Vermelho**: Acerto < 50% (Risco Alto)

## 🔧 Tecnologias

- **Frontend**: React + Next.js + TypeScript
- **Estilização**: CSS-in-JS inline (TailwindCSS inspirado)
- **Banco de Dados**: Supabase (PostgreSQL)
- **API**: Binance Public API
- **Deploy**: Vercel

## 📊 Fluxo de Funcionamento

1. **Inicialização**:
   - Sistema carrega últimas 500 velas da Binance
   - Salva no Supabase

2. **Coleta Contínua**:
   - A cada 5 segundos atualiza a vela atual
   - Quando uma vela fecha:
     - Marca como "finalizada"
     - Salva no banco
     - Recalcula métricas das estratégias

3. **Análise**:
   - Para cada vela finalizada
   - Aplica lógica das 4 estratégias
   - Verifica acerto/erro
   - Atualiza métricas

4. **Visualização**:
   - Gráfico atualizado em tempo real
   - Painel de métricas atualizado a cada 30s
   - Indicadores visuais de status

## 🎯 Próximas Expansões

- WebSocket para atualização ainda mais rápida
- Alertas de oportunidades de alta probabilidade
- Sistema preditivo com machine learning
- Múltiplos pares de moedas
- Múltiplos timeframes
- Exportação de relatórios
- Backtesting histórico

## 🔒 Segurança

- Chaves da API armazenadas em variáveis de ambiente
- Sem armazenamento de dados sensíveis
- Uso apenas de endpoints públicos da Binance
- Validação de dados em todas as operações

---

**Desenvolvido com foco em confiabilidade, precisão e usabilidade.**
