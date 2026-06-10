# ILES — Troubleshooting & Common Issues Guide

## 🚨 Common Issues & Solutions

### 1. CORS Errors (No 'Access-Control-Allow-Origin' header)

**Error Message:**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Causes & Solutions:**

1. **Backend CORS not configured:**
   ```python
   # In settings.py - verify CORS_ALLOWED_ORIGINS
   CORS_ALLOWED_ORIGINS = [
       'http://localhost:5173',
       'http://localhost:3000'
   ]
   ```

2. **Frontend using wrong API URL:**
   ```bash
   # Check .env.local
   cat iles_frontend/.env.local
   # Should show: VITE_API_BASE_URL=http://localhost:8000
   ```

3. **CORS Middleware not first in middleware list:**
   ```python
   # In settings.py - CorsMiddleware must be FIRST
   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware',  # ← MUST BE FIRST
       'django.middleware.security.SecurityMiddleware',
       # ... rest of middleware
   ]
   ```

### 2. 401 Unauthorized Errors

**Error Message:**
```
GET /api/placements/ 401 (Unauthorized)
```

**Causes & Solutions:**

1. **JWT token not being sent:**
   ```javascript
   // In src/api/api.js - verify token is being attached
   api.interceptors.request.use((config) => {
       const token = localStorage.getItem('access_token')
       if (token) {
           config.headers.Authorization = `Bearer ${token}`
       }
       return config
   })
   ```

2. **Token expired or invalid:**
   ```javascript
   // Check localStorage in browser DevTools
   localStorage.getItem('access_token')  // Should not be empty
   localStorage.getItem('refresh_token') // Should not be empty
   ```

3. **Backend JWT configuration missing:**
   ```python
   # In settings.py - verify JWT config exists
   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
       'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
   }
   ```

4. **User not authenticated:**
   - Make sure you're logged in
   - Check browser console for login errors
   - Clear localStorage and login again

### 3. 400 Bad Request Errors

**Error Message:**
```
POST /api/logs/ 400 (Bad Request)
```

**Causes & Solutions:**

1. **Missing required fields:**
   ```javascript
   // Check request body in Network tab
   // Ensure all required fields are included
   ```

2. **Invalid data format:**
   - Check API documentation for expected format
   - Ensure dates are in ISO 8601 format: `YYYY-MM-DD`
   - Ensure numbers are actually numbers, not strings

3. **Validation errors:**
   - Check the response body for detailed error messages
   - Look in browser DevTools → Network → Response tab

### 4. "Cannot GET /" Error

**Error Message:**
```
Cannot GET /
```

**Causes & Solutions:**

1. **Backend not running:**
   ```bash
   # Start backend
   cd iles_backend
   python manage.py runserver
   # Should show: Starting development server at http://127.0.0.1:8000/
   ```

2. **Frontend trying to access wrong URL:**
   ```bash
   # Make sure you're accessing frontend on port 5173
   http://localhost:5173  ✓ Correct
   http://localhost:8000  ✗ Wrong (this is backend)
   ```

### 5. Database Connection Errors

**Error Messages:**
```
OperationalError: connection refused
psycopg2.OperationalError: could not connect to server
```

**Causes & Solutions:**

1. **SQLite (local development):**
   ```bash
   # No setup needed, but verify permissions
   ls -la iles_backend/db.sqlite3
   ```

2. **PostgreSQL (production/optional):**
   ```bash
   # Check DATABASE_URL environment variable
   echo $DATABASE_URL
   
   # Try connecting manually
   psql $DATABASE_URL
   ```

3. **Migrations not run:**
   ```bash
   # Run migrations
   cd iles_backend
   python manage.py migrate
   ```

### 6. Static Files Not Loading (404)

**Error Message:**
```
GET /static/... 404 (Not Found)
```

**Causes & Solutions:**

1. **Static files not collected:**
   ```bash
   cd iles_backend
   python manage.py collectstatic --noinput
   ```

2. **STATIC_URL/STATIC_ROOT misconfigured:**
   ```python
   # In settings.py - verify these are set
   STATIC_URL = 'static/'
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   ```

### 7. Media Files Not Loading (Avatar Images)

**Error Message:**
```
GET /media/avatars/... 404 (Not Found)
```

**Causes & Solutions:**

1. **Media files not served in development:**
   ```python
   # In urls.py - verify media file serving is enabled
   urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
   ```

2. **Wrong file path in database:**
   - Check UserProfile model stores correct path
   - Verify file actually exists in media folder

