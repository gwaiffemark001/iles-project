# ✅ ILES Production Ready - Verification Checklist

## 🚀 Pre-Deployment Verification

Complete this checklist before deploying to production.

### Code Quality

- [ ] **Backend linting**: Run `python manage.py check` - should show no errors
- [ ] **Frontend linting**: Run `npm run lint` - should show no errors  
- [ ] **No hardcoded secrets**: Search code for passwords, API keys (should be zero results)
- [ ] **No debugging code**: Check for `console.log()`, `print()`, `breakpoint()` (remove if found)
- [ ] **Dependencies updated**: Run `pip list` and `npm outdated` (optional upgrade)

### Environment Configuration

**Backend (.env.local or .env)**
- [ ] `DEBUG=True` (development) or `DEBUG=False` (production)
- [ ] `SECRET_KEY` is set and secure
- [ ] `ALLOWED_HOSTS` includes your domain(s)
- [ ] `CORS_ALLOWED_ORIGINS` has frontend URL
- [ ] `CSRF_TRUSTED_ORIGINS` has frontend URL
- [ ] `DATABASE_URL` is correct (PostgreSQL for production)

**Frontend (.env.local or .env.production)**
- [ ] `VITE_API_BASE_URL=http://localhost:8000` (local) or domain (production)
- [ ] No hardcoded URLs in components (should all use `API_BASE_URL`)

### Database & Migrations

- [ ] All migrations created: `python manage.py makemigrations` (no output = clean)
- [ ] All migrations applied: `python manage.py migrate` (all dependencies met)
- [ ] No migration errors: `python manage.py showmigrations` (all checked)
- [ ] Database has data: Run `python manage.py shell` then `CustomUser.objects.count()` > 0

### Backend API Testing

Using browser DevTools or Postman:

- [ ] **Register endpoint works**: POST `/api/register/` with valid data
- [ ] **Login endpoint works**: POST `/api/token/` returns access + refresh tokens
- [ ] **Token refresh works**: POST `/api/token/refresh/` with refresh token
- [ ] **Protected endpoints work**: GET `/api/profile/` with Authorization header
- [ ] **401 on missing token**: GET `/api/profile/` without token returns 401
- [ ] **Proper error messages**: Invalid requests return clear error descriptions

### Frontend Functionality

- [ ] **App loads**: http://localhost:5173 loads without errors
- [ ] **Register page works**: Can navigate to register, no console errors
- [ ] **Login page works**: Can enter credentials, can submit form
- [ ] **Authentication flow**: Can register → verify → login → see dashboard
- [ ] **API calls work**: Check Network tab, requests have correct Authorization header
- [ ] **Token stored**: Check localStorage for access_token and refresh_token
- [ ] **Error handling**: Login with wrong password shows error message
- [ ] **No CORS errors**: Check Console for CORS-related messages (should be none)

### CORS & Security

- [ ] **CORS headers present**: Check Network tab response headers for `Access-Control-Allow-Origin`
- [ ] **CORS requests work**: Requests from frontend to backend succeed
- [ ] **CSRF protection**: Check if CSRF token required (depends on backend setup)
- [ ] **Secure headers** (production): Check response headers for HSTS, X-Frame-Options, etc.
- [ ] **HTTPS redirect** (production): http:// redirects to https://

### Static & Media Files

- [ ] **Static files collected**: Run `python manage.py collectstatic --noinput` (no errors)
- [ ] **Static files served**: Load `/admin/` page works and loads CSS
- [ ] **Media files accessible**: If avatars uploaded, verify image loads
- [ ] **File permissions correct**: Files aren't readable by other users

### Performance & Optimization

- [ ] **Frontend build optimized**: `npm run build` creates dist/ folder, size is reasonable
- [ ] **Database queries optimized**: No N+1 queries (check Django shell with debugger)
- [ ] **API response times**: Requests complete in < 1 second
- [ ] **Static files compressed**: JS/CSS minified in build
- [ ] **Images optimized**: Avatar images are reasonable file size

### Error Handling

- [ ] **Backend error logs**: No 500 errors in recent logs
- [ ] **Frontend error handling**: Network errors show user-friendly messages
- [ ] **Form validation**: Invalid form input shows validation errors
- [ ] **API error responses**: Errors from API shown correctly in UI
- [ ] **No exposed stack traces**: Error pages don't show sensitive code

### Local Development Setup

