#!/usr/bin/env node

/**
 * SCRIPT SIMPLES PARA CORRIGIR SUPABASE
 * 
 * Este script testa a conexão e tenta inserir dados diretamente
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SupabaseTester {
    constructor() {
        this.results = [];
    }

    /**
     * Testar conexão básica
     */
    async testConnection() {
        console.log('🔌 Testando conexão com Supabase...');
        
        try {
            const { data, error } = await supabase
                .from('realtime_candle_data')
                .select('*')
                .limit(1);

            if (error) {
                console.log(`⚠️  Tabela realtime_candle_data: ${error.message}`);
                this.results.push({ test: 'Conexão', status: 'WARNING', message: error.message });
            } else {
                console.log('✅ Conexão com Supabase: OK');
                this.results.push({ test: 'Conexão', status: 'OK', message: 'Conexão estabelecida' });
            }
        } catch (err) {
            console.log(`❌ Erro de conexão: ${err.message}`);
            this.results.push({ test: 'Conexão', status: 'ERROR', message: err.message });
        }
    }

    /**
     * Testar inserção simples
     */
    async testSimpleInsert() {
        console.log('🧪 Testando inserção simples...');
        
        const testData = {
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

        try {
            const { data, error } = await supabase
                .from('realtime_candle_data')
                .insert(testData);

            if (error) {
                console.log(`❌ Erro na inserção: ${error.message}`);
                this.results.push({ test: 'Inserção', status: 'ERROR', message: error.message });
            } else {
                console.log('✅ Inserção: OK');
                this.results.push({ test: 'Inserção', status: 'OK', message: 'Dados inseridos com sucesso' });
            }
        } catch (err) {
            console.log(`❌ Erro na inserção: ${err.message}`);
            this.results.push({ test: 'Inserção', status: 'ERROR', message: err.message });
        }
    }

    /**
     * Verificar tabelas existentes
     */
    async checkExistingTables() {
        console.log('📋 Verificando tabelas existentes...');
        
        const tables = [
            'realtime_candle_data',
            'historical_candle_data',
            'candle_data',
            'market_data',
            'trading_signals'
        ];

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    console.log(`❌ Tabela ${table}: ${error.message}`);
                    this.results.push({ test: `Tabela ${table}`, status: 'ERROR', message: error.message });
                } else {
                    console.log(`✅ Tabela ${table}: Existe`);
                    this.results.push({ test: `Tabela ${table}`, status: 'OK', message: 'Tabela existe' });
                }
            } catch (err) {
                console.log(`❌ Tabela ${table}: ${err.message}`);
                this.results.push({ test: `Tabela ${table}`, status: 'ERROR', message: err.message });
            }
        }
    }

    /**
     * Executar todos os testes
     */
    async runAllTests() {
        console.log('🚀 INICIANDO TESTES DO SUPABASE');
        console.log('=' * 50);

        await this.testConnection();
        await this.checkExistingTables();
        await this.testSimpleInsert();

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 RELATÓRIO DE TESTES');
        console.log('=' * 50);
        
        const okTests = this.results.filter(r => r.status === 'OK').length;
        const errorTests = this.results.filter(r => r.status === 'ERROR').length;
        const warningTests = this.results.filter(r => r.status === 'WARNING').length;

        console.log(`✅ Sucessos: ${okTests}`);
        console.log(`⚠️  Avisos: ${warningTests}`);
        console.log(`❌ Erros: ${errorTests}`);

        if (errorTests > 0) {
            console.log('\n❌ Erros encontrados:');
            this.results.filter(r => r.status === 'ERROR').forEach(result => {
                console.log(`  - ${result.test}: ${result.message}`);
            });
        }

        if (warningTests > 0) {
            console.log('\n⚠️  Avisos:');
            this.results.filter(r => r.status === 'WARNING').forEach(result => {
                console.log(`  - ${result.test}: ${result.message}`);
            });
        }

        console.log('\n🎯 Testes concluídos!');
    }
}

// Executar testes
async function main() {
    const tester = new SupabaseTester();
    await tester.runAllTests();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SupabaseTester;
