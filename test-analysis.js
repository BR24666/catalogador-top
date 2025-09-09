#!/usr/bin/env node

/**
 * SCRIPT DE TESTE PARA ANÁLISE PROBABILÍSTICA
 * 
 * Este script testa as funções de análise probabilística
 * com dados de exemplo para verificar se estão funcionando corretamente.
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class AnalysisTester {
    constructor() {
        this.testResults = [];
    }

    /**
     * Executar todos os testes
     */
    async runAllTests() {
        console.log('🧪 INICIANDO TESTES DE ANÁLISE PROBABILÍSTICA');
        console.log('=' * 50);

        // Teste 1: Verificar se as tabelas existem
        await this.testTableExistence();

        // Teste 2: Verificar se as estratégias foram inseridas
        await this.testStrategiesInsertion();

        // Teste 3: Testar análise MHI
        await this.testMHIAnalysis();

        // Teste 4: Testar análise de minoria
        await this.testMinorityAnalysis();

        // Teste 5: Testar análise de três soldados
        await this.testThreeSoldiersAnalysis();

        // Teste 6: Testar análise de alternância 2x2
        await this.testAlternationAnalysis();

        // Teste 7: Testar função principal de análise
        await this.testMainAnalysisFunction();

        // Relatório final
        this.printTestReport();
    }

    /**
     * Teste 1: Verificar existência das tabelas
     */
    async testTableExistence() {
        console.log('\n📋 Teste 1: Verificando existência das tabelas...');
        
        const tables = [
            'historical_candles',
            'accuracy_cycles',
            'probabilistic_signals',
            'temporal_patterns',
            'probabilistic_strategies',
            'opportunity_alerts',
            'system_config_v2'
        ];

        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                if (error) {
                    this.testResults.push({
                        test: `Tabela ${table}`,
                        status: 'FAILED',
                        message: error.message
                    });
                    console.log(`❌ Tabela ${table}: ERRO - ${error.message}`);
                } else {
                    this.testResults.push({
                        test: `Tabela ${table}`,
                        status: 'PASSED',
                        message: 'Tabela existe e acessível'
                    });
                    console.log(`✅ Tabela ${table}: OK`);
                }
            } catch (err) {
                this.testResults.push({
                    test: `Tabela ${table}`,
                    status: 'FAILED',
                    message: err.message
                });
                console.log(`❌ Tabela ${table}: ERRO - ${err.message}`);
            }
        }
    }

    /**
     * Teste 2: Verificar inserção das estratégias
     */
    async testStrategiesInsertion() {
        console.log('\n📋 Teste 2: Verificando estratégias inseridas...');
        
        try {
            const { data, error } = await supabase
                .from('probabilistic_strategies')
                .select('name, is_active')
                .order('name');

            if (error) {
                this.testResults.push({
                    test: 'Estratégias inseridas',
                    status: 'FAILED',
                    message: error.message
                });
                console.log(`❌ Erro ao buscar estratégias: ${error.message}`);
                return;
            }

            const expectedStrategies = [
                'MHI_Majority',
                'Minority_Reversal',
                'Three_Soldiers_Crows',
                'Color_Alternation_2x2',
                'Strong_Candle_Post_Sequence',
                'Single_Color_Engulfing',
                'First_Candle_Quadrant_M5',
                'Post_Doji_Reversal',
                'Odd_Sequence_Reversal',
                'Three_Valleys_Peaks'
            ];

            const foundStrategies = data.map(s => s.name);
            const missingStrategies = expectedStrategies.filter(s => !foundStrategies.includes(s));

            if (missingStrategies.length === 0) {
                this.testResults.push({
                    test: 'Estratégias inseridas',
                    status: 'PASSED',
                    message: `Todas as ${expectedStrategies.length} estratégias encontradas`
                });
                console.log(`✅ Estratégias: ${data.length} encontradas`);
            } else {
                this.testResults.push({
                    test: 'Estratégias inseridas',
                    status: 'FAILED',
                    message: `Estratégias faltando: ${missingStrategies.join(', ')}`
                });
                console.log(`❌ Estratégias faltando: ${missingStrategies.join(', ')}`);
            }

        } catch (err) {
            this.testResults.push({
                test: 'Estratégias inseridas',
                status: 'FAILED',
                message: err.message
            });
            console.log(`❌ Erro: ${err.message}`);
        }
    }

    /**
     * Teste 3: Testar análise MHI
     */
    async testMHIAnalysis() {
        console.log('\n📋 Teste 3: Testando análise MHI...');
        
        try {
            // Dados de teste: Verde, Vermelha, Verde (maioria Verde)
            const testCandles = [
                {
                    timestamp: new Date(Date.now() - 180000).toISOString(),
                    color: 'GREEN',
                    open_price: 50000,
                    close_price: 50100
                },
                {
                    timestamp: new Date(Date.now() - 120000).toISOString(),
                    color: 'RED',
                    open_price: 50100,
                    close_price: 50000
                },
                {
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                    color: 'GREEN',
                    open_price: 50000,
                    close_price: 50100
                }
            ];

            const { data, error } = await supabase
                .rpc('analyze_mhi_strategy', {
                    p_pair: 'BTCUSDT',
                    p_timeframe: '1m',
                    p_candles: JSON.stringify(testCandles)
                });

            if (error) {
                this.testResults.push({
                    test: 'Análise MHI',
                    status: 'FAILED',
                    message: error.message
                });
                console.log(`❌ Erro na análise MHI: ${error.message}`);
            } else if (data && data.length > 0) {
                const result = data[0];
                this.testResults.push({
                    test: 'Análise MHI',
                    status: 'PASSED',
                    message: `Sinal: ${result.signal_type}, Confiança: ${result.confidence_score}%`
                });
                console.log(`✅ MHI: ${result.signal_type} (${result.confidence_score}%)`);
            } else {
                this.testResults.push({
                    test: 'Análise MHI',
                    status: 'FAILED',
                    message: 'Nenhum resultado retornado'
                });
                console.log(`❌ MHI: Nenhum resultado`);
            }

        } catch (err) {
            this.testResults.push({
                test: 'Análise MHI',
                status: 'FAILED',
                message: err.message
            });
            console.log(`❌ Erro MHI: ${err.message}`);
        }
    }

    /**
     * Teste 4: Testar análise de minoria
     */
    async testMinorityAnalysis() {
        console.log('\n📋 Teste 4: Testando análise de minoria...');
        
        try {
            // Dados de teste: Verde, Verde, Vermelha (minoria Vermelha)
            const testCandles = [
                {
                    timestamp: new Date(Date.now() - 180000).toISOString(),
                    color: 'GREEN',
                    open_price: 50000,
                    close_price: 50100
                },
                {
                    timestamp: new Date(Date.now() - 120000).toISOString(),
                    color: 'GREEN',
                    open_price: 50100,
                    close_price: 50200
                },
                {
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                    color: 'RED',
                    open_price: 50200,
                    close_price: 50100
                }
            ];

            const { data, error } = await supabase
                .rpc('analyze_minority_strategy', {
                    p_pair: 'BTCUSDT',
                    p_timeframe: '1m',
                    p_candles: JSON.stringify(testCandles)
                });

            if (error) {
                this.testResults.push({
                    test: 'Análise Minoria',
                    status: 'FAILED',
                    message: error.message
                });
                console.log(`❌ Erro na análise Minoria: ${error.message}`);
            } else if (data && data.length > 0) {
                const result = data[0];
                this.testResults.push({
                    test: 'Análise Minoria',
                    status: 'PASSED',
                    message: `Sinal: ${result.signal_type}, Confiança: ${result.confidence_score}%`
                });
                console.log(`✅ Minoria: ${result.signal_type} (${result.confidence_score}%)`);
            } else {
                this.testResults.push({
                    test: 'Análise Minoria',
                    status: 'FAILED',
                    message: 'Nenhum resultado retornado'
                });
                console.log(`❌ Minoria: Nenhum resultado`);
            }

        } catch (err) {
            this.testResults.push({
                test: 'Análise Minoria',
                status: 'FAILED',
                message: err.message
            });
            console.log(`❌ Erro Minoria: ${err.message}`);
        }
    }

    /**
     * Teste 5: Testar análise de três soldados
     */
    async testThreeSoldiersAnalysis() {
        console.log('\n📋 Teste 5: Testando análise três soldados...');
        
        try {
            // Dados de teste: Verde, Verde, Verde (três soldados)
            const testCandles = [
                {
                    timestamp: new Date(Date.now() - 180000).toISOString(),
                    color: 'GREEN',
                    open_price: 50000,
                    close_price: 50100
                },
                {
                    timestamp: new Date(Date.now() - 120000).toISOString(),
                    color: 'GREEN',
                    open_price: 50100,
                    close_price: 50200
                },
                {
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                    color: 'GREEN',
                    open_price: 50200,
                    close_price: 50300
                }
            ];

            const { data, error } = await supabase
                .rpc('analyze_three_soldiers_crows_strategy', {
                    p_pair: 'BTCUSDT',
                    p_timeframe: '1m',
                    p_candles: JSON.stringify(testCandles)
                });

            if (error) {
                this.testResults.push({
                    test: 'Análise Três Soldados',
                    status: 'FAILED',
                    message: error.message
                });
                console.log(`❌ Erro na análise Três Soldados: ${error.message}`);
            } else if (data && data.length > 0) {
                const result = data[0];
                this.testResults.push({
                    test: 'Análise Três Soldados',
                    status: 'PASSED',
                    message: `Sinal: ${result.signal_type}, Confiança: ${result.confidence_score}%`
                });
                console.log(`✅ Três Soldados: ${result.signal_type} (${result.confidence_score}%)`);
            } else {
                this.testResults.push({
                    test: 'Análise Três Soldados',
                    status: 'FAILED',
                    message: 'Nenhum resultado retornado'
                });
                console.log(`❌ Três Soldados: Nenhum resultado`);
            }

        } catch (err) {
            this.testResults.push({
                test: 'Análise Três Soldados',
                status: 'FAILED',
                message: err.message
            });
            console.log(`❌ Erro Três Soldados: ${err.message}`);
        }
    }

    /**
     * Teste 6: Testar análise de alternância 2x2
     */
    async testAlternationAnalysis() {
        console.log('\n📋 Teste 6: Testando análise alternância 2x2...');
        
        try {
            // Dados de teste: Verde, Verde, Vermelha, Vermelha (padrão 2x2)
            const testCandles = [
                {
                    timestamp: new Date(Date.now() - 240000).toISOString(),
                    color: 'GREEN',
                    open_price: 50000,
                    close_price: 50100
                },
                {
                    timestamp: new Date(Date.now() - 180000).toISOString(),
                    color: 'GREEN',
                    open_price: 50100,
                    close_price: 50200
                },
                {
                    timestamp: new Date(Date.now() - 120000).toISOString(),
                    color: 'RED',
                    open_price: 50200,
                    close_price: 50100
                },
                {
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                    color: 'RED',
                    open_price: 50100,
                    close_price: 50000
                }
            ];

            const { data, error } = await supabase
                .rpc('analyze_alternation_2x2_strategy', {
                    p_pair: 'BTCUSDT',
                    p_timeframe: '1m',
                    p_candles: JSON.stringify(testCandles)
                });

            if (error) {
                this.testResults.push({
                    test: 'Análise Alternância 2x2',
                    status: 'FAILED',
                    message: error.message
                });
                console.log(`❌ Erro na análise Alternância 2x2: ${error.message}`);
            } else if (data && data.length > 0) {
                const result = data[0];
                this.testResults.push({
                    test: 'Análise Alternância 2x2',
                    status: 'PASSED',
                    message: `Sinal: ${result.signal_type}, Confiança: ${result.confidence_score}%`
                });
                console.log(`✅ Alternância 2x2: ${result.signal_type} (${result.confidence_score}%)`);
            } else {
                this.testResults.push({
                    test: 'Análise Alternância 2x2',
                    status: 'FAILED',
                    message: 'Nenhum resultado retornado'
                });
                console.log(`❌ Alternância 2x2: Nenhum resultado`);
            }

        } catch (err) {
            this.testResults.push({
                test: 'Análise Alternância 2x2',
                status: 'FAILED',
                message: err.message
            });
            console.log(`❌ Erro Alternância 2x2: ${err.message}`);
        }
    }

    /**
     * Teste 7: Testar função principal de análise
     */
    async testMainAnalysisFunction() {
        console.log('\n📋 Teste 7: Testando função principal de análise...');
        
        try {
            const { data, error } = await supabase
                .rpc('analyze_all_probabilistic_strategies', {
                    p_pair: 'BTCUSDT',
                    p_timeframe: '1m',
                    p_limit_candles: 10
                });

            if (error) {
                this.testResults.push({
                    test: 'Função Principal de Análise',
                    status: 'FAILED',
                    message: error.message
                });
                console.log(`❌ Erro na função principal: ${error.message}`);
            } else if (data && data.length > 0) {
                this.testResults.push({
                    test: 'Função Principal de Análise',
                    status: 'PASSED',
                    message: `${data.length} estratégias analisadas`
                });
                console.log(`✅ Função principal: ${data.length} estratégias analisadas`);
                
                // Mostrar resultados
                data.forEach(result => {
                    console.log(`   - ${result.strategy_name}: ${result.signal_type} (${result.confidence_score}%)`);
                });
            } else {
                this.testResults.push({
                    test: 'Função Principal de Análise',
                    status: 'FAILED',
                    message: 'Nenhum resultado retornado'
                });
                console.log(`❌ Função principal: Nenhum resultado`);
            }

        } catch (err) {
            this.testResults.push({
                test: 'Função Principal de Análise',
                status: 'FAILED',
                message: err.message
            });
            console.log(`❌ Erro função principal: ${err.message}`);
        }
    }

    /**
     * Imprimir relatório final dos testes
     */
    printTestReport() {
        console.log('\n' + '=' * 50);
        console.log('📊 RELATÓRIO FINAL DOS TESTES');
        console.log('=' * 50);

        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const total = this.testResults.length;

        console.log(`✅ Testes aprovados: ${passed}/${total}`);
        console.log(`❌ Testes falharam: ${failed}/${total}`);
        console.log(`📈 Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ TESTES QUE FALHARAM:');
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(result => {
                    console.log(`   - ${result.test}: ${result.message}`);
                });
        }

        console.log('\n' + '=' * 50);
        
        if (failed === 0) {
            console.log('🎉 TODOS OS TESTES PASSARAM! Sistema pronto para uso.');
        } else {
            console.log('⚠️  Alguns testes falharam. Verifique os erros acima.');
        }
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    const tester = new AnalysisTester();
    tester.runAllTests().catch(console.error);
}

module.exports = AnalysisTester;
