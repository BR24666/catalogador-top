#!/usr/bin/env node

/**
 * SCRIPT PARA VERIFICAR STATUS DO SUPABASE
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SupabaseStatusChecker {
    constructor() {
        this.status = {};
    }

    /**
     * Verificar status da conexão
     */
    async checkConnection() {
        console.log('🔌 Verificando conexão com Supabase...');
        
        try {
            const { data, error } = await supabase
                .from('candle_data')
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ Erro de conexão: ${error.message}`);
                this.status.connection = 'ERROR';
                this.status.connectionError = error.message;
                return false;
            } else {
                console.log('✅ Conexão com Supabase: OK');
                this.status.connection = 'OK';
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro de conexão: ${err.message}`);
            this.status.connection = 'ERROR';
            this.status.connectionError = err.message;
            return false;
        }
    }

    /**
     * Verificar status das tabelas
     */
    async checkTables() {
        console.log('\n📋 Verificando status das tabelas...');
        
        const tables = [
            'candle_data',
            'market_data',
            'trading_signals',
            'realtime_candle_data',
            'historical_candle_data'
        ];

        this.status.tables = {};

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    console.log(`❌ Tabela ${table}: ${error.message}`);
                    this.status.tables[table] = {
                        exists: true,
                        accessible: false,
                        error: error.message
                    };
                } else {
                    console.log(`✅ Tabela ${table}: Existe e acessível`);
                    this.status.tables[table] = {
                        exists: true,
                        accessible: true,
                        rowCount: data ? data.length : 0
                    };
                }
            } catch (err) {
                console.log(`❌ Tabela ${table}: ${err.message}`);
                this.status.tables[table] = {
                    exists: false,
                    accessible: false,
                    error: err.message
                };
            }
        }
    }

    /**
     * Verificar status do RLS
     */
    async checkRLS() {
        console.log('\n🔒 Verificando status do RLS...');
        
        const tables = Object.keys(this.status.tables);
        this.status.rls = {};

        for (const table of tables) {
            if (this.status.tables[table].exists) {
                try {
                    // Tentar inserir dados mínimos para testar RLS
                    const { data, error } = await supabase
                        .from(table)
                        .insert({
                            pair: 'BTCUSDT',
                            timestamp: new Date().toISOString()
                        });

                    if (error) {
                        if (error.message.includes('row-level security policy')) {
                            console.log(`🔒 Tabela ${table}: RLS ATIVADO`);
                            this.status.rls[table] = 'ENABLED';
                        } else {
                            console.log(`⚠️  Tabela ${table}: RLS DESABILITADO (mas com erro de estrutura)`);
                            this.status.rls[table] = 'DISABLED_WITH_ERROR';
                        }
                    } else {
                        console.log(`✅ Tabela ${table}: RLS DESABILITADO`);
                        this.status.rls[table] = 'DISABLED';
                    }
                } catch (err) {
                    console.log(`❌ Tabela ${table}: Erro ao testar RLS - ${err.message}`);
                    this.status.rls[table] = 'ERROR';
                }
            }
        }
    }

    /**
     * Verificar status do projeto
     */
    async checkProject() {
        console.log('\n🏗️  Verificando status do projeto...');
        
        try {
            // Tentar fazer uma requisição simples para verificar se o projeto está ativo
            const { data, error } = await supabase
                .from('candle_data')
                .select('count')
                .limit(1);

            if (error) {
                if (error.message.includes('JWT')) {
                    console.log('❌ Projeto: Chave de API inválida ou expirada');
                    this.status.project = 'INVALID_KEY';
                } else if (error.message.includes('not found')) {
                    console.log('❌ Projeto: Projeto não encontrado');
                    this.status.project = 'NOT_FOUND';
                } else {
                    console.log(`⚠️  Projeto: Ativo mas com problemas - ${error.message}`);
                    this.status.project = 'ACTIVE_WITH_ISSUES';
                }
            } else {
                console.log('✅ Projeto: Ativo e funcionando');
                this.status.project = 'ACTIVE';
            }
        } catch (err) {
            console.log(`❌ Projeto: Erro de conexão - ${err.message}`);
            this.status.project = 'CONNECTION_ERROR';
        }
    }

    /**
     * Executar verificação completa
     */
    async runFullCheck() {
        console.log('🚀 VERIFICANDO STATUS COMPLETO DO SUPABASE');
        console.log('=' * 50);

        await this.checkConnection();
        await this.checkTables();
        await this.checkRLS();
        await this.checkProject();

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 RELATÓRIO COMPLETO');
        console.log('=' * 50);
        
        console.log(`🔌 Conexão: ${this.status.connection}`);
        if (this.status.connectionError) {
            console.log(`   Erro: ${this.status.connectionError}`);
        }

        console.log(`🏗️  Projeto: ${this.status.project}`);

        console.log('\n📋 Status das Tabelas:');
        Object.entries(this.status.tables).forEach(([table, info]) => {
            console.log(`  ${table}: ${info.exists ? 'Existe' : 'Não existe'} - ${info.accessible ? 'Acessível' : 'Não acessível'}`);
            if (info.error) {
                console.log(`    Erro: ${info.error}`);
            }
        });

        console.log('\n🔒 Status do RLS:');
        Object.entries(this.status.rls).forEach(([table, status]) => {
            console.log(`  ${table}: ${status}`);
        });

        console.log('\n🎯 Verificação concluída!');
    }
}

// Executar verificação
async function main() {
    const checker = new SupabaseStatusChecker();
    await checker.runFullCheck();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SupabaseStatusChecker;
