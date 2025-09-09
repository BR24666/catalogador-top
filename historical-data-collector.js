#!/usr/bin/env node

/**
 * COLETOR DE DADOS HISTÓRICOS PARA ANÁLISE PROBABILÍSTICA
 * 
 * Este script coleta 6 meses de dados históricos de cada par de moeda
 * no timeframe de 1 minuto para popular o banco de dados com dados
 * suficientes para análise estatística das estratégias probabilísticas.
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Pares de trading para análise probabilística
const TRADING_PAIRS = ['BTCUSDT', 'XRPUSDT', 'SOLUSDT', 'EURUSD'];
const TIMEFRAME = '1m';
const MONTHS_BACK = 6;

// Configurações da API Binance
const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';
const RATE_LIMIT = 1200; // requisições por minuto
const BATCH_SIZE = 1000; // candles por requisição

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class HistoricalDataCollector {
    constructor() {
        this.requestCount = 0;
        this.startTime = Date.now();
        this.collectionStats = {
            totalPairs: TRADING_PAIRS.length,
            completedPairs: 0,
            totalCandles: 0,
            errors: 0
        };
    }

    /**
     * Aguardar para respeitar rate limit
     */
    async waitForRateLimit() {
        const elapsed = Date.now() - this.startTime;
        const expectedRequests = Math.floor(elapsed / 60000) * RATE_LIMIT;
        
        if (this.requestCount >= expectedRequests) {
            const waitTime = 60000 - (elapsed % 60000);
            console.log(`⏳ Aguardando ${Math.ceil(waitTime / 1000)}s para respeitar rate limit...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.startTime = Date.now();
            this.requestCount = 0;
        }
    }

    /**
     * Coletar dados históricos de um par específico
     */
    async collectPairHistoricalData(pair) {
        console.log(`\n🚀 Iniciando coleta de dados históricos para ${pair}...`);
        
        try {
            // Calcular período de 6 meses
            const endTime = Date.now();
            const startTime = endTime - (MONTHS_BACK * 30 * 24 * 60 * 60 * 1000);
            
            // Criar registro de coleta no banco
            const { data: collection, error: collectionError } = await supabase
                .from('historical_data_collection')
                .insert({
                    pair: pair,
                    timeframe: TIMEFRAME,
                    start_date: new Date(startTime).toISOString(),
                    end_date: new Date(endTime).toISOString(),
                    total_candles_expected: MONTHS_BACK * 30 * 24 * 60, // Aproximado
                    collection_status: 'IN_PROGRESS'
                })
                .select()
                .single();

            if (collectionError) {
                console.error(`❌ Erro ao criar registro de coleta: ${collectionError.message}`);
                return;
            }

            console.log(`📊 Coleta criada com ID: ${collection.id}`);

            // Coletar dados em lotes
            let allCandles = [];
            let currentStartTime = startTime;
            let batchCount = 0;

            while (currentStartTime < endTime) {
                await this.waitForRateLimit();
                
                const batchCandles = await this.fetchCandlesBatch(pair, currentStartTime, endTime);
                
                if (batchCandles.length === 0) break;
                
                allCandles = allCandles.concat(batchCandles);
                batchCount++;
                
                console.log(`📈 Lote ${batchCount}: ${batchCandles.length} velas coletadas (Total: ${allCandles.length})`);
                
                // Inserir lote no banco de dados
                await this.insertCandlesBatch(collection.id, batchCandles);
                
                // Atualizar timestamp para próximo lote
                currentStartTime = batchCandles[batchCandles.length - 1].timestamp + 60000; // +1 minuto
                
                this.requestCount++;
            }

            // Finalizar coleta
            await this.finalizeCollection(collection.id, allCandles.length);
            
            console.log(`✅ Coleta concluída para ${pair}: ${allCandles.length} velas`);
            this.collectionStats.completedPairs++;
            this.collectionStats.totalCandles += allCandles.length;

        } catch (error) {
            console.error(`❌ Erro na coleta de ${pair}:`, error.message);
            this.collectionStats.errors++;
        }
    }

    /**
     * Buscar lote de velas da API Binance
     */
    async fetchCandlesBatch(pair, startTime, endTime) {
        try {
            const limit = Math.min(BATCH_SIZE, 1000);
            const startTimeStr = startTime;
            const endTimeStr = Math.min(startTime + (limit * 60 * 1000), endTime);
            
            const response = await axios.get(BINANCE_API_URL, {
                params: {
                    symbol: pair,
                    interval: TIMEFRAME,
                    startTime: startTimeStr,
                    endTime: endTimeStr,
                    limit: limit
                }
            });

            return response.data.map(candle => ({
                timestamp: new Date(candle[0]).toISOString(),
                open_price: parseFloat(candle[1]),
                high_price: parseFloat(candle[2]),
                low_price: parseFloat(candle[3]),
                close_price: parseFloat(candle[4]),
                volume: parseFloat(candle[5]),
                color: parseFloat(candle[4]) > parseFloat(candle[1]) ? 'GREEN' : 'RED',
                hour: new Date(candle[0]).getHours(),
                minute: new Date(candle[0]).getMinutes(),
                day_of_week: new Date(candle[0]).getDay(),
                day_of_month: new Date(candle[0]).getDate(),
                month: new Date(candle[0]).getMonth() + 1,
                year: new Date(candle[0]).getFullYear()
            }));

        } catch (error) {
            console.error(`❌ Erro ao buscar dados da API: ${error.message}`);
            return [];
        }
    }

    /**
     * Inserir lote de velas no banco de dados
     */
    async insertCandlesBatch(collectionId, candles) {
        try {
            // Inserir velas históricas
            const { error: candlesError } = await supabase
                .from('historical_candles')
                .insert(candles.map(candle => ({
                    pair: candles[0].pair || 'BTCUSDT', // Será definido pelo par atual
                    timeframe: TIMEFRAME,
                    timestamp: candle.timestamp,
                    open_price: candle.open_price,
                    high_price: candle.high_price,
                    low_price: candle.low_price,
                    close_price: candle.close_price,
                    volume: candle.volume,
                    color: candle.color,
                    hour: candle.hour,
                    minute: candle.minute,
                    day_of_week: candle.day_of_week,
                    day_of_month: candle.day_of_month,
                    month: candle.month,
                    year: candle.year
                })));

            if (candlesError) {
                console.error(`❌ Erro ao inserir velas: ${candlesError.message}`);
                return;
            }

            // Atualizar contador de coleta
            const { error: updateError } = await supabase
                .from('historical_data_collection')
                .update({
                    total_candles_collected: candles.length,
                    last_collected_timestamp: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', collectionId);

            if (updateError) {
                console.error(`❌ Erro ao atualizar coleta: ${updateError.message}`);
            }

        } catch (error) {
            console.error(`❌ Erro ao inserir lote: ${error.message}`);
        }
    }

    /**
     * Finalizar coleta
     */
    async finalizeCollection(collectionId, totalCandles) {
        try {
            const { error } = await supabase
                .from('historical_data_collection')
                .update({
                    collection_status: 'COMPLETED',
                    total_candles_collected: totalCandles,
                    updated_at: new Date().toISOString()
                })
                .eq('id', collectionId);

            if (error) {
                console.error(`❌ Erro ao finalizar coleta: ${error.message}`);
            }

        } catch (error) {
            console.error(`❌ Erro ao finalizar coleta: ${error.message}`);
        }
    }

    /**
     * Executar coleta para todos os pares
     */
    async collectAllPairs() {
        console.log('🎯 INICIANDO COLETA DE DADOS HISTÓRICOS');
        console.log(`📅 Período: ${MONTHS_BACK} meses`);
        console.log(`⏱️  Timeframe: ${TIMEFRAME}`);
        console.log(`💰 Pares: ${TRADING_PAIRS.join(', ')}`);
        console.log('=' * 50);

        for (const pair of TRADING_PAIRS) {
            await this.collectPairHistoricalData(pair);
            
            // Pequena pausa entre pares
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 RELATÓRIO FINAL DA COLETA');
        console.log('=' * 50);
        console.log(`✅ Pares completados: ${this.collectionStats.completedPairs}/${this.collectionStats.totalPairs}`);
        console.log(`📈 Total de velas coletadas: ${this.collectionStats.totalCandles.toLocaleString()}`);
        console.log(`❌ Erros: ${this.collectionStats.errors}`);
        console.log(`⏱️  Tempo total: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
        console.log('=' * 50);
    }
}

// Executar coleta
async function main() {
    const collector = new HistoricalDataCollector();
    await collector.collectAllPairs();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = HistoricalDataCollector;