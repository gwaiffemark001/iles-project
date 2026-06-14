# ILES — Internship Logging & Evaluation System

A comprehensive web-based platform for managing student internships, weekly logging, and evaluation processes in educational institutions.

## 🏗️ Architecture Overview

### Frontend Architecture
- **React 18** with modern hooks and functional components
- **Vite** for fast development and optimized builds
- **Component-based Architecture** with reusable UI components
- **Custom Hooks** for state management and form validation
- **Centralized API Layer** for consistent backend communication
- **Responsive Design** with TailwindCSS and custom CSS

### Backend Architecture
- **Django 5.2** with Django REST Framework
- **PostgreSQL** database with optimized queries
- **JWT Authentication** with refresh token support
- **RESTful API** with proper HTTP status codes
- **Role-based Access Control** for different user types

## 🎯 Key Features

### User Roles
- **Students**: Submit weekly logs, view evaluations, manage placements
- **Academic Supervisors**: Review logs, create evaluations, monitor progress
- **Workplace Supervisors**: Review student performance, provide feedback
- **Administrators**: System management, user administration

### Core Functionality
- **Weekly Log Submission**: Students submit detailed weekly internship logs
- **Multi-stage Review Process**: Draft → Submitted → Reviewed → Approved
- **Evaluation System**: Comprehensive student performance evaluation
- **Placement Management**: Track and manage internship placements
- **Profile Management**: User profiles with avatar upload support
- **Real-time Chat**: Communication between students and supervisors

## 📦 Code Reusability Implementation

### Reusable Components
- **FormField**: Standardized form inputs with validation
- **DataTable**: Sortable, paginated data display
- **Modal**: Flexible dialog system for confirmations
- **UserAvatar**: Profile picture component with fallbacks

### Custom Hooks
- **useFormValidation**: Centralized form validation logic
- **useAuth**: Authentication state management
- **useApi**: Custom hook for API calls with error handling

### Utilities & Services
- **apiService**: Centralized API layer with error handling
- **helpers**: Common data manipulation and formatting
- **errorUtils**: Consistent error handling patterns

## 🔧 Development Setup

### Prerequisites
- Node.js 16+
- Python 3.8+
- PostgreSQL 12+

### Frontend Setup
```bash
cd iles_frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd iles_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## 📚 API Documentation

### Authentication
- `POST /api/token/` — Login, get JWT token
- `POST /api/token/refresh/` — Refresh token
- `POST /api/register/` — Register new user
- `GET/PUT /api/profile/` — View or update own profile
- `POST /api/change-password/` — Change password

### Weekly Logs
- `GET/POST /api/logs/` — List or create logs
- `GET/PUT/DELETE /api/logs/<pk>/` — Single log operations
- `PUT /api/logs/<pk>/submit/` — Submit a draft log
- `PUT /api/logs/<pk>/review/` — Supervisor reviews log
- `PUT /api/logs/<pk>/approve/` — Supervisor approves log
- `PUT /api/logs/<pk>/revise/` — Send log back to draft

### Placements
- `GET/POST /api/placements/` — List or create placements
- `GET/PUT/DELETE /api/placements/<pk>/` — Single placement

### Evaluations
- `GET/POST /api/evaluations/` — List or create evaluations
- `GET/DELETE /api/evaluations/<pk>/` — Single evaluation
- `GET/POST /api/criteria/` — Evaluation criteria

## 🛠️ Tech Stack

### Backend
- **Django 5.2** + Django REST Framework
- **PostgreSQL** with optimized indexing
- **JWT Authentication** (djangorestframework-simplejwt)
- **Redis** for session management
- **Celery** for background tasks

### Frontend
- **React 18** with modern hooks
- **Vite** for development and building
- **TailwindCSS** for responsive design
- **Axios** for HTTP requests
- **React Router** for navigation

### DevOps
- **GitHub Actions** for CI/CD
- **Docker** for containerization
- **Nginx** for reverse proxy

## 🧪 Testing

### Test Credentials
- **Admin**: username=gideonadmin, role=admin
- **Student**: username=student, role=student
- **Supervisor**: username=supervisor, role=supervisor

### Test Coverage
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Critical user journey testing

## 📋 Project Structure

```
iles-project/
├── iles_backend/          # Django backend
│   ├── core/              # Core app with models, views, serializers
│   ├── users/             # User management
│   └── iles_backend/      # Django settings and configuration
├── iles_frontend/         # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── utils/         # Utility functions
│   │   └── pages/         # Page components
│   └── public/            # Static assets
└── docs/                 # Project documentation
```

## 🚀 Deployment

### Production Deployment
- **Frontend**: Deployed to a hosting provider of your choice (e.g. Vercel/Netlify/Railway). Update `FRONTEND_URL` in `iles_backend/.env` with your deployment URL.
- **Backend**: Deployed to Heroku/AWS
- **Database**: Managed PostgreSQL service
- **CDN**: Cloudflare for static assets

### Environment Variables
```bash
# Backend
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
DEBUG=False

# Frontend
VITE_API_BASE_URL=http://your-backend.com
VITE_ENV=production
```

## 🤝 Contributing

### Development Guidelines
1. **Follow the established component patterns**
2. **Use reusable components** instead of duplicating code
3. **Write tests** for new features
4. **Follow the commit message convention**
5. **Update documentation** for API changes

### Code Standards
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **Conventional Commits** for version control

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Documentation**: Check the `/docs` folder
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