### 8. "Module Not Found" Errors

**Error Messages:**
```
ModuleNotFoundError: No module named 'corsheaders'
ImportError: cannot import name 'serializers'
```

**Causes & Solutions:**

1. **Dependencies not installed:**
   ```bash
   # Install backend dependencies
   cd iles_backend
   pip install -r requirements.txt
   
   # Install frontend dependencies
   cd iles_frontend
   npm install
   ```

2. **Wrong Python environment:**
   ```bash
   # Verify you're in the virtual environment
   which python  # Should show .venv path
   
   # If not, activate it
   source venv/Scripts/activate  # Windows
   source venv/bin/activate      # Mac/Linux
   ```

### 9. Port Already in Use

**Error Message:**
```
Address already in use
```

**Causes & Solutions:**

1. **Another process using the port:**
   ```bash
   # Find process using port 8000
   lsof -i :8000      # Mac/Linux
   netstat -ano | findstr :8000  # Windows
   
   # Kill the process
   kill -9 <PID>      # Mac/Linux
   taskkill /PID <PID> /F  # Windows
   ```

2. **Use different port:**
   ```bash
   # Backend on different port
   python manage.py runserver 8001
   
   # Frontend on different port
   VITE_PORT=5174 npm run dev
   ```

### 10. Login Page Shows but Dashboard Won't Load

**Problem:**
- Can login successfully
- Dashboard page goes blank or shows errors

**Solutions:**

1. **Check user role is set:**
   ```bash
   # In Django shell
   python manage.py shell
   >>> from core.models import CustomUser
   >>> user = CustomUser.objects.get(email='your@email.com')
   >>> print(user.role)  # Should not be None
   ```

2. **Verify user profile exists:**
   ```bash
   >>> from core.models import UserProfile
   >>> profile = UserProfile.objects.get(user=user)  # Should not error
   ```

3. **Check API response for errors:**
   - Open DevTools → Network tab
   - Look for failed requests
   - Click on request, check Response tab for error details

## 🔍 Debugging Tools & Techniques

### Browser DevTools

1. **Network Tab:**
   - Check all API requests
   - Verify response status codes
   - Look at request/response headers
   - Inspect request body

2. **Console Tab:**
   - Check for JavaScript errors
   - Look for CORS errors
   - Check for network errors

3. **Application Tab:**
   - View localStorage for tokens
   - Check cookies
   - Verify environment variables (if exposed)

### Django Debug

1. **Enable SQL Query Logging:**
   ```python
   # In settings.py
   LOGGING = {
       'version': 1,
       'handlers': {
           'console': {
               'class': 'logging.StreamHandler',
           },
       },
       'loggers': {
           'django.db.backends': {
               'handlers': ['console'],
               'level': 'DEBUG',
           },
       },
   }
   ```

2. **Django Shell:**
   ```bash
   python manage.py shell
   >>> from core.models import CustomUser
   >>> CustomUser.objects.all()
   ```

3. **Print Debugging:**
   ```python
   # In views.py
   print(f"DEBUG: User={request.user}, Role={request.user.role}")
   ```

## 📋 Pre-Deployment Checklist

Before going to production:

- [ ] All environment variables set in .env
- [ ] DEBUG = False
- [ ] SECRET_KEY is random and secure
- [ ] ALLOWED_HOSTS configured correctly
- [ ] Database migrations run successfully
- [ ] Static files collected
- [ ] Frontend builds without errors
- [ ] All API endpoints tested
- [ ] Login/logout flows work
- [ ] CORS errors resolved
- [ ] No console errors or warnings
- [ ] No hardcoded API URLs in code
- [ ] Email configuration tested (if using)
- [ ] Database backups enabled
- [ ] SSL certificate configured
- [ ] HTTPS redirects working

## 📞 Getting Help

1. **Check Logs:**
   ```bash
   # Backend logs
   tail -f iles_backend/logs.txt
   
   # Frontend logs in console
   # Browser DevTools → Console tab
   ```

2. **Search Stack Overflow:**
   - Search error message verbatim
   - Include "Django" or "React" in search
   - Check for similar issues

3. **Check Official Documentation:**
   - Django: https://docs.djangoproject.com/
   - DRF: https://www.django-rest-framework.org/
   - React: https://react.dev/
   - Railway: https://docs.railway.app/

4. **Test Isolated Endpoints:**
   ```bash
   # Use curl to test API directly
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/profile/
   ```

---

**Last Updated:** 2026-06-10  
**Status:** Production Ready
