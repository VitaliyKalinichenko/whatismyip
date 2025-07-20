#!/usr/bin/env pwsh

# Start WhatIsMyIP Backend Server
Write-Host "Starting WhatIsMyIP Backend Server..." -ForegroundColor Green

# Get the script directory and navigate to backend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend"

# Change to backend directory
Set-Location -Path $backendDir

# Check if we're in the right directory
if (-not (Test-Path "app\main.py")) {
    Write-Host "Error: app\main.py not found. Make sure you're in the correct directory." -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Red
    Write-Host "Expected backend directory: $backendDir" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Working directory: $(Get-Location)" -ForegroundColor Green
Write-Host "✅ Found app\main.py" -ForegroundColor Green

Write-Host "Installing/updating Python dependencies..." -ForegroundColor Yellow
python -m pip install -r requirements.txt --user

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
Write-Host "API Documentation will be available at http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server with proper working directory
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 