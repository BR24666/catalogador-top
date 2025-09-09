#!/usr/bin/env node

/**
 * SCRIPT PARA ENCONTRAR SOLUÇÃO FUNCIONAL
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class WorkingSolutionFinder {
    constructor() {
        this.workingSolutions = [];
    }

    /**
     * Testar inserção com dados mínimos
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
                return false;
            } else {
                console.log(`✅ Inserção mínima funcionou!`);
                this.workingSolutions.push({
                    table: tableName,
                    structure: 'mínima',
                    fields: Object.keys(testData)
                });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            return false;
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
                return false;
            } else {
                console.log(`✅ Inserção de vela funcionou!`);
                this.workingSolutions.push({
                    table: tableName,
                    structure: 'vela',
                    fields: Object.keys(testData)
                });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            return false;
        }
    }

    /**
     * Testar inserção com dados de vela com preços
     */
    async testCandlePriceInsert(tableName) {
        console.log(`\n🧪 Testando inserção de vela com preços na tabela: ${tableName}`);
        
        const testData = {
            pair: 'BTCUSDT',
            timeframe: '1m',
            timestamp: new Date().toISOString(),
            open_price: 50000.00,
            high_price: 50100.00,
            low_price: 49900.00,
            close_price: 50050.00,
            volume: 100.0
        };

        try {
            const { data, error } = await supabase
                .from(tableName)
                .insert(testData);

            if (error) {
                console.log(`❌ Erro: ${error.message}`);
                return false;
            } else {
                console.log(`✅ Inserção de vela com preços funcionou!`);
                this.workingSolutions.push({
                    table: tableName,
                    structure: 'vela com preços',
                    fields: Object.keys(testData)
                });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            return false;
        }
    }

    /**
     * Testar todas as tabelas
     */
    async testAllTables() {
        console.log('🚀 TESTANDO TODAS AS TABELAS POSSÍVEIS');
        console.log('=' * 50);

        const tables = [
            'candle_data',
            'market_data',
            'trading_signals',
            'realtime_candle_data',
            'historical_candle_data'
        ];

        for (const table of tables) {
            console.log(`\n📋 Testando tabela: ${table}`);
            
            // Testar inserção mínima
            const minimalWorked = await this.testMinimalInsert(table);
            
            if (!minimalWorked) {
                // Se inserção mínima não funcionou, testar inserção de vela
                const candleWorked = await this.testCandleInsert(table);
                
                if (!candleWorked) {
                    // Se inserção de vela não funcionou, testar inserção de vela com preços
                    await this.testCandlePriceInsert(table);
                }
            }
        }

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 SOLUÇÕES FUNCIONAIS ENCONTRADAS');
        console.log('=' * 50);
        
        if (this.workingSolutions.length > 0) {
            this.workingSolutions.forEach(solution => {
                console.log(`✅ ${solution.table}: ${solution.structure}`);
                console.log(`   Campos: ${solution.fields.join(', ')}`);
            });
        } else {
            console.log('❌ Nenhuma solução funcionou');
            console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
            console.log('1. Verificar se o Supabase tem RLS desabilitado');
            console.log('2. Verificar se as tabelas existem e têm a estrutura correta');
            console.log('3. Verificar se a chave de API está correta');
            console.log('4. Verificar se o projeto Supabase está ativo');
        }

        console.log('\n🎯 Teste concluído!');
    }
}

// Executar teste
async function main() {
    const finder = new WorkingSolutionFinder();
    await finder.testAllTables();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = WorkingSolutionFinder;
