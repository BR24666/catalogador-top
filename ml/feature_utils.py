"""
Utilitários para extração e processamento de features
"""
import numpy as np
import pandas as pd


def featurize_from_candles(df):
    """
    Extrai features de um DataFrame de candles
    
    Args:
        df: DataFrame com colunas ['timestamp', 'open', 'high', 'low', 'close', 'volume']
    
    Returns:
        dict com features extraídas
    """
    if len(df) < 5:
        return None
    
    closes = df['close'].astype(float).values
    opens = df['open'].astype(float).values
    highs = df['high'].astype(float).values
    lows = df['low'].astype(float).values
    volumes = df['volume'].astype(float).values

    features = {}

    # Preços básicos
    features['last_close'] = closes[-1]
    features['last_open'] = opens[-1]
    features['last_high'] = highs[-1]
    features['last_low'] = lows[-1]

    # Returns
    returns = (closes[1:] - closes[:-1]) / closes[:-1]
    features['mean_return_5'] = np.mean(returns[-5:]) if len(returns) >= 5 else 0
    features['mean_return_10'] = np.mean(returns[-10:]) if len(returns) >= 10 else 0
    features['std_return_10'] = np.std(returns[-10:]) if len(returns) >= 10 else 0

    # Body sizes
    bodies = np.abs(closes - opens)
    features['avg_body_5'] = np.mean(bodies[-5:])
    features['avg_body_10'] = np.mean(bodies[-10:]) if len(bodies) >= 10 else 0
    features['max_body_10'] = np.max(bodies[-10:]) if len(bodies) >= 10 else 0

    # Wicks
    upper_wicks = highs - np.maximum(opens, closes)
    lower_wicks = np.minimum(opens, closes) - lows
    features['avg_upper_wick_5'] = np.mean(upper_wicks[-5:])
    features['avg_lower_wick_5'] = np.mean(lower_wicks[-5:])

    # Direção
    bulls = np.sum(closes > opens)
    bears = np.sum(closes < opens)
    features['bull_count'] = int(bulls)
    features['bear_count'] = int(bears)
    features['bull_ratio'] = bulls / len(closes)

    # High/Low ranges
    features['max_high_10'] = np.max(highs[-10:]) if len(highs) >= 10 else highs[-1]
    features['min_low_10'] = np.min(lows[-10:]) if len(lows) >= 10 else lows[-1]
    features['price_range_10'] = features['max_high_10'] - features['min_low_10']

    # Volume
    features['avg_volume_5'] = np.mean(volumes[-5:])
    features['avg_volume_10'] = np.mean(volumes[-10:]) if len(volumes) >= 10 else 0
    features['last_volume'] = volumes[-1]

    # RSI
    features['rsi_14'] = calculate_rsi(closes, 14)

    # Moving averages
    features['sma_5'] = np.mean(closes[-5:])
    features['sma_10'] = np.mean(closes[-10:]) if len(closes) >= 10 else closes[-1]
    features['sma_20'] = np.mean(closes[-20:]) if len(closes) >= 20 else closes[-1]

    # Price vs MAs
    features['price_vs_sma5'] = (features['last_close'] - features['sma_5']) / features['sma_5']
    features['price_vs_sma10'] = (features['last_close'] - features['sma_10']) / features['sma_10'] if features['sma_10'] > 0 else 0

    # Time features
    ts = pd.to_datetime(df['timestamp'].iloc[-1])
    features['hour'] = ts.hour
    features['minute'] = ts.minute
    features['weekday'] = ts.weekday()

    # Patterns
    features['is_doji'] = int(abs(closes[-1] - opens[-1]) < (bodies[-1] * 0.1))
    features['is_hammer'] = int(lower_wicks[-1] > (bodies[-1] * 2))

    return features


def calculate_rsi(prices, period=14):
    """Calcula RSI (Relative Strength Index)"""
    if len(prices) < period + 1:
        return 50

    changes = np.diff(prices)
    gains = np.where(changes > 0, changes, 0)
    losses = np.where(changes < 0, -changes, 0)

    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])

    if avg_loss == 0:
        return 100

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))

    return rsi


def normalize_features(features_dict, scaler=None):
    """
    Normaliza features (opcional)
    """
    # Por enquanto retorna como está
    # Pode adicionar StandardScaler ou MinMaxScaler aqui
    return features_dict

