/**
 * CONFIGURAÇÕES DO CATALOGADOR PROBABILÍSTICO
 * 
 * Copie este arquivo para config.js e ajuste as configurações conforme necessário
 */

module.exports = {
    // Supabase Configuration
    supabase: {
        url: 'https://lgddsslskhzxtpjathjr.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws'
    },

    // Trading Pairs Configuration
    trading: {
        pairs: ['BTCUSDT', 'XRPUSDT', 'SOLUSDT', 'EURUSD'],
        timeframe: '1m',
        historicalMonths: 6
    },

    // Data Collection Configuration
    collection: {
        batchSize: 1000,
        rateLimit: 1200, // requests per minute
        retryAttempts: 3,
        retryDelay: 5000
    },

    // Analysis Configuration
    analysis: {
        minAccuracyThreshold: 75.0,
        maxAccuracyThreshold: 100.0,
        minConsecutiveWins: 3,
        confidenceThreshold: 80.0,
        maxCyclesAnalysis: 100
    },

    // Real-time Configuration
    realtime: {
        updateInterval: 60000, // 1 minute
        websocketReconnectDelay: 5000,
        maxConcurrentAnalyses: 10
    },

    // Alert Configuration
    alerts: {
        enabled: true,
        email: '',
        webhookUrl: '',
        minConfidence: 80.0,
        minConsecutiveWins: 3
    },

    // Logging Configuration
    logging: {
        level: 'INFO', // DEBUG, INFO, WARN, ERROR
        debugMode: false,
        logToFile: true,
        logFile: 'catalogador.log'
    },

    // Performance Configuration
    performance: {
        cacheTTL: 300000, // 5 minutes
        memoryLimit: 512, // MB
        maxConnections: 100
    },

    // API Endpoints
    apis: {
        binance: {
            rest: 'https://api.binance.com/api/v3/klines',
            websocket: 'wss://stream.binance.com:9443/ws'
        },
        forex: {
            rest: 'https://api.exchangerate-api.com/v4/historical'
        }
    }
};
