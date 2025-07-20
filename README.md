# WhatIsMyIP - Professional IP Tools & Networking Utilities

A complete web application providing IP-related services and networking tools with a modern, responsive design and professional API.

## 🚀 Features

### Core Functionality
- **Main IP Checker**: Display public IP, geolocation, ISP, timezone, currency, and country information
- **Dark/Light Mode**: Seamless theme switching with system preference detection
- **Mobile Responsive**: Optimized for all device sizes
- **SEO Optimized**: Complete meta tags, OpenGraph, Twitter Cards, and Schema.org markup

### Networking Tools
1. **IP Location Lookup** - Find geographic location of any IP address
2. **Port Checker** - Check open TCP ports on any host
3. **DNS Lookup** - Query DNS records (A, AAAA, MX, TXT, NS, CNAME)
4. **Whois Lookup** - Domain registration information
5. **Ping Test** - Network latency testing
6. **Traceroute** - Network path tracing
7. **IP Blacklist Check** - DNSBL spam database checking
8. **Email Blacklist Check** - Email domain reputation checking
9. **IPv6 Test** - IPv6 connectivity testing
10. **Internet Speed Test** - Connection speed testing

### API Features
- **RESTful API** - Complete API for all networking tools
- **Auto Documentation** - Swagger/OpenAPI documentation at `/docs`
- **Rate Limiting Ready** - Prepared for production rate limiting
- **CORS Support** - Cross-origin request handling
- **Error Handling** - Comprehensive error responses

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Lucide React** - Beautiful icon library
- **next-themes** - Theme switching functionality

### Backend
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation and serialization
- **Uvicorn** - ASGI server
- **Python 3.11** - Latest Python features

### Deployment
- **Docker** - Containerized deployment
- **Docker Compose** - Multi-service orchestration
- **Vercel Ready** - Optimized for Vercel deployment
- **CDN Ready** - Cloudflare integration prepared

## 📦 Installation & Setup

### Prerequisites
- Node.js 20+ and npm
- Python 3.11+
- Docker and Docker Compose (optional)

### Local Development

#### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd whatismyip

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

#### 2. Environment Configuration
```bash
# Frontend environment (optional)
cd frontend
cp .env.example .env.local
# Edit .env.local with your configuration

# Backend environment (optional)
cd backend
cp .env.example .env
# Edit .env with your configuration
```

#### 3. Start Development Servers

**Backend (Terminal 1):**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

#### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Docker Deployment

#### 1. Build and Run with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

#### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

#### 3. Stop Services
```bash
docker-compose down
```

## 🌐 Production Deployment

### Vercel Deployment (Frontend)
1. Connect your GitHub repository to Vercel
2. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   ```
3. Deploy automatically on push to main branch

### Backend Deployment Options

#### Option 1: DigitalOcean App Platform
1. Create a new app from your repository
2. Configure the backend service:
   - **Source**: `/backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Run Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Set environment variables as needed

#### Option 2: Railway
1. Connect your GitHub repository
2. Deploy the backend from `/backend` directory
3. Railway will auto-detect FastAPI and deploy

#### Option 3: Docker on VPS
```bash
# On your VPS
git clone <repository-url>
cd whatismyip
docker-compose -f docker-compose.prod.yml up -d
```

### Domain Configuration
1. Point your domain to the deployed services
2. Update CORS origins in backend configuration
3. Update API URL in frontend environment variables

## 🔧 Configuration

### Frontend Configuration
Edit `frontend/next.config.js`:
```javascript
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  // ... other config
};
```

### Backend Configuration
Edit `backend/app/main.py` for CORS origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com", "http://localhost:3000"],
    # ... other settings
)
```

## 📊 API Documentation

### Base URL
- Development: `http://localhost:8000`
- Production: `https://your-api-domain.com`

### Authentication
Currently, the API is open. For production, implement:
- API key authentication
- Rate limiting
- User registration/login

### Example API Calls

#### Get IP Information
```bash
curl -X GET "http://localhost:8000/api/v1/ip-info" \
  -H "accept: application/json"
```

#### DNS Lookup
```bash
curl -X GET "http://localhost:8000/api/v1/dns-lookup?domain=example.com&record_types=A&record_types=MX" \
  -H "accept: application/json"
```

#### Port Check
```bash
curl -X POST "http://localhost:8000/api/v1/port-check" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "ports": [80, 443, 22]
  }'
```

## 🔒 Security Considerations

### Production Checklist
- [ ] Implement API rate limiting
- [ ] Add API key authentication
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up monitoring and logging
- [ ] Implement input validation and sanitization
- [ ] Add security headers
- [ ] Regular security updates

### Rate Limiting
Implement rate limiting using libraries like:
- `slowapi` for FastAPI
- Redis for distributed rate limiting

### API Keys
Add API key authentication:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_api_key(token: str = Depends(security)):
    if token.credentials != "your-api-key":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return token
```

## 📈 Monitoring & Analytics

### Google Analytics
Add your GA4 tracking ID to `frontend/src/app/layout.tsx`:
```typescript
// Add Google Analytics script
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

### API Monitoring
Consider implementing:
- Application performance monitoring (APM)
- Error tracking (Sentry)
- Uptime monitoring
- API usage analytics

## 🎨 Customization

### Branding
1. Update logo and favicon in `frontend/public/`
2. Modify color scheme in `frontend/src/app/globals.css`
3. Update site metadata in `frontend/src/app/layout.tsx`

### Adding New Tools
1. Create new API endpoint in `backend/app/api/v1/`
2. Add corresponding frontend page in `frontend/src/app/`
3. Update navigation in `frontend/src/components/layout/header.tsx`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the troubleshooting section below

## 🔧 Troubleshooting

### Common Issues

#### Frontend won't start
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Backend API errors
```bash
# Check Python version and dependencies
python --version
pip install -r requirements.txt
```

#### Docker issues
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up
```

#### CORS errors
- Ensure backend CORS origins include your frontend URL
- Check that API URL in frontend matches backend URL

### Performance Optimization

#### Frontend
- Enable Next.js image optimization
- Implement service worker for caching
- Use CDN for static assets

#### Backend
- Implement caching for API responses
- Use connection pooling for databases
- Add response compression

## 🚀 Scaling

### Horizontal Scaling
- Use load balancers for multiple backend instances
- Implement Redis for session storage
- Use CDN for global content delivery

### Database Integration
For production, consider adding:
- PostgreSQL for user data
- Redis for caching and rate limiting
- MongoDB for analytics data

---

**Built with ❤️ for the developer community**

