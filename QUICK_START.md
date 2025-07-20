# 🚀 Quick Start Guide - WhatIsMyIP

## Prerequisites
- Python 3.8+ installed
- Node.js 18+ installed
- Git (for cloning the repository)

## Option 1: Automatic Fix & Start (Recommended)

Run the comprehensive fix script from the project root:

```powershell
.\fix-and-start.ps1
```

This script will:
- ✅ Fix all dependency issues
- ✅ Clean build caches
- ✅ Start both servers properly
- ✅ Monitor server status

## Option 2: Manual Startup

### Step 1: Start Backend

```powershell
# Navigate to backend directory
cd backend

# Install Python dependencies
python -m pip install -r requirements.txt --user

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 2: Start Frontend (in a new terminal)

```powershell
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start Next.js development server
npm run dev
```

**Expected Output:**
```
> frontend@0.1.0 dev
> next dev --turbopack

   ▲ Next.js 15.3.4 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000
   ✓ Ready in X.Xs
```

## ✅ Verification

### Backend Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health"
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890.123,
  "version": "1.0.0"
}
```

### Frontend Check
```powershell
Invoke-WebRequest -Uri "http://localhost:3000"
```

**Expected:** HTTP 200 or 307 (redirect to /en)

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend App** | http://localhost:3000 | Main application |
| **Backend API** | http://localhost:8000 | API endpoints |
| **API Documentation** | http://localhost:8000/docs | Interactive API docs |
| **Health Check** | http://localhost:8000/health | Backend status |

## 🔧 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'app'`
**Solution:** Make sure you're in the `backend` directory when running uvicorn

**Problem:** `ImportError: No module named 'fastapi'`
**Solution:** Install dependencies: `python -m pip install -r requirements.txt --user`

### Frontend Issues

**Problem:** `404 errors on /en`
**Solution:** Wait for Next.js compilation to complete (usually 10-30 seconds)

**Problem:** `Port 3000 is in use`
**Solution:** Next.js will automatically use the next available port (3001, 3002, etc.)

**Problem:** `Build cache issues`
**Solution:** Delete `.next` folder: `Remove-Item -Recurse -Force .next`

### Port Conflicts

If ports are already in use:

```powershell
# Kill existing processes
taskkill /f /im python.exe /t
taskkill /f /im node.exe /t

# Or use different ports
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
npm run dev -- -p 3001
```

## 🛑 Stopping Servers

### Automatic Script
Press `Ctrl+C` in the script window

### Manual
- **Backend:** Press `Ctrl+C` in the backend terminal
- **Frontend:** Press `Ctrl+C` in the frontend terminal

### Force Stop All
```powershell
taskkill /f /im python.exe /t
taskkill /f /im node.exe /t
```

## 📝 Notes

- The frontend will redirect from `/` to `/en` (this is normal for internationalization)
- Initial compilation may take 10-30 seconds
- Both servers support hot reloading (changes will auto-refresh)
- Backend API is available at `/api/v1/*` endpoints
- Frontend proxies API calls to the backend automatically

## 🆘 Still Having Issues?

1. **Check the logs** - Look for specific error messages
2. **Verify dependencies** - Make sure Python and Node.js are properly installed
3. **Clear caches** - Remove `.next` and `__pycache__` directories
4. **Check ports** - Ensure ports 3000 and 8000 are available
5. **Run the automatic script** - `.\fix-and-start.ps1` handles most issues automatically 