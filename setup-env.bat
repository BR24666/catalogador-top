@echo off
echo Configurando variaveis de ambiente...

REM Backend .env
(
echo # Supabase
echo SUPABASE_URL=https://lgddsslskhzxtpjathjr.supabase.co
echo SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws
echo.
echo # Backend
echo BACKEND_PORT=3001
echo MODEL_SERVER_URL=http://localhost:8000
echo TRADE_CONFIDENCE_THRESHOLD=0.70
echo.
echo # Environment
echo NODE_ENV=development
) > backend\.env

echo Backend .env criado!

REM ML .env
(
echo # Supabase
echo SUPABASE_URL=https://lgddsslskhzxtpjathjr.supabase.co
echo SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws
echo.
echo # ML Server
echo MODEL_PATH=./models/latest_model.joblib
echo ML_SERVER_PORT=8000
) > ml\.env

echo ML .env criado!

REM Frontend .env.local
(
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
echo NEXT_PUBLIC_SUPABASE_URL=https://lgddsslskhzxtpjathjr.supabase.co
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZGRzc2xza2h6eHRwamF0aGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTQ1ODcsImV4cCI6MjA2MDU3MDU4N30._hnImYIRQ_102sY0X_TAWBKS1J71SpXt1Xjr2HvJIws
) > .env.local

echo Frontend .env.local criado!

echo.
echo ========================================
echo Configuracao concluida!
echo ========================================
echo.
pause

