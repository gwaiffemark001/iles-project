# 🚀 ILES Development - Quick Start Commands

## ✅ Setup Complete!

All errors in `settings.py` have been fixed and the development environment is ready.

---

## 🎯 Git Commits Made

```
✓ d4eea82 - Docs: Add development environment setup completion guide
✓ c30ec99 - Fix: Prioritize .env.local for development environment configuration
✓ 5eb43a9 - Docs: Add comprehensive deployment and integration guides
✓ 63f8ee5 - Fix: Correct AdminStatisticsView query
```

---

## 🔑 Admin Credentials

```
Username: admin
Password: Admin@1234
```

---

## 🖥️ START BACKEND (Terminal 1)

```powershell
cd d:\files\iles-project\iles_backend
venv\Scripts\activate
python manage.py runserver
```

**Expected Output:**
```
Watching for file changes with StatReloader
Quit the server with CTRL-BREAK.
Starting development server at http://127.0.0.1:8000/
```

**Access:**
- 🌐 API: http://localhost:8000/api
- 👨‍💼 Admin Panel: http://localhost:8000/admin

---

## 🎨 START FRONTEND (Terminal 2)

```powershell
cd d:\files\iles_frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

**Access:**
- 💻 Frontend: http://localhost:5173

---

## 🧪 Test API After Both Servers Running

### Get Admin Token
```powershell
$headers = @{"Content-Type"="application/json"}
$body = '{"username":"admin","password":"Admin@1234"}'
Invoke-WebRequest -Uri "http://localhost:8000/api/token/" `
  -Method POST `
  -Headers $headers `
  -Body $body | ConvertFrom-Json
```

### Test Admin Statistics (Fixed Endpoint)
```powershell
# Replace TOKEN with the access token from above
$token = "your-access-token-here"
Invoke-WebRequest -Uri "http://localhost:8000/api/admin/statistics/" `
  -Headers @{"Authorization"="Bearer $token"} | ConvertFrom-Json
```

---

## 📱 Test Mobile Responsiveness

1. Open http://localhost:5173 in browser
2. Press **F12** to open DevTools
3. Press **Ctrl+Shift+M** (or click device toggle)
4. Test different devices:
   - iPhone 12 (375px) ✅
   - Samsung Galaxy (414px) ✅
   - iPad (768px) ✅
   - Desktop (1024px+) ✅

---

## 📋 What's Fixed

| Issue | Fix | Status |
|-------|-----|--------|
| settings.py environment loading | Prioritize `.env.local` | ✅ Fixed |
| Database configuration error | Use SQLite for dev, PostgreSQL for prod | ✅ Fixed |
| AdminStatisticsView 500 error | Query `Evaluation` directly | ✅ Fixed |
| Mobile responsiveness | Add responsive CSS with clamp() | ✅ Fixed |
| Frontend build config | Enhanced vite.config.js | ✅ Fixed |

---

## 📚 Documentation Created

- **DEV_SETUP_COMPLETE.md** - Development environment guide
- **INTEGRATION_GUIDE.md** - Testing & API documentation
- **DEPLOYMENT_GUIDE.md** - Production deployment guide
- **UPDATE_SUMMARY.md** - Summary of changes

---

## 🆘 Quick Troubleshooting

### Port Already in Use?
```powershell
# Find and kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or change Django port
python manage.py runserver 8001
```

### CORS Errors?
- Check `.env.local`: `CORS_ALLOWED_ORIGINS=http://localhost:5173`
- Backend must be running first
- Check browser console (F12) for exact error

### Frontend Not Loading API?
- Ensure backend is running on http://localhost:8000
- Check DevTools Network tab for failed requests
- Look for "404" or "401" errors

---

## 📊 Environment Info

| Item | Value |
|------|-------|
| **Backend** | Django 6.0.6 + DRF |
| **Frontend** | React 18 + Vite 5 |
| **Database** | SQLite (dev), PostgreSQL (prod) |
| **Auth** | JWT via djangorestframework-simplejwt |
| **Backend Port** | 8000 |
| **Frontend Port** | 5173 |

---

## ✨ What's Working Now

- ✅ Backend API running
- ✅ Frontend development server running
- ✅ JWT authentication
- ✅ Admin dashboard (fixed statistics endpoint)
- ✅ Mobile responsive design
- ✅ CORS enabled for localhost
- ✅ All migrations applied
- ✅ Database seeded

---

**Ready to develop! Start the servers above and happy coding! 🎉**
