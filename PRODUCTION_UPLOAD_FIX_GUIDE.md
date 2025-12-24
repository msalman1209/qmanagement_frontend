# 🚨 URGENT: Production Video Upload Fix

## ❌ Current Issue
```
Local: ✅ Working perfectly
Production: ❌ Network Error - Request not reaching backend
Error: ERR_NETWORK with 184.83MB video
```

## 🔧 What Was Fixed

### 1. Frontend Changes (`page.js`)
- ✅ Reduced max file size from 500MB → **200MB** for production stability
- ✅ Direct environment variable usage for API URL (no concatenation issues)
- ✅ Better error messages with specific troubleshooting steps
- ✅ Increased timeout to **15 minutes minimum**
- ✅ Token validation before upload
- ✅ Detailed console logging for debugging

### 2. Backend Changes (`server.js`)
- ✅ Updated CORS to allow all Vercel deployment URLs
- ✅ Added request logging middleware
- ✅ Exposed additional headers for CORS
- ✅ Increased CORS maxAge to 24 hours

## 🚀 Deployment Steps

### Step 1: Deploy Frontend to Vercel
```bash
cd "c:\Users\tech solutionor\Desktop\newquemanagementinnextjs\que-management"
git add .
git commit -m "Fix: Production video upload with reduced file size limit and better error handling"
git push origin main
```

### Step 2: Set Environment Variables on Vercel
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add/Verify these variables:**
```
NEXT_PUBLIC_API_URL=https://queapi.techmanagement.tech/api
NEXT_PUBLIC_API_URL_WS=https://queapi.techmanagement.tech
NEXT_PUBLIC_PYTHON_TTS_URL=https://your-python-tts-url.com
NODE_ENV=production
```

**⚠️ CRITICAL:** After adding/updating environment variables, **REDEPLOY** the application!

### Step 3: Deploy Backend
```bash
# SSH into your server
ssh your-server

# Navigate to backend directory
cd /path/to/backend

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Restart PM2
pm2 restart queue-backend

# Check logs
pm2 logs queue-backend --lines 50
```

### Step 4: Verify Nginx Configuration
```bash
# Check Nginx config
sudo nano /etc/nginx/sites-available/default
```

**Required Nginx Settings:**
```nginx
server {
    listen 80;
    server_name queapi.techmanagement.tech;

    # CRITICAL: File size limit
    client_max_body_size 250M;

    # CRITICAL: Timeouts
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
    send_timeout 600s;
    client_body_timeout 600s;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CRITICAL: Disable buffering for uploads
        proxy_request_buffering off;
        proxy_buffering off;
        
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Apply Nginx changes:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🧪 Testing Steps

### Test 1: Check Backend Health
```bash
curl https://queapi.techmanagement.tech/api/health
```
Expected: `{"status":"OK","message":"Server is running"}`

### Test 2: Check CORS
```bash
curl -H "Origin: https://qmanagement-frontend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://queapi.techmanagement.tech/api/counter-display/upload-video \
     -v
```
Expected: See `Access-Control-Allow-Origin` in response headers

### Test 3: Upload Small Video (10MB)
1. Open production site: https://qmanagement-frontend.vercel.app
2. Login
3. Go to Counter Display
4. Upload a **small video (10-20MB)** first
5. Check browser console for logs
6. Check backend PM2 logs: `pm2 logs queue-backend --raw`

### Test 4: Upload Medium Video (50-100MB)
Once small video works, try medium size

### Test 5: Upload Large Video (150-200MB)
Finally test with larger file

## 📊 Monitoring & Debugging

### Real-Time Backend Logs
```bash
# SSH into server
pm2 logs queue-backend --raw | grep -i "upload\|error\|cors"
```

### Frontend Browser Console
Look for these logs:
```
🎬 handleVideoUpload called
📹 Video file selected: name Size: X MB
📤 Uploading video to: https://queapi.techmanagement.tech/api/counter-display/upload-video
🌐 API_URL from env: https://queapi.techmanagement.tech/api
🎯 Final upload URL: https://queapi.techmanagement.tech/api/counter-display/upload-video
⏱️ Upload timeout set to: X minutes
📊 Upload progress: X%
📥 Server response status: 200
✅ Video uploaded: /uploads/...
```

### Check Network Tab
1. Open DevTools → Network tab
2. Filter: `upload-video`
3. Try upload
4. Check request details:
   - **Status Code:** Should be 200
   - **Request Headers:** Should have `Authorization: Bearer ...`
   - **Response:** Should have `success: true`

## 🔍 Common Issues & Solutions

### Issue 1: Still Getting Network Error
**Cause:** Backend not receiving requests
**Solution:**
```bash
# 1. Check if backend is running
pm2 status

