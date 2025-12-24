# 🔴 NGINX 413 ERROR FIX - File Upload Limit

## Problem:
```
413 Request Entity Too Large
nginx/1.24.0 (Ubuntu)
```

**Reason:** Nginx ka default `client_max_body_size` bohot chhota hai (1MB). Video upload ke liye 500MB+ limit chahiye.

---

## ✅ SOLUTION - Server Par Nginx Config Update

### Step 1: SSH se Server par Login
```bash
ssh root@queapi.techmanagement.tech
# Ya apna user/IP use karo
```

### Step 2: Nginx Config File Edit Karo
```bash
sudo nano /etc/nginx/nginx.conf
```

### Step 3: `http` Block Mein Ye Line Add Karo
File ke `http {` section mein ye line add karo:

```nginx
http {
    # ... existing config ...
    
    # ✅ FILE UPLOAD LIMIT - 500MB
    client_max_body_size 500M;
    
    # ✅ TIMEOUTS for large uploads (10 minutes)
    client_body_timeout 600s;
    client_header_timeout 600s;
    send_timeout 600s;
    
    # ... rest of config ...
}
```

### Step 4: Site-Specific Config (OPTIONAL but RECOMMENDED)
Agar aapki site ka specific config file hai:
```bash
sudo nano /etc/nginx/sites-available/default
# Ya
sudo nano /etc/nginx/sites-available/queapi.techmanagement.tech
```

`server {` block mein add karo:
```nginx
server {
    listen 80;
    server_name queapi.techmanagement.tech;
    
    # ✅ FILE UPLOAD LIMITS
    client_max_body_size 500M;
    client_body_timeout 600s;
    
    # ✅ CORS Headers (for OPTIONS preflight)
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
    
    # ✅ Handle OPTIONS preflight
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # ✅ DISABLE BUFFERING for uploads
        proxy_request_buffering off;
        
        # ✅ TIMEOUTS
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        
        # ✅ HEADERS
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 5: Config Test Karo
```bash
sudo nginx -t
```

**Expected Output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 6: Nginx Reload/Restart
```bash
# Reload (recommended - no downtime)
sudo systemctl reload nginx

# Ya Restart
sudo systemctl restart nginx
```

### Step 7: Verify Status
```bash
sudo systemctl status nginx
```

---

## 🧪 TEST KARO - Postman

### Postman Setup:
```
Method: POST
URL: https://queapi.techmanagement.tech/api/counter-display/upload-video

Headers:
  Authorization: Bearer YOUR_TOKEN

Body (form-data):
  video: [Select video file]
  admin_id: 1
```

**Expected Response:**
```json
{
  "success": true,
  "videoUrl": "/uploads/1234567890-video.mp4",
  "message": "Video uploaded successfully"
}
```

---

## 🔍 TROUBLESHOOTING

### Error Persist Kare To:

1. **Nginx Error Logs Check:**
```bash
sudo tail -f /var/log/nginx/error.log
```

2. **Backend Logs Check:**
```bash
pm2 logs queue-management-server
```

3. **Port Check:**
```bash
sudo netstat -tlnp | grep 5000
```

4. **Nginx Config Double Check:**
```bash
sudo nginx -T | grep client_max_body_size
# Should show: client_max_body_size 500M;
```

5. **Restart Everything:**
```bash
pm2 restart queue-management-server
sudo systemctl restart nginx
```

---

## 📝 QUICK REFERENCE

### Minimum Required Config:
```nginx
# In /etc/nginx/nginx.conf
http {
    client_max_body_size 500M;
}
```

### Full Production Config:
```nginx
# In /etc/nginx/sites-available/your-site
server {
    client_max_body_size 500M;
    client_body_timeout 600s;
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_request_buffering off;
        proxy_read_timeout 600s;
    }
}
```

---

## ✅ CHECKLIST

- [ ] SSH to server
- [ ] Edit `/etc/nginx/nginx.conf`
- [ ] Add `client_max_body_size 500M;`
- [ ] Run `sudo nginx -t`
- [ ] Run `sudo systemctl reload nginx`
- [ ] Test upload with Postman
- [ ] Test upload from frontend
- [ ] Check backend logs (should show POST request)
- [ ] Verify video saved in `/uploads/` folder

---

## 🎯 EXPECTED BEHAVIOR AFTER FIX

### Before Fix:
```
❌ 413 Request Entity Too Large
❌ Nginx blocking large files
❌ Backend never receives request
```

### After Fix:
```
✅ File upload successful
✅ Backend receives POST request
✅ Video saved to /uploads/
✅ Returns videoUrl in response
```

---

## 📞 NEED HELP?

If error still persists:
1. Share Nginx error logs: `sudo tail -50 /var/log/nginx/error.log`
2. Share Nginx config: `sudo nginx -T`
3. Share backend PM2 logs: `pm2 logs --lines 50`

---

**Created:** December 24, 2025
**Server:** queapi.techmanagement.tech
**Issue:** 413 Request Entity Too Large (Nginx file upload limit)
**Solution:** Increase `client_max_body_size` to 500M