- [ ] **Backend starts clean**: New developer can `pip install -r requirements.txt` → works
- [ ] **Frontend starts clean**: New developer can `npm install` → `npm run dev` → works
- [ ] **Database initializes**: New developer can `python manage.py migrate` → works
- [ ] **Can create superuser**: `python manage.py createsuperuser` works
- [ ] **Admin panel accessible**: `http://localhost:8000/admin/` loads after superuser created

### Documentation

- [ ] ✅ **LOCAL_DEVELOPMENT_SETUP.md** - covers local setup
- [ ] ✅ **PRODUCTION_DEPLOYMENT_GUIDE.md** - covers Railway deployment
- [ ] ✅ **TROUBLESHOOTING_GUIDE.md** - covers common issues
- [ ] ✅ **QUICK_REFERENCE.md** - API endpoints and developer reference
- [ ] ✅ **README.md** - project overview exists
- [ ] ✅ **FIXES_SUMMARY.md** - documents all changes made

### Production Deployment

Before pushing to Railway:

- [ ] [ ] README.md updated with instructions
- [ ] [ ] Procfile correctly configured (migrations → static files → gunicorn)
- [ ] [ ] requirements.txt includes all dependencies (check `pip freeze`)
- [ ] [ ] package.json has build script defined
- [ ] [ ] All sensitive data removed from .env files
- [ ] [ ] .gitignore excludes .env, __pycache__, node_modules
- [ ] [ ] `.env` files added to .gitignore
- [ ] [ ] All code committed to git: `git status` shows clean

### Post-Deployment Validation

After deploying to production:

- [ ] **Backend responds**: Visit `/admin/` - should see login page
- [ ] **Frontend loads**: Visit production domain - app loads
- [ ] **API accessible**: Check Network tab - API calls succeed
- [ ] **No CORS errors**: Console shows no CORS errors
- [ ] **Migrations ran**: Database schema is up to date
- [ ] **Static files load**: CSS/JS files load from production
- [ ] **Login works**: Can register and login in production
- [ ] **Data persists**: Changes save to database
- [ ] **Emails work** (if configured): Test email sending
- [ ] **Backups enabled**: Database backups are running

### Performance Verification

- [ ] **Page load time**: Initial page load < 3 seconds
- [ ] **API response time**: API calls complete in < 1 second  
- [ ] **Database performance**: No slow queries
- [ ] **Memory usage**: Backend not using excessive memory
- [ ] **Disk usage**: Database size is reasonable

### Security Verification

- [ ] **DEBUG=False**: Production environment has DEBUG=False
- [ ] **SECRET_KEY secure**: Not the default Django key
- [ ] **ALLOWED_HOSTS correct**: Only your domain(s) listed
- [ ] **CORS restricted**: Only your frontend origin allowed
- [ ] **HTTPS enabled**: All traffic redirects to HTTPS
- [ ] **SSL certificate valid**: Check site certificate (Railway provides free)
- [ ] **No exposed secrets**: Check CloudTrail/logs for leaked credentials
- [ ] **Password requirements enforced**: Users must have strong passwords

### Monitoring & Alerts

- [ ] **Error tracking**: Consider Sentry or similar
- [ ] **Log aggregation**: Can view all logs in one place
- [ ] **Performance monitoring**: Can see API response times
- [ ] **Email alerts**: Notified of critical errors
- [ ] **Database backups**: Automatic backups enabled (Railway does this)
- [ ] **Uptime monitoring**: Status page or monitoring service configured

## 📊 Sign-Off

**Verification Date:** ____________  
**Verified By:** ____________  
**Status:** [ ] Ready for Production [ ] Needs Fixes

**Notes:**
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

## 🔄 If Issues Found

If any checks fail:

1. **Check TROUBLESHOOTING_GUIDE.md** for the issue
2. **Check relevant settings** in settings.py or .env files
3. **Check browser console** and Network tab for errors
4. **Check backend logs** for server errors
5. **Re-read fix documentation** in FIXES_SUMMARY.md

## ✅ Final Sign-Off

Once all checks are complete:

```bash
# Final commit
git add .
git commit -m "Final production verification - all checks passed"
git push origin main

# Monitor deployment in Railway dashboard
# Verify production is responding: https://your-app.railway.app
```

---

**Remember:** Don't skip any checks. They prevent production outages! ⚠️

**Last Updated:** 2026-06-10
