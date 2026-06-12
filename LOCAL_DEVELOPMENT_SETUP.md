# Local Development Setup Guide

This guide provides step-by-step instructions for setting up the ILES project for local development with hot reload and live UI feedback.

## Prerequisites

- **Node.js 18+** — Download from https://nodejs.org/
- **Python 3.11+** — Download from https://www.python.org/
- **PostgreSQL 15+** (optional, SQLite works for development) — https://www.postgresql.org/
- **Git** — Version control
- **VS Code** (recommended) — Code editor with Pylance and ESLint extensions

## 1. Backend Setup (Django + Django REST Framework)

### 1.1 Clone and Navigate to Backend

```bash
cd d:\files\iles-project\iles_backend
```

### 1.2 Create Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate
```

**Windows (CMD):**
```cmd
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 1.3 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 1.4 Setup Environment Variables

Create a `.env` file in `iles_backend/` directory:

```env
# Security
DEBUG=True
SECRET_KEY=your-secret-key-for-development
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (use SQLite for development by default)
# SQLite will be used if DATABASE_URL and DB_NAME are not set
DATABASE_URL=  # Leave empty for SQLite

# Or PostgreSQL (if you have it running):
# DB_NAME=iles_dev
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432

# CORS & CSRF
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:5173

# Email (for password reset - local development)
# The backend uses Gmail OAuth2, so set these if testing locally:
# GMAIL_CLIENT_ID=
# GMAIL_CLIENT_SECRET=
# GMAIL_REFRESH_TOKEN=
# GMAIL_API_USER=
# DEFAULT_FROM_EMAIL=
```

### 1.5 Run Migrations

```bash
python manage.py migrate
```

### 1.6 Create Superuser (Admin Account)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

### 1.7 Start Development Server

```bash
python manage.py runserver 0.0.0.0:8000
```

The backend will be available at: `http://localhost:8000`

**Admin Interface:** `http://localhost:8000/admin`

## 2. Frontend Setup (React + Vite)

### 2.1 Navigate to Frontend Directory

```bash
cd d:\files\iles-project\iles_frontend
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Setup Environment Variables

Create a `.env.local` file in `iles_frontend/` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
```

### 2.4 Start Development Server with Hot Reload

```bash
npm run dev
```

This will start Vite development server (typically on `http://localhost:5173`)

**Features:**
- ✅ Hot Module Replacement (HMR) — Changes reflect instantly
- ✅ Fast rebuild times
- ✅ Automatic browser refresh
- ✅ Source maps for debugging

## 3. Running Both Services Simultaneously

### Option A: Separate Terminal Windows (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd d:\files\iles-project\iles_backend
.\venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
cd d:\files\iles-project\iles_frontend
npm run dev
```

Then open your browser to `http://localhost:5173`

### Option B: Using VS Code Tasks

See [VS Code Tasks Configuration](#vs-code-tasks-configuration) below.

## 4. Testing Workflow

### Backend Testing

Run Django tests:
```bash
python manage.py test
```

Run specific test module:
```bash
python manage.py test core.tests.TestEvaluationCalculations
```

### Frontend Testing

Run ESLint (linting):
```bash
npm run lint
```

Fix linting issues automatically:
```bash
npm run lint -- --fix
```

Build for testing:
```bash
npm run build
```

## 5. Database Management

### SQLite Development (Default)

The SQLite database is automatically created at `iles_backend/db.sqlite3`. 

To reset database:
```bash
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### PostgreSQL Development (Optional)

If you want to test with PostgreSQL:

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE iles_dev;
CREATE USER iles_user WITH PASSWORD 'your_password';
ALTER ROLE iles_user SET client_encoding TO 'utf8';
ALTER ROLE iles_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE iles_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE iles_dev TO iles_user;
```

2. Update `.env`:
```env
DB_NAME=iles_dev
DB_USER=iles_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

3. Run migrations:
```bash
python manage.py migrate
```

## 6. Debugging

### Backend Debugging

Use Django shell:
```bash
python manage.py shell
```

Example queries:
```python
from core.models import CustomUser, Evaluation
users = CustomUser.objects.all()
evaluations = Evaluation.objects.filter(week_number=1)
```

### Frontend Debugging

1. Open DevTools: `F12` or `Right-click → Inspect`
2. Check Network tab for API requests
3. Check Console for JavaScript errors
4. React DevTools extension recommended: https://react-devtools-tutorial.vercel.app/

### API Debugging

Use the Django admin interface:
- `http://localhost:8000/admin` (with superuser credentials)

Or use REST client tools:
- **VS Code Extension:** REST Client by Humao Chen
- **Postman:** Desktop app for API testing

## 7. Common Issues & Fixes

### Issue: "ModuleNotFoundError: No module named 'django'"

**Fix:** Ensure virtual environment is activated:
```bash
# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### Issue: "Port 8000 already in use"

**Fix:** Run on different port:
```bash
python manage.py runserver 0.0.0.0:8001
```

### Issue: "Port 5173 already in use"

**Fix:** Kill process or run on different port:
```bash
npm run dev -- --port 5174
```

### Issue: CORS errors in frontend

**Fix:** Ensure `CORS_ALLOWED_ORIGINS` includes `http://localhost:5173` in backend `.env`

### Issue: Static files not loading

**Fix:** Collect static files:
```bash
python manage.py collectstatic --noinput
```

## 8. Production Readiness Checklist

Before deploying to production:

- [ ] Set `DEBUG=False` in production settings
- [ ] Set specific `ALLOWED_HOSTS` (not ['*'])
- [ ] Set `SECRET_KEY` to secure random value
- [ ] Configure email service for password resets
- [ ] Set up PostgreSQL database
- [ ] Configure CORS_ALLOWED_ORIGINS with production frontend domain
- [ ] Run migrations on production database
- [ ] Collect static files
- [ ] Test email functionality
- [ ] Run all tests: `python manage.py test`
- [ ] Run linting: `npm run lint`

See [Production Deployment Guide](PRODUCTION_DEPLOYMENT.md) for details.

## 9. Useful Commands Reference

### Backend
```bash
# Development server
python manage.py runserver 0.0.0.0:8000

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Run tests
python manage.py test

# Create superuser
python manage.py createsuperuser

# Shell/REPL
python manage.py shell

# Collect static files
python manage.py collectstatic
```

### Frontend
```bash
# Development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## 10. IDE Configuration

### VS Code Extensions (Recommended)

1. **Pylance** — Python language server
   - Better autocomplete for backend development
   - Installation: https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance

2. **ES Lint** — JavaScript linting
   - Real-time linting feedback
   - Installation: https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint

3. **REST Client** — API testing
   - Make HTTP requests directly from VS Code
   - Installation: https://marketplace.visualstudio.com/items?itemName=humao.rest-client

4. **Thunder Client** — Alternative API tester
   - Installation: https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client

## 11. Next Steps

1. **Start both services** — Follow Section 3 above
2. **Access the application** — Open `http://localhost:5173` in your browser
3. **Login** — Use the superuser credentials you created in Step 1.6
4. **Test features** — Navigate through the application and test functionality
5. **Check browser DevTools** — Monitor network requests and console logs
6. **Make changes** — Edit code and see changes reflected in real-time

---

**Need Help?**
- Check backend logs: Look at Django runserver output
- Check frontend logs: Open browser DevTools Console
- Check `.env` file: Ensure all environment variables are set
- Review error messages carefully — they usually point to the issue

Happy developing! 🚀
