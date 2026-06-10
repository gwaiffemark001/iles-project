# ILES Application - Complete Deployment & Setup Guide
## Production Ready Configuration (Updated 2026-06-10)

---

## 🎯 What's New in This Update

### Critical Fixes Applied ✅
1. **Backend 500 Error Fixed**: AdminStatisticsView now correctly queries evaluations
2. **Mobile Responsiveness**: Complete CSS overhaul for all screen sizes
3. **Frontend Production Build**: Configured for Railway and Vercel deployment
4. **Environment Configuration**: Separate development and production setups

---

## 📱 Mobile Responsiveness Features

### Implemented
- ✅ Responsive font sizing (clamp function)
- ✅ Mobile-first CSS approach
- ✅ Touch-friendly buttons (44x44px minimum)
- ✅ Flexible grid layouts
- ✅ Responsive images
- ✅ Accessibility (WCAG compliant)
- ✅ Reduced motion support for animations
- ✅ Print stylesheet

### Screen Sizes Tested
| Device Type | Width Range | Status |
|-------------|-------------|--------|
| Mobile (small) | 320-480px | ✅ Optimized |
| Mobile (large) | 480-640px | ✅ Optimized |
| Tablet | 640-1024px | ✅ Responsive |
| Desktop | 1024px+ | ✅ Full layout |

---

## 🚀 Quick Start (Development)

### Option 1: Full Stack Local Development (5 minutes)

```bash
# Terminal 1: Backend
cd iles-project/iles_backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Terminal 2: Frontend
cd iles_frontend
npm install
npm run dev

# Open browser
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api
# Admin: http://localhost:8000/admin
```

### Verify Setup
```bash
# In another terminal, test API
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'

# Should return JWT tokens
```

---

## 🌐 Production Deployment

### Platform: Railway (Recommended)

#### Backend Deployment

**Step 1: Connect Railway to GitHub**
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your ILES repository

**Step 2: Create PostgreSQL Service**
1. Click "+ Create Service"
2. Select "PostgreSQL"
3. Railway automatically adds `DATABASE_URL` environment variable

**Step 3: Set Environment Variables**
```
DEBUG=False
SECRET_KEY=django-insecure-YOUR-UNIQUE-SECRET-KEY-HERE
ALLOWED_HOSTS=iles-project-iles-backend.up.railway.app,*.up.railway.app
CORS_ALLOWED_ORIGINS=https://iles-project-iles-frontend.up.railway.app
SECURE_SSL_REDIRECT=False
SECURE_PROXY_HEADER=HTTP_X_FORWARDED_PROTO,https
USE_X_FORWARDED_HOST=True
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Step 4: Deploy Backend**
```bash
git add .
git commit -m "Update: Mobile responsiveness and API fixes"
git push origin main
# Railway auto-deploys on push
```

**Step 5: Run Migrations**
```bash
# In Railway dashboard, open backend service terminal:
python manage.py migrate --noinput
python manage.py createsuperuser
```

#### Frontend Deployment

**Option A: Railway (Same Platform)**
```bash
# Create new Railway service for frontend
# Set buildCommand: npm run build
# Set startCommand: npm run preview (for testing) or configure with nginx

# Set environment variables:
VITE_API_BASE_URL=/api
```

**Option B: Vercel (Recommended for SPA)**
1. Go to https://vercel.com
2. Click "New Project"
3. Import GitHub repository
4. Framework: Vite
5. Build Command: `npm run build`
6. Output Directory: `dist`

**Environment Variables on Vercel:**
```
VITE_API_BASE_URL=/api
```

**Configure Rewrites** (vercel.json):
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://iles-project-iles-backend.up.railway.app/api/:path*"
    }
  ]
}
```

#### Configure CORS for Production

**Backend settings.py** (already configured):
```python
# Only allow your production frontend URL
CORS_ALLOWED_ORIGINS = [
    'https://iles-project-iles-frontend.up.railway.app',  # Railway
    'https://your-domain.vercel.app',  # If using Vercel
]

# Trust Railway's reverse proxy headers
SECURE_PROXY_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
```

**Frontend .env.production**:
```
VITE_API_BASE_URL=/api
```

---

## 🔒 Security Checklist

- [ ] Changed `SECRET_KEY` to a unique, secure value
- [ ] Set `DEBUG=False` in production
- [ ] Configured `ALLOWED_HOSTS` with your domain
- [ ] Set `CORS_ALLOWED_ORIGINS` to your frontend URL only
- [ ] Enabled `SECURE_SSL_REDIRECT` after HTTPS is working
- [ ] Set secure cookie flags
- [ ] Generated new admin password (not default)
- [ ] Configured email backend for notifications
- [ ] Set up database backups (Railway: automatic)
- [ ] Monitored error logs

---

## 📋 Verification Checklist

