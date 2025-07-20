# ✅ Deployment Checklist

## Pre-Deployment
- [x] Fixed backend security headers bug
- [x] Created render.yaml configuration
- [x] Created start.sh script
- [x] Updated frontend image domains
- [x] Created deployment guide

## Backend Deployment (Render)
- [ ] Sign up/login to Render
- [ ] Connect GitHub repository
- [ ] Create new Web Service
- [ ] Configure service settings
- [ ] Set environment variables
- [ ] Deploy backend
- [ ] Test backend health endpoint
- [ ] Note backend URL

## Frontend Deployment (Vercel)
- [ ] Sign up/login to Vercel
- [ ] Import GitHub repository
- [ ] Configure project settings
- [ ] Set environment variables
- [ ] Deploy frontend
- [ ] Test frontend functionality
- [ ] Note frontend URL

## Post-Deployment
- [ ] Update backend CORS with frontend URL
- [ ] Redeploy backend
- [ ] Test full application
- [ ] Check for CORS errors
- [ ] Test all features
- [ ] Update admin credentials
- [ ] Set up monitoring

## URLs to Note
- Backend URL: `https://________________.onrender.com`
- Frontend URL: `https://________________.vercel.app`

## Environment Variables
### Backend (Render)
```
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend-url.vercel.app
JWT_SECRET_KEY=[auto-generated]
ADMIN_EMAIL=admin@whatismyip.com
ADMIN_PASSWORD=SecurePassword123!
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
``` 