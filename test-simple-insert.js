#!/usr/bin/env node

/**
 * SCRIPT PARA TESTAR INSERÇÃO SIMPLES
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SimpleInsertTester {
    constructor() {
        this.results = [];
    }

    /**
     * Testar inserção com estrutura mínima
     */
    async testMinimalInsert(tableName) {
        console.log(`\n🧪 Testando inserção mínima na tabela: ${tableName}`);
        
        const testData = {
            pair: 'BTCUSDT',
            timestamp: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from(tableName)
                .insert(testData);

            if (error) {
                console.log(`❌ Erro: ${error.message}`);
                this.results.push({ table: tableName, status: 'ERROR', message: error.message });
            } else {
                console.log(`✅ Inserção mínima funcionou!`);
                this.results.push({ table: tableName, status: 'OK', message: 'Inserção mínima funcionou' });
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ table: tableName, status: 'ERROR', message: err.message });
        }
    }

    /**
     * Testar inserção com dados de vela
     */
    async testCandleInsert(tableName) {
        console.log(`\n🧪 Testando inserção de vela na tabela: ${tableName}`);
        
        const testData = {
            pair: 'BTCUSDT',
            timeframe: '1m',
            timestamp: new Date().toISOString(),
            open: 50000.00,
            high: 50100.00,
            low: 49900.00,
            close: 50050.00,
            volume: 100.0
        };

        try {
            const { data, error } = await supabase
                .from(tableName)
                .insert(testData);

            if (error) {
                console.log(`❌ Erro: ${error.message}`);
                this.results.push({ table: tableName, status: 'ERROR', message: error.message });
            } else {
                console.log(`✅ Inserção de vela funcionou!`);
                this.results.push({ table: tableName, status: 'OK', message: 'Inserção de vela funcionou' });
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ table: tableName, status: 'ERROR', message: err.message });
        }
    }

    /**
     * Executar todos os testes
     */
    async runAllTests() {
        console.log('🚀 TESTANDO INSERÇÕES SIMPLES');
        console.log('=' * 50);

        const tables = [
            'realtime_candle_data',
            'historical_candle_data',
            'candle_data'
        ];

        for (const table of tables) {
            await this.testMinimalInsert(table);
            await this.testCandleInsert(table);
        }

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 RELATÓRIO DE TESTES');
        console.log('=' * 50);
        
        const okTests = this.results.filter(r => r.status === 'OK').length;
        const errorTests = this.results.filter(r => r.status === 'ERROR').length;

        console.log(`✅ Sucessos: ${okTests}`);
        console.log(`❌ Erros: ${errorTests}`);

        if (errorTests > 0) {
            console.log('\n❌ Erros encontrados:');
            this.results.filter(r => r.status === 'ERROR').forEach(result => {
                console.log(`  - ${result.table}: ${result.message}`);
            });
        }

        console.log('\n🎯 Testes concluídos!');
    }
}

// Executar testes
async function main() {
    const tester = new SimpleInsertTester();
    await tester.runAllTests();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimpleInsertTester;
