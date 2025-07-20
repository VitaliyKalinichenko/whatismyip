# 🚀 Deployment Guide for WhatIsMyIP

## Overview
This guide will help you deploy your WhatIsMyIP application to production using:
- **Backend**: Render (FastAPI)
- **Frontend**: Vercel (Next.js)

## Prerequisites ✅
- [x] GitHub repository
- [x] Vercel account
- [x] Render account

## Step 1: Deploy Backend to Render

### 1.1 Connect to Render
1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository

### 1.2 Configure Backend Service
**Service Settings:**
- **Name**: `whatismyip-backend`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `chmod +x start.sh && ./start.sh`
- **Health Check Path**: `/health`

**Environment Variables:**
```
ENVIRONMENT=production
CORS_ORIGINS=https://your-vercel-domain.vercel.app
JWT_SECRET_KEY=[Render will generate this]
ADMIN_EMAIL=admin@whatismyip.com
ADMIN_PASSWORD=SecurePassword123!
```

### 1.3 Deploy Backend
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL (e.g., `https://whatismyip-backend.onrender.com`)

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the `frontend` folder as the root directory

### 2.2 Configure Frontend
**Build Settings:**
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
```

### 2.3 Deploy Frontend
1. Click "Deploy"
2. Wait for deployment to complete
3. Note your frontend URL (e.g., `https://your-project.vercel.app`)

## Step 3: Update CORS Configuration

### 3.1 Update Backend CORS
After getting your Vercel URL, update the backend environment variable:
```
CORS_ORIGINS=https://your-project.vercel.app
```

### 3.2 Redeploy Backend
1. Go to your Render dashboard
2. Find your backend service
3. Click "Manual Deploy" → "Deploy latest commit"

## Step 4: Test Deployment

### 4.1 Test Backend
Visit your backend URL + `/health`:
```
https://your-backend.onrender.com/health
```

### 4.2 Test Frontend
Visit your Vercel URL and test:
- IP information display
- Speed test functionality
- All other tools

### 4.3 Test API Connection
Check browser console for any CORS errors or API connection issues.

## Step 5: Custom Domain (Optional)

### 5.1 Backend Custom Domain
1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domains"
3. Add your domain and configure DNS

### 5.2 Frontend Custom Domain
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your domain and configure DNS

## Troubleshooting

### Common Issues:

**1. CORS Errors**
- Ensure `CORS_ORIGINS` includes your exact Vercel domain
- Check for trailing slashes in URLs

**2. API Connection Failed**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check if backend is running (health check)

**3. Build Failures**
- Check Render/Vercel logs for specific errors
- Ensure all dependencies are in requirements.txt

**4. Speed Test Not Working**
- Render may have limitations on subprocess execution
- Consider using alternative speed test methods

## Security Notes

### Production Security:
1. **Change default admin credentials** after first login
2. **Use strong JWT_SECRET_KEY** (Render generates this)
3. **Enable HTTPS** (both Render and Vercel provide this)
4. **Monitor logs** for any security issues

### Environment Variables:
- Never commit sensitive data to Git
- Use Render/Vercel environment variables
- Rotate secrets regularly

## Cost Estimation

### Render (Backend):
- **Free Tier**: $0/month (with limitations)
- **Paid Tier**: $7/month (recommended for production)

### Vercel (Frontend):
- **Free Tier**: $0/month (100GB bandwidth)
- **Paid Tier**: $20/month (if you exceed limits)

**Total Estimated Cost**: $7-27/month

## Support

If you encounter issues:
1. Check Render/Vercel deployment logs
2. Verify environment variables
3. Test locally with production URLs
4. Check browser console for errors

## Next Steps

After successful deployment:
1. Set up monitoring and logging
2. Configure custom domains
3. Set up CI/CD for automatic deployments
4. Implement backup strategies
5. Consider CDN for better performance 