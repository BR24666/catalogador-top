@echo off
color 0A
title Sistema ML - Catalogador BTC/USDT

echo.
echo ========================================
echo   SISTEMA ML CATALOGADOR BTC/USDT
echo ========================================
echo.

REM Verificar se Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado!
    echo Por favor, instale Python 3.9+ em https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Verificar se Node esta instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale Node.js 18+ em https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Pre-requisitos verificados
echo.

REM Verificar se modelo existe
if not exist "ml\models\latest_model.joblib" (
    echo ========================================
    echo   TREINAMENTO DO MODELO NECESSARIO
    echo ========================================
    echo.
    echo O modelo ainda nao foi treinado.
    echo Deseja treinar agora? Isso pode levar alguns minutos.
    echo.
    set /p train="Treinar modelo agora? (S/N): "
    
    if /i "%train%"=="S" (
        echo.
        echo Treinando modelo...
        cd ml
        python train.py
        cd ..
        echo.
        echo Modelo treinado!
        echo.
        pause
    ) else (
        echo.
        echo [AVISO] O sistema ML nao funcionara sem o modelo treinado.
        echo Execute: cd ml ^& python train.py
        echo.
        pause
    )
)

echo ========================================
echo   INICIANDO SISTEMA
echo ========================================
echo.
echo Abrindo 3 terminais:
echo   1. ML Server (Python FastAPI) - Porta 8000
echo   2. Backend (Node.js Express) - Porta 3001
echo   3. Frontend (Next.js) - Porta 3000
echo.
echo Aguarde alguns segundos...
echo.

REM Iniciar ML Server
start "ML Server (FastAPI)" cmd /k "cd ml && python serve.py"
timeout /t 2 >nul

REM Iniciar Backend
start "Backend (Node.js)" cmd /k "cd backend && npm start"
timeout /t 2 >nul

REM Iniciar Frontend
start "Frontend (Next.js)" cmd /k "npm run dev"
timeout /t 2 >nul

echo.
echo ========================================
echo   SISTEMA INICIADO!
echo ========================================
echo.
echo Acesse: http://localhost:3000
echo.
echo Monitoramento:
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:3001/health
echo   - ML API:   http://localhost:8000/health
echo.
echo Para parar, feche os 3 terminais que foram abertos.
echo.
pause

