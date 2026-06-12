# Gmail OAuth2 Setup for ILES Password Reset (Railway)

## Why Gmail OAuth2?

- **Railway SMTP Blocked**: Free/Hobby Railway plans block outbound SMTP (ports 25, 465, 587)
- **Gmail OAuth2 Uses HTTPS**: Port 443 is never blocked, so it works on any Railway tier
- **More Reliable**: No flaky SMTP connections; uses Google's REST API

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the **project dropdown** at the top
3. Click **NEW PROJECT**
4. Name: `ILES Backend`
5. Click **CREATE**
6. Wait for project creation to complete

### 2. Enable Gmail API

1. In the Google Cloud Console, search for `Gmail API`
2. Click **Gmail API** from results
3. Click **ENABLE**

### 3. Create OAuth2 Credentials

1. Go to **Credentials** (left sidebar)
2. Click **+ CREATE CREDENTIALS**
3. Select **OAuth client ID**
4. If prompted to configure OAuth consent screen:
   - Click **CONFIGURE CONSENT SCREEN**
   - Choose **External** user type
   - Click **CREATE**
   - Fill in required fields:
     - App name: `ILES`
     - User support email: your email
     - Developer contact info: your email
   - Click **SAVE AND CONTINUE** through all steps
   - Click **BACK TO CREDENTIALS**

5. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
6. Application type: **Web application**
7. Under **Authorized JavaScript origins**, click **ADD URI**:
   - Add: `https://iles-project-iles-backend.up.railway.app` (your Railway backend URL)
8. Under **Authorized redirect URIs**, click **ADD URI**:
   - Add: `https://iles-project-iles-backend.up.railway.app/auth/callback`
9. Click **CREATE**
10. Copy and **save** your:
    - **Client ID**
    - **Client Secret**

### 4. Generate Refresh Token

You have two options:

#### Option A: Using Google OAuth2 Playground (Easiest)

1. Go to [Google OAuth2 Playground](https://developers.google.com/oauthplayground)
2. In the top-right, click **⚙️ Settings**
3. Check **Use your own OAuth credentials**
4. Paste your **Client ID** and **Client Secret** from step 3
5. Click **Close**
6. In the left panel, expand **Gmail API v1**
7. Select scope: `https://www.googleapis.com/auth/gmail.send`
8. Click **AUTHORIZE APIS**
9. Choose your Gmail account
10. Click **Allow** to grant permissions
11. Click **EXCHANGE AUTHORIZATION CODE FOR TOKENS**
12. Copy the **Refresh Token** and save it

#### Option B: Using Python Script (Alternative)

```bash
pip install google-auth-oauthlib

python << 'EOF'
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

# Create a flow object from your credentials
flow = InstalledAppFlow.from_client_config(
    {
        "installed": {
            "client_id": "YOUR_CLIENT_ID",
            "client_secret": "YOUR_CLIENT_SECRET",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob"]
        }
    },
    SCOPES
)

# Run local OAuth flow
creds = flow.run_local_server(port=0)

# Print the refresh token
print("REFRESH TOKEN:", creds.refresh_token)
EOF
```

### 5. Add Environment Variables to Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **ILES project**
3. Click the **Backend service**
4. Go to **Variables** tab
5. Add these environment variables:
   ```
   GMAIL_CLIENT_ID=<your-client-id>
   GMAIL_CLIENT_SECRET=<your-client-secret>
   GMAIL_REFRESH_TOKEN=<your-refresh-token>
   GMAIL_API_USER=<your-gmail-address>
   ```
6. Click **Save**

### 6. Remove SMTP Credentials

If `EMAIL_HOST_USER` or `EMAIL_HOST_PASSWORD` are already set in Railway, delete them. The backend no longer uses SMTP fallback and now relies on Gmail OAuth2 only.

### 7. Deploy and Test

1. Push your code to trigger Railway redeploy:
   ```bash
   git push
   ```

2. Monitor deployment in Railway dashboard

3. Test password reset:
   - Go to your frontend login page
   - Click "Forgot Password?"
   - Enter your email
   - Check Railway logs for:
     - `✓ Password reset email sent via Gmail OAuth2 API to ...` ✅ (Success!)
     - `✗ Password reset email failed` → Check Gmail OAuth2 credentials and logs

### 8. View Logs

To check if password reset emails are being sent:

```bash
cd d:\files\iles-project\iles_backend
railway logs --service 2c73697a-5da6-420d-924b-1a7b10688a8c --lines 100 --latest | grep -i "password\|gmail\|email"
```

Look for:
- `✓ Password reset email sent via Gmail OAuth2 API` → Email delivered!
- `Gmail OAuth2 not configured` → Check your environment variables
- `✗ Password reset email failed` → Check Railway logs for errors

## Troubleshooting

### "Gmail OAuth2 not configured or failed"

**Problem**: The function doesn't have all required credentials.

**Solution**:
- Verify all 4 variables are set in Railway Variables
- Make sure `GMAIL_REFRESH_TOKEN` is not empty
- Refresh token expires after ~6 months of inactivity; regenerate if needed

### "Error: google.auth.exceptions.RefreshError"

**Problem**: The refresh token is invalid or expired.

**Solution**:
- Regenerate refresh token using Google OAuth2 Playground (see Step 4 above)
- Update `GMAIL_REFRESH_TOKEN` in Railway Variables

### "Invalid OAuth2 Credentials"

**Problem**: Client ID/Secret don't match your project.

**Solution**:
- Verify you're using credentials from the same Google Cloud project
- Delete old credentials and create new ones if needed

### "Still not receiving emails"

1. Check the backend is actually running: `railway status`
2. Check logs for any errors: `railway logs --latest`
3. Check your Gmail spam/trash folders
4. Verify the email address receiving the reset link exists in the system
5. SMTP fallback is no longer supported. The backend now requires Gmail OAuth2 to send reset emails.

## Local Development

To test Gmail OAuth2 locally without deploying:

1. Get your credentials from Google Cloud
2. Update `.env.local`:
   ```
   GMAIL_CLIENT_ID=<your-client-id>
   GMAIL_CLIENT_SECRET=<your-client-secret>
   GMAIL_REFRESH_TOKEN=<your-refresh-token>
   GMAIL_API_USER=<your-email>
   ```
3. Run locally:
   ```bash
   python manage.py runserver
   ```
4. Test password reset on `http://localhost:5173/forgot-password`
5. Check console output for email logs

## References

- [Google Cloud Console](https://console.cloud.google.com/)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth2 Playground](https://developers.google.com/oauthplayground)
- [Django Email Backend](https://docs.djangoproject.com/en/6.0/topics/email/)
