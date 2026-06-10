# ILES — Quick Developer Reference

Fast reference guide for common development tasks.

## 🚀 Starting Development

### Backend
```bash
cd iles_backend

# First time setup
python -m venv venv
.\venv\Scripts\activate    # Windows
source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver
# Visit: http://localhost:8000/admin/
```

### Frontend
```bash
cd iles_frontend

# First time setup
npm install

# Start dev server
npm run dev
# Visit: http://localhost:5173
```

## 🔑 Authentication Flow

1. **Register Account:**
   - POST `/api/register/`
   - Body: `{email, password, first_name, last_name, role}`

2. **Login:**
   - POST `/api/token/` (get access + refresh tokens)
   - Body: `{email, password}`
   - Response: `{access, refresh}`

3. **API Requests:**
   - Add header: `Authorization: Bearer {access_token}`
   - Automatic in axios interceptor

4. **Token Refresh:**
   - POST `/api/token/refresh/`
   - Body: `{refresh: refresh_token}`
   - Returns new `access` token

5. **Logout:**
   - Remove tokens from localStorage
   - No server-side logout needed (JWT stateless)

## 📁 Project Structure

```
iles-project/
├── iles_backend/              # Django backend
│   ├── core/                  # Main app (models, views, serializers)
│   ├── iles_backend/          # Settings, URLs, WSGI
│   ├── manage.py              # Django CLI
│   ├── requirements.txt        # Python dependencies
│   └── Procfile               # Production config
│
├── iles_frontend/             # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── api/              # API client & endpoints
│   │   ├── auth/             # Auth context & hooks
│   │   ├── routes/           # Route definitions
│   │   └── App.jsx           # Main app component
│   ├── package.json          # JS dependencies
│   ├── vite.config.js        # Vite configuration
│   └── .env.local            # Local env variables
│
├── PRODUCTION_DEPLOYMENT_GUIDE.md
├── TROUBLESHOOTING_GUIDE.md
└── LOCAL_DEVELOPMENT_SETUP.md
```

## 🔗 API Endpoints

### Authentication
```
POST   /api/token/              - Login (get tokens)
POST   /api/token/refresh/      - Refresh access token
POST   /api/register/           - Register new account
POST   /api/forgot-password/    - Request password reset
POST   /api/forgot-password-confirm/  - Confirm password reset
```

### Profile
```
GET    /api/profile/            - Get current user profile
PUT    /api/profile/            - Update current user profile
POST   /api/change-password/    - Change password
GET    /api/users/              - List users (admin only)
GET    /api/users/{id}/         - Get user details
GET    /api/users/{id}/summary/ - Get user summary
```

### Logs
```
GET    /api/logs/               - Get logs (role-based filtering)
POST   /api/logs/               - Create new log
GET    /api/logs/{id}/          - Get log details
PUT    /api/logs/{id}/          - Update log
POST   /api/logs/{id}/submit/   - Submit log for review
POST   /api/logs/{id}/review/   - Add supervisor review
POST   /api/logs/{id}/approve/  - Approve log
POST   /api/logs/{id}/revise/   - Request revision
```

### Placements
```
GET    /api/placements/         - Get placements (role-based)
POST   /api/placements/         - Create new placement (admin)
GET    /api/placements/{id}/    - Get placement details
PUT    /api/placements/{id}/    - Update placement
GET    /api/placements/available/  - Get available placements
```

### Applications
```
GET    /api/applications/       - Get applications
POST   /api/applications/       - Submit application
POST   /api/applications/{id}/decide/  - Approve/reject application
```

### Evaluations
```
GET    /api/evaluations/        - Get evaluations
POST   /api/evaluations/        - Create evaluation
GET    /api/evaluations/{id}/   - Get evaluation details
PUT    /api/evaluations/{id}/   - Update evaluation
GET    /api/criteria/           - Get evaluation criteria
```

### Notifications
```
GET    /api/notifications/      - Get user notifications
POST   /api/notifications/{id}/read/  - Mark notification read
POST   /api/notifications/mark-all-read/  - Mark all read
```

