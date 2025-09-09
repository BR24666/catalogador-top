#!/usr/bin/env node

/**
 * SCRIPT PARA CORRIGIR POLÍTICAS RLS
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class RLSPolicyFixer {
    constructor() {
        this.results = [];
    }

    /**
     * Tentar desabilitar RLS em uma tabela
     */
    async disableRLS(tableName) {
        console.log(`\n🔧 Tentando desabilitar RLS na tabela: ${tableName}`);
        
        try {
            // Tentar desabilitar RLS usando SQL
            const { data, error } = await supabase.rpc('exec_sql', {
                sql: `ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY;`
            });

            if (error) {
                console.log(`❌ Erro ao desabilitar RLS: ${error.message}`);
                this.results.push({ table: tableName, action: 'Desabilitar RLS', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log(`✅ RLS desabilitado com sucesso!`);
                this.results.push({ table: tableName, action: 'Desabilitar RLS', status: 'OK', message: 'RLS desabilitado' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ table: tableName, action: 'Desabilitar RLS', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Tentar criar política permissiva
     */
    async createPermissivePolicy(tableName) {
        console.log(`\n🔧 Tentando criar política permissiva na tabela: ${tableName}`);
        
        try {
            // Tentar criar política permissiva
            const { data, error } = await supabase.rpc('exec_sql', {
                sql: `
                    CREATE POLICY IF NOT EXISTS "Allow all operations" 
                    ON ${tableName} 
                    FOR ALL 
                    TO authenticated 
                    USING (true) 
                    WITH CHECK (true);
                `
            });

            if (error) {
                console.log(`❌ Erro ao criar política: ${error.message}`);
                this.results.push({ table: tableName, action: 'Criar política', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log(`✅ Política criada com sucesso!`);
                this.results.push({ table: tableName, action: 'Criar política', status: 'OK', message: 'Política criada' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ table: tableName, action: 'Criar política', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Testar inserção após correção
     */
    async testInsertAfterFix(tableName) {
        console.log(`\n🧪 Testando inserção após correção na tabela: ${tableName}`);
        
        const testData = {
            pair: 'BTCUSDT',
            timestamp: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase
                .from(tableName)
                .insert(testData);

            if (error) {
                console.log(`❌ Erro na inserção: ${error.message}`);
                this.results.push({ table: tableName, action: 'Teste inserção', status: 'ERROR', message: error.message });
                return false;
            } else {
                console.log(`✅ Inserção funcionou!`);
                this.results.push({ table: tableName, action: 'Teste inserção', status: 'OK', message: 'Inserção funcionou' });
                return true;
            }
        } catch (err) {
            console.log(`❌ Erro: ${err.message}`);
            this.results.push({ table: tableName, action: 'Teste inserção', status: 'ERROR', message: err.message });
            return false;
        }
    }

    /**
     * Executar correção completa
     */
    async fixAllTables() {
        console.log('🚀 CORRIGINDO POLÍTICAS RLS');
        console.log('=' * 50);

        const tables = [
            'candle_data',
            'market_data',
            'trading_signals',
            'realtime_candle_data',
            'historical_candle_data'
        ];

        for (const table of tables) {
            console.log(`\n📋 Processando tabela: ${table}`);
            
            // Tentar desabilitar RLS
            const rlsDisabled = await this.disableRLS(table);
            
            if (!rlsDisabled) {
                // Se não conseguiu desabilitar RLS, tentar criar política permissiva
                await this.createPermissivePolicy(table);
            }
            
            // Testar inserção
            await this.testInsertAfterFix(table);
        }

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 RELATÓRIO DE CORREÇÃO');
        console.log('=' * 50);
        
        const okTests = this.results.filter(r => r.status === 'OK').length;
        const errorTests = this.results.filter(r => r.status === 'ERROR').length;

        console.log(`✅ Sucessos: ${okTests}`);
        console.log(`❌ Erros: ${errorTests}`);

        if (errorTests > 0) {
            console.log('\n❌ Erros encontrados:');
            this.results.filter(r => r.status === 'ERROR').forEach(result => {
                console.log(`  - ${result.table} (${result.action}): ${result.message}`);
            });
        }

        console.log('\n🎯 Correção concluída!');
    }
}

// Executar correção
async function main() {
    const fixer = new RLSPolicyFixer();
    await fixer.fixAllTables();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = RLSPolicyFixer;
