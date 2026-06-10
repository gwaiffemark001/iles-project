"""
Django settings for iles_backend project.
Production-ready configuration for Railway deployment.
"""

from pathlib import Path
import os
from datetime import timedelta
import dj_database_url
from dotenv import load_dotenv

# Load environment variables from .env.local (development) or .env (production)
if os.path.exists('.env.local'):
    load_dotenv('.env.local')
else:
    load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ─────────────────────────────────────────────
# SECURITY
# ─────────────────────────────────────────────

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'False') == 'True'

# Allow Railway domains and localhost
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'iles-project-iles-backend.up.railway.app',
    '*.up.railway.app',  # Allow all Railway subdomains
]

# Add custom hosts from environment if provided
custom_allowed_hosts = os.getenv('ALLOWED_HOSTS')
if custom_allowed_hosts:
    custom_hosts = [host.strip() for host in custom_allowed_hosts.split(',')]
    ALLOWED_HOSTS.extend(custom_hosts)

AUTH_USER_MODEL = 'core.CustomUser'

# ─────────────────────────────────────────────
# PRODUCTION SECURITY SETTINGS
# ─────────────────────────────────────────────

if not DEBUG:
    # HTTPS & Cookies
    # Disable for Railway - proxy handles HTTPS, we trust X-Forwarded-Proto
    SECURE_SSL_REDIRECT = False  # Railway reverse proxy handles this
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # Trust X-Forwarded-Proto header from Railway's reverse proxy
    # Railway terminates SSL, so requests arrive as HTTP but were originally HTTPS
    SECURE_PROXY_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Also trust other forwarded headers
    USE_X_FORWARDED_HOST = True
    
    # Security Headers (temporarily lowered HSTS for testing)
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 3600  # 1 hour (lowered from 1 year for testing)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    # SECURE_HSTS_PRELOAD = True  # Disabled temporarily
    
    # Content Security Policy
    SECURE_CONTENT_SECURITY_POLICY = {
        'default-src': ("'self'",),
        'script-src': ("'self'", "'unsafe-inline'"),
        'style-src': ("'self'", "'unsafe-inline'"),
        'img-src': ("'self'", 'data:', 'https:'),
        'font-src': ("'self'",),
        'connect-src': ("'self'",),
    }

# ─────────────────────────────────────────────
# APPLICATIONS
# ─────────────────────────────────────────────

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'core',
    'corsheaders',
]

# ─────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # ← must be first
    'django.middleware.security.SecurityMiddleware',   # ← second
    'whitenoise.middleware.WhiteNoiseMiddleware',      # ← third (after security)
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'iles_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'iles_backend.wsgi.application'

# ─────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────

DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Railway production OR local PostgreSQL
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=not DEBUG,  # Require SSL only in production
        )
    }
elif os.getenv('DB_NAME') and os.getenv('DB_USER'):
    # Local development with PostgreSQL
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'iles_db'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }
else:
    # Fallback — SQLite for development only
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ─────────────────────────────────────────────
# PASSWORD VALIDATION
# ─────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─────────────────────────────────────────────
# INTERNATIONALISATION
# ─────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ─────────────────────────────────────────────
# STATIC & MEDIA FILES
# ─────────────────────────────────────────────

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─────────────────────────────────────────────
# AWS S3 CONFIGURATION (For Production Image/Media Storage)
# ─────────────────────────────────────────────

# Use S3 for media files in production if AWS credentials are provided
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
AWS_S3_CUSTOM_DOMAIN = os.getenv('AWS_S3_CUSTOM_DOMAIN')
AWS_DEFAULT_ACL = 'public-read'
AWS_QUERYSTRING_AUTH = False

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME:
    # Production: Use S3 for media files
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'access_key': AWS_ACCESS_KEY_ID,
                'secret_key': AWS_SECRET_ACCESS_KEY,
                'bucket_name': AWS_STORAGE_BUCKET_NAME,
                'region_name': AWS_S3_REGION_NAME,
                'custom_domain': AWS_S3_CUSTOM_DOMAIN or f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com',
            }
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        }
    }
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN or f"{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com"}/'
else:
    # Development or fallback: Use local file storage
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        }
    }

# ─────────────────────────────────────────────
# CORS & CSRF
# ─────────────────────────────────────────────

CORS_ALLOW_ALL_ORIGINS = DEBUG # True in dev, False in production

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in (
        os.getenv('CORS_ALLOWED_ORIGINS')
        or 'http://localhost:5173,http://localhost:5174,http://localhost:3000'
    ).split(',')
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in (
        os.getenv('CSRF_TRUSTED_ORIGINS') or 'http://localhost:5173'
    ).split(',')
]

# Allow credentials in CORS requests (needed for JWT in cookies/headers)
CORS_ALLOW_CREDENTIALS = True

# ─────────────────────────────────────────────
# REST FRAMEWORK & JWT
# ─────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# ─────────────────────────────────────────────
# EMAIL CONFIGURATION
# ─────────────────────────────────────────────

EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'ILES System <noreply@iles.edu>')

# Email backend selection based on configuration
if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    # Production: Use SMTP if credentials are provided
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
elif DEBUG:
    # Development: Use console backend for debugging
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    # Production without email config: Use console backend to prevent crashes
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ─────────────────────────────────────────────
# TWILIO (SMS)
# ─────────────────────────────────────────────

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')

# ─────────────────────────────────────────────
# DEFAULT AUTO FIELD
# ─────────────────────────────────────────────

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
