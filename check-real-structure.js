#!/usr/bin/env node

/**
 * SCRIPT PARA VERIFICAR ESTRUTURA REAL DAS TABELAS
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class RealStructureChecker {
    constructor() {
        this.structures = {};
    }

    /**
     * Verificar estrutura real de uma tabela
     */
    async checkRealStructure(tableName) {
        console.log(`\n🔍 Verificando estrutura real da tabela: ${tableName}`);
        
        try {
            // Tentar buscar dados existentes para ver a estrutura
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ Erro ao buscar dados: ${error.message}`);
                return;
            }

            if (data && data.length > 0) {
                console.log(`✅ Dados encontrados na tabela ${tableName}:`);
                console.log(`   Estrutura:`, Object.keys(data[0]));
                this.structures[tableName] = Object.keys(data[0]);
            } else {
                console.log(`⚠️  Tabela ${tableName} existe mas está vazia`);
                this.structures[tableName] = 'vazia';
            }

        } catch (err) {
            console.log(`❌ Erro ao verificar ${tableName}: ${err.message}`);
        }
    }

    /**
     * Verificar todas as tabelas
     */
    async checkAllTables() {
        console.log('🚀 VERIFICANDO ESTRUTURA REAL DAS TABELAS');
        console.log('=' * 50);

        const tables = [
            'realtime_candle_data',
            'historical_candle_data',
            'candle_data',
            'market_data',
            'trading_signals'
        ];

        for (const table of tables) {
            await this.checkRealStructure(table);
        }

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 ESTRUTURAS REAIS IDENTIFICADAS');
        console.log('=' * 50);
        
        Object.entries(this.structures).forEach(([table, structure]) => {
            if (structure === 'vazia') {
                console.log(`⚠️  ${table}: ${structure}`);
            } else {
                console.log(`✅ ${table}: ${structure.join(', ')}`);
            }
        });

        console.log('\n🎯 Verificação concluída!');
    }
}

// Executar verificação
async function main() {
    const checker = new RealStructureChecker();
    await checker.checkAllTables();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = RealStructureChecker;
