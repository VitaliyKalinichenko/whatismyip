# Restart Backend and Frontend Servers
Write-Host "Restarting WhatIsMyIP servers..." -ForegroundColor Green

# Kill any existing Python and Node.js processes
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($pythonProcesses) {
    Write-Host "Stopping Python processes..." -ForegroundColor Yellow
    $pythonProcesses | Stop-Process -Force
}

if ($nodeProcesses) {
    Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
}

# Wait a moment for processes to stop
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Set-Location "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Set-Location "../frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Wait for frontend to start
Start-Sleep -Seconds 5

# Test if servers are running
Write-Host "Testing server connections..." -ForegroundColor Yellow

try {
    $backendResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/ip-info" -Method GET -TimeoutSec 5
    Write-Host "Backend server is running on http://127.0.0.1:8000" -ForegroundColor Green
} catch {
    Write-Host "Backend server is not responding" -ForegroundColor Red
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "Frontend server is running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "Frontend server is not responding" -ForegroundColor Red
}

Write-Host "Server restart complete!" -ForegroundColor Green
Write-Host "Backend: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan 