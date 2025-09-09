#!/usr/bin/env node

/**
 * SCRIPT PARA ENCONTRAR TABELA QUE FUNCIONE SEM RLS
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class WorkingTableWithoutRLS {
    constructor() {
        this.workingTables = [];
    }

    /**
     * Testar inserção em uma tabela
     */
    async testTableInsert(tableName) {
        console.log(`\n🧪 Testando inserção na tabela: ${tableName}`);
        
        const testData = {
            pair: 'BTCUSDT',
            timestamp: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from(tableName)
                .insert(testData);

            if (error) {
                if (error.message.includes('row-level security policy')) {
                    console.log(`🔒 Tabela ${tableName}: RLS ATIVADO`);
                    return false;
                } else {
                    console.log(`❌ Erro: ${error.message}`);
                    return false;
                }
            } else {
                console.log(`✅ Inserção funcionou!`);
                this.workingTables.push({
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
     * Testar todas as tabelas possíveis
     */
    async testAllTables() {
        console.log('🚀 TESTANDO TODAS AS TABELAS POSSÍVEIS');
        console.log('=' * 50);

        const possibleTables = [
            'candle_data',
            'market_data',
            'trading_signals',
            'realtime_candle_data',
            'historical_candle_data',
            'candles',
            'market_candles',
            'price_data',
            'ohlc_data',
            'trading_data',
            'simple_candles',
            'test_candles',
            'candle_test',
            'market_test',
            'trading_test'
        ];

        for (const table of possibleTables) {
            await this.testTableInsert(table);
        }

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 TABELAS QUE FUNCIONAM SEM RLS');
        console.log('=' * 50);
        
        if (this.workingTables.length > 0) {
            this.workingTables.forEach(table => {
                console.log(`✅ ${table.table}: ${table.structure}`);
                console.log(`   Campos: ${table.fields.join(', ')}`);
            });
        } else {
            console.log('❌ Nenhuma tabela funcionou sem RLS');
            console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
            console.log('1. Desabilitar RLS nas tabelas existentes');
            console.log('2. Criar novas tabelas sem RLS');
            console.log('3. Usar uma chave de API com permissões administrativas');
            console.log('4. Verificar se o projeto Supabase está configurado corretamente');
        }

        console.log('\n🎯 Teste concluído!');
    }
}

// Executar teste
async function main() {
    const finder = new WorkingTableWithoutRLS();
    await finder.testAllTables();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = WorkingTableWithoutRLS;