# 2. Check backend logs
pm2 logs queue-backend --lines 100

# 3. Test backend directly
curl https://queapi.techmanagement.tech/api/health

# 4. Check Nginx
sudo systemctl status nginx
sudo tail -50 /var/log/nginx/error.log

# 5. Restart everything
pm2 restart queue-backend
sudo systemctl restart nginx
```

### Issue 2: CORS Error
**Cause:** Origin not allowed
**Solution:**
Backend already updated to allow all Vercel URLs. Just restart:
```bash
pm2 restart queue-backend
```

### Issue 3: 413 Payload Too Large
**Cause:** Nginx limit too small
**Solution:**
```bash
sudo nano /etc/nginx/nginx.conf
# Add: client_max_body_size 250M;
sudo nginx -t
sudo systemctl reload nginx
```

### Issue 4: Timeout After 60 Seconds
**Cause:** Nginx default timeout
**Solution:**
Add timeouts in Nginx config (see Step 4 above)

### Issue 5: Backend Crashes During Upload
**Cause:** Out of memory
**Solution:**
```bash
# Increase Node.js memory
pm2 delete queue-backend
pm2 start server.js --name queue-backend --node-args="--max-old-space-size=4096"
pm2 save
```

## 📝 Updated File Size Recommendations

| File Size | Status | Recommendation |
|-----------|--------|----------------|
| < 50MB | ✅ Perfect | Fast upload, reliable |
| 50-100MB | ✅ Good | 2-5 minutes, stable |
| 100-150MB | ⚠️ Acceptable | 5-8 minutes, need stable internet |
| 150-200MB | ⚠️ Maximum | 8-15 minutes, very stable internet required |
| > 200MB | ❌ Rejected | Compress first! |

## 🎬 Video Compression Guide

### Option 1: HandBrake (Best Quality)
1. Download: https://handbrake.fr/
2. Open video
3. Preset: "Fast 1080p30" or "Fast 720p30"
4. RF: 22-24 (lower = better quality)
5. Target size: 50-150MB

### Option 2: Online Compressor
1. Visit: https://www.videosmaller.com/
2. Upload video
3. Use low compression
4. Download result

### Option 3: FFmpeg Command
```bash
ffmpeg -i input.mp4 -vcodec h264 -acodec mp3 -crf 24 output.mp4
```

## ✅ Verification Checklist

Before telling user it's fixed:

- [ ] Backend deployed and running (pm2 status)
- [ ] Nginx configured with 250M limit and timeouts
- [ ] Nginx reloaded successfully
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set on Vercel
- [ ] Vercel redeployed after env vars
- [ ] Backend health check returns OK
- [ ] CORS test passes
- [ ] Small video (10MB) uploads successfully
- [ ] Medium video (50-100MB) uploads successfully
- [ ] Logs show upload progress
- [ ] Backend logs show request received

## 📞 If Still Not Working

1. **Share Backend Logs:**
```bash
pm2 logs queue-backend --lines 200 > backend_logs.txt
```

2. **Share Nginx Error Logs:**
```bash
sudo tail -200 /var/log/nginx/error.log > nginx_errors.txt
```

3. **Share Frontend Console:**
- Open DevTools → Console
- Try upload
- Copy all logs
- Screenshot Network tab

4. **Share Nginx Config:**
```bash
sudo cat /etc/nginx/sites-available/default > nginx_config.txt
```

---

**Last Updated:** December 24, 2025  
**Status:** 🔴 Awaiting Deployment & Testing  
**File Size Limit:** 200MB (Production)  
**Timeout:** 15 minutes minimum
