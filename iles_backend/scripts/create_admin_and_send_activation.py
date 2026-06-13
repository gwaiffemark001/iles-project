import os
import sys
import django
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iles_backend.settings')
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model
from core.gmail_oauth2 import send_email_via_gmail_api

User = get_user_model()

# Configure these values or accept from environment
USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
EMAIL = os.getenv('ADMIN_EMAIL', 'mar666068@gmail.com')
PASSWORD = os.getenv('ADMIN_PASSWORD', 'Admin@1234')

u = User.objects.filter(username=USERNAME).first()
if u:
    print('Updating existing user:', USERNAME)
    u.email = EMAIL
    u.set_password(PASSWORD)
    u.is_staff = True
    u.is_superuser = True
    u.is_active = False
    u.save()
else:
    print('Creating new admin user:', USERNAME)
    u = User.objects.create_user(username=USERNAME, email=EMAIL, password=PASSWORD)
    u.is_staff = True
    u.is_superuser = True
    u.is_active = False
    u.save()

# Generate activation token and URL
tg = PasswordResetTokenGenerator()
token = tg.make_token(u)
uid = urlsafe_base64_encode(force_bytes(u.pk))
frontend = getattr(settings, 'FRONTEND_URL', None)
backend = getattr(settings, 'BACKEND_BASE_URL', None) or f"http://127.0.0.1:8000"

if frontend:
    activation_url = f"{frontend.rstrip('/')}/activate?uid={uid}&token={token}"
else:
    activation_url = f"{backend.rstrip('/')}/api/activate-account?uid={uid}&token={token}"

print('Activation URL:', activation_url)

# Try to send via Gmail API helper
sent = False
try:
    sent = send_email_via_gmail_api(recipient_email=EMAIL, subject='Activate your ILES admin account', message=f'Activate: {activation_url}')
    print('Attempted send via Gmail API, result:', sent)
except Exception as e:
    print('Gmail API send failed:', str(e))

if not sent:
    print('Email not sent automatically. Please copy the activation URL above and open it in a browser to activate the account.')

print('Done')
