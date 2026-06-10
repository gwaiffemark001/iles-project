# Railway Deployment Setup Guide

This guide covers the configuration of email services and image/media storage for the ILES application on Railway.

## Overview

The ILES application has been updated with:
1. **Email Services** - Configured to use SMTP (Gmail, SendGrid, etc.)
2. **Media/Image Storage** - Configured to use AWS S3 for persistent storage of profile pictures and other media files
3. **Dashboard Fixes** - Fixed evaluation counting and label terminology

## Prerequisites

- Railway account with access to the ILES project
- AWS account (for S3 bucket)
- SMTP credentials (Gmail, SendGrid, Mailgun, etc.)

---

## 1. Email Configuration (Django/Railway)

### Step 1: Create an Email Service Account

Choose one option:

#### Option A: Gmail
1. Enable 2FA on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" to generate a 16-character password
4. Copy the generated password

#### Option B: SendGrid
1. Create a SendGrid account: https://sendgrid.com/
2. Navigate to Settings → API Keys
3. Create a new API key and copy it

#### Option C: Mailgun
1. Create a Mailgun account: https://www.mailgun.com/
2. Get your SMTP credentials from the domain settings

### Step 2: Configure Railway Environment Variables

1. Go to your Railway project (iles-project backend service)
2. Navigate to **Variables** tab
3. Add the following environment variables:

**For Gmail:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@youromain.com
```

**For SendGrid:**
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

**For Mailgun:**
```
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@yourdomain.mg
EMAIL_HOST_PASSWORD=your-mailgun-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Step 3: Test Email Configuration

The backend will automatically use the configured SMTP credentials when deployed. Test by:
1. Triggering a user invitation or password reset
2. Check the Railway logs for any SMTP errors

---

## 2. AWS S3 Media Storage Setup

### Step 1: Create an S3 Bucket

1. Go to AWS Console → S3
2. Click **Create Bucket**
3. Enter a bucket name (e.g., `iles-prod-media`)
4. Region: Choose your preferred region (e.g., `us-east-1`)
5. **Block Public Access Settings:**
   - Uncheck "Block all public access"
   - Check "Block public access to buckets and objects granted through new public bucket policies"
   - Leave other settings checked
6. Create the bucket

### Step 2: Create IAM User for S3 Access

1. Go to AWS Console → IAM
2. Click **Users** → **Create User**
3. Name: `iles-s3-user`
4. Click **Create User**
5. Go to the user → **Security Credentials** tab
6. Click **Create Access Key**
7. Choose "Application running outside of AWS"
8. Copy the Access Key ID and Secret Access Key (save securely)

### Step 3: Attach S3 Policy to IAM User

1. In IAM Users → Select `iles-s3-user`
2. Click **Add Permissions** → **Attach policies directly**
3. Search and select: `AmazonS3FullAccess` (or create a custom policy for more restriction)
4. Click **Add Permissions**

### Step 4: Create S3 Bucket Policy (Optional but Recommended)

For more restrictive access, attach this bucket policy:

1. Go to S3 → Your Bucket → **Permissions** tab
2. Click **Bucket Policy**
3. Replace with:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::iles-prod-media/*"
        },
        {
            "Sid": "ILESAppAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/iles-s3-user"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::iles-prod-media/*"
        }
    ]
}
```

Replace `YOUR_ACCOUNT_ID` with your AWS Account ID and `iles-prod-media` with your bucket name.

### Step 5: Enable CORS for S3 Bucket (If needed for direct uploads)

1. Go to S3 → Your Bucket → **Permissions** tab
2. Scroll to **CORS**
3. Click **Edit** and add:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
            "https://blissful-curiosity.up.railway.app",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

### Step 6: Configure Railway Environment Variables

1. Go to your Railway project (iles-project backend service)
2. Navigate to **Variables** tab
3. Add the following:

```
AWS_ACCESS_KEY_ID=your-iam-user-access-key-id
AWS_SECRET_ACCESS_KEY=your-iam-user-secret-access-key
AWS_STORAGE_BUCKET_NAME=iles-prod-media
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=iles-prod-media.s3.us-east-1.amazonaws.com
```

**Optional:** For CloudFront CDN (recommended for production):
```
AWS_S3_CUSTOM_DOMAIN=d1234567890.cloudfront.net
```

### Step 7: Deploy and Test

1. Railway will automatically redeploy with the new environment variables
2. Wait for deployment to complete
3. Test by:
   - Uploading a profile picture as a user
   - Verify the image displays correctly
   - Check S3 console to confirm files are uploaded

---

## 3. Dashboard Fixes Applied

The following fixes have been implemented:

### Label Changes
- ✅ "Max Score by Each Workplace" → "Max Score by Each Supervisor"

### Calculation Fixes
- ✅ **Total Evaluations**: Now counts unique logs evaluated (not per evaluator)
- ✅ **Reviewed Logs**: Properly counts logs with "reviewed" status
- ✅ **Evaluation Scores**: Uses configured supervisor_share (40%) and academic_share (60%) percentages

### Consistency Improvements
- ✅ **Progress Calculation**: Uses backend calculation for consistency across all dashboards

---

## 4. Troubleshooting

### Email Not Sending
1. Check Railway logs for SMTP errors
2. Verify email credentials are correct
3. For Gmail: Ensure App Password is used (not regular password)
4. Check that the sending email address is whitelisted in your email service

### Images Not Displaying After Upload
1. Check Railway logs for S3 errors
2. Verify AWS credentials are correct
3. Confirm bucket name and region match configuration
4. Check S3 bucket permissions and CORS settings
5. Verify files appear in S3 console

### S3 Access Denied Error
1. Verify IAM user has S3 permissions
2. Check AWS Access Key ID and Secret are correct
3. Verify bucket policy allows access from the IAM user

---

## 5. Environment Variables Summary

### Complete Backend Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Security
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=iles-project-iles-backend.up.railway.app,yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://blissful-curiosity.up.railway.app,https://yourdomain.com
CSRF_TRUSTED_ORIGINS=https://blissful-curiosity.up.railway.app,https://yourdomain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# AWS S3 Media Storage
AWS_ACCESS_KEY_ID=your-iam-access-key
AWS_SECRET_ACCESS_KEY=your-iam-secret-key
AWS_STORAGE_BUCKET_NAME=iles-prod-media
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=iles-prod-media.s3.us-east-1.amazonaws.com

# Twilio (Optional - if SMS is needed)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 6. Next Steps

1. **Test Email**: Invite a new user and verify email is received
2. **Test Image Upload**: Update profile picture and verify display
3. **Monitor Logs**: Check Railway logs for any errors
4. **Set Up Monitoring**: Configure alerts for failed emails/uploads
5. **Document Credentials**: Store AWS keys securely (use Railway's secret management)

---

## Support

For issues or questions:
1. Check Railway logs: Dashboard → Your Service → Logs
2. Review this guide's Troubleshooting section
3. Contact AWS/Email service provider support if needed
