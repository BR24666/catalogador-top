#!/usr/bin/env node

/**
 * SCRIPT DE INICIALIZAÇÃO RÁPIDA
 * 
 * Este script executa todo o processo de inicialização:
 * 1. Verifica dependências
 * 2. Testa conexão com Supabase
 * 3. Executa testes básicos
 * 4. Inicia coleta de dados históricos (opcional)
 * 5. Inicia sistema de tempo real
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

class QuickStart {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.steps = [];
    }

    /**
     * Executar inicialização completa
     */
    async run() {
        console.log('🚀 INICIALIZAÇÃO RÁPIDA DO CATALOGADOR PROBABILÍSTICO');
        console.log('=' * 60);

        try {
            // Passo 1: Verificar dependências
            await this.checkDependencies();

            // Passo 2: Verificar conexão Supabase
            await this.checkSupabaseConnection();

            // Passo 3: Verificar estrutura do banco
            await this.checkDatabaseStructure();

            // Passo 4: Executar testes básicos
            await this.runBasicTests();

            // Passo 5: Perguntar sobre coleta de dados
            await this.askAboutDataCollection();

            // Passo 6: Iniciar sistema
            await this.startSystem();

            console.log('\n🎉 INICIALIZAÇÃO CONCLUÍDA COM SUCESSO!');
            this.printSummary();

        } catch (error) {
            console.error('\n❌ ERRO NA INICIALIZAÇÃO:', error.message);
            this.printErrorSummary();
            process.exit(1);
        }
    }

    /**
     * Verificar dependências
     */
    async checkDependencies() {
        console.log('\n📦 Verificando dependências...');
        
        const packageJsonPath = path.join(__dirname, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error('package.json não encontrado');
        }

        const nodeModulesPath = path.join(__dirname, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            console.log('⚠️  node_modules não encontrado. Execute: npm install');
            throw new Error('Dependências não instaladas');
        }

        this.steps.push({ step: 'Dependências', status: 'OK', message: 'Todas as dependências encontradas' });
        console.log('✅ Dependências: OK');
    }

    /**
     * Verificar conexão Supabase
     */
    async checkSupabaseConnection() {
        console.log('\n🔗 Verificando conexão com Supabase...');
        
        try {
            const { data, error } = await this.supabase
                .from('probabilistic_strategies')
                .select('count')
                .limit(1);

            if (error) {
                throw new Error(`Erro de conexão: ${error.message}`);
            }

            this.steps.push({ step: 'Conexão Supabase', status: 'OK', message: 'Conexão estabelecida' });
            console.log('✅ Supabase: Conectado');
        } catch (error) {
            this.steps.push({ step: 'Conexão Supabase', status: 'ERRO', message: error.message });
            throw error;
        }
    }

    /**
     * Verificar estrutura do banco
     */
    async checkDatabaseStructure() {
        console.log('\n🏗️  Verificando estrutura do banco...');
        
        const tables = [
            'historical_candles',
            'accuracy_cycles',
            'probabilistic_strategies',
            'opportunity_alerts'
        ];

        let allTablesExist = true;
        const missingTables = [];

        for (const table of tables) {
            try {
                const { error } = await this.supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    allTablesExist = false;
                    missingTables.push(table);
                }
            } catch (err) {
                allTablesExist = false;
                missingTables.push(table);
            }
        }

        if (!allTablesExist) {
            const message = `Tabelas faltando: ${missingTables.join(', ')}`;
            this.steps.push({ step: 'Estrutura do Banco', status: 'ERRO', message });
            throw new Error(message);
        }

        this.steps.push({ step: 'Estrutura do Banco', status: 'OK', message: 'Todas as tabelas existem' });
        console.log('✅ Banco de dados: Estrutura OK');
    }

    /**
     * Executar testes básicos
     */
    async runBasicTests() {
        console.log('\n🧪 Executando testes básicos...');
        
        try {
            // Teste 1: Verificar estratégias
            const { data: strategies, error: strategiesError } = await this.supabase
                .from('probabilistic_strategies')
                .select('name, is_active')
                .eq('is_active', true);

            if (strategiesError) {
                throw new Error(`Erro ao buscar estratégias: ${strategiesError.message}`);
            }

            if (!strategies || strategies.length === 0) {
                throw new Error('Nenhuma estratégia ativa encontrada');
            }

            // Teste 2: Verificar funções
            const { data: health, error: healthError } = await this.supabase
                .rpc('get_probabilistic_system_health');

            if (healthError) {
                console.log('⚠️  Função de saúde não disponível (normal se ainda não houver dados)');
            }

            this.steps.push({ step: 'Testes Básicos', status: 'OK', message: `${strategies.length} estratégias ativas` });
            console.log(`✅ Testes: ${strategies.length} estratégias ativas`);
        } catch (error) {
            this.steps.push({ step: 'Testes Básicos', status: 'ERRO', message: error.message });
            throw error;
        }
    }

    /**
     * Perguntar sobre coleta de dados
     */
    async askAboutDataCollection() {
        console.log('\n📊 COLETA DE DADOS HISTÓRICOS');
        console.log('Para análise probabilística eficaz, precisamos de dados históricos.');
        console.log('Recomendamos coletar 6 meses de dados para cada par.');
        console.log('Isso pode levar 2-4 horas, mas é essencial para o funcionamento.');
        
        // Em um ambiente real, você usaria readline para interação
        // Por agora, vamos assumir que o usuário quer coletar
        console.log('\n🔄 Iniciando coleta de dados históricos...');
        console.log('⏳ Isso pode levar algumas horas. O processo continuará em background.');
        
        // Iniciar coleta em background
        const { spawn } = require('child_process');
        const collector = spawn('node', ['historical-data-collector.js'], {
            stdio: 'inherit',
            detached: true
        });
        
        collector.unref(); // Permitir que o processo pai termine
        
        this.steps.push({ step: 'Coleta de Dados', status: 'INICIADA', message: 'Coleta em background' });
        console.log('✅ Coleta iniciada em background');
    }

    /**
     * Iniciar sistema
     */
    async startSystem() {
        console.log('\n🚀 Iniciando sistema de tempo real...');
        
        // Iniciar sistema de tempo real
        const { spawn } = require('child_process');
        const realtime = spawn('node', ['realtime-data-updater.js'], {
            stdio: 'inherit',
            detached: true
        });
        
        realtime.unref(); // Permitir que o processo pai termine
        
        this.steps.push({ step: 'Sistema de Tempo Real', status: 'INICIADO', message: 'Sistema ativo' });
        console.log('✅ Sistema de tempo real iniciado');
    }

    /**
     * Imprimir resumo
     */
    printSummary() {
        console.log('\n' + '=' * 60);
        console.log('📊 RESUMO DA INICIALIZAÇÃO');
        console.log('=' * 60);

        this.steps.forEach(step => {
            const status = step.status === 'OK' ? '✅' : step.status === 'ERRO' ? '❌' : '🔄';
            console.log(`${status} ${step.step}: ${step.message}`);
        });

        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('1. Aguarde a coleta de dados históricos (2-4 horas)');
        console.log('2. Monitore o sistema via Supabase Dashboard');
        console.log('3. Verifique alertas em opportunity_alerts');
        console.log('4. Ajuste thresholds conforme necessário');
        console.log('5. Analise padrões temporais identificados');

        console.log('\n📞 COMANDOS ÚTEIS:');
        console.log('- npm test                    # Executar testes');
        console.log('- npm run collect-historical  # Coletar dados históricos');
        console.log('- npm run start-realtime     # Iniciar tempo real');
        console.log('- node test-analysis.js      # Testar análises');

        console.log('\n🎉 Sistema pronto para identificar oportunidades!');
    }

    /**
     * Imprimir resumo de erros
     */
    printErrorSummary() {
        console.log('\n' + '=' * 60);
        console.log('❌ RESUMO DE ERROS');
        console.log('=' * 60);

        this.steps.forEach(step => {
            if (step.status === 'ERRO') {
                console.log(`❌ ${step.step}: ${step.message}`);
            }
        });

        console.log('\n🛠️  SOLUÇÕES:');
        console.log('1. Execute: npm install');
        console.log('2. Verifique as chaves do Supabase');
        console.log('3. Execute: npm test');
        console.log('4. Verifique a conexão de internet');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const quickStart = new QuickStart();
    quickStart.run().catch(console.error);
}

module.exports = QuickStart;
