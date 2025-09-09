#!/usr/bin/env node

/**
 * SCRIPT PARA CRIAR TABELA SIMPLES NO SUPABASE
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SimpleTableCreator {
    constructor() {
        this.results = [];
    }

    /**
     * Criar tabela simples
     */
    async createSimpleTable() {
        console.log('🔧 Criando tabela simples...');
        
        try {
            // Tentar criar uma tabela usando SQL direto
            const { data, error } = await supabase.rpc('exec_sql', {
                sql: `
                    CREATE TABLE IF NOT EXISTS simple_candles (
                        id SERIAL PRIMARY KEY,
                        pair VARCHAR(20) NOT NULL,
                        timeframe VARCHAR(10) NOT NULL,
                        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                        open DECIMAL(20,8) NOT NULL,
                        high DECIMAL(20,8) NOT NULL,
                        low DECIMAL(20,8) NOT NULL,
                        close DECIMAL(20,8) NOT NULL,
                        volume DECIMAL(20,8) NOT NULL,
                        color VARCHAR(10) NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                `
            });

            if (error) {
                console.log(`❌ Erro ao criar tabela: ${error.message}`);
                this.results.push({ test: 'Criação de tabela', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log('✅ Tabela criada com sucesso!');
                this.results.push({ test: 'Criação de tabela', status: 'OK', message: 'Tabela criada' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ test: 'Criação de tabela', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Testar inserção na tabela simples
     */
    async testSimpleInsert() {
        console.log('🧪 Testando inserção na tabela simples...');
        
        const testData = {
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

        try {
            const { data, error } = await supabase
                .from('simple_candles')
                .insert(testData);

            if (error) {
                console.log(`❌ Erro na inserção: ${error.message}`);
                this.results.push({ test: 'Inserção', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log('✅ Inserção funcionou!');
                this.results.push({ test: 'Inserção', status: 'OK', message: 'Inserção funcionou' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ test: 'Inserção', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Executar criação e teste
     */
    async runAll() {
        console.log('🚀 CRIANDO TABELA SIMPLES NO SUPABASE');
        console.log('=' * 50);

        const created = await this.createSimpleTable();
        
        if (created) {
            await this.testSimpleInsert();
        }

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 RELATÓRIO FINAL');
        console.log('=' * 50);
        
        const okTests = this.results.filter(r => r.status === 'OK').length;
        const errorTests = this.results.filter(r => r.status === 'ERROR').length;

        console.log(`✅ Sucessos: ${okTests}`);
        console.log(`❌ Erros: ${errorTests}`);

        if (errorTests > 0) {
            console.log('\n❌ Erros encontrados:');
            this.results.filter(r => r.status === 'ERROR').forEach(result => {
                console.log(`  - ${result.test}: ${result.message}`);
            });
        }

        console.log('\n🎯 Processo concluído!');
    }
}

// Executar criação
async function main() {
    const creator = new SimpleTableCreator();
    await creator.runAll();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimpleTableCreator;
