"""
Gmail OAuth2 Email Service
Handles OAuth2 authentication and email delivery via Gmail REST API
"""
from django.conf import settings
import logging
from email.utils import formataddr

logger = logging.getLogger(__name__)


def get_gmail_from_address():
    default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', '') or getattr(settings, 'GMAIL_API_USER', '')
    if '<' not in default_from and '@' in default_from:
        default_from = formataddr(('ILES System', default_from))
    return default_from


def send_email_via_gmail_api(recipient_email, subject, message, html_message=None):
    """
    Send email using Gmail REST API (OAuth2).
    
    Args:
        recipient_email: Recipient's email address
        subject: Email subject
        message: Plain text message
        html_message: Optional HTML message (preferred if provided)
    
    Returns:
        bool: True if sent successfully, False otherwise
        
    Requires environment variables:
        - GMAIL_CLIENT_ID: OAuth2 Client ID from Google Cloud Console
        - GMAIL_CLIENT_SECRET: OAuth2 Client Secret
        - GMAIL_REFRESH_TOKEN: Long-lived refresh token from initial OAuth2 flow
        - GMAIL_API_USER: Email address to send from (usually same as account used for OAuth2)
    """
    # Check if all required credentials are set
    required_vars = {
        'GMAIL_CLIENT_ID': getattr(settings, 'GMAIL_CLIENT_ID', ''),
        'GMAIL_CLIENT_SECRET': getattr(settings, 'GMAIL_CLIENT_SECRET', ''),
        'GMAIL_REFRESH_TOKEN': getattr(settings, 'GMAIL_REFRESH_TOKEN', ''),
        'GMAIL_API_USER': getattr(settings, 'GMAIL_API_USER', ''),
    }
    missing = [name for name, value in required_vars.items() if not value]
    if missing:
        logger.error("Gmail OAuth2 credentials missing: %s", ", ".join(missing))
        return False

    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
        from email.mime.text import MIMEText
        from email.utils import formataddr
        import base64
        
        # Create credentials from refresh token
        creds = Credentials(
            token=None,  # Will be obtained via refresh
            refresh_token=settings.GMAIL_REFRESH_TOKEN,
            client_id=settings.GMAIL_CLIENT_ID,
            client_secret=settings.GMAIL_CLIENT_SECRET,
            token_uri='https://oauth2.googleapis.com/token'
        )
        
        # Refresh to obtain a valid access token
        creds.refresh(Request())
        
        # Build Gmail API service
        service = build('gmail', 'v1', credentials=creds, cache_discovery=False)
        
        # Construct MIME message
        body_text = html_message if html_message else message
        mime_msg = MIMEText(body_text, 'html' if html_message else 'plain')
        mime_msg['to'] = recipient_email
        mime_msg['from'] = get_gmail_from_address()
        mime_msg['subject'] = subject
        
        # Encode and send
        raw_message = base64.urlsafe_b64encode(mime_msg.as_bytes()).decode()
        send_body = {'raw': raw_message}
        
        result = service.users().messages().send(userId='me', body=send_body).execute()
        logger.info(f"Gmail API: Email sent successfully to {recipient_email} (message ID: {result.get('id')})")
        return True
        
    except Exception as e:
        logger.error(f"Gmail OAuth2 email failed for {recipient_email}: {type(e).__name__}: {str(e)}")
        return False


def get_gmail_oauth2_setup_instructions():
    """
    Return setup instructions for Gmail OAuth2.
    """
    return """
    GMAIL OAUTH2 SETUP INSTRUCTIONS
    ================================
    
    1. Go to Google Cloud Console: https://console.cloud.google.com/
    
    2. Create a new project:
       - Click on project selector at top
       - Click "NEW PROJECT"
       - Name it "ILES Backend"
       - Click CREATE
    
    3. Enable Gmail API:
       - Search for "Gmail API" in the search bar
       - Click "Enable"
    
    4. Create OAuth2 credentials:
       - Go to Credentials (left sidebar)
       - Click "CREATE CREDENTIALS" > "OAuth client ID"
       - Application type: "Web application"
       - Authorized JavaScript origins: https://your-railway-domain.up.railway.app
       - Authorized redirect URIs: https://your-railway-domain.up.railway.app/auth/callback
       - Click CREATE
       - Copy and save your Client ID and Client Secret
    
    5. Generate a Refresh Token:
       - Use this Python snippet to get a refresh token:
       
       ```python
       from google_auth_oauthlib.flow import InstalledAppFlow
       
       SCOPES = ['https://www.googleapis.com/auth/gmail.send']
       flow = InstalledAppFlow.from_client_secrets_file(
           'path/to/credentials.json',  # Download from Google Cloud Console
           SCOPES
       )
       creds = flow.run_local_server(port=0)
       print("Refresh Token:", creds.refresh_token)
       ```
       
       OR use the interactive Google OAuth2 playground:
       https://developers.google.com/oauthplayground
       
       - Select Gmail API scope: https://www.googleapis.com/auth/gmail.send
       - Authorize and exchange auth code for tokens
       - Copy the Refresh Token
    
    6. Set environment variables on Railway:
       - GMAIL_CLIENT_ID=<your-client-id>
       - GMAIL_CLIENT_SECRET=<your-client-secret>
       - GMAIL_REFRESH_TOKEN=<your-refresh-token>
       - GMAIL_API_USER=<your-gmail-address>
       
    7. Test by triggering a password reset or notification
    """
