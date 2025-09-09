#!/usr/bin/env node

/**
 * SCRIPT PARA VERIFICAR ESTRUTURA DAS TABELAS
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class TableStructureChecker {
    constructor() {
        this.structures = {};
    }

    /**
     * Verificar estrutura de uma tabela
     */
    async checkTableStructure(tableName) {
        console.log(`\n🔍 Verificando estrutura da tabela: ${tableName}`);
        
        try {
            // Tentar inserir dados com diferentes estruturas
            const testData1 = {
                pair: 'BTCUSDT',
                timeframe: '1m',
                timestamp: new Date().toISOString(),
                open: 50000.00,
                high: 50100.00,
                low: 49900.00,
                close: 50050.00,
                volume: 100.0,
                color: 'GREEN'
            };

            const { data: data1, error: error1 } = await supabase
                .from(tableName)
                .insert(testData1);

            if (!error1) {
                console.log(`✅ Estrutura 1 funcionou: open, high, low, close`);
                this.structures[tableName] = 'open, high, low, close';
                return;
            }

            const testData2 = {
                pair: 'BTCUSDT',
                timeframe: '1m',
                timestamp: new Date().toISOString(),
                open_price: 50000.00,
                high_price: 50100.00,
                low_price: 49900.00,
                close_price: 50050.00,
                volume: 100.0,
                color: 'GREEN'
            };

            const { data: data2, error: error2 } = await supabase
                .from(tableName)
                .insert(testData2);

            if (!error2) {
                console.log(`✅ Estrutura 2 funcionou: open_price, high_price, low_price, close_price`);
                this.structures[tableName] = 'open_price, high_price, low_price, close_price';
                return;
            }

            const testData3 = {
                symbol: 'BTCUSDT',
                interval: '1m',
                timestamp: new Date().toISOString(),
                open: 50000.00,
                high: 50100.00,
                low: 49900.00,
                close: 50050.00,
                volume: 100.0
            };

            const { data: data3, error: error3 } = await supabase
                .from(tableName)
                .insert(testData3);

            if (!error3) {
                console.log(`✅ Estrutura 3 funcionou: symbol, interval, open, high, low, close`);
                this.structures[tableName] = 'symbol, interval, open, high, low, close';
                return;
            }

            console.log(`❌ Nenhuma estrutura funcionou para ${tableName}`);
            console.log(`   Erro 1: ${error1?.message}`);
            console.log(`   Erro 2: ${error2?.message}`);
            console.log(`   Erro 3: ${error3?.message}`);

        } catch (err) {
            console.log(`❌ Erro ao verificar ${tableName}: ${err.message}`);
        }
    }

    /**
     * Verificar todas as tabelas
     */
    async checkAllTables() {
        console.log('🚀 VERIFICANDO ESTRUTURA DAS TABELAS');
        console.log('=' * 50);

        const tables = [
            'realtime_candle_data',
            'historical_candle_data',
            'candle_data'
        ];

        for (const table of tables) {
            await this.checkTableStructure(table);
        }

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 ESTRUTURAS IDENTIFICADAS');
        console.log('=' * 50);
        
        Object.entries(this.structures).forEach(([table, structure]) => {
            console.log(`✅ ${table}: ${structure}`);
        });

        console.log('\n🎯 Verificação concluída!');
    }
}

// Executar verificação
async function main() {
    const checker = new TableStructureChecker();
    await checker.checkAllTables();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TableStructureChecker;