### Backend Verification
```bash
# Check backend is accessible
curl https://iles-project-iles-backend.up.railway.app/api/

# Login and get token
curl -X POST https://iles-project-iles-backend.up.railway.app/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'

# Test admin statistics endpoint (FIXED)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://iles-project-iles-backend.up.railway.app/api/admin/statistics/

# Should return:
# {
#   "total_students": X,
#   "total_supervisors": Y,
#   "total_placements": Z,
#   ...
# }
```

### Frontend Verification
```bash
# Check frontend loads
curl https://iles-project-iles-frontend.up.railway.app/

# Should return HTML (not error)
```

### Mobile Testing
1. Open frontend on mobile device
2. Test responsive layout (no horizontal scroll)
3. Test button clicks (44px minimum touch target)
4. Test form inputs (keyboard doesn't hide content)
5. Test image scaling
6. Test on different browsers (Chrome, Safari, Firefox)

### Cross-Origin Testing
1. Frontend requests should reach backend
2. No "CORS error" in browser console
3. Authentication tokens should be sent correctly
4. Media files should be accessible

---

## 🛠️ Troubleshooting

### Backend Issues

**Problem: 500 Error on `/api/admin/statistics/`**
- **Fixed in this update**: Query now uses `Evaluation.objects.count()`
- **Check**: Backend code is updated from the fix
- **Solution**: Re-deploy latest code to Railway

**Problem: CORS Errors in Production**
```
Access to XMLHttpRequest at 'https://backend.app/api/...' from origin 
'https://frontend.app' has been blocked by CORS policy
```
- Check `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check CorsMiddleware is first in MIDDLEWARE list
- Verify frontend URL has trailing slash removed

**Problem: 401 Unauthorized**
- Token may have expired (1-hour lifetime)
- Use refresh token endpoint: POST `/api/token/refresh/`
- Check token is being sent: `Authorization: Bearer YOUR_TOKEN`

### Frontend Issues

**Problem: API Requests Return 404**
- Check `VITE_API_BASE_URL` in production env
- Use `/api` (relative path) not full URL
- Verify backend proxy is configured

**Problem: Mobile Layout Broken**
- Check viewport meta tag in index.html
- Clear browser cache
- Test in different browser
- Check CSS file is loaded (inspect DevTools)

**Problem: Build Fails on Railway**
```bash
# Solution: Increase build resources
# In Railway dashboard: Settings > Build > Select "CPU: +1"
```

### Database Issues

**Problem: Migration Fails**
```bash
# Check migrations are in sync
python manage.py showmigrations

# Apply specific migration
python manage.py migrate core 0001

# Check database connection
python manage.py dbshell
```

---

## 📊 Monitoring

### Backend Logs
```bash
# View logs in Railway dashboard
# Look for error patterns:
# - [ERROR] NameError, AttributeError (code issues)
# - [ERROR] Forbidden (403) - permission issues
# - [ERROR] BadRequest (400) - validation issues
```

### Frontend Logs
```bash
# Browser DevTools Console (F12)
# Look for:
# - Network errors (red entries)
# - CORS errors
# - 401/403/404 errors
# - JavaScript errors
```

### Performance
- Check Railway dashboard for response times
- Monitor database connection pool
- Check build sizes (should be < 500KB for frontend)

---

## 🔄 Continuous Deployment

### Auto-Deploy on Push
```bash
# Simply push to main branch
git add .
git commit -m "Your changes"
git push origin main

# Railway automatically:
# 1. Builds your code
# 2. Runs tests (if configured)
# 3. Deploys new version
# 4. Restarts services
```

### Manual Deployment
1. Railway Dashboard → Select Service
2. Click "Deploy" button
3. Select branch to deploy
4. Wait for deployment to complete

---

## 📞 Support & References

### Key Files
- Backend settings: `iles_backend/settings.py`
- Frontend config: `iles_frontend/vite.config.js`
- API client: `iles_frontend/src/api/axios.js`
- Environment: `.env.local` and `.env`

### Documentation Links
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Railway Documentation](https://docs.railway.app/)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)
- [CORS Headers](https://github.com/adamchainz/django-cors-headers)

### Testing the Fix
The main fix (AdminStatisticsView) can be tested with:
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://your-backend.app/api/admin/statistics/
```

If you see stats (not 500 error), the fix is working! ✅

---

## ✨ Summary of Changes

| Component | Change | Status |
|-----------|--------|--------|
| Backend API | Fixed 500 error on `/api/admin/statistics/` | ✅ Complete |
| Frontend CSS | Added mobile responsiveness | ✅ Complete |
| Vite Config | Enhanced build & dev settings | ✅ Complete |
| Environment | Created `.env.production` | ✅ Complete |
| Documentation | Created integration guide | ✅ Complete |

---

**Version**: 1.0.0  
**Date**: 2026-06-10  
**Status**: Production Ready 🚀

Ready to deploy? Follow the quick start or production deployment sections above!
