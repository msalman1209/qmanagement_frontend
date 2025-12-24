# 🔴 Production Upload Debug Guide - Network Error Fix

## ✅ What We've Confirmed

1. **Backend Code is Correct:**
   - ✅ `uploadVideo` and `uploadLogo` functions exist in `counterDisplayController.js`
   - ✅ Routes properly configured in `counter-display.js`
   - ✅ Multer configured with 500MB limit
   - ✅ Server timeouts set to 10 minutes
   - ✅ CORS configured for Vercel origin

2. **Frontend Code is Correct:**
   - ✅ Using raw axios to bypass interceptors
   - ✅ Dynamic timeout calculation (1 min per 30MB)
   - ✅ Progress tracking enabled
   - ✅ File size validation (200MB max)

## 🔍 Root Cause Analysis

**ERR_NETWORK** with `undefined response` means:
1. Request never reaches backend, OR
2. Backend receives but doesn't respond, OR
3. Network infrastructure blocking the request

## 🚨 Critical Checks Needed on Production Server

### Step 1: Check if Backend is Running
```bash
ssh your-server
pm2 status
pm2 logs queue-backend --lines 50
```

**Expected:** Backend process should be "online" and showing recent logs

### Step 2: Check Nginx Configuration
```bash
ssh your-server
sudo nano /etc/nginx/sites-available/default
# OR
sudo nano /etc/nginx/sites-available/queapi.techmanagement.tech
```

**Required Nginx Settings:**
```nginx
server {
    listen 80;
    server_name queapi.techmanagement.tech;

    # CRITICAL: Increase client body size for video uploads
    client_max_body_size 500M;

    # CRITICAL: Increase timeouts
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
    send_timeout 600s;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # CRITICAL: Forward client IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CRITICAL: Disable buffering for large uploads
        proxy_request_buffering off;
        proxy_buffering off;
    }
}
```

**After editing, reload Nginx:**
```bash
sudo nginx -t                # Test configuration
sudo systemctl reload nginx  # Apply changes
```

### Step 3: Check Server Firewall
```bash
# Check if firewall is blocking large uploads or long connections
sudo ufw status
sudo iptables -L -n -v
```

### Step 4: Test Backend Directly
```bash
# From your local machine, test backend endpoint directly
curl -X POST https://queapi.techmanagement.tech/api/counter-display/upload-video \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "video=@/path/to/test-video.mp4" \
  -F "admin_id=1" \
  -v
```

### Step 5: Check Backend Logs During Upload
```bash
# Terminal 1: Watch logs in real-time
ssh your-server
pm2 logs queue-backend --raw

# Terminal 2: Try uploading from frontend
# Watch if ANY request reaches backend
```

## 🔧 Common Production Issues & Fixes

### Issue 1: Nginx Not Updated
**Symptom:** `client_max_body_size` still at default 1MB  
**Fix:**
```bash
sudo nano /etc/nginx/nginx.conf
# Add inside http block:
client_max_body_size 500M;

sudo nginx -t
sudo systemctl reload nginx
```

### Issue 2: Backend Not Restarted After Code Changes
**Symptom:** Old code still running  
**Fix:**
```bash
cd /path/to/backend
git pull origin main
npm install
pm2 restart queue-backend
pm2 logs queue-backend --lines 20
```

### Issue 3: SSL Certificate Issues
**Symptom:** Mixed content errors or HTTPS blocking  
**Fix:**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Issue 4: Server Running Out of Memory
**Symptom:** Process crashes during large uploads  
**Fix:**
```bash
# Check memory usage
free -h
df -h

# Increase Node.js memory limit in PM2
pm2 delete queue-backend
pm2 start server.js --name queue-backend --node-args="--max-old-space-size=4096"
pm2 save
```

