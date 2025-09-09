#!/usr/bin/env node

/**
 * SCRIPT PARA DESCOBRIR ESTRUTURA REAL DAS TABELAS
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class TableStructureDiscoverer {
    constructor() {
        this.discoveredStructures = {};
    }

    /**
     * Descobrir estrutura de uma tabela
     */
    async discoverTableStructure(tableName) {
        console.log(`\n🔍 Descobrindo estrutura da tabela: ${tableName}`);
        
        // Tentar diferentes estruturas de dados
        const testStructures = [
            // Estrutura 1: Dados básicos
            {
                name: 'Dados básicos',
                data: {
                    pair: 'BTCUSDT',
                    timestamp: new Date().toISOString()
                }
            },
            // Estrutura 2: Dados de vela simples
            {
                name: 'Vela simples',
                data: {
                    symbol: 'BTCUSDT',
                    interval: '1m',
                    timestamp: new Date().toISOString(),
                    open: 50000.00,
                    high: 50100.00,
                    low: 49900.00,
                    close: 50050.00,
                    volume: 100.0
                }
            },
            // Estrutura 3: Dados de vela com preços
            {
                name: 'Vela com preços',
                data: {
                    pair: 'BTCUSDT',
                    timeframe: '1m',
                    timestamp: new Date().toISOString(),
                    open_price: 50000.00,
                    high_price: 50100.00,
                    low_price: 49900.00,
                    close_price: 50050.00,
                    volume: 100.0
                }
            },
            // Estrutura 4: Dados de vela com OHLC
            {
                name: 'Vela OHLC',
                data: {
                    pair: 'BTCUSDT',
                    timeframe: '1m',
                    timestamp: new Date().toISOString(),
                    o: 50000.00,
                    h: 50100.00,
                    l: 49900.00,
                    c: 50050.00,
                    v: 100.0
                }
            }
        ];

        for (const structure of testStructures) {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .insert(structure.data);

                if (!error) {
                    console.log(`✅ Estrutura "${structure.name}" funcionou!`);
                    this.discoveredStructures[tableName] = {
                        structure: structure.name,
                        fields: Object.keys(structure.data)
                    };
                    return true;
                } else {
                    console.log(`❌ Estrutura "${structure.name}": ${error.message}`);
                }
            } catch (err) {
                console.log(`❌ Estrutura "${structure.name}": ${err.message}`);
            }
        }

        console.log(`❌ Nenhuma estrutura funcionou para ${tableName}`);
        return false;
    }

    /**
     * Descobrir todas as tabelas
     */
    async discoverAllTables() {
        console.log('🚀 DESCOBRINDO ESTRUTURA DAS TABELAS');
        console.log('=' * 50);

        const tables = [
            'candle_data',
            'market_data',
            'trading_signals',
            'realtime_candle_data',
            'historical_candle_data'
        ];

        for (const table of tables) {
            await this.discoverTableStructure(table);
        }

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 ESTRUTURAS DESCOBERTAS');
        console.log('=' * 50);
        
        if (Object.keys(this.discoveredStructures).length > 0) {
            Object.entries(this.discoveredStructures).forEach(([table, info]) => {
                console.log(`✅ ${table}: ${info.structure}`);
                console.log(`   Campos: ${info.fields.join(', ')}`);
            });
        } else {
            console.log('❌ Nenhuma estrutura funcionou');
        }

        console.log('\n🎯 Descoberta concluída!');
    }
}

// Executar descoberta
async function main() {
    const discoverer = new TableStructureDiscoverer();
    await discoverer.discoverAllTables();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TableStructureDiscoverer;
