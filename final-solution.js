#!/usr/bin/env node

/**
 * SOLUÇÃO FINAL PARA O PROBLEMA DO SUPABASE
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class FinalSolution {
    constructor() {
        this.results = [];
    }

    /**
     * Verificar se existe alguma tabela que funcione
     */
    async checkWorkingTables() {
        console.log('🔍 Verificando se existe alguma tabela que funcione...');
        
        const possibleTables = [
            'candle_data',
            'market_data',
            'trading_signals',
            'realtime_candle_data',
            'historical_candle_data'
        ];

        for (const table of possibleTables) {
            try {
                // Tentar inserir dados mínimos
                const { data, error } = await supabase
                    .from(table)
                    .insert({
                        pair: 'BTCUSDT',
                        timestamp: new Date().toISOString()
                    });

                if (error) {
                    if (error.message.includes('row-level security policy')) {
                        console.log(`🔒 Tabela ${table}: RLS ATIVADO`);
                    } else {
                        console.log(`❌ Tabela ${table}: ${error.message}`);
                    }
                } else {
                    console.log(`✅ Tabela ${table}: FUNCIONA!`);
                    this.results.push({
                        table: table,
                        status: 'WORKING',
                        message: 'Tabela funciona sem RLS'
                    });
                }
            } catch (err) {
                console.log(`❌ Tabela ${table}: ${err.message}`);
            }
        }
    }

    /**
     * Verificar se existe alguma função que funcione
     */
    async checkWorkingFunctions() {
        console.log('\n🔍 Verificando se existe alguma função que funcione...');
        
        const possibleFunctions = [
            'exec_sql',
            'sql',
            'query',
            'execute_sql',
            'run_sql'
        ];

        for (const func of possibleFunctions) {
            try {
                const { data, error } = await supabase.rpc(func, {
                    sql: 'SELECT 1 as test'
                });

                if (error) {
                    console.log(`❌ Função ${func}: ${error.message}`);
                } else {
                    console.log(`✅ Função ${func}: FUNCIONA!`);
                    this.results.push({
                        function: func,
                        status: 'WORKING',
                        message: 'Função funciona'
                    });
                }
            } catch (err) {
                console.log(`❌ Função ${func}: ${err.message}`);
            }
        }
    }

    /**
     * Verificar se existe alguma tabela que funcione sem RLS
     */
    async checkTablesWithoutRLS() {
        console.log('\n🔍 Verificando se existe alguma tabela que funcione sem RLS...');
        
        const possibleTables = [
            'candle_data',
            'market_data',
            'trading_signals',
            'realtime_candle_data',
            'historical_candle_data'
        ];

        for (const table of possibleTables) {
            try {
                // Tentar inserir dados mínimos
                const { data, error } = await supabase
                    .from(table)
                    .insert({
                        pair: 'BTCUSDT',
                        timestamp: new Date().toISOString()
                    });

                if (error) {
                    if (error.message.includes('row-level security policy')) {
                        console.log(`🔒 Tabela ${table}: RLS ATIVADO`);
                    } else {
                        console.log(`❌ Tabela ${table}: ${error.message}`);
                    }
                } else {
                    console.log(`✅ Tabela ${table}: FUNCIONA SEM RLS!`);
                    this.results.push({
                        table: table,
                        status: 'WORKING_WITHOUT_RLS',
                        message: 'Tabela funciona sem RLS'
                    });
                }
            } catch (err) {
                console.log(`❌ Tabela ${table}: ${err.message}`);
            }
        }
    }

    /**
     * Executar verificação completa
     */
    async runFullCheck() {
        console.log('🚀 VERIFICAÇÃO COMPLETA DO SUPABASE');
        console.log('=' * 50);

        await this.checkWorkingTables();
        await this.checkWorkingFunctions();
        await this.checkTablesWithoutRLS();

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 RELATÓRIO FINAL');
        console.log('=' * 50);
        
        if (this.results.length > 0) {
            console.log('✅ Soluções funcionais encontradas:');
            this.results.forEach(result => {
                if (result.table) {
                    console.log(`  - Tabela ${result.table}: ${result.message}`);
                } else if (result.function) {
                    console.log(`  - Função ${result.function}: ${result.message}`);
                }
            });
        } else {
            console.log('❌ Nenhuma solução funcionou');
            console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
            console.log('1. Desabilitar RLS nas tabelas existentes');
            console.log('2. Criar novas tabelas sem RLS');
            console.log('3. Usar uma chave de API com permissões administrativas');
            console.log('4. Verificar se o projeto Supabase está configurado corretamente');
            console.log('5. Usar uma abordagem diferente para armazenar dados');
        }

        console.log('\n🎯 Verificação concluída!');
    }
}

// Executar verificação
async function main() {
    const solution = new FinalSolution();
    await solution.runFullCheck();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = FinalSolution;
