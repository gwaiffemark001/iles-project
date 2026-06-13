Gmail OAuth (production) — quick setup

Purpose
- Use Gmail REST API with OAuth2 refresh token to send activation and notification emails.

Required environment variables (add these to Railway project secrets or your .env):
- GMAIL_CLIENT_ID: OAuth2 Client ID from Google Cloud Console
- GMAIL_CLIENT_SECRET: OAuth2 Client Secret
- GMAIL_REFRESH_TOKEN: Refresh token obtained from the OAuth2 consent flow
- GMAIL_API_USER: The email address to send from (e.g. no-reply@yourdomain.com)
- DEFAULT_FROM_EMAIL: Display "Name <email@domain>" used by Django

Optional settings:
- EMAIL_TIMEOUT: seconds (default 10)
- EMAIL_VERIFY_USE_SMTP: set to `false` (we use Gmail OAuth only)

Generate a refresh token (brief):
1. Create OAuth credentials (Desktop or Web) in Google Cloud Console and add the scope:
   - https://www.googleapis.com/auth/gmail.send
2. Use the helper in `core/gmail_oauth2.py` or run a one-off script that opens the OAuth consent URL and exchanges the code for tokens.
3. Persist the `refresh_token` value into Railway as `GMAIL_REFRESH_TOKEN`.

Railway / Deployment steps
1. In Railway project > Environments > Variables, add the variables above.
2. Set `FRONTEND_URL` to `https://iles-project-iles-frontend.up.railway.app` and `BACKEND_BASE_URL` to `https://iles-project-iles-backend.up.railway.app`.
3. Redeploy the backend service (Railway will pick up env changes).
4. On the frontend deployment, ensure `VITE_API_BASE_URL` is set to `https://iles-project-iles-backend.up.railway.app` (already present in .env.production).

Testing
- Create a test user via the registration endpoint and confirm an activation link is sent. Activation links use `FRONTEND_URL` (for user-facing link) or `BACKEND_BASE_URL` if sent from scripts.

Notes
- This project uses the `send_email_via_gmail_api` helper in `core/gmail_oauth2.py` which checks the above settings.
- We intentionally avoid SMTP; do not set SMTP envs unless needed for fallback testing.
