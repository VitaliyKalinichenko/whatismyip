@echo off
echo Starting WhatIsMyIP Backend Server...

REM Change to backend directory
cd /d "%~dp0backend"

REM Check if we're in the right directory
if not exist "app\main.py" (
    echo Error: app\main.py not found. Make sure you're in the correct directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo ✅ Working directory: %CD%
echo ✅ Found app\main.py

echo Installing/updating Python dependencies...
python -m pip install -r requirements.txt --user

if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Starting FastAPI server on http://localhost:8000
echo API Documentation will be available at http://localhost:8000/docs
echo Press Ctrl+C to stop the server
echo.

REM Start the server with proper working directory
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 