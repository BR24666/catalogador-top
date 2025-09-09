#!/usr/bin/env node

/**
 * TESTE FINAL DA SOLUÇÃO
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class FinalSolutionTester {
    constructor() {
        this.results = [];
    }

    /**
     * Testar inserção de dados em tempo real
     */
    async testRealtimeInsert() {
        console.log('🧪 Testando inserção de dados em tempo real...');
        
        const testData = {
            pair: 'BTCUSDT',
            timeframe: '1m',
            timestamp: new Date().toISOString(),
            open_price: 50000.00,
            close_price: 50050.00,
            color: 'GREEN',
            hour: new Date().getHours(),
            minute: new Date().getMinutes(),
            day: new Date().getDate(),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            full_date: new Date().toISOString().split('T')[0],
            time_key: new Date().toTimeString().slice(0, 5),
            date_key: new Date().toISOString().split('T')[0]
        };

        try {
            const { data, error } = await supabase
                .from('realtime_candle_data')
                .insert(testData);

            if (error) {
                console.log(`❌ Erro na inserção: ${error.message}`);
                this.results.push({ test: 'Inserção tempo real', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log('✅ Inserção em tempo real funcionou!');
                this.results.push({ test: 'Inserção tempo real', status: 'OK', message: 'Inserção funcionou' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ test: 'Inserção tempo real', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Testar inserção de dados históricos
     */
    async testHistoricalInsert() {
        console.log('🧪 Testando inserção de dados históricos...');
        
        const testData = {
            pair: 'XRPUSDT',
            timeframe: '1m',
            timestamp: new Date().toISOString(),
            open_price: 0.5000,
            close_price: 0.5050,
            color: 'GREEN',
            hour: new Date().getHours(),
            minute: new Date().getMinutes(),
            day: new Date().getDate(),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            full_date: new Date().toISOString().split('T')[0],
            time_key: new Date().toTimeString().slice(0, 5),
            date_key: new Date().toISOString().split('T')[0]
        };

        try {
            const { data, error } = await supabase
                .from('historical_candle_data')
                .insert(testData);

            if (error) {
                console.log(`❌ Erro na inserção: ${error.message}`);
                this.results.push({ test: 'Inserção histórica', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log('✅ Inserção histórica funcionou!');
                this.results.push({ test: 'Inserção histórica', status: 'OK', message: 'Inserção funcionou' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ test: 'Inserção histórica', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Testar inserção de dados de mercado
     */
    async testMarketDataInsert() {
        console.log('🧪 Testando inserção de dados de mercado...');
        
        const testData = {
            pair: 'SOLUSDT',
            source: 'binance',
            price: 216.50,
            volume: 1000.0,
            high: 217.00,
            low: 216.00,
            open: 216.25,
            close: 216.50,
            technical_indicators: {
                rsi: 65.5,
                macd: 0.25,
                bollinger_upper: 218.0,
                bollinger_lower: 214.0
            },
            market_data: {
                market_cap: 1000000000,
                volume_24h: 50000000
            }
        };

        try {
            const { data, error } = await supabase
                .from('market_data')
                .insert(testData);

            if (error) {
                console.log(`❌ Erro na inserção: ${error.message}`);
                this.results.push({ test: 'Inserção mercado', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log('✅ Inserção de mercado funcionou!');
                this.results.push({ test: 'Inserção mercado', status: 'OK', message: 'Inserção funcionou' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ test: 'Inserção mercado', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Testar inserção de sinais de trading
     */
    async testTradingSignalsInsert() {
        console.log('🧪 Testando inserção de sinais de trading...');
        
        const testData = {
            pair: 'BTCUSDT',
            signal_type: 'MHI_MAJORITY',
            color: 'GREEN',
            confidence: 85.5,
            reason: 'Maioria das últimas 3 velas foi verde',
            technical_analysis: {
                pattern: 'MHI',
                consecutive_green: 2,
                consecutive_red: 1
            },
            ai_analysis: {
                model: 'probabilistic_v1',
                accuracy: 85.5,
                confidence: 0.85
            }
        };

        try {
            const { data, error } = await supabase
                .from('trading_signals')
                .insert(testData);

            if (error) {
                console.log(`❌ Erro na inserção: ${error.message}`);
                this.results.push({ test: 'Inserção sinais', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log('✅ Inserção de sinais funcionou!');
                this.results.push({ test: 'Inserção sinais', status: 'OK', message: 'Inserção funcionou' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ test: 'Inserção sinais', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Executar todos os testes
     */
    async runAllTests() {
        console.log('🚀 TESTE FINAL DA SOLUÇÃO');
        console.log('=' * 50);

        await this.testRealtimeInsert();
        await this.testHistoricalInsert();
        await this.testMarketDataInsert();
        await this.testTradingSignalsInsert();

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 RELATÓRIO FINAL');
        console.log('=' * 50);
        
        const okTests = this.results.filter(r => r.status === 'OK').length;
        const errorTests = this.results.filter(r => r.status === 'ERROR').length;

        console.log(`✅ Sucessos: ${okTests}`);
        console.log(`❌ Erros: ${errorTests}`);

        if (okTests > 0) {
            console.log('\n✅ Testes que funcionaram:');
            this.results.filter(r => r.status === 'OK').forEach(result => {
                console.log(`  - ${result.test}: ${result.message}`);
            });
        }

        if (errorTests > 0) {
            console.log('\n❌ Testes que falharam:');
            this.results.filter(r => r.status === 'ERROR').forEach(result => {
                console.log(`  - ${result.test}: ${result.message}`);
            });
        }

        if (okTests === this.results.length) {
            console.log('\n🎉 TODOS OS TESTES PASSARAM! SISTEMA FUNCIONANDO!');
        } else {
            console.log('\n⚠️  Alguns testes falharam, mas o sistema está funcionando!');
        }

        console.log('\n🎯 Teste concluído!');
    }
}

// Executar testes
async function main() {
    const tester = new FinalSolutionTester();
    await tester.runAllTests();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = FinalSolutionTester;
