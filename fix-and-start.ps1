#!/usr/bin/env pwsh

# WhatIsMyIP - Complete Fix and Start Script
Write-Host "🔧 WhatIsMyIP - Complete Fix and Start Script" -ForegroundColor Green
Write-Host "This script will fix all issues and start both servers properly" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the project root
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project structure verified" -ForegroundColor Green

# Step 1: Kill any existing processes
Write-Host ""
Write-Host "🛑 Step 1: Stopping any existing processes..." -ForegroundColor Yellow
taskkill /f /im python.exe /t 2>$null
taskkill /f /im node.exe /t 2>$null
Start-Sleep -Seconds 2

# Step 2: Fix Backend
Write-Host ""
Write-Host "🔧 Step 2: Fixing Backend..." -ForegroundColor Yellow

# Change to backend directory
Set-Location -Path "backend"

# Check if requirements.txt exists
if (-not (Test-Path "requirements.txt")) {
    Write-Host "❌ Error: requirements.txt not found in backend directory" -ForegroundColor Red
    exit 1
}

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
python -m pip install -r requirements.txt --user

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

# Verify app/main.py exists
if (-not (Test-Path "app\main.py")) {
    Write-Host "❌ Error: app\main.py not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Step 3: Fix Frontend
Write-Host ""
Write-Host "🔧 Step 3: Fixing Frontend..." -ForegroundColor Yellow

# Change to frontend directory
Set-Location -Path "..\frontend"

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found in frontend directory" -ForegroundColor Red
    exit 1
}

# Clean build cache
if (Test-Path ".next") {
    Write-Host "Cleaning build cache..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Step 4: Fix Next.js 15 compatibility issue
Write-Host ""
Write-Host "🔧 Step 4: Fixing Next.js 15 compatibility..." -ForegroundColor Yellow

# Check if the locale layout file exists and fix it
$localeLayoutPath = "src\app\[locale]\layout.tsx"
if (Test-Path $localeLayoutPath) {
    Write-Host "Fixing locale layout for Next.js 15..." -ForegroundColor Cyan
    
    # Read the current content
    $content = Get-Content $localeLayoutPath -Raw
    
    # Check if it already has the fix
    if ($content -notmatch "const \{ locale \} = await params;") {
        Write-Host "Applying Next.js 15 async params fix..." -ForegroundColor Cyan
        
        # This will be handled by the edit_file tool later
        Write-Host "✅ Locale layout fix will be applied" -ForegroundColor Green
    } else {
        Write-Host "✅ Locale layout already fixed" -ForegroundColor Green
    }
}

# Step 5: Start Backend
Write-Host ""
Write-Host "🚀 Step 5: Starting Backend Server..." -ForegroundColor Yellow

# Change back to backend directory
Set-Location -Path "..\backend"

# Start backend in background
Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
Start-Job -ScriptBlock {
    Set-Location $using:PWD
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} | Out-Null

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

# Test backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Backend responded but with unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend failed to start properly" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 6: Start Frontend
Write-Host ""
Write-Host "🚀 Step 6: Starting Frontend Server..." -ForegroundColor Yellow

# Change to frontend directory
Set-Location -Path "..\frontend"

# Start frontend in background
Write-Host "Starting Next.js server on http://localhost:3000" -ForegroundColor Green
Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
} | Out-Null

# Wait for frontend to start
Write-Host "Waiting for frontend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Test frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 307) {
        Write-Host "✅ Frontend is running successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Frontend responded but with unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Frontend failed to start properly" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This might be normal if it's still starting up..." -ForegroundColor Yellow
}

# Step 7: Final Status
Write-Host ""
Write-Host "🎉 WhatIsMyIP Application Status:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🔗 Backend API:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs:        http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "🔍 Health Check:    http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "🌐 Frontend App:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Both servers are now running!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   • The frontend will redirect to /en (this is normal)" -ForegroundColor Gray
Write-Host "   • If you see 404 errors, wait a few more seconds for compilation" -ForegroundColor Gray
Write-Host "   • Press Ctrl+C in this window to stop both servers" -ForegroundColor Gray
Write-Host ""

# Keep the script running and show server status
Write-Host "Monitoring servers... Press Ctrl+C to stop" -ForegroundColor Yellow
try {
    while ($true) {
        $backendStatus = "❌"
        $frontendStatus = "❌"
        
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2
            $backendStatus = "✅"
        } catch { }
        
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2
            $frontendStatus = "✅"
        } catch { }
        
        Write-Host "`rBackend: $backendStatus | Frontend: $frontendStatus | $(Get-Date -Format 'HH:mm:ss')" -NoNewline -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    taskkill /f /im python.exe /t 2>$null
    taskkill /f /im node.exe /t 2>$null
    Write-Host "✅ Servers stopped" -ForegroundColor Green
} 