# ILES — Internship Logging & Evaluation System

## Backend API Endpoints

### Authentication
- POST /api/token/ — Login, get JWT token
- POST /api/token/refresh/ — Refresh token
- POST /api/register/ — Register new user
- GET/PUT /api/profile/ — View or update own profile
- POST /api/change-password/ — Change password

### Weekly Logs
- GET/POST /api/logs/ — List or create logs
- GET/PUT/DELETE /api/logs/<pk>/ — Single log operations
- PUT /api/logs/<pk>/submit/ — Submit a draft log
- PUT /api/logs/<pk>/review/ — Supervisor reviews log
- PUT /api/logs/<pk>/approve/ — Supervisor approves log
- PUT /api/logs/<pk>/revise/ — Send log back to draft

### Placements
- GET/POST /api/placements/ — List or create placements
- GET/PUT/DELETE /api/placements/<pk>/ — Single placement

### Evaluations
- GET/POST /api/evaluations/ — List or create evaluations
- GET/DELETE /api/evaluations/<pk>/ — Single evaluation
- GET/POST /api/criteria/ — Evaluation criteria

## Tech Stack
- Backend: Django 5.2 + Django REST Framework
- Database: PostgreSQL
- Authentication: JWT (djangorestframework-simplejwt)
- Frontend: React + Vite

## Test Credentials
- Admin: username=gideonadmin, role=admin

# Comment 1
# Comment 2
# Comment 3
# Comment 4
# Comment 5
# Comment 6
# Comment 7
# Comment 8
# Comment 9
# Comment 10

# Comment 11
# Comment 12
# Comment 13
# Comment 14
# Comment 15
# Comment 16
# Comment 17
# Comment 18
# Comment 19
# Comment 20