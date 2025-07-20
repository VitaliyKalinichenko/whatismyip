# Start WhatIsMyIP Application (Backend + Frontend)
Write-Host "Starting WhatIsMyIP Application..." -ForegroundColor Green
Write-Host "This will start both backend and frontend servers" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the project root
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Function to start backend in new window
function Start-Backend {
    Write-Host "Starting Backend Server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '.\start-backend.ps1'"
}

# Function to start frontend in new window  
function Start-Frontend {
    Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '.\start-frontend.ps1'"
}

# Start backend first
Start-Backend
Write-Host "Backend starting in new window..." -ForegroundColor Green

# Wait a moment for backend to initialize
Write-Host "Waiting 5 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend
Start-Frontend
Write-Host "Frontend starting in new window..." -ForegroundColor Green

Write-Host ""
Write-Host "✅ Application is starting!" -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Both servers are running in separate windows." -ForegroundColor Yellow
Write-Host "Close those windows or press Ctrl+C in them to stop the servers." -ForegroundColor Yellow

# Keep this script running to show status
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 