# Deployment Guide for WhatIsMyIP

This guide provides step-by-step instructions for deploying the WhatIsMyIP application to various platforms.

## 🚀 Quick Start (Local Testing)

### Prerequisites
- Node.js 20+
- Python 3.11+
- Git

### 1. Clone and Setup
```bash
git clone <your-repository>
cd whatismyip

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies  
cd backend && pip install -r requirements.txt && cd ..
```

### 2. Start Services
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend
cd frontend  
npm run dev
```

### 3. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🌐 Production Deployment Options

### Option 1: Vercel + Railway (Recommended)

#### Frontend on Vercel
1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

2. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Your frontend will be available at `https://your-app.vercel.app`

#### Backend on Railway
1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub
   - Select your repository

2. **Configure Service**
   ```
   Root Directory: backend
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**
   ```
   ENVIRONMENT=production
   CORS_ORIGINS=https://your-app.vercel.app
   ```

4. **Deploy**
   - Railway will auto-deploy
   - Note your backend URL for frontend configuration

### Option 2: DigitalOcean App Platform

#### 1. Create App
- Go to DigitalOcean App Platform
- Create app from GitHub repository

#### 2. Configure Services

**Frontend Service:**
```yaml
name: frontend
source_dir: /frontend
github:
  repo: your-username/whatismyip
  branch: main
run_command: npm start
build_command: npm run build
environment_slug: node-js
instance_count: 1
instance_size_slug: basic-xxs
envs:
- key: NEXT_PUBLIC_API_URL
  value: ${backend.PUBLIC_URL}
```

**Backend Service:**
```yaml
name: backend
source_dir: /backend
github:
  repo: your-username/whatismyip
  branch: main
run_command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
build_command: pip install -r requirements.txt
environment_slug: python
instance_count: 1
instance_size_slug: basic-xxs
envs:
- key: ENVIRONMENT
  value: production
- key: CORS_ORIGINS
  value: ${frontend.PUBLIC_URL}
```

### Option 3: AWS (Advanced)

#### Frontend on S3 + CloudFront
1. **Build Static Site**
   ```bash
   cd frontend
   npm run build
   npm run export
   ```

2. **Upload to S3**
   ```bash
   aws s3 sync out/ s3://your-bucket-name --delete
   ```

3. **Configure CloudFront**
   - Create distribution pointing to S3 bucket
   - Configure custom domain and SSL

#### Backend on ECS/Fargate
1. **Build Docker Image**
   ```bash
   cd backend
   docker build -t whatismyip-backend .
   ```

2. **Push to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
   docker tag whatismyip-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/whatismyip-backend:latest
   docker push your-account.dkr.ecr.us-east-1.amazonaws.com/whatismyip-backend:latest
   ```

3. **Deploy to ECS**
   - Create ECS cluster
   - Create task definition
   - Create service with load balancer

### Option 4: Docker Compose (VPS)

#### 1. Prepare VPS
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Clone and Deploy
```bash
git clone <your-repository>
cd whatismyip

# Create production environment file
cp .env.example .env
# Edit .env with production values

# Deploy
docker-compose up -d --build
```

#### 3. Configure Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔧 Configuration for Production

### Environment Variables

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### Backend (.env)
```bash
ENVIRONMENT=production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECRET_KEY=your-super-secret-key
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
```

### Security Checklist
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure proper CORS origins
- [ ] Implement rate limiting
- [ ] Add API authentication
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Enable security headers
- [ ] Regular security updates

### Performance Optimization
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Implement Redis caching
- [ ] Optimize images and assets
- [ ] Enable gzip compression
- [ ] Monitor performance metrics

## 📊 Monitoring Setup

### Application Monitoring
1. **Sentry** (Error Tracking)
   ```bash
   npm install @sentry/nextjs
   pip install sentry-sdk[fastapi]
   ```

2. **Google Analytics** (Frontend)
   ```typescript
   // Add to layout.tsx
   <Script src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID" />
   ```

3. **Uptime Monitoring**
   - UptimeRobot
   - Pingdom
   - StatusCake

### Infrastructure Monitoring
- **Logs**: Centralized logging with ELK stack or similar
- **Metrics**: Prometheus + Grafana
- **Alerts**: PagerDuty or similar

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd backend && docker build -t backend .
      - run: docker push your-registry/backend:latest
```

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear caches
rm -rf node_modules package-lock.json
npm install

# Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

#### CORS Errors
- Verify CORS_ORIGINS includes your frontend domain
- Check API URL configuration in frontend
- Ensure no trailing slashes in URLs

#### Performance Issues
- Enable caching
- Optimize database queries
- Use CDN for static assets
- Implement connection pooling

#### SSL/HTTPS Issues
- Verify certificate installation
- Check domain DNS configuration
- Ensure all URLs use HTTPS

### Health Checks
```bash
# Backend health
curl https://api.yourdomain.com/health

# Frontend accessibility
curl -I https://yourdomain.com

# API functionality
curl https://api.yourdomain.com/api/v1/ip-info
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify environment configuration
4. Test locally first
5. Create GitHub issue with details

---

**Happy Deploying! 🚀**

