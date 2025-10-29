"""
Script de treinamento do modelo ML
"""
import os
import joblib
import json
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
from feature_utils import featurize_from_candles

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://lgddsslskhzxtpjathjr.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws')
MODEL_PATH = os.getenv('MODEL_PATH', './models/latest_model.joblib')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def load_candles(limit=10000):
    """Carrega candles do Supabase"""
    print(f"📊 Carregando últimos {limit} candles...")
    
    response = supabase.table('candles')\
        .select('*')\
        .order('timestamp', desc=False)\
        .limit(limit)\
        .execute()
    
    data = response.data or []
    df = pd.DataFrame(data)
    
    print(f"✅ {len(df)} candles carregados")
    return df


def build_dataset(df, lookback=30):
    """
    Constrói dataset de treinamento
    
    Args:
        df: DataFrame de candles
        lookback: Número de candles para usar como contexto
    
    Returns:
        X (features), y (labels)
    """
    print(f"🔨 Construindo dataset com lookback={lookback}...")
    
    X = []
    y = []
    feature_names = None
    
    for i in range(lookback, len(df) - 1):
        window = df.iloc[i-lookback:i]
        features = featurize_from_candles(window)
        
        if features is None:
            continue
        
        if feature_names is None:
            feature_names = list(features.keys())
        
        # Label: direção da próxima vela
        next_row = df.iloc[i+1]
        label = 1 if float(next_row['close']) > float(next_row['open']) else 0
        
        X.append(list(features.values()))
        y.append(label)
    
    X_df = pd.DataFrame(X, columns=feature_names)
    y_series = pd.Series(y)
    
    print(f"✅ Dataset construído: {len(X_df)} amostras, {len(feature_names)} features")
    print(f"📊 Distribuição de classes: UP={np.sum(y_series)}, DOWN={len(y_series)-np.sum(y_series)}")
    
    return X_df, y_series


def train_model(X, y):
    """Treina o modelo LightGBM"""
    print("\n🤖 Treinando modelo...")
    
    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )
    
    print(f"📊 Train: {len(X_train)} | Test: {len(X_test)}")
    
    # Modelo
    model = LGBMClassifier(
        n_estimators=1000,
        learning_rate=0.02,
        max_depth=5,
        num_leaves=31,
        random_state=42,
        verbose=-1
    )
    
    model.fit(X_train, y_train)
    
    # Avaliar
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_acc = accuracy_score(y_train, y_pred_train)
    test_acc = accuracy_score(y_test, y_pred_test)
    
    print(f"\n📊 RESULTADOS:")
    print(f"   Train Accuracy: {train_acc*100:.2f}%")
    print(f"   Test Accuracy: {test_acc*100:.2f}%")
    
    print(f"\n📊 Classification Report (Test):")
    print(classification_report(y_test, y_pred_test, target_names=['DOWN', 'UP']))
    
    print(f"\n📊 Confusion Matrix (Test):")
    print(confusion_matrix(y_test, y_pred_test))
    
    # Feature importance
    importances = model.feature_importances_
    feature_importance_df = pd.DataFrame({
        'feature': X.columns,
        'importance': importances
    }).sort_values('importance', ascending=False)
    
    print(f"\n📊 Top 10 Features:")
    print(feature_importance_df.head(10).to_string(index=False))
    
    return model, {
        'train_accuracy': float(train_acc),
        'test_accuracy': float(test_acc),
        'n_samples': len(X),
        'n_features': len(X.columns)
    }


def save_model(model, columns, metrics, df):
    """Salva modelo e registra no Supabase"""
    print(f"\n💾 Salvando modelo em {MODEL_PATH}...")
    
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    trained_at = datetime.utcnow().isoformat()
    version = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    
    artifact = {
        'model': model,
        'columns': columns.tolist() if hasattr(columns, 'tolist') else list(columns),
        'trained_at': trained_at,
        'version': version,
        'metrics': metrics
    }
    
    joblib.dump(artifact, MODEL_PATH)
    print(f"✅ Modelo salvo!")
    
    # Registrar no Supabase
    try:
        supabase.table('model_runs').insert([{
            'model_name': 'lgbm_btc',
            'version': version,
            'params': {
                'n_estimators': 1000,
                'learning_rate': 0.02,
                'max_depth': 5
            },
            'metrics': metrics,
            'data_range': {
                'rows': len(df),
                'date_from': str(df['timestamp'].min()),
                'date_to': str(df['timestamp'].max())
            }
        }]).execute()
        
        print(f"✅ Modelo registrado no Supabase (versão: {version})")
    except Exception as e:
        print(f"⚠️ Erro ao registrar no Supabase: {e}")


def main():
    print("🚀 ========================================")
    print("   TREINAMENTO DO MODELO ML")
    print("   ========================================\n")
    
    # 1. Carregar dados
    df = load_candles(limit=10000)
    
    if len(df) < 100:
        print("❌ Dados insuficientes para treinamento!")
        return
    
    # 2. Construir dataset
    X, y = build_dataset(df, lookback=30)
    
    if len(X) < 100:
        print("❌ Dataset muito pequeno!")
        return
    
    # 3. Treinar
    model, metrics = train_model(X, y)
    
    # 4. Salvar
    save_model(model, X.columns, metrics, df)
    
    print("\n✅ ========================================")
    print("   TREINAMENTO CONCLUÍDO!")
    print("   ========================================")
    print(f"   Test Accuracy: {metrics['test_accuracy']*100:.2f}%")
    print(f"   Modelo: {MODEL_PATH}")
    print("   ========================================\n")


if __name__ == '__main__':
    main()

