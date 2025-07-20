@echo off
echo 🚀 Starting WhatIsMyIP Application...
echo.

echo 📡 Starting Backend Server...
cd backend
start "Backend Server" powershell -NoExit -Command "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
cd ..

echo 🌐 Starting Frontend Server...
cd frontend
start "Frontend Server" powershell -NoExit -Command "npm run dev"
cd ..

echo.
echo ✅ Servers are starting up!
echo 📡 Backend API: http://localhost:8000
echo 🌐 Frontend: http://localhost:3000
echo 📚 API Documentation: http://localhost:8000/docs
echo.
pause 