### Chat
```
GET    /api/chat/contacts/      - Get chat contacts
GET    /api/chat/messages/{id}/ - Get messages with user
POST   /api/chat/messages/{id}/ - Send message
```

### Admin
```
GET    /api/admin/statistics/   - Get admin dashboard stats
```

## 📝 Adding New Endpoints

### Backend
1. Add model in `core/models.py`
2. Create serializer in `core/serializers.py`
3. Create view in `core/views.py`
4. Add URL in `iles_backend/urls.py`

### Frontend
1. Add function in `src/api/api.js`
2. Create component in `src/pages/` or `src/components/`
3. Add route in `src/routes/index.jsx`
4. Add link in navigation

## 🧪 Testing

### Run Tests
```bash
# Backend
cd iles_backend
python manage.py test

# Frontend
cd iles_frontend
npm test
```

### Lint Code
```bash
# Frontend
npm run lint
```

## 💾 Database

### Migrations
```bash
# Create migration for model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# See migration status
python manage.py showmigrations

# Rollback migration
python manage.py migrate core 0002  # Go back to migration 0002
```

### Data Backup
```bash
# Dump data to file
python manage.py dumpdata > backup.json

# Load data from file
python manage.py loaddata backup.json

# Delete all data (be careful!)
python manage.py flush
```

## 🐛 Common Debug Commands

```bash
# Django shell
python manage.py shell

# Inside shell:
>>> from core.models import CustomUser
>>> user = CustomUser.objects.get(email='test@example.com')
>>> user.role  # Check user role
>>> user.userprofile  # Check profile exists

# Check migrations
python manage.py makemigrations --dry-run

# SQL preview
python manage.py sqlmigrate core 0001
```

## 📦 Environment Variables

### Local Development (.env.local)

Backend:
```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=  # Leave empty for SQLite
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Frontend:
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🔒 Security

### Never commit:
- `.env` or `.env.local` with real values
- Secret keys
- Database passwords
- API keys or tokens

### Use .gitignore:
```
.env
.env.local
db.sqlite3
__pycache__/
*.pyc
node_modules/
venv/
.venv/
```

## 📊 User Roles

```python
STUDENT                    # Submit logs, view evaluations
WORKPLACE_SUPERVISOR       # Review logs, create evaluations
ACADEMIC_SUPERVISOR        # Monitor progress, approve logs
ADMIN                      # System administration
PROGRAM_ADMIN              # Program-level administration
```

## 🎨 Component Examples

### Using API
```javascript
import { api } from '@/api/api'

// GET request
const response = await api.get('/logs/')

// POST request
const response = await api.post('/logs/', {
    week_number: 1,
    summary: 'This week...',
})

// With error handling
try {
    const response = await api.get('/logs/')
} catch (error) {
    console.error('Error:', error.response?.data?.detail)
}
```

### Using Authentication
```javascript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
    const { user, login, logout } = useAuth()
    
    const handleLogin = async (email, password) => {
        await login(email, password)
    }
    
    return <div>User: {user?.email}</div>
}
```

## 🚀 Deployment

### Production Checklist
```bash
# 1. Test locally
npm run build  # Frontend
python manage.py test  # Backend

# 2. Set environment variables in Railway

# 3. Push to GitHub
git add .
git commit -m "Release v1.0"
git push origin main

# 4. Railway auto-deploys
# Check Railway dashboard for status

# 5. Verify production
# Visit: https://your-app.railway.app
```

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| CORS error | Check CORS_ALLOWED_ORIGINS in settings |
| 401 error | Check token in localStorage, verify JWT config |
| 404 error | Check route/URL, verify endpoint exists |
| Port in use | Kill process on port or use different port |
| Migrations error | Run `python manage.py migrate` |
| Dependencies error | Run `pip install -r requirements.txt` or `npm install` |

## 📚 Resources

- [Django Docs](https://docs.djangoproject.com/)
- [DRF Docs](https://www.django-rest-framework.org/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Railway Docs](https://docs.railway.app/)

---

**Last Updated:** 2026-06-10
