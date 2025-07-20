#!/usr/bin/env pwsh

Write-Host "Starting WhatIsMyIP Backend (Enhanced Mode)..." -ForegroundColor Green
Write-Host "Enhanced with rate limiting protection and intelligent fallback chain" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Write-Host "Changing to backend directory..." -ForegroundColor Yellow
Set-Location -Path "backend" -ErrorAction SilentlyContinue

# Check if we're in the right directory
if (-not (Test-Path "requirements.txt")) {
    Write-Host "Error: requirements.txt not found. Make sure you're in the project root directory." -ForegroundColor Red
    exit 1
}

# Check Python dependencies
Write-Host "Checking Python dependencies..." -ForegroundColor Yellow
try {
    python -m pip install -r requirements.txt --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Some dependencies may need updating" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error installing dependencies: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting FastAPI server in enhanced mode..." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Enhanced Features:" -ForegroundColor Green
Write-Host "   • Rate limiting protection for Ookla CLI" -ForegroundColor White
Write-Host "   • Intelligent fallback chain (Ookla CLI → Speedtest-cli → HTTP)" -ForegroundColor White
Write-Host "   • Better error handling and retry logic" -ForegroundColor White
Write-Host "   • Geographic server selection" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server without reload for better stability
try {
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
} catch {
    Write-Host "Error starting server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Write-Host ""
    Write-Host "Backend server stopped" -ForegroundColor Yellow
} 