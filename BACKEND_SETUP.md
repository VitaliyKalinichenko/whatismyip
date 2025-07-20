# Backend Setup Guide

This guide explains how to properly start the WhatIsMyIP backend server with the correct configuration.

## Problem Solved

The backend was previously experiencing `ModuleNotFoundError: No module named 'app'` because uvicorn was being launched from the root project directory instead of the backend directory where the `app` module is located.

## Solution

All launch configurations now ensure that:
1. The working directory is set to `backend/`
2. The Python module path is correctly resolved
3. The FastAPI app from `app/main.py` is properly loaded

## Launch Methods

### 1. PowerShell Script (Recommended)
```powershell
# From project root
.\start-backend.ps1
```

### 2. Windows Batch File
```cmd
# From project root
start-backend.bat
```

### 3. Manual Command
```bash
# From project root
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. VS Code Debugging
1. Open the project in VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Debug Backend" from the dropdown
4. Press F5 to start debugging

### 5. VS Code Tasks
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Tasks: Run Task"
3. Select "Start Backend Server"

### 6. Docker
```bash
# From project root
docker-compose up backend
```

## Configuration Files

### VS Code Launch Configuration (`.vscode/launch.json`)
```json
{
    "name": "Debug Backend",
    "type": "python",
    "request": "launch",
    "module": "uvicorn",
    "args": ["app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
    "cwd": "${workspaceFolder}/backend",
    "env": {"PYTHONPATH": "${workspaceFolder}/backend"}
}
```

### VS Code Tasks (`.vscode/tasks.json`)
```json
{
    "label": "Start Backend Server",
    "type": "shell",
    "command": "python",
    "args": ["-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
    "options": {"cwd": "${workspaceFolder}/backend"}
}
```

## Verification

When the backend starts successfully, you should see:
- ✅ Working directory: [path]/backend
- ✅ Found app\main.py
- Server running on http://localhost:8000
- API docs available at http://localhost:8000/docs

## Troubleshooting

### ModuleNotFoundError: No module named 'app'
**Cause**: Running from wrong directory
**Solution**: Ensure you're in the backend directory or use one of the provided scripts

### Port 8000 already in use
**Solution**: 
```bash
# Kill processes on port 8000
netstat -ano | findstr :8000
taskkill /PID [PID] /F
```

### Permission denied
**Solution**: Run as administrator or use `--user` flag for pip install

## Environment Variables

The backend supports these environment variables:
- `ENVIRONMENT`: Set to "development" or "production"
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `DISABLE_RELOAD`: Set to "true" to disable auto-reload

## API Endpoints

Once running, the backend provides:
- **Health Check**: `GET /health`
- **API Documentation**: `GET /docs` (Swagger UI)
- **ReDoc Documentation**: `GET /redoc`
- **API Routes**: `GET /api/v1/*` 