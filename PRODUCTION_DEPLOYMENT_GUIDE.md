# ILES Production Deployment Guide

Complete guide for deploying ILES to production on Railway with PostgreSQL.

## 🚀 Quick Start Production Deployment

### Prerequisites
- Railway account (https://railway.app)
- Git repository with your code
- Domain name (optional, Railway provides free domain)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Production deployment setup"
git push origin main
```

### Step 2: Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account and select your repository
5. Railway auto-detects your project type

### Step 3: Add PostgreSQL Database

1. In Railway dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway automatically connects and sets `DATABASE_URL`

### Step 4: Configure Environment Variables

In Railway dashboard, set these environment variables:

```env
# Django
SECRET_KEY=<generate-secure-random-key-using-django>
DEBUG=False
ALLOWED_HOSTS=your-app.railway.app,www.your-app.railway.app,your-custom-domain.com

# CORS (your frontend URL)
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com

# Email (optional - Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Twilio (optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 5: Generate Secure SECRET_KEY

In your local terminal:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output and paste as `SECRET_KEY` in Railway.

### Step 6: Deploy Frontend

#### Option A: Vercel (Recommended)
```bash
npm install -g vercel
cd iles_frontend
vercel --prod
```

Set in Vercel environment variables:
```env
VITE_API_BASE_URL=https://your-backend-domain.railway.app
```

#### Option B: Railway
1. Create separate Railway service for frontend
2. Build command: `npm run build`
3. Start command: `npm run preview`
4. Set environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend-domain.railway.app
   ```

### Step 7: Test Production

1. Visit your frontend URL
2. Register a new account
3. Login and verify API calls work
4. Check browser console for CORS errors

## 📋 Checklist Before Going Live

- [ ] DEBUG=False in production
- [ ] SECRET_KEY is secure and random
- [ ] ALLOWED_HOSTS includes your domain
- [ ] CORS_ALLOWED_ORIGINS set to frontend URL
- [ ] Database migrations completed
- [ ] Email configuration tested (optional)
- [ ] Static files collected
- [ ] Frontend .env.production has correct API URL
- [ ] SSL certificate configured (Railway does this automatically)
- [ ] Backup strategy in place

## 🔐 Security Checklist

### Backend (Django)
- [ ] `DEBUG = False` in production
- [ ] `SECURE_SSL_REDIRECT = True` (add this)
- [ ] `SESSION_COOKIE_SECURE = True` (add this)
- [ ] `CSRF_COOKIE_SECURE = True` (add this)
- [ ] `ALLOWED_HOSTS` configured correctly
- [ ] `SECRET_KEY` is secret and random
- [ ] Database password is strong
- [ ] Email credentials use app passwords (not main password)

### Frontend (React)
- [ ] API URLs don't leak sensitive information
- [ ] No secrets in .env.production
- [ ] Build optimized with `npm run build`
- [ ] No console.log of sensitive data in production

### Database
- [ ] Regular backups enabled
- [ ] PostgreSQL version up to date
- [ ] Strong database password

## 🔧 Additional Security Settings to Add

Add these to `settings.py` in production section:

```python
# Security settings (add to settings.py)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_SECURITY_POLICY = {
        "default-src": ("'self'",),
        "script-src": ("'self'", "'unsafe-inline'"),
        "style-src": ("'self'", "'unsafe-inline'"),
    }
```

## 📊 Monitor Your Application

### Railway Dashboard
- View logs: Project → Logs tab
- Check deployments: Project → Deployments tab
- Monitor resources: Project → Environment → Metrics

### Common Issues & Solutions

#### 401 Unauthorized Errors
- Check JWT token is being sent
- Verify CORS_ALLOWED_ORIGINS is correct
- Ensure frontend uses correct API URL

#### 400 Bad Request
- Check request body formatting
- Verify all required fields are sent
- Look at server logs for detailed error

#### CORS Errors
- Update CORS_ALLOWED_ORIGINS with frontend domain
- Restart Railway service

#### Database Connection Errors
- Verify DATABASE_URL is set in Railway
- Check PostgreSQL service is running
- Run migrations: `python manage.py migrate`

## 🎯 Post-Deployment Steps

1. **Run Migrations**
   ```bash
   # In Railway terminal
   python manage.py migrate
   ```

2. **Create Superuser**
   ```bash
   # In Railway terminal
   python manage.py createsuperuser
   ```

3. **Collect Static Files**
   - Railway automatically runs this via Procfile

4. **Test Authentication Flow**
   - Register account
   - Verify email (if configured)
   - Login and check dashboard

5. **Set Up Monitoring**
   - Configure email alerts
   - Set up error tracking (Sentry, etc.)
   - Monitor database performance

## 📞 Support & Resources

- Django Deployment: https://docs.djangoproject.com/en/5.0/howto/deployment/
- Railway Docs: https://docs.railway.app/
- DRF Documentation: https://www.django-rest-framework.org/
- PostgreSQL Docs: https://www.postgresql.org/docs/

## 🔄 Updating Your Application

```bash
# 1. Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# 2. Railway auto-deploys from main branch
# Check Railway dashboard for deployment status

# 3. If migrations needed, run in Railway terminal:
python manage.py migrate
```

## 📝 Environment Variable Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| SECRET_KEY | Django security key | auto-set by Django |
| DEBUG | Development mode | False (production) |
| ALLOWED_HOSTS | Allowed domain names | app.railway.app,myapp.com |
| DATABASE_URL | PostgreSQL connection | auto-set by Railway |
| CORS_ALLOWED_ORIGINS | Frontend URL | https://myapp.vercel.app |
| CSRF_TRUSTED_ORIGINS | CSRF trusted hosts | https://myapp.vercel.app |
| EMAIL_HOST_USER | Email sender | your@email.com |
| EMAIL_HOST_PASSWORD | Email password | app-specific-password |
| TWILIO_ACCOUNT_SID | Twilio account ID | AC... |
| TWILIO_AUTH_TOKEN | Twilio auth token | ... |
| TWILIO_PHONE_NUMBER | Twilio phone number | +1234567890 |

---

**Last Updated:** 2026-06-10  
**Version:** 1.0  
**Status:** Production Ready
