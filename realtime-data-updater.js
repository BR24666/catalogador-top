#!/usr/bin/env node

/**
 * ATUALIZADOR DE DADOS EM TEMPO REAL PARA ANÁLISE PROBABILÍSTICA
 * 
 * Este script mantém os dados atualizados em tempo real e executa
 * as análises das estratégias probabilísticas continuamente.
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const WebSocket = require('ws');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

const TRADING_PAIRS = ['BTCUSDT', 'XRPUSDT', 'SOLUSDT', 'EURUSD'];
const TIMEFRAME = '1m';
const UPDATE_INTERVAL = 60000; // 1 minuto

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class RealtimeDataUpdater {
    constructor() {
        this.isRunning = false;
        this.updateInterval = null;
        this.wsConnections = new Map();
        this.lastUpdate = new Map();
    }

    /**
     * Iniciar atualização em tempo real
     */
    async start() {
        console.log('🚀 Iniciando atualização de dados em tempo real...');
        this.isRunning = true;

        // Inicializar WebSocket para cada par
        for (const pair of TRADING_PAIRS) {
            await this.initializeWebSocket(pair);
        }

        // Iniciar intervalo de análise
        this.startAnalysisInterval();

        console.log('✅ Sistema de tempo real ativado');
    }

    /**
     * Parar atualização
     */
    stop() {
        console.log('🛑 Parando atualização de dados em tempo real...');
        this.isRunning = false;

        // Fechar WebSockets
        for (const [pair, ws] of this.wsConnections) {
            ws.close();
        }
        this.wsConnections.clear();

        // Limpar intervalos
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        console.log('✅ Sistema de tempo real parado');
    }

    /**
     * Inicializar WebSocket para um par
     */
    async initializeWebSocket(pair) {
        try {
            const wsUrl = `wss://stream.binance.com:9443/ws/${pair.toLowerCase()}@kline_1m`;
            const ws = new WebSocket(wsUrl);

            ws.on('open', () => {
                console.log(`🔗 WebSocket conectado para ${pair}`);
            });

            ws.on('message', (data) => {
                this.handleWebSocketMessage(pair, JSON.parse(data));
            });

            ws.on('error', (error) => {
                console.error(`❌ Erro WebSocket ${pair}:`, error.message);
            });

            ws.on('close', () => {
                console.log(`🔌 WebSocket desconectado para ${pair}`);
                // Reconectar após 5 segundos
                if (this.isRunning) {
                    setTimeout(() => this.initializeWebSocket(pair), 5000);
                }
            });

            this.wsConnections.set(pair, ws);

        } catch (error) {
            console.error(`❌ Erro ao inicializar WebSocket para ${pair}:`, error.message);
        }
    }

    /**
     * Processar mensagem do WebSocket
     */
    async handleWebSocketMessage(pair, data) {
        try {
            if (data.k && data.k.x) { // Vela fechada
                const candle = data.k;
                
                // Verificar se já processamos esta vela
                const candleTime = new Date(candle.t);
                const lastUpdateTime = this.lastUpdate.get(pair);
                
                if (lastUpdateTime && candleTime <= lastUpdateTime) {
                    return; // Já processada
                }

                // Processar nova vela
                await this.processNewCandle(pair, candle);
                this.lastUpdate.set(pair, candleTime);

            }
        } catch (error) {
            console.error(`❌ Erro ao processar mensagem WebSocket ${pair}:`, error.message);
        }
    }

    /**
     * Processar nova vela
     */
    async processNewCandle(pair, candle) {
        try {
            const candleData = {
                pair: pair,
                timeframe: TIMEFRAME,
                timestamp: new Date(candle.t).toISOString(),
                open_price: parseFloat(candle.o),
                high_price: parseFloat(candle.h),
                low_price: parseFloat(candle.l),
                close_price: parseFloat(candle.c),
                volume: parseFloat(candle.v),
                color: parseFloat(candle.c) > parseFloat(candle.o) ? 'GREEN' : 'RED',
                hour: new Date(candle.t).getHours(),
                minute: new Date(candle.t).getMinutes(),
                day_of_week: new Date(candle.t).getDay(),
                day_of_month: new Date(candle.t).getDate(),
                month: new Date(candle.t).getMonth() + 1,
                year: new Date(candle.t).getFullYear()
            };

            // Inserir vela no banco
            const { error: insertError } = await supabase
                .from('historical_candles')
                .upsert(candleData, {
                    onConflict: 'pair,timeframe,timestamp'
                });

            if (insertError) {
                console.error(`❌ Erro ao inserir vela ${pair}:`, insertError.message);
                return;
            }

            console.log(`📊 Nova vela ${pair}: ${candleData.color} - ${candleData.close_price}`);

            // Executar análise probabilística
            await this.runProbabilisticAnalysis(pair);

        } catch (error) {
            console.error(`❌ Erro ao processar vela ${pair}:`, error.message);
        }
    }

    /**
     * Executar análise probabilística
     */
    async runProbabilisticAnalysis(pair) {
        try {
            // Buscar velas recentes para análise
            const { data: recentCandles, error: candlesError } = await supabase
                .from('historical_candles')
                .select('*')
                .eq('pair', pair)
                .eq('timeframe', TIMEFRAME)
                .order('timestamp', { ascending: false })
                .limit(10);

            if (candlesError || !recentCandles) {
                console.error(`❌ Erro ao buscar velas recentes ${pair}:`, candlesError?.message);
                return;
            }

            // Executar análise de todas as estratégias
            const { data: analysisResults, error: analysisError } = await supabase
                .rpc('analyze_all_probabilistic_strategies', {
                    p_pair: pair,
                    p_timeframe: TIMEFRAME,
                    p_limit_candles: 10
                });

            if (analysisError) {
                console.error(`❌ Erro na análise ${pair}:`, analysisError.message);
                return;
            }

            // Processar resultados da análise
            for (const result of analysisResults || []) {
                if (result.confidence_score >= 80 && result.probability_success >= 75) {
                    console.log(`🎯 OPORTUNIDADE ${pair} - ${result.strategy_name}: ${result.signal_type} (Confiança: ${result.confidence_score}%)`);
                    
                    // Criar alerta de oportunidade
                    await this.createOpportunityAlert(pair, result);
                }
            }

        } catch (error) {
            console.error(`❌ Erro na análise probabilística ${pair}:`, error.message);
        }
    }

    /**
     * Criar alerta de oportunidade
     */
    async createOpportunityAlert(pair, analysisResult) {
        try {
            const { error } = await supabase
                .from('opportunity_alerts')
                .insert({
                    pair: pair,
                    strategy_name: analysisResult.strategy_name,
                    alert_timestamp: new Date().toISOString(),
                    expected_cycle_start: new Date(Date.now() + 60000).toISOString(), // Próximo minuto
                    confidence_level: analysisResult.confidence_score,
                    pattern_hour: new Date().getHours(),
                    pattern_day_of_week: new Date().getDay(),
                    pattern_accuracy: analysisResult.probability_success,
                    pattern_consecutive_wins: analysisResult.consecutive_wins_before || 0
                });

            if (error) {
                console.error(`❌ Erro ao criar alerta ${pair}:`, error.message);
            } else {
                console.log(`🚨 Alerta criado para ${pair} - ${analysisResult.strategy_name}`);
            }

        } catch (error) {
            console.error(`❌ Erro ao criar alerta ${pair}:`, error.message);
        }
    }

    /**
     * Iniciar intervalo de análise
     */
    startAnalysisInterval() {
        this.updateInterval = setInterval(async () => {
            if (!this.isRunning) return;

            console.log('🔄 Executando análise periódica...');
            
            // Executar análise para todos os pares
            for (const pair of TRADING_PAIRS) {
                await this.runProbabilisticAnalysis(pair);
            }

            // Verificar oportunidades ativas
            await this.checkActiveOpportunities();

        }, UPDATE_INTERVAL);
    }

    /**
     * Verificar oportunidades ativas
     */
    async checkActiveOpportunities() {
        try {
            const { data: opportunities, error } = await supabase
                .from('opportunity_alerts')
                .select('*')
                .eq('is_active', true)
                .eq('is_triggered', false)
                .lte('expected_cycle_start', new Date().toISOString());

            if (error) {
                console.error('❌ Erro ao verificar oportunidades:', error.message);
                return;
            }

            for (const opportunity of opportunities || []) {
                console.log(`⏰ Oportunidade ativa: ${opportunity.pair} - ${opportunity.strategy_name} (${opportunity.confidence_level}%)`);
                
                // Marcar como acionada
                await supabase
                    .from('opportunity_alerts')
                    .update({ is_triggered: true, triggered_at: new Date().toISOString() })
                    .eq('id', opportunity.id);
            }

        } catch (error) {
            console.error('❌ Erro ao verificar oportunidades:', error.message);
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const updater = new RealtimeDataUpdater();
    
    // Tratamento de sinais para parada limpa
    process.on('SIGINT', () => {
        console.log('\n🛑 Recebido SIGINT, parando...');
        updater.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Recebido SIGTERM, parando...');
        updater.stop();
        process.exit(0);
    });

    // Iniciar sistema
    updater.start().catch(console.error);
}

module.exports = RealtimeDataUpdater;
