# Simple WhatIsMyIP Server Starter
Write-Host "🚀 Starting WhatIsMyIP Application..." -ForegroundColor Green
Write-Host ""

# Start Backend Server
Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Servers are starting up!" -ForegroundColor Green
Write-Host "📡 Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3000 (or 3001 if 3000 is busy)" -ForegroundColor Cyan
Write-Host "📚 API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌍 Language URLs:" -ForegroundColor Magenta
Write-Host "   🇺🇸 English: http://localhost:3000/en" -ForegroundColor White
Write-Host "   🇪🇸 Spanish: http://localhost:3000/es" -ForegroundColor White
Write-Host "   🇩🇪 German: http://localhost:3000/de" -ForegroundColor White
Write-Host "   🇫🇷 French: http://localhost:3000/fr" -ForegroundColor White
Write-Host "   🇧🇷 Portuguese: http://localhost:3000/pt" -ForegroundColor White
Write-Host "   🇮🇳 Hindi: http://localhost:3000/hi" -ForegroundColor White
Write-Host "   🇸🇦 Arabic: http://localhost:3000/ar" -ForegroundColor White
Write-Host "   🇺🇦 Ukrainian: http://localhost:3000/uk" -ForegroundColor White
Write-Host "   🇨🇳 Chinese: http://localhost:3000/zh" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 