#!/usr/bin/env node

/**
 * SCRIPT PARA CRIAR SOLUÇÃO FUNCIONAL
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class WorkingSolutionCreator {
    constructor() {
        this.results = [];
    }

    /**
     * Criar tabela usando SQL direto
     */
    async createTableWithSQL() {
        console.log('🔧 Tentando criar tabela usando SQL direto...');
        
        try {
            // Tentar criar tabela usando SQL direto
            const { data, error } = await supabase.rpc('exec_sql', {
                sql: `
                    CREATE TABLE IF NOT EXISTS working_candles (
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
                this.results.push({ test: 'Criação SQL', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log('✅ Tabela criada com sucesso!');
                this.results.push({ test: 'Criação SQL', status: 'OK', message: 'Tabela criada' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ test: 'Criação SQL', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Tentar usar tabela existente com dados mínimos
     */
    async tryMinimalData() {
        console.log('🧪 Tentando usar dados mínimos...');
        
        const testData = {
            pair: 'BTCUSDT',
            timestamp: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from('candle_data')
                .insert(testData);

            if (error) {
                console.log(`❌ Erro: ${error.message}`);
                this.results.push({ test: 'Dados mínimos', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log('✅ Dados mínimos funcionaram!');
                this.results.push({ test: 'Dados mínimos', status: 'OK', message: 'Dados mínimos funcionaram' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ test: 'Dados mínimos', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Tentar usar tabela existente com dados de vela
     */
    async tryCandleData() {
        console.log('🧪 Tentando usar dados de vela...');
        
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
                .from('candle_data')
                .insert(testData);

            if (error) {
                console.log(`❌ Erro: ${error.message}`);
                this.results.push({ test: 'Dados de vela', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log('✅ Dados de vela funcionaram!');
                this.results.push({ test: 'Dados de vela', status: 'OK', message: 'Dados de vela funcionaram' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ test: 'Dados de vela', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Executar todas as tentativas
     */
    async runAllAttempts() {
        console.log('🚀 TENTANDO CRIAR SOLUÇÃO FUNCIONAL');
        console.log('=' * 50);

        // Tentar criar tabela usando SQL
        const sqlWorked = await this.createTableWithSQL();
        
        if (!sqlWorked) {
            // Se SQL não funcionou, tentar dados mínimos
            const minimalWorked = await this.tryMinimalData();
            
            if (!minimalWorked) {
                // Se dados mínimos não funcionaram, tentar dados de vela
                await this.tryCandleData();
            }
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

        if (okTests > 0) {
            console.log('\n✅ Soluções funcionais:');
            this.results.filter(r => r.status === 'OK').forEach(result => {
                console.log(`  - ${result.test}: ${result.message}`);
            });
        }

        console.log('\n🎯 Processo concluído!');
    }
}

// Executar tentativas
async function main() {
    const creator = new WorkingSolutionCreator();
    await creator.runAllAttempts();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = WorkingSolutionCreator;
