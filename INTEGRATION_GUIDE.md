# ILES Application - Complete Integration Guide
## Development, Testing & Production Setup

---

## 📋 Table of Contents

1. [Backend Setup (Development)](#backend-setup-development)
2. [Frontend Setup (Development)](#frontend-setup-development)
3. [API Testing & Verification](#api-testing--verification)
4. [Mobile Responsiveness](#mobile-responsiveness)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Backend Setup (Development)

### Prerequisites
- Python 3.10+
- PostgreSQL (optional for development, uses SQLite by default)
- pip and virtualenv

### Step 1: Clone & Install
```bash
cd iles-project/iles_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment
```bash
# The .env.local file is already configured for development
cat .env.local

# Expected output:
# DEBUG=True
# SECRET_KEY=django-insecure-dev-key-not-for-production...
# CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 3: Run Migrations
```bash
python manage.py migrate

# You should see:
# Operations to perform:
#   Apply all migrations: admin, auth, core, contenttypes, sessions
# Running migrations:
#   Applying core.0001_initial... OK
#   Applying core.0002_...
```

### Step 4: Create Superuser (Admin)
```bash
python manage.py createsuperuser

# Follow prompts:
# Username: admin
# Email: admin@iles.local
# Password: (enter a secure password)
# Superuser created successfully
```

### Step 5: Start Development Server
```bash
# Terminal 1: Run Django development server
python manage.py runserver

# You should see:
# Watching for file changes with StatReloader
# Quit the server with CTRL-BREAK.
# Django version 6.0.6, using settings 'iles_backend.settings'
# Starting development server at http://127.0.0.1:8000/
```

---

## Frontend Setup (Development)

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Step 1: Install Dependencies
```bash
cd iles_frontend

# Install dependencies
npm install
# or
yarn install

# Expected output shows successful installation of:
# - react, react-dom
# - vite, @vitejs/plugin-react
# - tailwindcss, @tailwindcss/vite
# - axios
```

### Step 2: Configure Environment
```bash
# The .env.local file should already be configured
cat .env.local

# Expected output:
# VITE_API_BASE_URL=http://localhost:8000
```

### Step 3: Start Development Server
```bash
# Terminal 2: Run Vite development server
npm run dev

# You should see:
#   VITE v5.x.x  ready in xxx ms
#   ➜  Local:   http://localhost:5173/
#   ➜  press h + enter to show help
```

### Step 4: Verify Setup
Open browser and navigate to:
- Frontend: http://localhost:5173
- Backend Admin: http://localhost:8000/admin
- Backend API: http://localhost:8000/api

---

## API Testing & Verification

### Quick Health Check
```bash
# Test backend is running
curl http://localhost:8000/api/

# Expected: API response or 404 (which is fine - it means backend is running)
```

### Authentication Flow Test

#### 1. User Registration
```bash
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "email": "student1@example.com",
    "password": "SecurePass123!",
    "role": "student"
  }'

# Expected response:
# {
#   "id": 1,
#   "username": "student1",
#   "email": "student1@example.com",
#   "role": "student"
# }
```

#### 2. Login & Get Token
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "SecurePass123!"
  }'

# Expected response:
# {
#   "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
# }

# Save the access token for subsequent requests:
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
```

#### 3. Test Protected Endpoint
```bash
# Use the token from login response
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/profile/

# Expected: User profile data or 200 OK
```

#### 4. Admin Statistics Endpoint (Fixed in this update)
```bash
# Login as admin first, then:
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/api/admin/statistics/

# Expected response (now fixed):
# {
#   "total_students": 5,
#   "total_supervisors": 3,
#   "total_placements": 4,
#   "active_placements": 2,
#   "total_logs": 12,
#   "pending_logs": 2,
#   "approved_logs": 8,
#   "draft_logs": 2,
#   "total_evaluations": 4,
#   "logs_by_status": [...]
# }
```

### Common Endpoints to Test

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/token/` | POST | Get JWT token |
| `/api/token/refresh/` | POST | Refresh expired token |
| `/api/register/` | POST | Register new user |
| `/api/profile/` | GET, PUT | View/update profile |
| `/api/users/` | GET | List users (admin only) |
| `/api/logs/` | GET, POST | List/create weekly logs |
| `/api/placements/` | GET, POST | List/create placements |
| `/api/evaluations/` | GET, POST | List/create evaluations |
| `/api/admin/statistics/` | GET | Admin dashboard stats |

---

## Mobile Responsiveness

### What's Been Implemented

1. **Viewport Meta Tag**: Properly configured for mobile browsers
2. **Responsive Font Sizing**: Uses `clamp()` for fluid typography
3. **Touch-Friendly Buttons**: Minimum 44x44px touch targets
4. **Mobile-First CSS**: Media queries for screens < 640px and < 480px
5. **Flexible Layouts**: Grid and flexbox with auto-fitting
6. **Images**: Auto-scaling with `max-width: 100%`
7. **Accessibility**: WCAG compliance, reduced motion support

### Testing Mobile Responsiveness

#### Using Browser DevTools
1. Open Chrome/Firefox DevTools (F12)
2. Click "Toggle device toolbar" (or Ctrl+Shift+M)
3. Select different devices:
   - iPhone 12/13/14/15
   - Samsung Galaxy S21+
   - iPad Air
   - Custom resolution (375px width for small phones)
4. Test:
   - Buttons are easily clickable
   - Text is readable (no horizontal scroll)
   - Images scale properly
   - Forms are accessible

#### Tested Screen Sizes
- Mobile: 320px - 480px (small phones)
- Tablet: 480px - 640px (large phones)
- Desktop: 640px+ (tablets and larger)

### CSS Features Used
- `clamp()` for responsive sizing
- CSS Grid with `auto-fit`
- Flexbox for alignment
- Media queries
- Touch-friendly minimum targets
- Semantic HTML for accessibility

---

## Production Deployment

### Backend Deployment (Railway)

#### Step 1: Set Environment Variables on Railway
```
DEBUG=False
SECRET_KEY=your-production-secret-key-here (generate a new one!)
ALLOWED_HOSTS=iles-project-iles-backend.up.railway.app
DATABASE_URL=postgresql://... (Railway provides this automatically)
CORS_ALLOWED_ORIGINS=https://iles-project-iles-frontend.up.railway.app
```

#### Step 2: Deploy Backend
```bash
git add .
git commit -m "Fix: AdminStatisticsView and mobile responsiveness improvements"
git push railway main
```

#### Step 3: Run Migrations on Railway
```bash
railway run python manage.py migrate --noinput
```

### Frontend Deployment (Railway or Vercel)

#### Using Railway
```bash
# Build frontend
cd iles_frontend
npm run build

# Deploy to Railway
railway up
```

#### Using Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variable on Vercel dashboard:
# VITE_API_BASE_URL=/api
```

#### Post-Deployment Steps
1. Verify backend API is accessible from frontend
2. Test user registration and login
3. Test admin dashboard endpoint
4. Check mobile responsiveness on actual devices
5. Monitor server logs for errors

---

## Troubleshooting

### Backend Issues

#### 500 Error on `/api/admin/statistics/`
**FIXED**: Updated query from `WeeklyLog.objects.filter(evaluations__id__isnull=False)` to `Evaluation.objects.count()`

#### CORS Errors in Development
```python
# Check .env.local has:
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Make sure CorsMiddleware is FIRST in settings.py MIDDLEWARE list
```

#### 401 Unauthorized
- Ensure JWT token is being sent in request headers
- Check token hasn't expired (1-hour lifetime by default)
- Token refresh endpoint: POST `/api/token/refresh/`

#### Database Connection Error
```bash
# Reset SQLite (development only!)
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Frontend Issues

#### API Requests Failing
- Check `.env.local` has correct `VITE_API_BASE_URL`
- For production: use `/api` (relative URL) in `.env.production`
- Verify backend is running and accessible

#### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

#### Mobile Display Issues
- Clear browser cache: Ctrl+Shift+Delete
- Test in private/incognito window
- Verify viewport meta tag in index.html

### General Troubleshooting

#### Check All Services Running
```bash
# Backend should be on port 8000
http://localhost:8000/api/

# Frontend should be on port 5173
http://localhost:5173

# Both should be accessible without errors
```

#### View Backend Logs
```bash
# Terminal where Django is running - shows request logs and errors
# Look for:
# [dd/mmm/yyyy hh:mm:ss] "GET /api/..." 200 OK
# [dd/mmm/yyyy hh:mm:ss] "GET /api/..." 500 ERROR
```

#### View Frontend Logs
```bash
# Terminal where Vite is running shows build and server info
# Browser console (F12) shows API response errors and client errors
```

---

## Quick Reference Commands

```bash
# Backend
cd iles_backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python manage.py runserver

# Frontend
cd iles_frontend
npm run dev

# Build frontend for production
npm run build

# View built frontend
npm run preview

# Run tests (when available)
python manage.py test
npm run test
```

---

## Next Steps

1. ✅ Backend 500 error fixed
2. ✅ Mobile responsiveness added
3. ✅ Frontend environment configuration updated
4. Run through API testing checklist above
5. Deploy to production with new environment variables
6. Monitor logs after deployment
7. Test on real mobile devices

---

**Last Updated**: 2026-06-10  
**Status**: Ready for Development & Production Deployment
