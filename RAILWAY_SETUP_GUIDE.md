# Railway Deployment Setup Guide

This guide covers the configuration of email services and image/media storage for the ILES application on Railway.

## Overview

The ILES application has been updated with:
1. **Email Services** - Configured to use Gmail OAuth2 via the Gmail REST API
2. **Media/Image Storage** - Configured to use AWS S3 for persistent storage of profile pictures and other media files
3. **Dashboard Fixes** - Fixed evaluation counting and label terminology

## Prerequisites

- Railway account with access to the ILES project
- AWS account (for S3 bucket)
- Gmail OAuth2 credentials for email delivery

---

## 1. Email Configuration (Django/Railway)

### Step 1: Create Gmail OAuth2 Credentials

1. Go to Google Cloud Console
2. Create a new project for ILES if needed
3. Enable the Gmail API
4. Create OAuth client credentials for a web application
5. Generate a refresh token with Gmail send scope

### Step 2: Configure Railway Environment Variables

1. Go to your Railway project (iles-project backend service)
2. Navigate to **Variables** tab
3. Add the following environment variables:

```
GMAIL_CLIENT_ID=<your-client-id>
GMAIL_CLIENT_SECRET=<your-client-secret>
GMAIL_REFRESH_TOKEN=<your-refresh-token>
GMAIL_API_USER=<your-gmail-address>
DEFAULT_FROM_EMAIL=ILES <mar666068@gmail.com>
```

### Step 3: Test Email Configuration

The backend uses Gmail OAuth2 directly for email delivery. Test by:
1. Triggering a password reset
2. Checking Railway logs for a successful Gmail API send
3. Verifying the recipient receives the reset email

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
1. Check Railway logs for Gmail OAuth2 errors
2. Verify Gmail OAuth2 credentials are correct
3. Ensure the refresh token is valid and not expired
4. Check that `GMAIL_API_USER` matches the Gmail account authorized by the refresh token

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
GMAIL_CLIENT_ID=<your-client-id>
GMAIL_CLIENT_SECRET=<your-client-secret>
GMAIL_REFRESH_TOKEN=<your-refresh-token>
GMAIL_API_USER=<your-gmail-address>
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
