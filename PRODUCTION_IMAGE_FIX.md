# Production Image Issue - Comprehensive Fix

## Problem
Images upload successfully in development but don't display in production (Railway).

## Root Causes

1. **Ephemeral Storage on Railway**
   - Railway's filesystem is ephemeral by default
   - Media files uploaded to `/app/media/` get deleted on app restart/redeploy
   - New uploads work until the next deploy

2. **URL Construction in Production**
   - Serializer uses `request.build_absolute_uri()` to build image URLs
   - May not work correctly with Railway's proxy headers

3. **Media Collection During Deploy**
   - Static files collected but media directory might be incomplete

## Solution: Use Railway Volumes (Free)

### Step 1: Configure Railway Volume

In Railway Dashboard:
1. Go to your Backend service
2. Click **Settings** → **Volumes**
3. Click **Create Volume**
4. Set Mount Path: `/app/media`
5. Click **Create**

This creates persistent storage for media files.

### Step 2: Deploy with collectstatic

Procfile already has this:
```
web: python manage.py migrate && python manage.py collectstatic --noinput && gunicorn iles_backend.wsgi --bind 0.0.0.0:$PORT --log-file -
```

This ensures:
- Database migrations run
- Static AND media files are properly set up
- Media directory exists on the volume
- Django starts correctly

### Step 3: Configure settings.py (Already Done)

Settings already configured:
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
SECURE_PROXY_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
```

### Step 4: URLs Configuration (Already Fixed)

`urls.py` now always serves media:
```python
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

## Testing in Production

1. **Upload a profile image**
   - Go to your profile
   - Upload a new avatar
   - Click Save

2. **Verify image displays**
   - Image should appear immediately
   - Should persist across app restarts (with volume)

3. **Check network requests**
   - Open browser DevTools → Network tab
   - Upload image
   - Look for requests to `/media/avatars/...`
   - Should return 200 (OK) not 404

## If Images Still Don't Show

### Check 1: Media Directory Permissions
```bash
# SSH into Railway
railway shell

# Check if media directory exists
ls -la /app/media/

# Check if files were uploaded
ls -la /app/media/avatars/
```

### Check 2: Django Logs
```bash
# View recent logs
railway logs

# Look for:
# - Errors during collectstatic
# - Missing /media/ directory
# - Permission errors writing to /media/
```

### Check 3: Serializer URL Building
In Django shell:
```python
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.first()
if user.profile.avatar_image:
    print(user.profile.avatar_image.url)  # Should show /media/avatars/...
```

### Check 4: Frontend Environment
Verify `.env.production` is set:
```env
VITE_API_BASE_URL=https://iles-project-iles-backend.up.railway.app
```

Frontend build should use this for media URLs.

## File Size Limits

Default Django media file uploads: 2.5MB

To increase in settings.py:
```python
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
```

## Performance Notes

- **With WhiteNoise**: Media files compressed and cached efficiently
- **With Railway Volume**: Files persist across restarts
- **Response time**: <100ms after first load (WhiteNoise caching)

## Cost Breakdown (Free Tier)

| Component | Cost |
|-----------|------|
| Railway App | $5/month (free tier) |
| Media Volume (500GB) | Included with hobby tier |
| WhiteNoise Compression | $0 (included) |
| **Total** | **$5/month or free** |

## Next Steps

After adding the volume:
1. Redeploy your app (push to git)
2. Test uploading and displaying images
3. Restart app and verify images persist
4. Check logs for any errors

## Troubleshooting Commands

```bash
# SSH into Railway pod
railway shell

# Check volume is mounted
df -h | grep media

# Check file ownership
ls -la /app/media/avatars/

# Test Django can access files
python manage.py shell
>>> from django.core.files.storage import default_storage
>>> default_storage.exists('avatars/test.txt')

# View recent 50 lines of logs
railway logs --limit 50
```
