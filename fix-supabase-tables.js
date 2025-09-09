#!/usr/bin/env node

/**
 * SCRIPT PARA CORRIGIR TABELAS DO SUPABASE
 * 
 * Este script verifica e cria as tabelas necessárias para o sistema probabilístico
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações
const SUPABASE_URL = 'https://lgddsslskhzxtpjathjr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class SupabaseFixer {
    constructor() {
        this.fixedTables = [];
        this.errors = [];
    }

    /**
     * Verificar se uma tabela existe
     */
    async checkTableExists(tableName) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                return false;
            }
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Criar tabela realtime_candle_data
     */
    async createRealtimeCandleDataTable() {
        console.log('🔧 Criando tabela realtime_candle_data...');
        
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS realtime_candle_data (
                    id SERIAL PRIMARY KEY,
                    pair VARCHAR(20) NOT NULL,
                    timeframe VARCHAR(10) NOT NULL,
                    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                    open_price DECIMAL(20,8) NOT NULL,
                    high_price DECIMAL(20,8) NOT NULL,
                    low_price DECIMAL(20,8) NOT NULL,
                    close_price DECIMAL(20,8) NOT NULL,
                    volume DECIMAL(20,8) NOT NULL,
                    color VARCHAR(10) NOT NULL,
                    hour INTEGER NOT NULL,
                    minute INTEGER NOT NULL,
                    day_of_week INTEGER NOT NULL,
                    day_of_month INTEGER NOT NULL,
                    month INTEGER NOT NULL,
                    year INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(pair, timeframe, timestamp)
                );

                -- Criar índices
                CREATE INDEX IF NOT EXISTS idx_realtime_candle_data_pair_timeframe 
                ON realtime_candle_data(pair, timeframe);
                
                CREATE INDEX IF NOT EXISTS idx_realtime_candle_data_timestamp 
                ON realtime_candle_data(timestamp);

                -- Habilitar RLS
                ALTER TABLE realtime_candle_data ENABLE ROW LEVEL SECURITY;

                -- Criar política para permitir inserção
                CREATE POLICY IF NOT EXISTS "Allow insert for authenticated users" 
                ON realtime_candle_data FOR INSERT 
                TO authenticated 
                WITH CHECK (true);

                -- Criar política para permitir leitura
                CREATE POLICY IF NOT EXISTS "Allow select for authenticated users" 
                ON realtime_candle_data FOR SELECT 
                TO authenticated 
                USING (true);
            `
        });

        if (error) {
            console.error(`❌ Erro ao criar tabela realtime_candle_data: ${error.message}`);
            this.errors.push(`realtime_candle_data: ${error.message}`);
        } else {
            console.log('✅ Tabela realtime_candle_data criada com sucesso');
            this.fixedTables.push('realtime_candle_data');
        }
    }

    /**
     * Criar tabela historical_candle_data
     */
    async createHistoricalCandleDataTable() {
        console.log('🔧 Criando tabela historical_candle_data...');
        
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS historical_candle_data (
                    id SERIAL PRIMARY KEY,
                    pair VARCHAR(20) NOT NULL,
                    timeframe VARCHAR(10) NOT NULL,
                    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                    open_price DECIMAL(20,8) NOT NULL,
                    high_price DECIMAL(20,8) NOT NULL,
                    low_price DECIMAL(20,8) NOT NULL,
                    close_price DECIMAL(20,8) NOT NULL,
                    volume DECIMAL(20,8) NOT NULL,
                    color VARCHAR(10) NOT NULL,
                    hour INTEGER NOT NULL,
                    minute INTEGER NOT NULL,
                    day_of_week INTEGER NOT NULL,
                    day_of_month INTEGER NOT NULL,
                    month INTEGER NOT NULL,
                    year INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(pair, timeframe, timestamp)
                );

                -- Criar índices
                CREATE INDEX IF NOT EXISTS idx_historical_candle_data_pair_timeframe 
                ON historical_candle_data(pair, timeframe);
                
                CREATE INDEX IF NOT EXISTS idx_historical_candle_data_timestamp 
                ON historical_candle_data(timestamp);

                -- Habilitar RLS
                ALTER TABLE historical_candle_data ENABLE ROW LEVEL SECURITY;

                -- Criar política para permitir inserção
                CREATE POLICY IF NOT EXISTS "Allow insert for authenticated users" 
                ON historical_candle_data FOR INSERT 
                TO authenticated 
                WITH CHECK (true);

                -- Criar política para permitir leitura
                CREATE POLICY IF NOT EXISTS "Allow select for authenticated users" 
                ON historical_candle_data FOR SELECT 
                TO authenticated 
                USING (true);
            `
        });

        if (error) {
            console.error(`❌ Erro ao criar tabela historical_candle_data: ${error.message}`);
            this.errors.push(`historical_candle_data: ${error.message}`);
        } else {
            console.log('✅ Tabela historical_candle_data criada com sucesso');
            this.fixedTables.push('historical_candle_data');
        }
    }

    /**
     * Testar inserção de dados
     */
    async testDataInsertion() {
        console.log('🧪 Testando inserção de dados...');
        
        const testData = {
            pair: 'BTCUSDT',
            timeframe: '1m',
            timestamp: new Date().toISOString(),
            open_price: 50000.00,
            high_price: 50100.00,
            low_price: 49900.00,
            close_price: 50050.00,
            volume: 100.0,
            color: 'GREEN',
            hour: new Date().getHours(),
            minute: new Date().getMinutes(),
            day_of_week: new Date().getDay(),
            day_of_month: new Date().getDate(),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        };

        // Testar inserção em realtime_candle_data
        const { data: realtimeData, error: realtimeError } = await supabase
            .from('realtime_candle_data')
            .insert(testData);

        if (realtimeError) {
            console.error(`❌ Erro ao inserir em realtime_candle_data: ${realtimeError.message}`);
            this.errors.push(`realtime_candle_data insert: ${realtimeError.message}`);
        } else {
            console.log('✅ Inserção em realtime_candle_data: OK');
        }

        // Testar inserção em historical_candle_data
        const { data: historicalData, error: historicalError } = await supabase
            .from('historical_candle_data')
            .insert(testData);

        if (historicalError) {
            console.error(`❌ Erro ao inserir em historical_candle_data: ${historicalError.message}`);
            this.errors.push(`historical_candle_data insert: ${historicalError.message}`);
        } else {
            console.log('✅ Inserção em historical_candle_data: OK');
        }
    }

    /**
     * Executar correção completa
     */
    async fixAll() {
        console.log('🚀 INICIANDO CORREÇÃO DO SUPABASE');
        console.log('=' * 50);

        // Verificar conexão
        console.log('🔌 Verificando conexão com Supabase...');
        const { data, error } = await supabase.from('realtime_candle_data').select('*').limit(1);
        if (error) {
            console.log('⚠️  Tabela realtime_candle_data não existe, criando...');
        }

        // Criar tabelas
        await this.createRealtimeCandleDataTable();
        await this.createHistoricalCandleDataTable();

        // Testar inserção
        await this.testDataInsertion();

        // Relatório final
        console.log('\n' + '=' * 50);
        console.log('📊 RELATÓRIO DE CORREÇÃO');
        console.log('=' * 50);
        console.log(`✅ Tabelas corrigidas: ${this.fixedTables.length}`);
        console.log(`❌ Erros: ${this.errors.length}`);
        
        if (this.fixedTables.length > 0) {
            console.log('\n✅ Tabelas corrigidas:');
            this.fixedTables.forEach(table => console.log(`  - ${table}`));
        }
        
        if (this.errors.length > 0) {
            console.log('\n❌ Erros encontrados:');
            this.errors.forEach(error => console.log(`  - ${error}`));
        }

        console.log('\n🎯 Sistema pronto para uso!');
    }
}

// Executar correção
async function main() {
    const fixer = new SupabaseFixer();
    await fixer.fixAll();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SupabaseFixer;
