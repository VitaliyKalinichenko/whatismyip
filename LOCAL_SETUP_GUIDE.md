# WhatIsMyIP - Complete Local Setup Guide

## 📋 Project Analysis Summary

**WhatIsMyIP** is a full-stack web application that provides IP address information and networking tools:

### 🏗️ Architecture
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI with Python 3.11+, providing REST API endpoints
- **Deployment**: Docker containers with docker-compose setup

### 🔧 Core Features
1. **IP Information**: Public IP detection, geolocation, ISP details
2. **DNS Lookup**: Query DNS records (A, AAAA, MX, TXT, NS, CNAME)
3. **Port Checker**: Check open TCP ports on hosts
4. **WHOIS Lookup**: Domain registration information
5. **Blacklist Check**: DNSBL spam database checking
6. **Dark/Light Mode**: Theme switching with system preference
7. **Mobile Responsive**: Optimized for all devices

### 📁 Project Structure
```
whatismyip/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── app/             # Next.js 13+ app directory
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   ├── package.json
│   └── next.config.js
├── backend/                  # FastAPI Python application
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── models/          # Pydantic data models
│   │   └── main.py          # FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml        # Multi-service Docker setup
└── README.md
```

## 🚀 Local Development Setup

### Prerequisites
✅ **Installed and Verified:**
- Node.js v20.17.0 (✓ Compatible with requirements)
- Python 3.13.1 (✓ Compatible with 3.11+ requirement)
- npm (comes with Node.js)

### 🐍 Backend Setup

#### 1. Install Dependencies
```powershell
cd backend
pip install -r requirements.txt
```

**✅ Status**: Dependencies installed successfully:
- fastapi==0.115.6
- uvicorn[standard]==0.32.1
- pydantic==2.10.3
- python-multipart==0.0.18
- requests==2.32.3
- dnspython==2.7.0
- python-whois==0.9.5
- aiofiles==24.1.0
- python-dotenv==1.0.1
- httpx==0.28.1

#### 2. Start Backend Server
```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 🌐 Frontend Setup

#### 1. Install Dependencies
```powershell
cd frontend
npm install
```

**✅ Status**: 358 packages installed successfully with 0 vulnerabilities.

#### 2. Create Environment File
```powershell
# Create .env.local file
Set-Content -Path ".env.local" -Value "NEXT_PUBLIC_API_URL=http://localhost:8000"
```

#### 3. Start Frontend Server
```powershell
cd frontend
npm run dev
```

**Expected Output:**
```
▲ Next.js 15.3.4
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

## 🔗 Access Points

Once both servers are running:

- **🌐 Frontend Application**: http://localhost:3000
- **⚡ Backend API**: http://localhost:8000
- **📚 API Documentation**: http://localhost:8000/docs
- **📋 Alternative API Docs**: http://localhost:8000/redoc

## 🧪 Testing the Setup

### Backend Health Check
```powershell
# Test backend is running
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET

# Expected response: {"status":"healthy","timestamp":1234567890}
```

### API Endpoints Available
- `GET /` - API information
- `GET /health` - Health check
- `GET /api/v1/ip-info` - Get IP information
- `GET /api/v1/my-ip` - Get client IP
- `GET /api/v1/dns-lookup` - DNS lookup
- `POST /api/v1/port-check` - Port checking
- `GET /api/v1/whois` - WHOIS lookup
- `POST /api/v1/blacklist-check` - Blacklist checking

## 🛠️ Manual Server Start Commands

If you need to start servers manually in separate terminals:

### Terminal 1 - Backend
```powershell
cd C:\Users\vkalini\Downloads\whatismyip-complete\whatismyip\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2 - Frontend
```powershell
cd C:\Users\vkalini\Downloads\whatismyip-complete\whatismyip\frontend
npm run dev
```

## 🐳 Alternative: Docker Setup

If you prefer using Docker:

```powershell
# From project root
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

This will start both frontend and backend services in containers.

## 🔧 Development Configuration

### Backend Configuration
- **CORS**: Configured to allow all origins (development only)
- **API Base**: `/api/v1`
- **Documentation**: Auto-generated with FastAPI
- **Mock Data**: Uses mock data for demonstration

### Frontend Configuration
- **API URL**: Configured via environment variable
- **Theme**: Dark/light mode support
- **Responsive**: Mobile-first design
- **Components**: shadcn/ui component library

## 🚨 Troubleshooting

### Common Issues

1. **Backend not starting**:
   - Check Python version: `python --version`
   - Verify dependencies: `pip list`
   - Check port 8000 availability

2. **Frontend not starting**:
   - Check Node.js version: `node --version`
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check port 3000 availability

3. **API connection issues**:
   - Verify backend is running on port 8000
   - Check CORS settings in `backend/app/main.py`
   - Verify environment variables in `.env.local`

### Process Management
```powershell
# Check running processes
Get-Process -Name python
Get-Process -Name node

# Kill processes if needed
Stop-Process -Name python -Force
Stop-Process -Name node -Force
```

## 📝 Next Steps

1. **✅ Dependencies Installed**: Both frontend and backend dependencies are ready
2. **🔄 Start Servers**: Run both servers manually in separate terminals
3. **🧪 Test Application**: Verify both services are accessible
4. **🎨 Customize**: Modify the mock data or integrate with real APIs
5. **🚀 Deploy**: Use Docker or deploy to cloud platforms

## 🔍 Current Status

- ✅ **Project Structure**: Complete and organized
- ✅ **Backend Dependencies**: Successfully installed
- ✅ **Frontend Dependencies**: Successfully installed  
- ✅ **API Endpoints**: Created and functional (mock data)
- ✅ **Configuration Files**: Ready for development
- 🟡 **Servers**: Ready to start manually
- 🟡 **Testing**: Ready for verification

The project is now fully set up and ready for local development! 