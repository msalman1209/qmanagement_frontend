# 🎥 Video Upload Troubleshooting Guide

## ✅ Recent Fixes Applied:

### 1. **Timeout Issues Fixed**
- ✅ Frontend timeout: Dynamic based on file size (min 5 minutes, +1 min per 30MB)
- ✅ Backend server timeout: 10 minutes
- ✅ Backend request/response timeout: 10 minutes each
- ✅ Keep-alive timeout: 10 minutes 50 seconds
- ✅ Headers timeout: 11 minutes

### 2. **File Size Limits**
- ✅ Frontend validation: 200MB maximum
- ✅ Backend Multer: 200MB limit
- ✅ Express body-parser: 500MB limit
- ✅ Axios: Infinity (no limit)

### 3. **Better Error Handling**
- ✅ Multer LIMIT_FILE_SIZE error shows proper 413 status
- ✅ Network errors show helpful Urdu messages
- ✅ Progress updates at 25%, 50%, 75%
- ✅ Confirmation dialog for files > 100MB

---

## 🔧 Testing Steps:

### 1. **Backend Restart (IMPORTANT!)**
```bash
cd backend
pm2 restart queue-backend
# OR
npm start
```

### 2. **Test Small Video First (10-20MB)**
- Open Counter Display page
- Select a small video
- Check console for logs
- Verify upload completes

### 3. **Test Medium Video (50-100MB)**
- Should upload without confirmation
- Watch progress in console
- Check for success message

### 4. **Test Large Video (100-200MB)**
- Should show confirmation dialog
- Should show timeout warning
- Monitor upload progress
- Wait 3-5 minutes for completion

---

## 🐛 If Still Getting Network Error:

### Check 1: Backend Running?
```bash
pm2 logs queue-backend --lines 50
# Look for "Server is running" message
```

### Check 2: API URL Correct?
Browser Console:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should be: https://queapi.techmanagement.tech/api
```

### Check 3: Nginx Configuration (if using)
```nginx
# Add to your nginx config:
client_max_body_size 200M;
client_body_timeout 600s;
proxy_read_timeout 600s;
proxy_send_timeout 600s;
```

Then reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Check 4: Server Resources
```bash
# Check disk space
df -h

# Check memory
free -h

# Check if server is overloaded
top
```

### Check 5: Network Speed
- Slow internet? 184MB file will take time
- Upload speed < 1Mbps? Will take 25+ minutes
- Test with smaller file first (50MB)

---

## 📊 Upload Time Estimates:

| File Size | 1 Mbps | 5 Mbps | 10 Mbps | 20 Mbps |
|-----------|--------|--------|---------|---------|
| 50 MB     | 7 min  | 1.5 min| 40 sec  | 20 sec  |
| 100 MB    | 14 min | 3 min  | 1.5 min | 40 sec  |
| 150 MB    | 20 min | 4 min  | 2 min   | 1 min   |
| 184 MB    | 25 min | 5 min  | 2.5 min | 1.2 min |
| 200 MB    | 27 min | 5.5 min| 2.7 min | 1.3 min |

---

## 💡 Best Practices:

### 1. **Compress Large Videos**
Use FFmpeg to compress:
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset fast -c:a aac -b:a 128k output.mp4
```

### 2. **Use Online Compressor**
- https://www.freeconvert.com/video-compressor
- https://www.ps2pdf.com/compress-mp4
- https://clideo.com/compress-video

### 3. **Recommended Video Settings**
- Resolution: 1920x1080 (Full HD) max
- Bitrate: 2-3 Mbps (reduces size significantly)
- Format: MP4 (H.264)
- Target size: 50-100MB for best performance

### 4. **For Very Large Videos**
Consider:
- Cloud storage (AWS S3, Cloudflare R2)
- External video hosting (Vimeo, YouTube unlisted)
- Multiple smaller videos instead of one large

---

## 🔍 Debug Console Logs to Check:

When uploading, you should see:
```
🎬 handleVideoUpload called
📹 Video file selected: video.mp4 Size: 184.83 MB
📦 File size: 184.83 MB
⏱️ Upload timeout set to: 7.0 minutes
📤 Uploading video to: https://queapi.techmanagement.tech/api/counter-display/upload-video
📊 Upload progress: 5%
📊 Upload progress: 10%
📊 Upload progress: 25%
Upload ho raha hai... 25% complete
📊 Upload progress: 50%
Upload ho raha hai... 50% complete
📊 Upload progress: 75%
Upload ho raha hai... 75% complete
📊 Upload progress: 100%
✅ Video uploaded: /uploads/1234567890-video.mp4
```

---

## ⚠️ Common Errors & Solutions:

### Error: "Network Error"
**Causes:**
1. Backend not running
2. Timeout too short (FIXED in latest code)
3. Nginx timeout
4. Server out of disk space
5. Very slow network

**Solutions:**
1. Restart backend server
2. Update code (already done)
3. Update Nginx config
4. Free up disk space
5. Use smaller file or compress

### Error: "413 Payload Too Large"
**Causes:**
1. Nginx client_max_body_size too small
2. Backend limit too small (FIXED)

**Solutions:**
1. Update Nginx: `client_max_body_size 200M;`
2. Code already updated to 200MB

### Error: "CORS Policy"
**Causes:**
1. Origin not allowed
2. Preflight request failed

**Solutions:**
1. Check allowedOrigins in backend/server.js
2. Restart backend after changes

---

## 📝 Deployment Checklist:

- [ ] Backend code updated and pushed
- [ ] Backend server restarted
- [ ] Nginx configuration updated (if applicable)
- [ ] Nginx reloaded (if applicable)
- [ ] Test with small file (10MB)
- [ ] Test with medium file (50MB)
- [ ] Test with large file (100-200MB)
- [ ] Check browser console for errors
- [ ] Check backend logs for errors
- [ ] Verify video plays on ticket_info screen

---

## 🚀 Quick Fix Commands:

```bash
# 1. Update backend code
cd backend
git pull

# 2. Restart backend
pm2 restart queue-backend

# 3. Check logs
pm2 logs queue-backend --lines 50

# 4. If using Nginx, update config
sudo nano /etc/nginx/sites-available/your-config
# Add: client_max_body_size 200M;
# Add: client_body_timeout 600s;
# Add: proxy_read_timeout 600s;

# 5. Test Nginx config
sudo nginx -t

# 6. Reload Nginx
sudo systemctl reload nginx

# 7. Test upload!
```

---

## 📞 Still Having Issues?

1. **Check Backend Logs:**
   ```bash
   pm2 logs queue-backend --lines 100
   ```

2. **Check Nginx Logs (if using):**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Browser Console:**
   - Press F12
   - Go to Network tab
   - Try upload
   - Check failed request details

4. **Test API Directly:**
   ```bash
   curl -X POST https://queapi.techmanagement.tech/api/health
   # Should return: {"status":"OK","message":"Server is running"}
   ```

---

## ✅ Expected Behavior:

1. **Select video file** → Shows file size in console
2. **If > 100MB** → Shows confirmation dialog
3. **Click OK** → Shows "Uploading..." message
4. **Progress updates** → Console shows percentage
5. **25%, 50%, 75%** → Screen shows progress message
6. **100%** → "Video successfully upload ho gaya! ✅"
7. **Video preview** → Shows uploaded video

---

**Last Updated:** December 24, 2025
**Status:** ✅ All fixes applied, ready for testing
