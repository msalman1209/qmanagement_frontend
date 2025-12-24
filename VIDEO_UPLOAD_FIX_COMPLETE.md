# 🎥 Video Upload Fix - Complete Guide

## ✅ Issues Fixed:

### 1. **CORS Error Fixed**
- ✅ Backend now properly logs allowed origins
- ✅ Frontend axios configured with proper timeout
- ✅ CORS allows all required headers

### 2. **413 Content Too Large Fixed**
- ✅ Express body-parser limit increased to 500MB
- ✅ Multer file size limit set to 500MB
- ✅ Axios maxContentLength and maxBodyLength set to Infinity
- ✅ Frontend validation reduced to 100MB for reliability

### 3. **Timeout Issues Fixed**
- ✅ Axios timeout increased from 15 seconds to 5 minutes (300,000ms)
- ✅ Progress indicator added for large file uploads
- ✅ Better error handling with specific messages

---

## 🔧 Changes Made:

### Frontend (`src/utils/axiosInstance.js`):
```javascript
timeout: 300000, // 5 minutes for video uploads
```

### Backend (`backend/server.js`):
```javascript
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ limit: '500mb', extended: true }))
```

### Frontend Upload Handler (`page.js`):
- ✅ File size validation: Max 100MB (safe limit)
- ✅ Progress tracking with console logs
- ✅ Better error messages for users
- ✅ Network error detection
- ✅ Loading state during upload
- ✅ File input reset on error

---

## 🚀 Server Configuration Required:

### **For Nginx (if using):**

Add to your Nginx configuration file:

```nginx
server {
    listen 443 ssl;
    server_name queapi.techmanagement.tech;

    # Increase upload size limit
    client_max_body_size 500M;
    
    # Increase timeouts for large uploads
    client_body_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    # Buffer settings for large files
    client_body_buffer_size 256k;
    proxy_buffering off;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://qmanagement-frontend.vercel.app' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Cache-Control, Pragma, Expires' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }

    location /uploads {
        alias /path/to/your/backend/uploads;
        add_header 'Access-Control-Allow-Origin' 'https://qmanagement-frontend.vercel.app' always;
    }
}
```

### **For Apache (if using):**

Add to `.htaccess` or Apache config:

```apache
<IfModule mod_php.c>
    php_value upload_max_filesize 500M
    php_value post_max_size 500M
    php_value max_execution_time 300
    php_value max_input_time 300
</IfModule>

# For Apache 2.4+
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://qmanagement-frontend.vercel.app"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, Cache-Control, Pragma, Expires"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>
```

### **For Node.js PM2:**

Update your PM2 ecosystem file:

```javascript
module.exports = {
  apps: [{
    name: 'queue-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      // Increase Node.js memory limit for large uploads
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  }]
}
```

### **For Docker (if using):**

Add to your Dockerfile or docker-compose.yml:

```yaml
services:
  backend:
    environment:
      - NODE_OPTIONS=--max-old-space-size=4096
    deploy:
      resources:
        limits:
          memory: 4G
```

---

## 📝 Backend Deployment Steps:

### 1. **Update Backend Code:**
```bash
cd backend
git pull origin main
npm install
```

### 2. **Restart Backend Server:**

**If using PM2:**
```bash
pm2 restart queue-backend
pm2 logs queue-backend --lines 50
```

**If using systemd:**
```bash
sudo systemctl restart queue-backend
sudo systemctl status queue-backend
```

**If using Docker:**
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f backend
```

### 3. **Reload Nginx (if applicable):**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 Testing:

### 1. **Check Backend Logs:**
Look for these logs when uploading:
```
✅ CORS allowed origin: https://qmanagement-frontend.vercel.app
📤 Uploading video to: https://queapi.techmanagement.tech/api/counter-display/upload-video
📊 Upload progress: 25%
📊 Upload progress: 50%
📊 Upload progress: 75%
📊 Upload progress: 100%
✅ Video uploaded successfully
```

### 2. **Test Small Video First:**
- Try uploading a 10-20MB video first
- Check browser console for progress logs
- Verify success message appears

### 3. **Test Larger Video:**
- Try up to 100MB video
- Monitor upload progress in console
- Check backend logs for any errors

### 4. **Check Browser Console:**
Press F12 and look for:
- ✅ Green checkmarks = Success
- ❌ Red X = Errors with details
- 📤 Upload arrow = File uploading
- 📊 Chart = Progress updates

---

## 🐛 Troubleshooting:

### **Issue: Still getting CORS error**
**Solution:**
1. Check if Nginx/Apache is adding duplicate CORS headers
2. Remove CORS headers from Nginx if backend already handles them
3. Verify `allowedOrigins` in `backend/server.js` includes your Vercel URL

### **Issue: Still getting 413 error**
**Solution:**
1. Check Nginx `client_max_body_size`
2. Verify server has enough disk space in `/tmp` or upload directory
3. Check cloud provider upload limits (AWS, DigitalOcean, etc.)

### **Issue: Upload takes too long then fails**
**Solution:**
1. Reduce video size (compress using HandBrake or similar)
2. Check server upload speed
3. Verify timeout settings in Nginx/Apache
4. Use smaller videos (under 50MB recommended)

### **Issue: Video uploads but doesn't save**
**Solution:**
1. Check uploads folder permissions: `chmod 755 backend/uploads`
2. Verify disk space: `df -h`
3. Check database constraints
4. Check backend controller logs

---

## 💡 Best Practices:

### **For Users:**
- ✅ Keep videos under 50MB for best performance
- ✅ Use MP4 format (most compatible)
- ✅ Compress videos before uploading
- ✅ Use tools like HandBrake or FFmpeg to reduce size

### **Video Compression Command (FFmpeg):**
```bash
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 1M -maxrate 1M -bufsize 2M output.mp4
```

### **For Administrators:**
- ✅ Monitor server disk space regularly
- ✅ Set up automatic cleanup of old videos
- ✅ Consider using cloud storage (AWS S3, Cloudinary) for videos
- ✅ Implement CDN for faster video delivery

---

## 📊 Current Limits:

| Component | Limit | Configurable In |
|-----------|-------|----------------|
| Frontend Validation | 100MB | `page.js` line ~252 |
| Axios Timeout | 5 minutes | `axiosInstance.js` line ~7 |
| Backend Body Parser | 500MB | `server.js` line ~90 |
| Multer File Size | 500MB | `counter-display.js` line ~37 |
| **Recommended Upload** | **50-100MB** | N/A |

---

## ✅ Checklist:

- [ ] Backend code updated and deployed
- [ ] Nginx/Apache configuration updated
- [ ] Server restarted (PM2/systemd/Docker)
- [ ] Nginx reloaded (if applicable)
- [ ] Test small video upload (10-20MB)
- [ ] Test medium video upload (50-80MB)
- [ ] Test large video upload (100MB)
- [ ] Check browser console logs
- [ ] Check backend server logs
- [ ] Verify video plays on ticket_info screen

---

## 🎯 Summary:

All code changes have been made. You now need to:

1. **Deploy Backend Changes** - Push and restart your backend server
2. **Update Server Config** - Apply Nginx/Apache changes if needed
3. **Test Upload** - Try uploading videos of different sizes
4. **Monitor Logs** - Watch both frontend and backend logs

The system is now configured to handle up to 500MB uploads, but recommends keeping videos under 100MB for reliability! 🚀