### Issue 5: CORS Headers Not Applied
**Symptom:** CORS error in browser console  
**Fix:** Verify in `backend/server.js`:
```javascript
const allowedOrigins = [
  'https://qmanagement-frontend.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

Then restart:
```bash
pm2 restart queue-backend
```

## 📋 Step-by-Step Production Deployment Checklist

1. **Update Backend Code:**
```bash
ssh your-server
cd /path/to/backend
git pull origin main
npm install
```

2. **Update Nginx Config:**
```bash
sudo nano /etc/nginx/sites-available/default
# Add client_max_body_size 500M; and timeouts
sudo nginx -t
sudo systemctl reload nginx
```

3. **Restart Backend with Memory Limit:**
```bash
pm2 delete queue-backend
pm2 start server.js --name queue-backend --node-args="--max-old-space-size=4096"
pm2 save
```

4. **Verify Everything Running:**
```bash
pm2 status
pm2 logs queue-backend --lines 20
sudo systemctl status nginx
curl -I https://queapi.techmanagement.tech/api/health
```

5. **Test Upload from Frontend:**
   - Open https://qmanagement-frontend.vercel.app
   - Try uploading a small video (10MB) first
   - Check PM2 logs: `pm2 logs queue-backend --raw`
   - Then try the 184MB video

## 🔍 Real-Time Debugging

When user tries uploading, run this on server:
```bash
# Watch all incoming requests
pm2 logs queue-backend --raw | grep -i "upload\|error\|multer"
```

## 📊 Expected vs Actual Behavior

### Expected Flow:
1. Frontend uploads to `/api/counter-display/upload-video`
2. Request passes through Nginx (with 500MB limit)
3. Reaches Express server (with 10-min timeout)
4. Multer processes file (500MB limit)
5. Controller saves to disk and database
6. Returns success JSON response

### Actual Behavior:
1. Frontend sends request
2. **❌ Gets ERR_NETWORK with undefined response**
3. Request never reaches backend (not in PM2 logs)

### This Indicates:
- **Most Likely:** Nginx blocking request due to `client_max_body_size` limit
- **Or:** Backend not running/crashed
- **Or:** Firewall blocking large uploads
- **Or:** SSL/HTTPS configuration issue

## 🎯 Immediate Action Required

**Run these commands on your production server RIGHT NOW:**

```bash
# 1. Check backend status
pm2 status

# 2. Check Nginx config for client_max_body_size
sudo grep -r "client_max_body_size" /etc/nginx/

# 3. If not found or too small, add it
sudo nano /etc/nginx/nginx.conf
# Add: client_max_body_size 500M;

# 4. Test and reload
sudo nginx -t
sudo systemctl reload nginx

# 5. Restart backend
pm2 restart queue-backend

# 6. Watch logs
pm2 logs queue-backend --raw
```

## 📱 Urdu Guide for Server Admin

```
Server per yeh commands chalayen:

1. Backend check karein:
pm2 status

2. Nginx me file size limit check karein:
sudo grep -r "client_max_body_size" /etc/nginx/

3. Agar nahi mila ya chota hn, to Nginx config me add karein:
sudo nano /etc/nginx/nginx.conf

Yeh line add karein http block me:
client_max_body_size 500M;

4. Nginx test aur reload:
sudo nginx -t
sudo systemctl reload nginx

5. Backend restart:
pm2 restart queue-backend

6. Logs dekhein:
pm2 logs queue-backend --raw

Ab frontend se video upload karen aur logs me dekhein request aa rahi hn ya nahi.
```

## 🚀 Quick Fix Commands (Copy-Paste)

```bash
# Complete fix in one go
sudo bash -c 'cat >> /etc/nginx/nginx.conf << EOF

http {
    client_max_body_size 500M;
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
}
EOF'

sudo nginx -t && sudo systemctl reload nginx
pm2 restart queue-backend
pm2 logs queue-backend --lines 50
```

## 📞 If Still Not Working

1. **Share Backend URL:** https://queapi.techmanagement.tech
2. **Share Server Logs:** `pm2 logs queue-backend --lines 100`
3. **Share Nginx Config:** `sudo cat /etc/nginx/sites-available/default`
4. **Share Nginx Error Log:** `sudo tail -100 /var/log/nginx/error.log`

---

**Last Updated:** [Current Date]  
**Status:** 🔴 Network Error - Nginx Configuration Required  
**Next Step:** Update Nginx `client_max_body_size` to 500M on production server
