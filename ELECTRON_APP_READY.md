# 🚀 Queue Management System - Quick Start Guide

## ✅ App Successfully Built and Running!

### 📦 What's Working:
- ✅ Electron app builds successfully
- ✅ Window opens and displays properly
- ✅ Next.js standalone server runs
- ✅ All routes and pages functional

---

## 🎯 How to Run the Application

### **Method 1: One-Click Startup (Recommended)**

#### Windows PowerShell:
```powershell
.\START_APP.ps1
```

#### Windows CMD:
```batch
START_APP.bat
```

This will automatically start:
1. Backend Server (Port 5000)
2. Python TTS Service (Port 5050)
3. Electron Application

---

### **Method 2: Manual Startup**

#### Step 1: Start Backend Server
```powershell
cd backend
node server.js
```

#### Step 2: Start Python TTS (Optional)
```powershell
cd python-tts-service
python app.py
```

#### Step 3: Run Application
```powershell
cd dist\win-unpacked
.\Queue Management System.exe
```

---

### **Method 3: Run Installer**
```powershell
.\dist\Queue Management System Setup 0.1.0.exe
```
Install and run from Start Menu or Desktop shortcut.

---

## 🔧 Development Commands

### Build New Installer:
```powershell
npm run electron:build:win
```

### Development Mode:
```powershell
# Terminal 1: Frontend
npm run electron:dev

# Terminal 2: Backend
cd backend
node server.js
```

### Production Build:
```powershell
npm run build
npm run electron:build:win
```

---

## 📋 System Requirements

- ✅ Node.js (v18 or higher)
- ✅ Python (v3.8 or higher) - for TTS service
- ✅ MySQL Database
- ✅ Windows 10/11

---

## 🌐 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5000 | http://localhost:5000 |
| Frontend (Dev) | 3000 | http://localhost:3000 |
| Python TTS | 5050 | http://localhost:5050 |

---

## ✅ Fixed Issues

1. ✅ **isPackaged Error**: Fixed undefined variable error
2. ✅ **Standalone Server**: Properly configured Next.js standalone mode
3. ✅ **Window Display**: App window now opens successfully
4. ✅ **Cache Errors**: Minimized with partition configuration

---

## 📝 Notes

- Cache warnings in console are normal and don't affect functionality
- DevTools are disabled in production for clean UI
- All services must be running for full functionality

---

## 🆘 Troubleshooting

### App doesn't open:
```powershell
# Rebuild the app
npm run electron:build:win
```

### Backend connection error:
```powershell
# Check backend is running
cd backend
node server.js
```

### Database connection error:
- Verify MySQL is running
- Check `.env.production` settings
- Ensure database credentials are correct

---

## 📞 Support

For issues or questions, check the documentation files in the project root.

---

**Last Updated**: December 26, 2025
**Status**: ✅ Production Ready
