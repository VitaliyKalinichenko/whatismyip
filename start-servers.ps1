# Start WhatIsMyIP Servers
Write-Host "🚀 Starting WhatIsMyIP Application..." -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Start Backend Server
Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
if (Test-Port 8000) {
    Write-Host "⚠️  Port 8000 is already in use. Backend server may already be running." -ForegroundColor Yellow
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    Start-Sleep -Seconds 3
}

# Start Frontend Server
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Yellow
if (Test-Port 3000) {
    Write-Host "⚠️  Port 3000 is already in use. Frontend server may already be running." -ForegroundColor Yellow
} else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
    Start-Sleep -Seconds 3
}

Write-Host "✅ Servers are starting up!" -ForegroundColor Green
Write-Host "📡 Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📚 API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 